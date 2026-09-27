// TEMPORARY, NON-PRODUCTION authentication. These credentials are public.
// Never reuse them in ADMIN_EMAIL/ADMIN_PASSWORD or send this session to Express.
export async function demoLogin(init?: RequestInit): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try { body = JSON.parse(String(init?.body || '{}')); }
  catch { return Response.json({ error: 'Invalid sign-in request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid sign-in request.' }, { status: 400 });
  }
  if (String(body.email || '').trim().toLowerCase() !== 'demo@trinetrarealty.com' ||
      body.password !== 'Demo@2026') {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  return Response.json({
    authenticated: true,
    token: 'demo-session-' + crypto.randomUUID(),
    user: { name: 'Client Demo', role: 'Demo administrator' },
  });
}
