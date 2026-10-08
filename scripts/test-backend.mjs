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
  console.log('🔄 Starting Backend Server for Full Integration Testing...');
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
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await wait(350);
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
    let createdPropertyId = '';
    let createdProjectId = '';
    let createdLeadId = '';

    await test('GET /api/health returns database status and engine info', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.status !== 'ok' || !data.database) {
        throw new Error('Invalid health response');
      }
      console.log(`       -> Database Engine: ${data.database}, ReadyState: ${data.mongo?.readyState}`);
    });

    await test('GET /api/db/status returns MongoDB connection metadata', async () => {
      const res = await fetch(`${BASE_URL}/api/db/status`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (typeof data.connected !== 'boolean' || !Array.isArray(data.modelsLoaded)) {
        throw new Error('Invalid db status response');
      }
      console.log(`       -> Models Loaded in Mongoose: ${data.modelsLoaded.join(', ')}`);
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

    await test('GET /api/bootstrap returns full platform catalog', async () => {
      const res = await fetch(`${BASE_URL}/api/bootstrap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.properties) || !Array.isArray(data.projects)) {
        throw new Error('Invalid bootstrap payload structure');
      }
      console.log(`       -> Found ${data.properties.length} properties, ${data.projects.length} projects`);
    });

    await test('GET /api/properties lists properties with filters', async () => {
      const res = await fetch(`${BASE_URL}/api/properties?category=Penthouse`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('Expected array');
      console.log(`       -> Found ${list.length} penthouse listings`);
    });

    await test('POST /api/properties creates a new property listing (Admin)', async () => {
      const payload = {
        title: 'Integration Test Sky Penthouse',
        locality: 'Golf Course Road · Sector 54',
        category: 'Penthouse',
        price: 95000000,
        areaSqFt: 4500,
        bedrooms: 4,
        bathrooms: 5,
        architecturalStyle: 'Modern Brutalism',
      };
      const res = await fetch(`${BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Status ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      if (!data.id || data.title !== payload.title) {
        throw new Error('Property creation failed');
      }
      createdPropertyId = data.id;
      console.log(`       -> Created Property ID: ${createdPropertyId}`);
    });

    await test('PUT /api/properties/:id updates an existing property (Admin)', async () => {
      const res = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price: 98000000 }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.price !== 98000000) throw new Error('Price not updated');
      console.log(`       -> Updated Price: ₹${data.price}`);
    });

    await test('GET /api/properties/:id fetches single property detail', async () => {
      const res = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.id !== createdPropertyId) throw new Error('ID mismatch');
    });

    await test('DELETE /api/properties/:id removes created property (Admin)', async () => {
      const res = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.deleted) throw new Error('Delete failed');
    });

    await test('GET /api/projects lists public published projects', async () => {
      const res = await fetch(`${BASE_URL}/api/projects`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('Expected array');
      console.log(`       -> Found ${list.length} published projects`);
    });

    await test('POST /api/admin/projects creates a flagship development (Admin)', async () => {
      const payload = {
        name: 'Trinetra Aurelia Test Residences',
        city: 'Gurugram',
        locality: 'Golf Course Extension',
        projectType: 'Ultra Luxury Highrise',
        startingPrice: 55000000,
        publicationState: 'PUBLISHED',
      };
      const res = await fetch(`${BASE_URL}/api/admin/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Status ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      if (!data.id || !data.slug) throw new Error('Project creation failed');
      createdProjectId = data.id;
      console.log(`       -> Created Project ID: ${createdProjectId} (Slug: ${data.slug})`);
    });

    await test('PATCH /api/admin/projects/:id/status toggles status attributes', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: true, projectStatus: 'Under Construction' }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.featured) throw new Error('Status patch failed');
    });

    await test('POST /api/admin/projects/:id/duplicate duplicates a project', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.id || !data.slug.includes('copy')) throw new Error('Duplication failed');
      // Clean up copy
      await fetch(`${BASE_URL}/api/admin/projects/${data.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    await test('DELETE /api/admin/projects/:id removes test project', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/projects/${createdProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.deleted) throw new Error('Project delete failed');
    });

    await test('POST /api/valuation/calculate calculates algorithmic valuation', async () => {
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
      console.log(`       -> Estimated Valuation: ${data.estimatedRange}`);
    });

    await test('POST /api/leads submits a customer lead inquiry', async () => {
      const payload = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+91 9876543210',
        type: 'Inquiry',
        message: 'Automated test inquiry from MongoDB Integration Suite.',
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
      createdLeadId = data.id;
      console.log(`       -> Created Lead ID: ${createdLeadId}`);
    });

    await test('GET /api/leads retrieves leads list (Admin)', async () => {
      const res = await fetch(`${BASE_URL}/api/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('Expected array');
      console.log(`       -> Total leads in database: ${list.length}`);
    });

    await test('PATCH /api/leads/:id updates lead status and notes (Admin)', async () => {
      const res = await fetch(`${BASE_URL}/api/leads/${createdLeadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Contacted', notes: 'Spoke with client.' }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.status !== 'Contacted') throw new Error('Lead status update failed');
    });

    await test('DELETE /api/leads/:id cleans up test lead (Admin)', async () => {
      const res = await fetch(`${BASE_URL}/api/leads/${createdLeadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    });

    await test('GET & POST /api/media manages media upload registry', async () => {
      const postRes = await fetch(`${BASE_URL}/api/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Test Render Elevation',
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
          category: 'Architectural Photography',
        }),
      });
      if (!postRes.ok) throw new Error(`Status ${postRes.status}`);

      const getRes = await fetch(`${BASE_URL}/api/media`);
      if (!getRes.ok) throw new Error(`Status ${getRes.status}`);
      const mediaList = await getRes.json();
      if (!Array.isArray(mediaList)) throw new Error('Expected array');
      console.log(`       -> Total media assets: ${mediaList.length}`);
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
