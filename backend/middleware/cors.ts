import { Request, Response, NextFunction } from 'express';
import { FRONTEND_ORIGIN } from '../config';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowedOrigin = FRONTEND_ORIGIN;
  const isVercelOrigin =
    origin && (origin.endsWith('.vercel.app') || origin === 'https://trinetrarealty.vercel.app');

  if (
    origin &&
    (!allowedOrigin ||
      allowedOrigin === '*' ||
      origin === allowedOrigin ||
      isVercelOrigin ||
      origin.startsWith('http://localhost:'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Admin-Token'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
  }
  next();
}

