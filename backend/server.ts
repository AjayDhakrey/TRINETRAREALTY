import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {
  INITIAL_PROPERTIES,
  INITIAL_PROJECTS,
  INITIAL_LEADS,
  INITIAL_LOCALITIES,
  INITIAL_BLOG_POSTS,
  INITIAL_MEDIA,
} from '../frontend/src/data/seedData';
import {
  Property,
  CompanyProject,
  CustomerLead,
  LocalityProfile,
  BlogPost,
  UploadedMedia,
} from '../frontend/src/types/realestate';

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));

interface DatabaseSchema {
  properties: Property[];
  projects: CompanyProject[];
  leads: CustomerLead[];
  localities: LocalityProfile[];
  blogPosts: BlogPost[];
  media: UploadedMedia[];
}

const DATA_DIR = path.join(BACKEND_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'realestate-db.json');
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const activeAdminTokens = new Map<string, number>();

function slugifyProjectName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8').replace(/Atelier Vance/g, 'Trinetra Realty');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      const isLegacyUsdScale =
        parsed &&
        Array.isArray(parsed.properties) &&
        parsed.properties.some((p) => p.id === 'prop-1' && p.price === 8450000);
      if (
        parsed &&
        Array.isArray(parsed.properties) &&
        parsed.properties.length > 0 &&
        !isLegacyUsdScale
      ) {
        if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
          parsed.projects = [...INITIAL_PROJECTS];
          saveDatabase(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read database file, falling back to initial seed:', err);
  }

  const initialDb: DatabaseSchema = {
    properties: [...INITIAL_PROPERTIES],
    projects: [...INITIAL_PROJECTS],
    leads: [...INITIAL_LEADS],
    localities: [...INITIAL_LOCALITIES],
    blogPosts: [...INITIAL_BLOG_POSTS],
    media: [...INITIAL_MEDIA],
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function getAdminToken(req: express.Request): string {
  const authHeader = req.headers.authorization || '';
  const token = /^Bearer\s+/i.test(authHeader)
    ? authHeader.replace(/^Bearer\s+/i, '').trim()
    : '';
  const headerToken = req.headers['x-admin-token'];
  return token || (typeof headerToken === 'string' ? headerToken : '');
}

function isAdminAuthorized(req: express.Request): boolean {
  const token = getAdminToken(req);
  const expiresAt = activeAdminTokens.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    activeAdminTokens.delete(token);
    return false;
  }
  return true;
}

function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({
      error: 'Unauthorized. Admin authentication is required to manage company projects.',
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = process.env.FRONTEND_ORIGIN;
    if (origin && allowedOrigin && origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  // Serve generated images directly from /src/assets/images in both dev and production
  const assetsImagesPath = path.resolve(BACKEND_DIR, '../frontend/src/assets/images');
  if (fs.existsSync(assetsImagesPath)) {
    app.use('/src/assets/images', (req, res, next) => {
      if ('import' in req.query) {
        next();
        return;
      }
      express.static(assetsImagesPath)(req, res, next);
    });
  }

  let db = loadDatabase();

  // --- API: Bootstrap all platform data ---
  app.get('/api/bootstrap', (req, res) => {
    const isAdmin = isAdminAuthorized(req);
    const visibleProjects = isAdmin
      ? db.projects
      : db.projects.filter((p) => p.publicationState === 'PUBLISHED');

    res.json({
      properties: db.properties,
      projects: visibleProjects,
      allProjectsCount: db.projects.length,
      leads: isAdmin ? db.leads : [],
      localities: db.localities,
      blogPosts: db.blogPosts,
      media: db.media,
    });
  });

  // ============================================================================
  // API: PUBLIC "OUR PROJECTS" (Published Only for Public Visitors)
  // ============================================================================
  app.get('/api/projects', (req, res) => {
    const { status, projectType, city, featured, search } = req.query;
    let list = db.projects.filter((p) => p.publicationState === 'PUBLISHED');

    if (status && status !== 'All') {
      list = list.filter((p) => p.projectStatus === status);
    }
    if (projectType && projectType !== 'All') {
      list = list.filter((p) =>
        p.projectType.toLowerCase().includes(String(projectType).toLowerCase())
      );
    }
    if (city && city !== 'All') {
      list = list.filter((p) => p.city.toLowerCase() === String(city).toLowerCase());
    }
    if (featured === 'true') {
      list = list.filter((p) => p.featured);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.configurationSummary.toLowerCase().includes(q) ||
          p.reraNumber.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  app.get('/api/projects/:slugOrId', (req, res) => {
    const param = req.params.slugOrId;
    const isAdmin = isAdminAuthorized(req);
    const project = db.projects.find((p) => p.slug === param || p.id === param);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.publicationState !== 'PUBLISHED' && !isAdmin) {
      res.status(404).json({ error: 'Project is not publicly published' });
      return;
    }

    res.json(project);
  });

  // ============================================================================
  // API: ADMIN "OUR PROJECTS" MANAGEMENT (Protected by Admin Auth)
  // ============================================================================
  app.get('/api/admin/projects', requireAdminAuth, (_req, res) => {
    res.json(db.projects);
  });

  app.post('/api/admin/projects', requireAdminAuth, (req, res) => {
    const body = req.body as Partial<CompanyProject>;
    if (!body.name || !body.name.trim()) {
      res.status(400).json({ error: 'Project Name is required.' });
      return;
    }

    const baseSlug = slugifyProjectName(body.slug?.trim() || body.name);
    let uniqueSlug = baseSlug || `trinetra-project-${Date.now()}`;
    if (db.projects.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
    }

    const nextNum = db.projects.length + 1;
    const nowIso = new Date().toISOString();

    const newProject: CompanyProject = {
      id: `proj-${Date.now()}`,
      code: body.code?.trim() || `TR-PRJ-0${nextNum}`,
      name: body.name.trim(),
      slug: uniqueSlug,
      projectType: body.projectType?.trim() || 'Luxury Residential',
      developerBrand: body.developerBrand?.trim() || 'Trinetra Realty Developments',
      projectStatus: body.projectStatus || 'New Launch',
      publicationState: body.publicationState || 'DRAFT',
      featured: Boolean(body.featured),
      shortDescription:
        body.shortDescription?.trim() ||
        `Signature ${body.projectType || 'architectural'} development by Trinetra Realty in ${
          body.locality || body.city || 'India'
        }.`,
      fullDescription:
        body.fullDescription?.trim() ||
        body.shortDescription?.trim() ||
        'An iconic architectural landmark developed and represented by Trinetra Realty.',
      city: body.city?.trim() || 'Noida',
      locality: body.locality?.trim() || 'Sector 94 · Expressway',
      state: body.state?.trim() || 'Uttar Pradesh',
      fullAddress:
        body.fullAddress?.trim() ||
        `${body.locality || 'Sector 94'}, ${body.city || 'Noida'}, ${
          body.state || 'Uttar Pradesh'
        }`,
      googleMapsLink: body.googleMapsLink?.trim() || '',
      coordinates: body.coordinates?.trim() || '',
      startingPrice: Number(body.startingPrice) || 25000000,
      maxPrice: body.maxPrice !== undefined ? Number(body.maxPrice) : undefined,
      priceOnRequest: Boolean(body.priceOnRequest),
      configurationSummary: body.configurationSummary?.trim() || '3 BHK & 4 BHK Luxury Residences',
      areaRangeSqFt: body.areaRangeSqFt?.trim() || '2,200 – 4,200 sq.ft.',
      unitsAvailable: Number(body.unitsAvailable) ?? 24,
      totalUnits: Number(body.totalUnits) ?? 80,
      possessionDate: body.possessionDate?.trim() || 'December 2028',
      reraNumber: body.reraNumber?.trim() || 'UPRERAPRJ-PENDING',
      projectArea: body.projectArea?.trim() || '5.0 Acres',
      numberOfTowers: Number(body.numberOfTowers) ?? 2,
      numberOfFloors: Number(body.numberOfFloors) ?? 28,
      constructionStatus: body.constructionStatus?.trim() || 'Active Construction Underway',
      coverImage: body.coverImage?.trim() || INITIAL_PROJECTS[0].coverImage,
      galleryImages:
        Array.isArray(body.galleryImages) && body.galleryImages.length > 0
          ? body.galleryImages
          : [
              {
                url: body.coverImage?.trim() || INITIAL_PROJECTS[0].coverImage,
                caption: `${body.name.trim()} — Architectural Perspective`,
              },
            ],
      floorPlanImages: Array.isArray(body.floorPlanImages) ? body.floorPlanImages : [],
      masterPlanImage: body.masterPlanImage?.trim() || '',
      locationMapImage: body.locationMapImage?.trim() || '',
      brochurePdfUrl: body.brochurePdfUrl?.trim() || '',
      projectVideoUrl: body.projectVideoUrl?.trim() || '',
      amenities:
        Array.isArray(body.amenities) && body.amenities.length > 0
          ? body.amenities
          : ['Swimming Pool', 'Clubhouse', 'Gym', 'Landscaped Garden', 'Security', 'CCTV', 'Parking'],
      highlights:
        Array.isArray(body.highlights) && body.highlights.length > 0
          ? body.highlights
          : ['RERA registered flagship development by Trinetra Realty'],
      configurations: Array.isArray(body.configurations) ? body.configurations : [],
      seoTitle:
        body.seoTitle?.trim() ||
        `${body.name.trim()} — ${body.locality || body.city || 'Trinetra Realty'}`,
      seoDescription:
        body.seoDescription?.trim() ||
        body.shortDescription?.trim() ||
        `Explore ${body.name.trim()} by Trinetra Realty.`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.projects.unshift(newProject);
    saveDatabase(db);
    res.status(201).json(newProject);
  });

  app.put('/api/admin/projects/:id', requireAdminAuth, (req, res) => {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const existing = db.projects[idx];
    const updates = req.body as Partial<CompanyProject>;

    let updatedSlug = existing.slug;
    if (updates.slug && updates.slug.trim() !== existing.slug) {
      const candidate = slugifyProjectName(updates.slug);
      if (candidate) {
        const conflict = db.projects.some((p, i) => i !== idx && p.slug === candidate);
        updatedSlug = conflict ? `${candidate}-${Date.now().toString().slice(-4)}` : candidate;
      }
    }

    const updatedProject: CompanyProject = {
      ...existing,
      ...updates,
      id: existing.id,
      slug: updatedSlug,
      startingPrice:
        updates.startingPrice !== undefined
          ? Number(updates.startingPrice)
          : existing.startingPrice,
      maxPrice:
        updates.maxPrice !== undefined
          ? updates.maxPrice
            ? Number(updates.maxPrice)
            : undefined
          : existing.maxPrice,
      unitsAvailable:
        updates.unitsAvailable !== undefined
          ? Number(updates.unitsAvailable)
          : existing.unitsAvailable,
      totalUnits:
        updates.totalUnits !== undefined ? Number(updates.totalUnits) : existing.totalUnits,
      numberOfTowers:
        updates.numberOfTowers !== undefined
          ? Number(updates.numberOfTowers)
          : existing.numberOfTowers,
      numberOfFloors:
        updates.numberOfFloors !== undefined
          ? Number(updates.numberOfFloors)
          : existing.numberOfFloors,
      updatedAt: new Date().toISOString(),
    };

    db.projects[idx] = updatedProject;
    saveDatabase(db);
    res.json(updatedProject);
  });

  app.patch('/api/admin/projects/:id/status', requireAdminAuth, (req, res) => {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { publicationState, featured, projectStatus } = req.body;
    const existing = db.projects[idx];

    db.projects[idx] = {
      ...existing,
      publicationState: publicationState !== undefined ? publicationState : existing.publicationState,
      featured: featured !== undefined ? Boolean(featured) : existing.featured,
      projectStatus: projectStatus !== undefined ? projectStatus : existing.projectStatus,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(db);
    res.json(db.projects[idx]);
  });

  app.post('/api/admin/projects/:id/duplicate', requireAdminAuth, (req, res) => {
    const existing = db.projects.find((p) => p.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const nowIso = new Date().toISOString();
    const copySlug = `${existing.slug}-copy-${Date.now().toString().slice(-4)}`;
    const nextNum = db.projects.length + 1;

    const duplicated: CompanyProject = {
      ...existing,
      id: `proj-${Date.now()}`,
      code: `TR-PRJ-0${nextNum}`,
      name: `${existing.name} (Copy)`,
      slug: copySlug,
      publicationState: 'DRAFT',
      featured: false,
      configurations: existing.configurations.map((c, i) => ({
        ...c,
        id: `cfg-${Date.now()}-${i}`,
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.projects.unshift(duplicated);
    saveDatabase(db);
    res.status(201).json(duplicated);
  });

  app.delete('/api/admin/projects/:id', requireAdminAuth, (req, res) => {
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const removed = db.projects.splice(idx, 1)[0];
    saveDatabase(db);
    res.json({ deleted: true, id: removed.id });
  });

  // --- API: Properties CRUD & Filtering ---
  app.get('/api/properties', (req, res) => {
    const {
      transactionType,
      category,
      locality,
      minPrice,
      maxPrice,
      bedrooms,
      search,
    } = req.query;

    let result = [...db.properties];

    if (transactionType && transactionType !== 'All') {
      result = result.filter((p) => p.transactionType === transactionType);
    }
    if (category && category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (locality && locality !== 'All') {
      result = result.filter((p) => p.locality === locality);
    }
    if (minPrice) {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }
    if (bedrooms && bedrooms !== 'All') {
      result = result.filter((p) => p.bedrooms >= Number(bedrooms));
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.architecturalStyle.toLowerCase().includes(q)
      );
    }

    res.json(result);
  });

  app.get('/api/properties/:id', (req, res) => {
    const property = db.properties.find((p) => p.id === req.params.id);
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    res.json(property);
  });

  app.post('/api/properties', requireAdminAuth, (req, res) => {
    const body = req.body as Partial<Property>;
    if (!body.title || !body.price || !body.areaSqFt || !body.locality) {
      res.status(400).json({ error: 'Title, price, area, and locality are required.' });
      return;
    }

    const price = Number(body.price);
    const areaSqFt = Number(body.areaSqFt) || 1000;
    const pricePerSqFt = Math.round(price / areaSqFt);
    const nextNum = 150 + db.properties.length;

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      code: body.code || `AV-0${nextNum}`,
      title: body.title.trim(),
      subtitle:
        body.subtitle?.trim() ||
        `${body.architecturalStyle || 'Contemporary Architectural'} residence in ${body.locality}`,
      transactionType: body.transactionType === 'Rent' ? 'Rent' : 'Buy',
      category: body.category || 'Penthouse',
      status: body.status || 'Available',
      price,
      pricePerSqFt,
      areaSqFt,
      bedrooms: Number(body.bedrooms) || 3,
      bathrooms: Number(body.bathrooms) || 3,
      parkingSpaces: Number(body.parkingSpaces) ?? 2,
      locality: body.locality,
      address: body.address?.trim() || `${body.locality} Private Enclave`,
      architecturalStyle: body.architecturalStyle?.trim() || 'Contemporary Minimalist',
      architect: body.architect?.trim() || 'Trinetra Realty Design Group',
      yearBuilt: Number(body.yearBuilt) || 2026,
      monthlyMaintenance: Number(body.monthlyMaintenance) || 0,
      furnishedStatus: body.furnishedStatus || 'Bespoke Millwork',
      featured: Boolean(body.featured),
      images:
        Array.isArray(body.images) && body.images.length > 0
          ? body.images
          : [INITIAL_PROPERTIES[0].images[0]],
      description:
        body.description?.trim() ||
        'An architecturally significant residence curated by Trinetra Realty Private Advisory.',
      amenities:
        Array.isArray(body.amenities) && body.amenities.length > 0
          ? body.amenities
          : ['Private Elevator', 'Architectural Lighting', 'Concierge Security'],
      highlights:
        Array.isArray(body.highlights) && body.highlights.length > 0
          ? body.highlights
          : [
              'Curated architectural material palette',
              'Expansive natural daylight orientation',
              'Private outdoor terrace integration',
            ],
      createdAt: new Date().toISOString(),
    };

    db.properties.unshift(newProperty);
    saveDatabase(db);
    res.status(201).json(newProperty);
  });

  app.put('/api/properties/:id', requireAdminAuth, (req, res) => {
    const idx = db.properties.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const existing = db.properties[idx];
    const updates = req.body as Partial<Property>;
    const price = updates.price !== undefined ? Number(updates.price) : existing.price;
    const areaSqFt =
      updates.areaSqFt !== undefined ? Number(updates.areaSqFt) : existing.areaSqFt;
    const pricePerSqFt = areaSqFt > 0 ? Math.round(price / areaSqFt) : existing.pricePerSqFt;

    const updatedProperty: Property = {
      ...existing,
      ...updates,
      id: existing.id,
      price,
      areaSqFt,
      pricePerSqFt,
      bedrooms:
        updates.bedrooms !== undefined ? Number(updates.bedrooms) : existing.bedrooms,
      bathrooms:
        updates.bathrooms !== undefined ? Number(updates.bathrooms) : existing.bathrooms,
      parkingSpaces:
        updates.parkingSpaces !== undefined
          ? Number(updates.parkingSpaces)
          : existing.parkingSpaces,
      yearBuilt:
        updates.yearBuilt !== undefined ? Number(updates.yearBuilt) : existing.yearBuilt,
      monthlyMaintenance:
        updates.monthlyMaintenance !== undefined
          ? Number(updates.monthlyMaintenance)
          : existing.monthlyMaintenance,
    };

    db.properties[idx] = updatedProperty;
    saveDatabase(db);
    res.json(updatedProperty);
  });

  app.delete('/api/properties/:id', requireAdminAuth, (req, res) => {
    const idx = db.properties.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    const removed = db.properties.splice(idx, 1)[0];
    saveDatabase(db);
    res.json({ deleted: true, id: removed.id });
  });

  // --- API: Customer Leads (Inquiry, Schedule Visit, Valuation, WhatsApp, Project Leads) ---
  app.get('/api/leads', requireAdminAuth, (_req, res) => {
    res.json(db.leads);
  });

  app.post('/api/leads', (req, res) => {
    const body = req.body as Partial<CustomerLead>;
    if (!body.name || !body.email || !body.phone || !body.type) {
      res.status(400).json({ error: 'Name, email, phone, and lead type are required.' });
      return;
    }

    const newLead: CustomerLead = {
      id: `lead-${Date.now()}`,
      type: body.type,
      status: 'New',
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      propertyId: body.propertyId,
      propertyTitle: body.propertyTitle,
      projectId: body.projectId,
      projectName: body.projectName,
      projectSlug: body.projectSlug,
      inquirySubType: body.inquirySubType,
      leadSource: body.leadSource || (body.projectId ? 'Our Projects Detail Page' : 'Website Direct'),
      financingType: body.financingType,
      message: body.message?.trim(),
      preferredDate: body.preferredDate,
      preferredTimeSlot: body.preferredTimeSlot,
      visitMode: body.visitMode,
      valuationDetails: body.valuationDetails,
      whatsappContext: body.whatsappContext,
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };

    db.leads.unshift(newLead);
    saveDatabase(db);
    res.status(201).json(newLead);
  });

  app.patch('/api/leads/:id', requireAdminAuth, (req, res) => {
    const idx = db.leads.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const updates = req.body as Partial<CustomerLead>;
    db.leads[idx] = {
      ...db.leads[idx],
      status: updates.status || db.leads[idx].status,
      notes: updates.notes !== undefined ? updates.notes : db.leads[idx].notes,
    };

    saveDatabase(db);
    res.json(db.leads[idx]);
  });

  app.delete('/api/leads/:id', requireAdminAuth, (req, res) => {
    const idx = db.leads.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const removed = db.leads.splice(idx, 1)[0];
    saveDatabase(db);
    res.json({ deleted: true, id: removed.id });
  });

  // --- API: Algorithmic Property Valuation Calculator ---
  app.post('/api/valuation/calculate', (req, res) => {
    const { locality, category, areaSqFt, bedrooms, condition } = req.body;
    const locProfile = db.localities.find((l) => l.name === locality);
    const basePerSqFt = locProfile ? locProfile.avgPricePerSqFt : 18500;

    const categoryMultipliers: Record<string, number> = {
      Penthouse: 1.14,
      Estate: 1.18,
      Villa: 1.08,
      Waterfront: 1.12,
      Townhouse: 1.0,
    };

    const conditionMultipliers: Record<string, number> = {
      'Museum Grade / New': 1.12,
      'Architecturally Restored': 1.04,
      'Original / Needs Work': 0.88,
    };

    const catMult = categoryMultipliers[category] || 1.0;
    const condMult = conditionMultipliers[condition] || 1.0;
    const bedroomBonus = Math.max(0, (Number(bedrooms) - 3) * 0.025);

    const adjustedPerSqFt = Math.round(basePerSqFt * catMult * condMult * (1 + bedroomBonus));
    const estimatedValue = Math.round(adjustedPerSqFt * (Number(areaSqFt) || 3500));
    const lowVal = Math.round(estimatedValue * 0.95);
    const highVal = Math.round(estimatedValue * 1.05);

    const formatInrUnit = (val: number) =>
      val >= 10_000_000
        ? `₹${(val / 10_000_000).toFixed(2)} Cr`
        : `₹${(val / 100_000).toFixed(2)} Lakh`;

    res.json({
      estimatedValue,
      adjustedPerSqFt,
      lowVal,
      highVal,
      estimatedRange: `${formatInrUnit(lowVal)} – ${formatInrUnit(highVal)}`,
    });
  });

  // --- API: Media / Image Upload Management ---
  app.get('/api/media', (_req, res) => {
    res.json(db.media);
  });

  app.post('/api/media', requireAdminAuth, (req, res) => {
    const { name, url, category, propertyId } = req.body;
    if (!name || !url) {
      res.status(400).json({ error: 'Image name and URL/data are required.' });
      return;
    }

    const newMedia: UploadedMedia = {
      id: `media-${Date.now()}`,
      name: name.trim(),
      url,
      category: category || 'Architectural Photography',
      uploadedAt: new Date().toISOString(),
    };

    db.media.unshift(newMedia);

    let updatedProperty: Property | null = null;
    if (propertyId && propertyId !== 'none') {
      const propIdx = db.properties.findIndex((p) => p.id === propertyId);
      if (propIdx !== -1) {
        if (!db.properties[propIdx].images.includes(url)) {
          db.properties[propIdx].images.unshift(url);
        }
        updatedProperty = db.properties[propIdx];
      }
    }

    saveDatabase(db);
    res.status(201).json({ media: newMedia, updatedProperty });
  });

  // --- API: Admin Authentication ---
  app.post('/api/admin/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const email = req.body?.email;
    const password = req.body?.password;
    const configuredEmail = process.env.ADMIN_EMAIL || 'admin@trinetrarealty.com';
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (typeof email === 'string' && typeof password === 'string' &&
        email === configuredEmail && password === configuredPassword) {
      const now = Date.now();
      for (const [existingToken, expiresAt] of activeAdminTokens) {
        if (expiresAt <= now) activeAdminTokens.delete(existingToken);
      }
      const token = randomUUID();
      const expiresAt = now + ADMIN_SESSION_DURATION_MS;
      activeAdminTokens.set(token, expiresAt);
      res.json({
        authenticated: true,
        token,
        expiresAt,
        user: {
          name: 'Managing Principal',
          role: 'Managing Principal, Trinetra Realty',
          email,
        },
      });
      return;
    }

    res.status(401).json({
      error: 'Invalid email or password.',
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    activeAdminTokens.delete(getAdminToken(req));
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).end();
  });

  // The frontend is developed and deployed separately; this process serves the API only.

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trinetra Realty Real Estate Server running on http://localhost:${PORT}`);
  });
}

startServer();
