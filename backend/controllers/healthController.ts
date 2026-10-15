import { Request, Response } from 'express';
import { isMongoConnected, getMongoStatus } from '../db/mongo';
import * as store from '../db/store';
import { isAdminAuthorized } from '../middleware/auth';

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isMongoConnected() ? 'mongodb' : 'json-file',
    mongo: getMongoStatus(),
  });
}

export function getDbStatus(_req: Request, res: Response): void {
  res.json(getMongoStatus());
}

export async function getBootstrap(req: Request, res: Response): Promise<void> {
  try {
    const isAdmin = await isAdminAuthorized(req);
    const data = await store.getBootstrapData(isAdmin);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to bootstrap platform data', details: err.message });
  }
}

