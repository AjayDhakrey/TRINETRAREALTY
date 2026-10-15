import path from 'path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Force IPv4 resolution order to avoid ENETUNREACH on cloud container networks like Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));

// Load root .env and backend/.env (preserving existing process.env variables)
dotenv.config({ path: path.resolve(BACKEND_DIR, '../.env') });
dotenv.config({ path: path.resolve(BACKEND_DIR, '../../.env') });

export const PORT = Number(process.env.PORT || 3000);
export const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
export const MONGODB_URI = process.env.MONGODB_URI;

export function slugifyProjectName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

