import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const PORT = 3055; // Use dedicated test port to prevent conflicts
const BASE_URL = `http://localhost:${PORT}`;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🔄 Starting Backend Server for Testing...');
  const serverProcess = spawn(
    process.execPath,
    [path.resolve(rootDir, 'node_modules/tsx/dist/cli.mjs'), 'backend/server.ts'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        PORT: String(PORT),
        ADMIN_EMAIL: 'admin@trinetrarealty.com',
        ADMIN_PASSWORD: 'admin',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    }
  );

  let output = '';
  serverProcess.stdout.on('data', (d) => {
    output += d.toString();
  });
  serverProcess.stderr.on('data', (d) => {
    output += d.toString();
  });

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/bootstrap`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await wait(300);
    }
  }

  if (!ready) {
    console.error('❌ Server failed to start in time. Output:\n', output);
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }

  console.log(`✅ Backend server active on ${BASE_URL}\n`);

  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  try {
    let token = '';

    await test('GET /api/bootstrap returns platform data', async () => {
      const res = await fetch(`${BASE_URL}/api/bootstrap`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.properties) || !Array.isArray(data.projects)) {
        throw new Error('Invalid bootstrap payload structure');
      }
      console.log(`       -> Found ${data.properties.length} properties, ${data.projects.length} projects`);
    });

    await test('GET /api/properties lists properties and supports filtering', async () => {
      const res = await fetch(`${BASE_URL}/api/properties?category=Penthouse`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('Expected array');
      console.log(`       -> Found ${list.length} penthouse listings`);
    });

    await test('GET /api/projects lists public published projects', async () => {
      const res = await fetch(`${BASE_URL}/api/projects`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('Expected array');
      console.log(`       -> Found ${list.length} published projects`);
    });

    await test('POST /api/valuation/calculate calculates property valuation', async () => {
      const payload = {
        locality: 'Golf Course Road · Sector 54',
        category: 'Penthouse',
        areaSqFt: 3500,
        bedrooms: 4,
        condition: 'Museum Grade / New',
      };
      const res = await fetch(`${BASE_URL}/api/valuation/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.estimatedValue || !data.estimatedRange) {
        throw new Error('Missing valuation fields');
      }
      console.log(`       -> Estimated: ${data.estimatedRange}`);
    });

    await test('POST /api/leads submits a customer lead inquiry', async () => {
      const payload = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+91 9876543210',
        type: 'Inquiry',
        message: 'Automated test inquiry from CI test runner.',
      };
      const res = await fetch(`${BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.id || data.name !== payload.name) {
        throw new Error('Lead creation failed');
      }
      console.log(`       -> Created Lead ID: ${data.id}`);
    });

    await test('POST /api/admin/login authenticates admin and issues token', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@trinetrarealty.com',
          password: 'admin',
        }),
      });
      if (!res.ok) throw new Error(`Login failed with status ${res.status}`);
      const data = await res.json();
      if (!data.authenticated || !data.token) {
        throw new Error('No authentication token received');
      }
      token = data.token;
      console.log(`       -> Authenticated as: ${data.user?.email}`);
    });

    await test('GET /api/admin/projects with Bearer token authorizes access', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Protected route failed: ${res.status}`);
      const projects = await res.json();
      if (!Array.isArray(projects)) throw new Error('Expected projects array');
      console.log(`       -> Admin projects count: ${projects.length}`);
    });

    await test('GET /api/leads with Bearer token retrieves customer leads', async () => {
      const res = await fetch(`${BASE_URL}/api/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Protected leads failed: ${res.status}`);
      const leads = await res.json();
      if (!Array.isArray(leads)) throw new Error('Expected leads array');
      console.log(`       -> Total customer leads in DB: ${leads.length}`);
    });

    await test('POST /api/admin/logout revokes admin session', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status !== 204) throw new Error(`Expected 204 status, got ${res.status}`);

      // Verify token is invalidated
      const checkRes = await fetch(`${BASE_URL}/api/admin/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkRes.status !== 401) {
        throw new Error('Token was not invalidated after logout');
      }
      console.log('       -> Session revoked successfully');
    });

  } finally {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch {}
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n🏁 Test Run Completed: ${passedCount}/${results.length} tests passed.`);
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests();
