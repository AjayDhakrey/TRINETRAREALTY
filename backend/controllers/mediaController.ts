import { Request, Response } from 'express';
import * as store from '../db/store';
import { UploadedMedia } from '../../shared/types/realestate';
import { broadcastEvent } from '../services/realtimeService';

export async function getMedia(_req: Request, res: Response): Promise<void> {
  try {
    const media = await store.getMedia();
    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch media', details: err.message });
  }
}

export async function createMedia(req: Request, res: Response): Promise<void> {
  try {
    const { name, url, category, propertyId } = req.body;
    if (!name || !url) {
      res.status(400).json({ error: 'Image name and URL/data are required.' });
      return;
    }

    const newMedia: UploadedMedia = {
      id: `media-${Date.now()}`,
      name: name.trim(),
      url,
      category: category || 'Architectural Photography',
      uploadedAt: new Date().toISOString(),
    };

    const result = await store.createMedia(newMedia, propertyId);
    
    // Broadcast real-time event to all connected public and admin clients
    broadcastEvent('media:created', result);
    if (result.updatedProperty) {
      broadcastEvent('property:updated', result.updatedProperty);
    }

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save media', details: err.message });
  }
}

export async function updateMedia(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, category, url } = req.body;

    const updates: Partial<UploadedMedia> = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof category === 'string' && category.trim()) updates.category = category.trim();
    if (typeof url === 'string' && url.trim()) updates.url = url.trim();

    const updated = await store.updateMedia(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    broadcastEvent('media:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update media', details: err.message });
  }
}

export async function deleteMedia(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await store.deleteMedia(id);
    if (!result.deleted) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    broadcastEvent('media:deleted', { id });
    if (result.affectedProjects) {
      result.affectedProjects.forEach((proj) => broadcastEvent('project:updated', proj));
    }
    if (result.affectedProperties) {
      result.affectedProperties.forEach((prop) => broadcastEvent('property:updated', prop));
    }

    res.json({
      deleted: true,
      id,
      affectedProjects: result.affectedProjects,
      affectedProperties: result.affectedProperties,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete media', details: err.message });
  }
}

