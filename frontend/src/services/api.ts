const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('/api/')
    ? `${apiBase}${input}`
    : input;
  const headers = new Headers(init?.headers);
  const token = window.localStorage.getItem('admin-token');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
