import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  LogOut,
  ShieldCheck,
  Zap,
  Phone,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { WhatsAppIcon } from './SocialIcons';

interface WhatsAppStatusResponse {
  status: 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED';
  qrCodeDataUrl: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  configuredOwnerNumbers: string[];
  lastConnectedAt: string | null;
  lastError: string | null;
}

export const AdminWhatsAppManager: React.FC = () => {
  const [data, setData] = useState<WhatsAppStatusResponse>({
    status: 'DISCONNECTED',
    qrCodeDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    configuredOwnerNumbers: ['919186221008', '919034969308'],
    lastConnectedAt: null,
    lastError: null,
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState('919186221008');
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const pollIntervalRef = useRef<number | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/whatsapp/status');
      if (res.ok) {
        const json: WhatsAppStatusResponse = await res.json();
        setData(json);
      }
    } catch (err: any) {
      console.warn('Could not fetch WhatsApp status:', err);
    }
  };

  useEffect(() => {
    void fetchStatus();

    // Poll status frequently so user immediately sees connection state after scanning QR
    const pollTime = data.status === 'CONNECTED' ? 10000 : 3500;
    pollIntervalRef.current = window.setInterval(() => {
      void fetchStatus();
    }, pollTime);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [data.status]);

  const handleInitOrRefresh = async (forceNew = false) => {
    setRefreshing(true);
    setTestFeedback(null);
    try {
      await apiFetch('/api/whatsapp/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceNew }),
      });
      await fetchStatus();
    } catch (err: any) {
      setTestFeedback({ success: false, msg: `Initialization error: ${err.message}` });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp automation? You will need to re-scan the QR code to re-link.')) {
      return;
    }
    setDisconnecting(true);
    setTestFeedback(null);
    try {
      await apiFetch('/api/whatsapp/disconnect', { method: 'POST' });
      await fetchStatus();
    } catch (err: any) {
      setTestFeedback({ success: false, msg: `Disconnect error: ${err.message}` });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestFeedback(null);
    try {
      const res = await apiFetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setTestFeedback({
          success: true,
          msg: `Test alert dispatched successfully to +${result.target}! Check your WhatsApp.`,
        });
      } else {
        setTestFeedback({
          success: false,
          msg: result.error || 'Failed to send test WhatsApp message.',
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        msg: `Dispatch error: ${err.message}`,
      });
    } finally {
      setTestSending(false);
    }
  };

  const isConnected = data.status === 'CONNECTED';
  const isScanQR = data.status === 'SCAN_QR';
  const isConnecting = data.status === 'CONNECTING';

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-[#F3F2EE] border border-stone-200 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#25D366]/10 text-[#25D366] text-xs font-semibold uppercase tracking-wider rounded-full">
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Direct WhatsApp Automation (No-API)</span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413]">
            WhatsApp Web Multi-Device Pairing
          </h2>
          <p className="text-xs text-[#57534E] leading-relaxed max-w-2xl">
            Link WhatsApp by scanning the QR code with your mobile phone. Once connected, every client enquiry submitted on Trinetra Realty is automatically forwarded directly to the business owners&apos; WhatsApp numbers with 0 API cost.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isScanQR
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-stone-100 text-stone-700 border-stone-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-500'
                  : isScanQR
                  ? 'bg-amber-500'
                  : 'bg-stone-400'
              }`}
            />
            <span>
              {isConnected
                ? 'Connected & Active'
                : isScanQR
                ? 'QR Code Ready to Scan'
                : isConnecting
                ? 'Connecting Socket...'
                : 'Disconnected'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleInitOrRefresh(false)}
            disabled={refreshing}
            className="p-2 border border-stone-300 bg-white hover:border-[#141413] text-[#141413] transition-colors rounded-sm cursor-pointer disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {testFeedback && (
        <div
          className={`p-4 rounded-sm border text-xs flex items-center gap-2 ${
            testFeedback.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {testFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{testFeedback.msg}</span>
        </div>
      )}

      {/* MAIN CONTENT: 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 6 Cols: QR Code or Connection Card */}
        <div className="lg:col-span-6 bg-[#FBFBF9] border border-stone-300 p-6 sm:p-8 space-y-6 rounded-sm shadow-2xs">
          {isConnected ? (
            /* Connected State */
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-sm">
                <div className="w-12 h-12 bg-[#25D366] text-white flex items-center justify-center rounded-full shrink-0 shadow-sm">
                  <WhatsAppIcon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs uppercase tracking-wide font-semibold text-emerald-800">
                    Active Multi-Device Session
                  </div>
                  <div className="font-serif-display text-xl font-semibold text-[#141413]">
                    Connected as +{data.connectedPhone || 'Admin Phone'}
                  </div>
                  <div className="text-xs text-stone-500 font-mono-tabular">
                    {data.connectedName ? `Device: ${data.connectedName}` : 'Trinetra Realty Multi-Device Client'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#57534E]">
                <div className="flex justify-between py-2 border-b border-stone-200">
                  <span className="font-medium text-[#141413]">Socket Protocol:</span>
                  <span className="font-mono-tabular">Baileys Multi-Device (Encrypted)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-200">
                  <span className="font-medium text-[#141413]">Session Cloud Persistence:</span>
                  <span className="text-emerald-700 font-medium">MongoDB Synced</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-200">
                  <span className="font-medium text-[#141413]">Connected Since:</span>
                  <span className="font-mono-tabular">
                    {data.lastConnectedAt
                      ? new Date(data.lastConnectedAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Active Session'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-stone-300 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors rounded-sm cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{disconnecting ? 'Disconnecting...' : 'Disconnect WhatsApp Session'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInitOrRefresh(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-stone-300 text-[#141413] hover:border-[#141413] transition-colors rounded-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Re-Generate QR Code</span>
                </button>
              </div>
            </div>
          ) : (
            /* QR Code Scan State */
            <div className="space-y-6 text-center">
              <div>
                <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                  Scan QR Code to Pair
                </h3>
                <p className="text-xs text-[#57534E] mt-1">
                  Point your WhatsApp camera at the code below to pair this server with your WhatsApp.
                </p>
              </div>

              {/* QR Image Container */}
              <div className="relative inline-block mx-auto p-4 bg-white border-2 border-stone-300 rounded-sm shadow-md">
                {data.qrCodeDataUrl ? (
                  <div className="space-y-2">
                    <img
                      src={data.qrCodeDataUrl}
                      alt="WhatsApp Web Pairing QR Code"
                      className="w-64 h-64 mx-auto object-contain"
                    />
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#25D366] font-medium pt-1">
                      <Zap className="w-3 h-3 text-[#25D366]" />
                      <span>Live QR Code · Auto-refreshes when scanned</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-stone-400 space-y-3 bg-stone-50">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#1E3A2F]" />
                    <span className="text-xs text-[#57534E]">
                      {isConnecting ? 'Initializing WhatsApp Socket...' : 'Generating fresh QR Code...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="text-left bg-[#F3F2EE] p-5 border border-stone-200 rounded-sm space-y-2.5 text-xs text-[#44403C]">
                <div className="font-semibold text-[#141413] uppercase tracking-wider text-[11px]">
                  How to Pair Your Phone (3 Steps):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[#57534E]">
                  <li>
                    Open <strong>WhatsApp</strong> on your phone (Rahul Khatri or Rohit Joon&apos;s phone).
                  </li>
                  <li>
                    Tap <strong>Settings</strong> (iPhone) or <strong>Three dots ⋮</strong> (Android) &gt; <strong>Linked Devices</strong>.
                  </li>
                  <li>
                    Tap <strong>Link a Device</strong> and point your camera at the QR code above.
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => handleInitOrRefresh(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors rounded-sm cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Generate New QR Code'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 6 Cols: Alert Routing & Test Message Dispatch */}
        <div className="lg:col-span-6 space-y-6">
          {/* Business Owner Alert Routing Configuration */}
          <div className="bg-[#FBFBF9] border border-stone-300 p-6 sm:p-8 space-y-5 rounded-sm shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#1E3A2F]" />
              <span>Business Owner Notification Targets</span>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              Whenever a customer submits any enquiry (Property Inquiry, Schedule Tour, Property Valuation, WhatsApp Concierge, or Contact Desk), the dossier is formatted and dispatched immediately to these numbers:
            </p>

            <div className="space-y-3">
              {/* Rahul Khatri Card */}
              <div className="p-4 bg-white border border-stone-200 rounded-sm flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-stone-500 uppercase font-semibold">Business Owner &amp; Advisory Partner</div>
                  <div className="font-serif-display text-base font-semibold text-[#141413]">
                    Rahul Khatri
                  </div>
                  <div className="text-xs font-mono-tabular text-[#1E3A2F] font-semibold">
                    +91 9186221008
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366]/10 text-[#25D366] text-xs font-semibold rounded-xs">
                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                  <span>Primary</span>
                </span>
              </div>

              {/* Rohit Joon Card */}
              <div className="p-4 bg-white border border-stone-200 rounded-sm flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-stone-500 uppercase font-semibold">Business Owner &amp; Managing Partner</div>
                  <div className="font-serif-display text-base font-semibold text-[#141413]">
                    Rohit Joon
                  </div>
                  <div className="text-xs font-mono-tabular text-[#1E3A2F] font-semibold">
                    +91 9034969308
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366]/10 text-[#25D366] text-xs font-semibold rounded-xs">
                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                  <span>Primary</span>
                </span>
              </div>

              {/* Connected Self-Device Card if different */}
              {data.connectedPhone &&
                data.connectedPhone !== '919186221008' &&
                data.connectedPhone !== '919034969308' && (
                  <div className="p-4 bg-white border border-emerald-200 rounded-sm flex items-center justify-between shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-emerald-700 uppercase font-semibold">Connected Device Self-Chat</div>
                      <div className="font-serif-display text-base font-semibold text-[#141413]">
                        {data.connectedName || 'Linked Phone'}
                      </div>
                      <div className="text-xs font-mono-tabular text-emerald-800 font-semibold">
                        +{data.connectedPhone}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xs">
                      Self-Chat
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Test WhatsApp Message Dispatch Card */}
          <div className="bg-[#FBFBF9] border border-stone-300 p-6 sm:p-8 space-y-4 rounded-sm shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
              <Send className="w-4 h-4 text-[#1E3A2F]" />
              <span>Verify Delivery · Send Test Message</span>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              Test your WhatsApp connection by dispatching an instant test alert to verify that messages land directly in your WhatsApp chat.
            </p>

            <form onSubmit={handleSendTestMessage} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Recipient WhatsApp Number (with country code):
                </label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g., 919186221008"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none font-mono-tabular"
                />
              </div>

              <button
                type="submit"
                disabled={testSending || !isConnected}
                className="w-full py-2.5 text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-sm shadow-sm disabled:opacity-50"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>
                  {testSending
                    ? 'Dispatching Test Message...'
                    : !isConnected
                    ? 'Scan QR Code First to Send'
                    : 'Send Test WhatsApp Alert'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

