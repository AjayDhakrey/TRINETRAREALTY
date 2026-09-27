export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const SESSION_KEY = DEMO_MODE ? 'trinetra-demo-session-v1' : 'trinetra-admin-session-v1';
let memoryToken = '';

export function getAdminSession(): string {
  try {
    const token = window.sessionStorage.getItem(SESSION_KEY) || memoryToken;
    // A demo session must never authenticate a production API request.
    return DEMO_MODE === token.startsWith('demo-session-') ? token : '';
  } catch { return memoryToken; }
}

export function setAdminSession(token: string): void {
  if (!token || DEMO_MODE !== token.startsWith('demo-session-')) return;
  memoryToken = token;
  try { window.sessionStorage.setItem(SESSION_KEY, token); } catch { /* Memory-only session. */ }
}

export function clearAdminSession(): void {
  memoryToken = '';
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem('admin-token');
  } catch { /* Storage can be unavailable in private browsing. */ }
}
