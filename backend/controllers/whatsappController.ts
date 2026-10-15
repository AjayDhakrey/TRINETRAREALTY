import { Request, Response } from 'express';
import {
  initWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  sendTestWhatsAppMessage,
} from '../services/whatsappService';

export function getStatus(_req: Request, res: Response): void {
  res.json(getWhatsAppStatus());
}

export async function init(req: Request, res: Response): Promise<void> {
  const forceNew = req.body?.forceNew === true;
  void initWhatsApp(forceNew);
  res.json({ message: 'WhatsApp initialization initiated', status: getWhatsAppStatus() });
}

export async function disconnect(_req: Request, res: Response): Promise<void> {
  await disconnectWhatsApp();
  res.json({ message: 'Disconnected', status: getWhatsAppStatus() });
}

export async function testMessage(req: Request, res: Response): Promise<void> {
  const target = req.body?.phone;
  const result = await sendTestWhatsAppMessage(target);
  res.json(result);
}

