const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function isApiBaseConfigured(): boolean {
  return Boolean(apiBase) || !import.meta.env.PROD;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('/api/')
    ? `${apiBase}${input}`
    : input;
  const headers = new Headers(init?.headers);
  const token = window.localStorage.getItem('admin-token');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

export async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      'The API returned a web page instead of JSON. Set VITE_API_BASE_URL in Netlify to your deployed backend URL, then rebuild the site.'
    );
  }
  return response.json() as Promise<T>;
}
