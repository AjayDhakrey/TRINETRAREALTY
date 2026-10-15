import { Request, Response } from 'express';
import * as store from '../db/store';
import { CustomerLead } from '../../shared/types/realestate';
import {
  sendOwnerEmailNotification,
  sendClientConfirmationEmail,
} from '../services/notificationService';
import { sendWhatsAppLeadNotification } from '../services/whatsappService';
import { broadcastEvent } from '../services/realtimeService';

export async function getLeads(_req: Request, res: Response): Promise<void> {
  try {
    const leads = await store.getLeads();
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch leads', details: err.message });
  }
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Partial<CustomerLead>;
    if (!body.name || !body.email || !body.phone || !body.type) {
      res.status(400).json({ error: 'Name, email, phone, and lead type are required.' });
      return;
    }

    const newLead: CustomerLead = {
      id: `lead-${Date.now()}`,
      type: body.type,
      status: 'New',
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      propertyId: body.propertyId,
      propertyTitle: body.propertyTitle,
      projectId: body.projectId,
      projectName: body.projectName,
      projectSlug: body.projectSlug,
      inquirySubType: body.inquirySubType,
      leadSource: body.leadSource || (body.projectId ? 'Our Projects Detail Page' : 'Website Direct'),
      financingType: body.financingType,
      message: body.message?.trim(),
      preferredDate: body.preferredDate,
      preferredTimeSlot: body.preferredTimeSlot,
      visitMode: body.visitMode,
      valuationDetails: body.valuationDetails,
      whatsappContext: body.whatsappContext,
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };

    const created = await store.createLead(newLead);
    broadcastEvent('lead:created', created);

    // Trigger Email notifications sequentially to prevent Google Script concurrency locking:
    // 1. Business Owner lead dossier dispatch
    // 2. Client confirmation email
    // 3. Direct WhatsApp notification to Business Owners (Rahul Khatri & Rohit Joon)
    void (async () => {
      try {
        const ownerRes = await sendOwnerEmailNotification(created);
        if (ownerRes.sent) {
          console.log(`📧 [Notification] Owner email sent successfully (${ownerRes.recipient}) for lead ${created.id}`);
        } else {
          console.warn(`⚠️ [Notification] Owner email not dispatched: ${ownerRes.error}`);
        }
      } catch (err: any) {
        console.error(`❌ [Notification] Owner email error:`, err.message);
      }

      await new Promise((r) => setTimeout(r, 1200));

      try {
        const clientRes = await sendClientConfirmationEmail(created);
        if (clientRes.sent) {
          console.log(`📧 [Notification] Client email sent successfully (${clientRes.recipient}) for lead ${created.id}`);
        } else {
          console.warn(`⚠️ [Notification] Client email not dispatched: ${clientRes.error}`);
        }
      } catch (err: any) {
        console.error(`❌ [Notification] Client email error:`, err.message);
      }

      try {
        const waRes = await sendWhatsAppLeadNotification(created);
        if (waRes.sent) {
          console.log(`📱 [WhatsApp] Lead alert dispatched to owners: ${waRes.recipients.join(', ')}`);
        } else if (waRes.errors.length) {
          console.warn(`⚠️ [WhatsApp] Lead alert status: ${waRes.errors.join('; ')}`);
        }
      } catch (err: any) {
        console.error(`❌ [WhatsApp] Lead alert error:`, err.message);
      }
    })();

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit lead', details: err.message });
  }
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const updates = req.body as Partial<CustomerLead>;
    const sanitized: Partial<CustomerLead> = {};
    if (updates.status) sanitized.status = updates.status;
    if (updates.notes !== undefined) sanitized.notes = updates.notes;

    const updated = await store.updateLead(req.params.id, sanitized);
    if (!updated) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    broadcastEvent('lead:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update lead', details: err.message });
  }
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await store.deleteLead(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    broadcastEvent('lead:deleted', { id: req.params.id });
    res.json({ deleted: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete lead', details: err.message });
  }
}

