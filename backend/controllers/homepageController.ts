import { Request, Response } from 'express';
import * as store from '../db/store';
import { broadcastEvent } from '../services/realtimeService';

export async function getHomepage(_req: Request, res: Response): Promise<void> {
  try {
    const content = await store.getHomepageContent();
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch homepage content', details: err.message });
  }
}

export async function updateHomepage(req: Request, res: Response): Promise<void> {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Invalid homepage content payload' });
      return;
    }

    const updated = await store.updateHomepageContent(updates);
    broadcastEvent('homepage:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update homepage content', details: err.message });
  }
}

