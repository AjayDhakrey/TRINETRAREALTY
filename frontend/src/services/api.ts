import { DEMO_MODE, getAdminSession, clearAdminSession } from './session';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

const isProduction = import.meta.env.PROD;
export const ADMIN_SERVICE_UNAVAILABLE =
  'Admin service is temporarily unavailable. Please try again shortly.';

export function isApiBaseConfigured(): boolean {
  return DEMO_MODE || !isProduction || Boolean(API_BASE_URL);
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = (normalizedPath === '/api' || normalizedPath.startsWith('/api/'))
    ? normalizedPath
    : `/api${normalizedPath}`;
  return `${API_BASE_URL}${apiPath}`;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Build-time guard keeps the temporary demo modules out of real API builds.
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const requestUrl = new URL(
      typeof input === 'string' ? input : input instanceof Request ? input.url : input.href,
      window.location.origin
    );
    const path = requestUrl.pathname;
    const method = (init?.method || 'GET').toUpperCase();
    if (path === '/api/admin/login' && method === 'POST') {
      const { demoLogin } = await import('./demoAuth');
      return demoLogin(init);
    }
    if (path === '/api/admin/logout' && method === 'POST') {
      clearAdminSession();
      return new Response(null, { status: 204 });
    }
    const needsSession = path.startsWith('/api/admin/') ||
      (path.startsWith('/api/properties') && method !== 'GET') ||
      (path.startsWith('/api/leads') && method !== 'POST') ||
      (path.startsWith('/api/media') && method !== 'GET');
    if (needsSession && !getAdminSession()) {
      return Response.json({ error: 'Please sign in to the demo.' }, { status: 401 });
    }
    // Never fall through to the network in demo mode, including unknown endpoints.
    const { demoFetch } = await import('./demoApi');
    return demoFetch(path + requestUrl.search, init);
  }
  const url = typeof input === 'string' && input.startsWith('/') ? apiUrl(input) : input;
  const headers = new Headers(init?.headers);
  const token = getAdminSession();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!/application\/(?:[\w.+-]+\+)?json\b/i.test(contentType)) {
    if (import.meta.env.DEV) {
      console.error('API returned a non-JSON response.', {
        status: response.status,
        url: response.url,
      });
      // Technical details stay in the development console.
    }
    throw new Error(ADMIN_SERVICE_UNAVAILABLE);
  }
  return response.json() as Promise<T>;
}
