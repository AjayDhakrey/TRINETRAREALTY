import { Request, Response, NextFunction } from 'express';
import { isMongoConnected } from '../db/mongo';
import { AdminSessionModel } from '../db/models/AdminSession';

export const activeAdminTokens = new Map<string, number>();

export function getAdminToken(req: Request): string {
  const authHeader = req.headers.authorization || '';
  const token = /^Bearer\s+/i.test(authHeader)
    ? authHeader.replace(/^Bearer\s+/i, '').trim()
    : '';
  const headerToken = req.headers['x-admin-token'];
  return token || (typeof headerToken === 'string' ? headerToken : '');
}

export async function isAdminAuthorized(req: Request): Promise<boolean> {
  const token = getAdminToken(req);
  if (!token) return false;
  const expiresAt = activeAdminTokens.get(token);
  if (expiresAt && expiresAt > Date.now()) {
    return true;
  }
  if (expiresAt && expiresAt <= Date.now()) {
    activeAdminTokens.delete(token);
    return false;
  }

  // Fallback to MongoDB persistent session (survives Render restarts & sleep cycles)
  if (isMongoConnected()) {
    try {
      const session = await AdminSessionModel.findOne({
        token,
        expiresAt: { $gt: new Date() },
      }).lean();
      if (session) {
        activeAdminTokens.set(token, new Date(session.expiresAt).getTime());
        return true;
      }
    } catch {
      // Ignore DB read error and fall through
    }
  }

  return false;
}

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authorized = await isAdminAuthorized(req);
  if (!authorized) {
    res.status(401).json({
      error: 'Unauthorized. Admin session has expired or is invalid. Please sign in again.',
    });
    return;
  }
  next();
}

