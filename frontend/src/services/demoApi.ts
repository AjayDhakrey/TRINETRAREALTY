import {
  INITIAL_PROPERTIES, INITIAL_PROJECTS, INITIAL_LEADS,
  INITIAL_LOCALITIES, INITIAL_BLOG_POSTS, INITIAL_MEDIA,
} from '../data/seedData';
import type { CompanyProject, CustomerLead, Property, UploadedMedia } from '../types/realestate';

// TEMPORARY, NON-PRODUCTION: a browser-only demo sandbox. Nothing is sent to a backend.
// Sample edits belong to this tab's session and never change production data.
const STORAGE_KEY = 'trinetra-demo-data-v1';
const seed = () => structuredClone({
  properties: INITIAL_PROPERTIES,
  projects: INITIAL_PROJECTS,
  leads: INITIAL_LEADS,
  localities: INITIAL_LOCALITIES,
  blogPosts: INITIAL_BLOG_POSTS,
  media: INITIAL_MEDIA,
});
type DemoData = ReturnType<typeof seed>;
let database: DemoData | undefined;

function getDatabase(): DemoData {
  if (database) return database;
  database = seed();
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DemoData;
      const valid = parsed && Object.keys(database).every((key) => {
        const rows = parsed[key as keyof DemoData];
        return Array.isArray(rows) && rows.every((row) => row && typeof row.id === 'string');
      });
      if (valid) database = parsed;
    }
  } catch {
    // Restricted storage or invalid old demo data should never prevent the demo opening.
  }
  return database;
}

function saveDatabase(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    // Large uploaded images can exceed browser quota; the active tab still keeps its edits.
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
const missing = () => json({ error: 'This demo record could not be found.' }, 404);
const uid = (prefix: string) => `${prefix}-demo-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function saveResult(body: unknown, status = 200): Response {
  saveDatabase();
  return json(body, status);
}

function uniqueSlug(value: string, projects: CompanyProject[], id?: string): string {
  const slug = slugify(value) || uid('project');
  return projects.some((item) => item.slug === slug && item.id !== id) ? `${slug}-${crypto.randomUUID().slice(0, 8)}` : slug;
}

function projectRecord(body: Partial<CompanyProject>, existing?: CompanyProject): CompanyProject {
  const record = {
    ...structuredClone(existing || INITIAL_PROJECTS[0]), ...body,
    id: existing?.id || uid('project'),
    code: body.code || existing?.code || `DEMO-PRJ-${getDatabase().projects.length + 1}`,
    publicationState: body.publicationState || existing?.publicationState || 'DRAFT',
    featured: body.featured ?? existing?.featured ?? false,
    createdAt: existing?.createdAt || now(), updatedAt: now(),
  };
  record.slug = uniqueSlug(body.slug || existing?.slug || record.name, getDatabase().projects, record.id);
  for (const key of ['startingPrice', 'unitsAvailable', 'totalUnits', 'numberOfTowers', 'numberOfFloors'] as const) {
    record[key] = Number(record[key]) || 0;
  }
  if (record.maxPrice !== undefined) record.maxPrice = Number(record.maxPrice) || undefined;
  return record;
}

function propertyRecord(body: Partial<Property>, existing?: Property): Property {
  const record = {
    ...structuredClone(existing || INITIAL_PROPERTIES[0]), ...body,
    id: existing?.id || uid('property'),
    code: body.code || existing?.code || `DEMO-PROP-${getDatabase().properties.length + 1}`,
    createdAt: existing?.createdAt || now(),
  };
  for (const key of ['price', 'areaSqFt', 'bedrooms', 'bathrooms', 'parkingSpaces', 'yearBuilt', 'monthlyMaintenance'] as const) {
    record[key] = Number(record[key]) || 0;
  }
  record.pricePerSqFt = record.areaSqFt > 0 ? Math.round(record.price / record.areaSqFt) : 0;
  return record;
}

export async function demoFetch(path: string, init?: RequestInit): Promise<Response> {
  const db = getDatabase();
  const url = new URL(path, 'https://demo.invalid');
  const route = url.pathname.replace(/\/+$/, '');
  const method = (init?.method || 'GET').toUpperCase();
  let body: Record<string, unknown> = {};
  try {
    if (typeof init?.body === 'string') {
      const parsed: unknown = JSON.parse(init.body);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return json({ error: 'The demo request could not be read. Please try again.' }, 400);
  }

  if (method === 'GET' && route === '/api/bootstrap') {
    return json({ ...db, allProjectsCount: db.projects.length });
  }
  if (method === 'GET' && route === '/api/admin/projects') return json(db.projects);
  if (method === 'GET' && route === '/api/projects') {
    const query = url.searchParams;
    let projects = db.projects.filter((project) => project.publicationState === 'PUBLISHED');
    for (const [parameter, key] of [['status', 'projectStatus'], ['city', 'city'], ['projectType', 'projectType']] as const) {
      const value = query.get(parameter);
      if (value && value !== 'All') projects = projects.filter((project) => project[key].toLowerCase().includes(value.toLowerCase()));
    }
    if (query.get('featured') === 'true') projects = projects.filter((project) => project.featured);
    const search = query.get('search')?.trim().toLowerCase();
    if (search) projects = projects.filter((project) => [project.name, project.locality, project.city, project.shortDescription, project.configurationSummary, project.reraNumber].join(' ').toLowerCase().includes(search));
    return json(projects);
  }

  const projectRoute = route.match(/^\/api\/(admin\/)?projects(?:\/([^/]+))?(?:\/(status|duplicate))?$/);
  if (projectRoute) {
    const [, admin, id, action] = projectRoute;
    const index = db.projects.findIndex((project) => project.id === id || project.slug === id);
    const existing = db.projects[index];
    if (id && !existing) return missing();
    if (method === 'GET' && existing) return json(existing);
    if (admin && method === 'POST' && !id) {
      if (typeof body.name !== 'string' || !body.name.trim()) return json({ error: 'Project Name is required.' }, 400);
      const record = projectRecord(body as Partial<CompanyProject>);
      db.projects.unshift(record);
      return saveResult(record, 201);
    }
    if (admin && existing && method === 'POST' && action === 'duplicate') {
      const copy = projectRecord({ ...structuredClone(existing), name: `${existing.name} (Copy)`, slug: `${existing.slug}-copy`, code: `DEMO-PRJ-${db.projects.length + 1}`, publicationState: 'DRAFT', featured: false });
      copy.configurations = copy.configurations.map((configuration) => ({ ...configuration, id: uid('configuration') }));
      db.projects.unshift(copy);
      return saveResult(copy, 201);
    }
    if (admin && existing && ((method === 'PUT' && !action) || (method === 'PATCH' && action === 'status'))) {
      db.projects[index] = projectRecord(body as Partial<CompanyProject>, existing);
      return saveResult(db.projects[index]);
    }
    if (admin && existing && method === 'DELETE' && !action) {
      db.projects.splice(index, 1);
      return saveResult({ deleted: true, id: existing.id });
    }
  }

  const propertyRoute = route.match(/^\/api\/properties(?:\/([^/]+))?$/);
  if (propertyRoute) {
    const id = propertyRoute[1];
    const index = db.properties.findIndex((property) => property.id === id);
    const existing = db.properties[index];
    if (id && !existing) return missing();
    if (method === 'GET' && existing) return json(existing);
    if (method === 'GET') {
      const query = url.searchParams;
      let properties = [...db.properties];
      for (const key of ['transactionType', 'category', 'locality'] as const) {
        const value = query.get(key);
        if (value && value !== 'All') properties = properties.filter((property) => property[key] === value);
      }
      if (query.get('minPrice')) properties = properties.filter((property) => property.price >= Number(query.get('minPrice')));
      if (query.get('maxPrice')) properties = properties.filter((property) => property.price <= Number(query.get('maxPrice')));
      if (query.get('bedrooms') && query.get('bedrooms') !== 'All') properties = properties.filter((property) => property.bedrooms >= Number(query.get('bedrooms')));
      const search = query.get('search')?.trim().toLowerCase();
      if (search) properties = properties.filter((property) => [property.title, property.subtitle, property.locality, property.address, property.code, property.architecturalStyle].join(' ').toLowerCase().includes(search));
      return json(properties);
    }
    if (method === 'POST' && !id) {
      if (!body.title || !Number(body.price) || !Number(body.areaSqFt) || !body.locality) return json({ error: 'Title, price, area, and locality are required.' }, 400);
      const record = propertyRecord(body as Partial<Property>);
      db.properties.unshift(record);
      return saveResult(record, 201);
    }
    if (method === 'PUT' && existing) {
      db.properties[index] = propertyRecord(body as Partial<Property>, existing);
      return saveResult(db.properties[index]);
    }
    if (method === 'DELETE' && existing) {
      db.properties.splice(index, 1);
      return saveResult({ deleted: true, id: existing.id });
    }
  }

  const leadRoute = route.match(/^\/api\/leads(?:\/([^/]+))?$/);
  if (leadRoute) {
    const id = leadRoute[1];
    const index = db.leads.findIndex((lead) => lead.id === id);
    const existing = db.leads[index];
    if (id && !existing) return missing();
    if (method === 'GET') return json(existing || db.leads);
    if (method === 'POST' && !id) {
      if (!body.name || !body.email || !body.phone || !body.type) return json({ error: 'Name, email, phone, and lead type are required.' }, 400);
      const record = { ...body, id: uid('lead'), status: 'New', notes: '', createdAt: now() } as CustomerLead;
      db.leads.unshift(record);
      return saveResult(record, 201);
    }
    if ((method === 'PATCH' || method === 'PUT') && existing) {
      db.leads[index] = { ...existing, ...body, id: existing.id } as CustomerLead;
      return saveResult(db.leads[index]);
    }
    if (method === 'DELETE' && existing) {
      db.leads.splice(index, 1);
      return saveResult({ deleted: true, id: existing.id });
    }
  }

  if (route === '/api/media' && method === 'GET') return json(db.media);
  if (route === '/api/media' && method === 'POST') {
    if (typeof body.name !== 'string' || typeof body.url !== 'string' || !body.name.trim() || !body.url) return json({ error: 'Image name and URL/data are required.' }, 400);
    const media: UploadedMedia = { id: uid('media'), name: body.name.trim(), url: body.url, category: String(body.category || 'Architectural Photography'), uploadedAt: now() };
    db.media.unshift(media);
    const updatedProperty = db.properties.find((property) => property.id === body.propertyId) || null;
    if (updatedProperty && !updatedProperty.images.includes(media.url)) updatedProperty.images.unshift(media.url);
    return saveResult({ media, updatedProperty }, 201);
  }
  if (route === '/api/valuation/calculate' && method === 'POST') {
    const base = db.localities.find((locality) => locality.name === body.locality)?.avgPricePerSqFt || 18500;
    const categories: Record<string, number> = { Penthouse: 1.14, Estate: 1.18, Villa: 1.08, Waterfront: 1.12, Townhouse: 1 };
    const conditions: Record<string, number> = { 'Museum Grade / New': 1.12, 'Architecturally Restored': 1.04, 'Original / Needs Work': 0.88 };
    const adjustedPerSqFt = Math.round(base * (categories[String(body.category)] || 1) * (conditions[String(body.condition)] || 1) * (1 + Math.max(0, (Number(body.bedrooms) - 3) * 0.025)));
    const estimatedValue = Math.round(adjustedPerSqFt * (Number(body.areaSqFt) || 3500));
    const lowVal = Math.round(estimatedValue * 0.95);
    const highVal = Math.round(estimatedValue * 1.05);
    const format = (value: number) => value >= 10_000_000 ? `₹${(value / 10_000_000).toFixed(2)} Cr` : `₹${(value / 100_000).toFixed(2)} Lakh`;
    return json({ adjustedPerSqFt, estimatedValue, lowVal, highVal, estimatedRange: `${format(lowVal)} – ${format(highVal)}` });
  }
  return json({ error: 'This action is not available in the client demo.' }, 501);
}
