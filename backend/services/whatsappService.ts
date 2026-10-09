import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { CustomerLead } from '../../frontend/src/types/realestate';
import { WhatsAppSessionModel } from '../models/WhatsAppSession';

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = path.resolve(BACKEND_DIR, '../data/whatsapp-auth');

export type WhatsAppStatus = 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED';

interface WhatsAppState {
  status: WhatsAppStatus;
  qrCodeDataUrl: string | null;
  qrRaw: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  reconnectAttempts: number;
}

const state: WhatsAppState = {
  status: 'DISCONNECTED',
  qrCodeDataUrl: null,
  qrRaw: null,
  connectedPhone: null,
  connectedName: null,
  lastConnectedAt: null,
  lastError: null,
  reconnectAttempts: 0,
};

let sock: WASocket | null = null;
let isInitializing = false;
const pinoLogger = pino({ level: 'silent' });

// Ensure session directory exists
function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

/**
 * Restore credentials from MongoDB if local disk directory is empty
 */
async function restoreSessionFromMongo(): Promise<boolean> {
  try {
    ensureSessionDir();
    const localFiles = fs.readdirSync(SESSION_DIR);
    if (localFiles.includes('creds.json')) {
      return true; // Already on disk
    }

    const doc = await WhatsAppSessionModel.findOne({ sessionId: 'primary' }).lean();
    if (!doc || !doc.files) {
      return false;
    }

    const files = doc.files as Record<string, string>;
    let restoredCount = 0;
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        fs.writeFileSync(path.join(SESSION_DIR, filename), content, 'utf-8');
        restoredCount++;
      }
    }
    if (restoredCount > 0) {
      console.log(`📦 [WhatsApp] Restored ${restoredCount} auth files from MongoDB database.`);
      return true;
    }
  } catch (err: any) {
    console.warn(`⚠️ [WhatsApp] Could not restore session from MongoDB:`, err.message);
  }
  return false;
}

/**
 * Backup credentials from local disk to MongoDB for cloud persistence across restarts
 */
async function backupSessionToMongo() {
  try {
    if (!fs.existsSync(SESSION_DIR)) return;
    const localFiles = fs.readdirSync(SESSION_DIR);
    if (!localFiles.includes('creds.json')) return;

    const filesMap: Record<string, string> = {};
    for (const file of localFiles) {
      // Backup creds.json and vital keys
      if (file.endsWith('.json')) {
        const fullPath = path.join(SESSION_DIR, file);
        try {
          filesMap[file] = fs.readFileSync(fullPath, 'utf-8');
        } catch {
          // ignore transient write locks
        }
      }
    }

    await WhatsAppSessionModel.findOneAndUpdate(
      { sessionId: 'primary' },
      {
        sessionId: 'primary',
        files: filesMap,
        connectedPhone: state.connectedPhone || undefined,
        connectedName: state.connectedName || undefined,
        status: state.status,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (err: any) {
    console.warn(`⚠️ [WhatsApp] MongoDB session backup failed:`, err.message);
  }
}

/**
 * Clean up local session files and MongoDB record on explicit logout
 */
async function clearSession() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
    await WhatsAppSessionModel.deleteOne({ sessionId: 'primary' }).catch(() => {});
  } catch (err: any) {
    console.warn(`⚠️ [WhatsApp] Error clearing session:`, err.message);
  }
}

/**
 * Format any phone number into a valid WhatsApp JID (e.g. 919186221008@s.whatsapp.net)
 */
export function formatToWhatsAppJid(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;

  // Indian numbers (10 digits) default to country code 91
  let standardized = digits;
  if (digits.length === 10) {
    standardized = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    standardized = `91${digits.slice(1)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    standardized = digits;
  }

  return `${standardized}@s.whatsapp.net`;
}

/**
 * Get configured business owner recipient phone numbers
 */
export function getOwnerPhoneNumbers(): string[] {
  const envNumbers = (process.env.WHATSAPP_OWNER_NUMBERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Official Trinetra Realty Owners: Rahul Khatri & Rohit Joon
  const defaults = ['919186221008', '919034969308'];
  const all = [...defaults, ...envNumbers];

  // If connected phone is known, add it as well
  if (state.connectedPhone) {
    all.push(state.connectedPhone);
  }

  return Array.from(new Set(all));
}

/**
 * Initialize Baileys Multi-Device WhatsApp Socket
 */
export async function initWhatsApp(forceNew = false): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;

  try {
    ensureSessionDir();

    if (!forceNew) {
      await restoreSessionFromMongo();
    } else {
      await clearSession();
      ensureSessionDir();
    }

    state.status = 'CONNECTING';
    state.lastError = null;

    const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    if (sock) {
      try {
        sock.ev.removeAllListeners('connection.update');
        sock.ev.removeAllListeners('creds.update');
        sock.end(undefined);
      } catch {}
      sock = null;
    }

    sock = makeWASocket({
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, pinoLogger),
      },
      logger: pinoLogger,
      browser: ['Trinetra Realty CRM', 'Desktop', '1.0.0'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      void backupSessionToMongo();
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.qrRaw = qr;
        try {
          state.qrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 8,
            color: { dark: '#141413', light: '#FFFFFF' },
          });
          state.status = 'SCAN_QR';
          console.log(`📱 [WhatsApp] Fresh QR code generated! Ready to scan in Admin Panel.`);
        } catch (qrErr: any) {
          console.error(`❌ [WhatsApp] Failed to generate QR Data URL:`, qrErr.message);
        }
      }

      if (connection === 'open') {
        state.status = 'CONNECTED';
        state.qrCodeDataUrl = null;
        state.qrRaw = null;
        state.reconnectAttempts = 0;
        state.lastConnectedAt = new Date().toISOString();

        const rawUser = sock?.user;
        const phone = rawUser?.id ? rawUser.id.split(':')[0].replace(/\D/g, '') : null;
        state.connectedPhone = phone;
        state.connectedName = rawUser?.name || 'Trinetra Realty Advisory';

        console.log(`✅ [WhatsApp] Connected successfully as +${phone} (${state.connectedName})!`);
        void backupSessionToMongo();
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        console.log(`⚠️ [WhatsApp] Connection closed (code: ${statusCode}, loggedOut: ${loggedOut})`);

        if (loggedOut) {
          state.status = 'DISCONNECTED';
          state.qrCodeDataUrl = null;
          state.qrRaw = null;
          state.connectedPhone = null;
          await clearSession();
        } else {
          state.status = 'CONNECTING';
          state.reconnectAttempts++;
          const delay = Math.min(state.reconnectAttempts * 3000, 15000);
          console.log(`🔄 [WhatsApp] Reconnecting in ${delay / 1000}s (attempt ${state.reconnectAttempts})...`);
          setTimeout(() => {
            void initWhatsApp(false);
          }, delay);
        }
      }
    });
  } catch (err: any) {
    console.error(`❌ [WhatsApp] Initialization error:`, err.message);
    state.status = 'DISCONNECTED';
    state.lastError = err.message;
  } finally {
    isInitializing = false;
  }
}

/**
 * Disconnect and log out of the WhatsApp session
 */
export async function disconnectWhatsApp(): Promise<void> {
  if (sock) {
    try {
      await sock.logout();
    } catch {}
    try {
      sock.end(undefined);
    } catch {}
    sock = null;
  }
  await clearSession();
  state.status = 'DISCONNECTED';
  state.qrCodeDataUrl = null;
  state.qrRaw = null;
  state.connectedPhone = null;
  state.connectedName = null;
  console.log(`🔌 [WhatsApp] Logged out and disconnected.`);
}

/**
 * Return live status object for Admin Dashboard
 */
export function getWhatsAppStatus() {
  return {
    status: state.status,
    qrCodeDataUrl: state.qrCodeDataUrl,
    connectedPhone: state.connectedPhone,
    connectedName: state.connectedName,
    configuredOwnerNumbers: getOwnerPhoneNumbers(),
    lastConnectedAt: state.lastConnectedAt,
    lastError: state.lastError,
  };
}

/**
 * Format Customer Lead into a crisp, high-visibility WhatsApp Alert
 */
export function buildLeadWhatsAppMessage(lead: CustomerLead): string {
  const dateStr = new Date(lead.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const propertyOrProject =
    lead.projectName ||
    lead.propertyTitle ||
    lead.valuationDetails?.locality ||
    'Trinetra Portfolio Residence';

  const lines = [
    `🏛️ *TRINETRA REALTY · NEW ENQUIRY ALERT* 🏛️`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Client Name:* ${lead.name}`,
    `📞 *Client Phone:* ${lead.phone}`,
    `✉️ *Client Email:* ${lead.email}`,
    `📋 *Enquiry Type:* ${lead.type}${lead.inquirySubType ? ` (${lead.inquirySubType})` : ''}`,
    `🏡 *Property / Subject:* ${propertyOrProject}`,
  ];

  if (lead.propertyId) {
    lines.push(`🆔 *Property ID:* ${lead.propertyId}`);
  }

  if (lead.preferredDate) {
    lines.push(`📅 *Requested Tour Date:* ${lead.preferredDate} (${lead.preferredTimeSlot || 'Standard Slot'})`);
  }

  if (lead.visitMode) {
    lines.push(`🚗 *Tour Format:* ${lead.visitMode}`);
  }

  if (lead.valuationDetails) {
    lines.push(
      `📊 *Valuation Estimate:* ${lead.valuationDetails.estimatedRange}`,
      `📐 *Dimensions:* ${lead.valuationDetails.areaSqFt?.toLocaleString() || '-'} sq.ft. (${lead.valuationDetails.category || '-'})`
    );
  }

  if (lead.whatsappContext || lead.message) {
    lines.push(
      ``,
      `💬 *Client Notes / Topic:*`,
      `"${(lead.whatsappContext || lead.message || '').trim()}"`
    );
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🕒 *Timestamp:* ${dateStr}`,
    `⚡ *Trinetra Realty Direct Dispatch System*`
  );

  return lines.join('\n');
}

/**
 * Send WhatsApp lead notification to all configured business owners
 */
export async function sendWhatsAppLeadNotification(lead: CustomerLead): Promise<{
  sent: boolean;
  recipients: string[];
  errors: string[];
}> {
  if (state.status !== 'CONNECTED' || !sock) {
    console.warn(`⚠️ [WhatsApp] Notification skipped — WhatsApp is not connected (current: ${state.status})`);
    return { sent: false, recipients: [], errors: ['WhatsApp is not connected.'] };
  }

  const messageText = buildLeadWhatsAppMessage(lead);
  const ownerNumbers = getOwnerPhoneNumbers();
  const successfulRecipients: string[] = [];
  const errors: string[] = [];

  for (const phone of ownerNumbers) {
    const jid = formatToWhatsAppJid(phone);
    if (!jid) continue;

    try {
      await sock.sendMessage(jid, { text: messageText });
      successfulRecipients.push(phone);
      console.log(`📱 [WhatsApp] Alert sent to Business Owner (+${phone}) for lead ${lead.id}`);
      // Small pause between multiple recipients
      await new Promise((r) => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`❌ [WhatsApp] Failed to send alert to +${phone}:`, err.message);
      errors.push(`+${phone}: ${err.message}`);
    }
  }

  // Also send polite confirmation greeting to customer if phone is valid
  const customerJid = formatToWhatsAppJid(lead.phone);
  if (customerJid) {
    try {
      const customerGreeting = [
        `Dear *${lead.name}*,`,
        ``,
        `Thank you for connecting with *Trinetra Realty*! We have successfully received your enquiry regarding *${
          lead.propertyTitle || lead.projectName || 'our real estate portfolio'
        }*.`,
        ``,
        `Our Business Owners & Managing Partners, *Rahul Khatri* (+91 9186221008) and *Rohit Joon* (+91 9034969308), are reviewing your request and will reach out to you shortly.`,
        ``,
        `🏢 *Office:* F3, Supermax Galleria Market, Sector 33, Sonipat, Haryana`,
        `🌐 *Website:* https://trinetrarealty.vercel.app`,
        ``,
        `Warm regards,`,
        `*Trinetra Realty*`,
        `_Your Future, Our Focus._`,
      ].join('\n');

      await sock.sendMessage(customerJid, { text: customerGreeting });
      console.log(`📱 [WhatsApp] Customer greeting sent to ${lead.name} (+${lead.phone})`);
    } catch (custErr: any) {
      console.warn(`⚠️ [WhatsApp] Could not send customer greeting:`, custErr.message);
    }
  }

  return {
    sent: successfulRecipients.length > 0,
    recipients: successfulRecipients,
    errors,
  };
}

/**
 * Send a quick test WhatsApp message to verify connection
 */
export async function sendTestWhatsAppMessage(customTarget?: string): Promise<{
  success: boolean;
  target?: string;
  error?: string;
}> {
  if (state.status !== 'CONNECTED' || !sock) {
    return { success: false, error: 'WhatsApp is not currently connected. Please scan the QR code first.' };
  }

  const targetNumber = customTarget || state.connectedPhone || '919186221008';
  const jid = formatToWhatsAppJid(targetNumber);
  if (!jid) {
    return { success: false, error: `Invalid target phone number: ${targetNumber}` };
  }

  try {
    const text = [
      `✅ *TRINETRA REALTY · WHATSAPP AUTOMATION ACTIVE*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `This is a test notification confirming that WhatsApp automation is successfully paired and operational!`,
      ``,
      `Whenever a client submits an enquiry on https://trinetrarealty.vercel.app, you will receive full customer details here instantly.`,
      ``,
      `🕒 *Connected:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      `🏢 *Trinetra Realty — Your Future, Our Focus.*`,
    ].join('\n');

    await sock.sendMessage(jid, { text });
    return { success: true, target: targetNumber };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
