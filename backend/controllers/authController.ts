import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ADMIN_SESSION_DURATION_MS } from '../config';
import { activeAdminTokens, getAdminToken } from '../middleware/auth';
import { isMongoConnected } from '../db/mongo';
import { AdminSessionModel } from '../db/models/AdminSession';

export async function login(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const email = req.body?.email;
  const password = req.body?.password;
  const configuredEmail = process.env.ADMIN_EMAIL || 'admin@trinetrarealty.com';
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (
    typeof email === 'string' &&
    typeof password === 'string' &&
    email === configuredEmail &&
    password === configuredPassword
  ) {
    const now = Date.now();
    for (const [existingToken, expiresAt] of activeAdminTokens) {
      if (expiresAt <= now) activeAdminTokens.delete(existingToken);
    }
    const token = randomUUID();
    const expiresAt = now + ADMIN_SESSION_DURATION_MS;
    activeAdminTokens.set(token, expiresAt);

    if (isMongoConnected()) {
      try {
        await AdminSessionModel.create({
          token,
          email,
          expiresAt: new Date(expiresAt),
        });
      } catch (err) {
        console.error('Failed to persist admin session in MongoDB:', err);
      }
    }

    res.json({
      authenticated: true,
      token,
      expiresAt,
      user: {
        name: 'Managing Principal',
        role: 'Managing Principal, Trinetra Realty',
        email,
      },
    });
    return;
  }

  res.status(401).json({
    error: 'Invalid email or password.',
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = getAdminToken(req);
  if (token) {
    activeAdminTokens.delete(token);
    if (isMongoConnected()) {
      try {
        await AdminSessionModel.deleteOne({ token });
      } catch {}
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(204).end();
}

