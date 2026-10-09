import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import dns from 'node:dns';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

// Force IPv4 resolution order to avoid ENETUNREACH on cloud container networks like Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));

// Load root .env and backend/.env (preserving existing process.env variables)
dotenv.config({ path: path.resolve(BACKEND_DIR, '.env') });
dotenv.config({ path: path.resolve(BACKEND_DIR, '../.env') });

import {
  INITIAL_PROJECTS,
  INITIAL_PROPERTIES,
} from '../frontend/src/data/seedData';
import {
  Property,
  CompanyProject,
  CustomerLead,
  UploadedMedia,
} from '../frontend/src/types/realestate';
import { connectMongoDB, getMongoStatus, isMongoConnected } from './db/mongo';
import * as store from './db/store';
import { AdminSessionModel } from './models/AdminSession';
import {
  sendOwnerEmailNotification,
  sendClientConfirmationEmail,
} from './services/notificationService';
import {
  initWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  sendWhatsAppLeadNotification,
  sendTestWhatsAppMessage,
} from './services/whatsappService';

const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const activeAdminTokens = new Map<string, number>();

function slugifyProjectName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getAdminToken(req: express.Request): string {
  const authHeader = req.headers.authorization || '';
  const token = /^Bearer\s+/i.test(authHeader)
    ? authHeader.replace(/^Bearer\s+/i, '').trim()
    : '';
  const headerToken = req.headers['x-admin-token'];
  return token || (typeof headerToken === 'string' ? headerToken : '');
}

async function isAdminAuthorized(req: express.Request): Promise<boolean> {
  const token = getAdminToken(req);
  if (!token) return false;
  const expiresAt = activeAdminTokens.get(token);
  if (expiresAt && expiresAt > Date.now()) {
    return true;
  }
  if (expiresAt && expiresAt <= Date.now()) {
    activeAdminTokens.delete(token);
    return false;
  }

  // Fallback to MongoDB persistent session (survives Render restarts & sleep cycles)
  if (isMongoConnected()) {
    try {
      const session = await AdminSessionModel.findOne({
        token,
        expiresAt: { $gt: new Date() },
      }).lean();
      if (session) {
        activeAdminTokens.set(token, new Date(session.expiresAt).getTime());
        return true;
      }
    } catch {
      // Ignore DB read error and fall through
    }
  }

  return false;
}

async function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const authorized = await isAdminAuthorized(req);
  if (!authorized) {
    res.status(401).json({
      error: 'Unauthorized. Admin session has expired or is invalid. Please sign in again.',
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Initialize MongoDB connection (falls back cleanly to JSON database if URI unavailable)
  await connectMongoDB(process.env.MONGODB_URI);

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = process.env.FRONTEND_ORIGIN;
    const isVercelOrigin = origin && (origin.endsWith('.vercel.app') || origin === 'https://trinetrarealty.vercel.app');
    
    if (origin && (!allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin || isVercelOrigin || origin.startsWith('http://localhost:'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
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

  // --- API: Database Health & Connection Status ---
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: isMongoConnected() ? 'mongodb' : 'json-file',
      mongo: getMongoStatus(),
    });
  });

  app.get('/api/db/status', (_req, res) => {
    res.json(getMongoStatus());
  });

  // --- API: Bootstrap all platform data ---
  app.get('/api/bootstrap', async (req, res) => {
    try {
      const isAdmin = await isAdminAuthorized(req);
      const data = await store.getBootstrapData(isAdmin);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to bootstrap platform data', details: err.message });
    }
  });

  // ============================================================================
  // API: PUBLIC "OUR PROJECTS"
  // ============================================================================
  app.get('/api/projects', async (req, res) => {
    try {
      const { status, projectType, city, featured, search } = req.query;
      const list = await store.getPublicProjects({
        status: typeof status === 'string' ? status : undefined,
        projectType: typeof projectType === 'string' ? projectType : undefined,
        city: typeof city === 'string' ? city : undefined,
        featured: typeof featured === 'string' ? featured : undefined,
        search: typeof search === 'string' ? search : undefined,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
    }
  });

  app.get('/api/projects/:slugOrId', async (req, res) => {
    try {
      const param = req.params.slugOrId;
      const isAdmin = await isAdminAuthorized(req);
      const project = await store.getProjectBySlugOrId(param, isAdmin);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (project === 'UNAUTHORIZED') {
        res.status(404).json({ error: 'Project is not publicly published' });
        return;
      }

      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch project', details: err.message });
    }
  });

  // ============================================================================
  // API: ADMIN "OUR PROJECTS" MANAGEMENT (Protected by Admin Auth)
  // ============================================================================
  app.get('/api/admin/projects', requireAdminAuth, async (_req, res) => {
    try {
      const projects = await store.getAllProjectsAdmin();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch admin projects', details: err.message });
    }
  });

  app.post('/api/admin/projects', requireAdminAuth, async (req, res) => {
    try {
      const body = req.body as Partial<CompanyProject>;
      if (!body.name || !body.name.trim()) {
        res.status(400).json({ error: 'Project Name is required.' });
        return;
      }

      const allProjects = await store.getAllProjectsAdmin();
      const baseSlug = slugifyProjectName(body.slug?.trim() || body.name);
      let uniqueSlug = baseSlug || `trinetra-project-${Date.now()}`;
      if (allProjects.some((p) => p.slug === uniqueSlug)) {
        uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
      }

      const nextNum = allProjects.length + 1;
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
        unitsAvailable: body.unitsAvailable !== undefined ? Number(body.unitsAvailable) : 24,
        totalUnits: body.totalUnits !== undefined ? Number(body.totalUnits) : 80,
        possessionDate: body.possessionDate?.trim() || 'December 2028',
        reraNumber: body.reraNumber?.trim() || 'UPRERAPRJ-PENDING',
        projectArea: body.projectArea?.trim() || '5.0 Acres',
        numberOfTowers: body.numberOfTowers !== undefined ? Number(body.numberOfTowers) : 2,
        numberOfFloors: body.numberOfFloors !== undefined ? Number(body.numberOfFloors) : 28,
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

      const created = await store.createProject(newProject);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('❌ Error creating project:', err);
      res.status(500).json({ error: 'Failed to create project', details: err.message });
    }
  });

  app.put('/api/admin/projects/:id', requireAdminAuth, async (req, res) => {
    try {
      const updates = req.body as Partial<CompanyProject>;
      const existing = await store.getProjectBySlugOrId(req.params.id, true);
      if (!existing || existing === 'UNAUTHORIZED') {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      let updatedSlug = existing.slug;
      if (updates.slug && updates.slug.trim() !== existing.slug) {
        const candidate = slugifyProjectName(updates.slug);
        if (candidate) {
          const all = await store.getAllProjectsAdmin();
          const conflict = all.some((p) => p.id !== req.params.id && p.slug === candidate);
          updatedSlug = conflict ? `${candidate}-${Date.now().toString().slice(-4)}` : candidate;
        }
      }

      const sanitizedUpdates: Partial<CompanyProject> = {
        ...updates,
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
      };

      const updated = await store.updateProject(req.params.id, sanitizedUpdates);
      if (!updated) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update project', details: err.message });
    }
  });

  app.patch('/api/admin/projects/:id/status', requireAdminAuth, async (req, res) => {
    try {
      const { publicationState, featured, projectStatus } = req.body;
      const updates: Partial<CompanyProject> = {};
      if (publicationState !== undefined) updates.publicationState = publicationState;
      if (featured !== undefined) updates.featured = Boolean(featured);
      if (projectStatus !== undefined) updates.projectStatus = projectStatus;

      const updated = await store.updateProject(req.params.id, updates);
      if (!updated) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update project status', details: err.message });
    }
  });

  app.post('/api/admin/projects/:id/duplicate', requireAdminAuth, async (req, res) => {
    try {
      const existing = await store.getProjectBySlugOrId(req.params.id, true);
      if (!existing || existing === 'UNAUTHORIZED') {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const all = await store.getAllProjectsAdmin();
      const nowIso = new Date().toISOString();
      const copySlug = `${existing.slug}-copy-${Date.now().toString().slice(-4)}`;
      const nextNum = all.length + 1;

      const { _id, __v, ...projectData } = existing as any;

      const duplicated: CompanyProject = {
        ...projectData,
        id: `proj-${Date.now()}`,
        code: `TR-PRJ-0${nextNum}`,
        name: `${existing.name} (Copy)`,
        slug: copySlug,
        publicationState: 'DRAFT',
        featured: false,
        configurations: (existing.configurations || []).map((c: any, i: number) => ({
          ...c,
          id: `cfg-${Date.now()}-${i}`,
        })),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const created = await store.createProject(duplicated);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('❌ Error duplicating project:', err);
      res.status(500).json({ error: 'Failed to duplicate project', details: err.message });
    }
  });

  app.delete('/api/admin/projects/:id', requireAdminAuth, async (req, res) => {
    try {
      const deleted = await store.deleteProject(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json({ deleted: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete project', details: err.message });
    }
  });

  // --- API: Properties CRUD & Filtering ---
  app.get('/api/properties', async (req, res) => {
    try {
      const {
        transactionType,
        category,
        locality,
        minPrice,
        maxPrice,
        bedrooms,
        search,
      } = req.query;

      const result = await store.getProperties({
        transactionType: typeof transactionType === 'string' ? transactionType : undefined,
        category: typeof category === 'string' ? category : undefined,
        locality: typeof locality === 'string' ? locality : undefined,
        minPrice: typeof minPrice === 'string' ? minPrice : undefined,
        maxPrice: typeof maxPrice === 'string' ? maxPrice : undefined,
        bedrooms: typeof bedrooms === 'string' ? bedrooms : undefined,
        search: typeof search === 'string' ? search : undefined,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch properties', details: err.message });
    }
  });

  app.get('/api/properties/:id', async (req, res) => {
    try {
      const property = await store.getPropertyById(req.params.id);
      if (!property) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }
      res.json(property);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch property', details: err.message });
    }
  });

  app.post('/api/properties', requireAdminAuth, async (req, res) => {
    try {
      const body = req.body as Partial<Property>;
      if (!body.title || !body.price || !body.areaSqFt || !body.locality) {
        res.status(400).json({ error: 'Title, price, area, and locality are required.' });
        return;
      }

      const price = Number(body.price);
      const areaSqFt = Number(body.areaSqFt) || 1000;
      const pricePerSqFt = Math.round(price / areaSqFt);
      const existingList = await store.getProperties({});
      const nextNum = 150 + existingList.length;

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
        bedrooms: body.bedrooms !== undefined ? Number(body.bedrooms) : 3,
        bathrooms: body.bathrooms !== undefined ? Number(body.bathrooms) : 3,
        parkingSpaces: body.parkingSpaces !== undefined ? Number(body.parkingSpaces) : 2,
        locality: body.locality,
        address: body.address?.trim() || `${body.locality} Private Enclave`,
        architecturalStyle: body.architecturalStyle?.trim() || 'Contemporary Minimalist',
        architect: body.architect?.trim() || 'Trinetra Realty Design Group',
        yearBuilt: body.yearBuilt !== undefined ? Number(body.yearBuilt) : 2026,
        monthlyMaintenance: body.monthlyMaintenance !== undefined ? Number(body.monthlyMaintenance) : 0,
        furnishedStatus: body.furnishedStatus || 'Bespoke Millwork',
        featured: Boolean(body.featured),
        images:
          Array.isArray(body.images) &&
          body.images.filter((img) => typeof img === 'string' && img.trim().length > 0).length > 0
            ? body.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
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

      const created = await store.createProperty(newProperty);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('❌ Error creating property:', err);
      res.status(500).json({ error: 'Failed to create property', details: err.message });
    }
  });

  app.put('/api/properties/:id', requireAdminAuth, async (req, res) => {
    try {
      const existing = await store.getPropertyById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }

      const updates = req.body as Partial<Property>;
      const price = updates.price !== undefined ? Number(updates.price) : existing.price;
      const areaSqFt =
        updates.areaSqFt !== undefined ? Number(updates.areaSqFt) : existing.areaSqFt;
      const pricePerSqFt = areaSqFt > 0 ? Math.round(price / areaSqFt) : existing.pricePerSqFt;

      const sanitizedUpdates: Partial<Property> = {
        ...updates,
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

      const updated = await store.updateProperty(req.params.id, sanitizedUpdates);
      if (!updated) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update property', details: err.message });
    }
  });

  app.delete('/api/properties/:id', requireAdminAuth, async (req, res) => {
    try {
      const deleted = await store.deleteProperty(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }
      res.json({ deleted: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete property', details: err.message });
    }
  });

  // --- API: Customer Leads ---
  app.get('/api/leads', requireAdminAuth, async (_req, res) => {
    try {
      const leads = await store.getLeads();
      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch leads', details: err.message });
    }
  });

  app.post('/api/leads', async (req, res) => {
    try {
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

      const created = await store.createLead(newLead);

      // Trigger Email notifications:
      // 1. Business Owner lead dossier dispatch (dhakreyajay444@gmail.com)
      // 2. Client confirmation email (e.g. dhakreyajay1356@gmail.com)
      // Trigger Email notifications sequentially to prevent Google Script concurrency locking:
      // 1. Business Owner lead dossier dispatch (dhakreyajay444@gmail.com)
      // 2. Client confirmation email (e.g. dhakreyajay1356@gmail.com)
      void (async () => {
        try {
          const ownerRes = await sendOwnerEmailNotification(created);
          if (ownerRes.sent) {
            console.log(`📧 [Notification] Owner email sent successfully (${ownerRes.recipient}) for lead ${created.id}`);
          } else {
            console.warn(`⚠️ [Notification] Owner email not dispatched: ${ownerRes.error}`);
          }
        } catch (err: any) {
          console.error(`❌ [Notification] Owner email error:`, err.message);
        }

        await new Promise((r) => setTimeout(r, 1200));

        try {
          const clientRes = await sendClientConfirmationEmail(created);
          if (clientRes.sent) {
            console.log(`📧 [Notification] Client email sent successfully (${clientRes.recipient}) for lead ${created.id}`);
          } else {
            console.warn(`⚠️ [Notification] Client email not dispatched: ${clientRes.error}`);
          }
        } catch (err: any) {
          console.error(`❌ [Notification] Client email error:`, err.message);
        }

        // 3. Direct WhatsApp notification to Business Owners (Rahul Khatri & Rohit Joon)
        try {
          const waRes = await sendWhatsAppLeadNotification(created);
          if (waRes.sent) {
            console.log(`📱 [WhatsApp] Lead alert dispatched to owners: ${waRes.recipients.join(', ')}`);
          } else if (waRes.errors.length) {
            console.warn(`⚠️ [WhatsApp] Lead alert status: ${waRes.errors.join('; ')}`);
          }
        } catch (err: any) {
          console.error(`❌ [WhatsApp] Lead alert error:`, err.message);
        }
      })();

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit lead', details: err.message });
    }
  });

  app.patch('/api/leads/:id', requireAdminAuth, async (req, res) => {
    try {
      const updates = req.body as Partial<CustomerLead>;
      const sanitized: Partial<CustomerLead> = {};
      if (updates.status) sanitized.status = updates.status;
      if (updates.notes !== undefined) sanitized.notes = updates.notes;

      const updated = await store.updateLead(req.params.id, sanitized);
      if (!updated) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update lead', details: err.message });
    }
  });

  app.delete('/api/leads/:id', requireAdminAuth, async (req, res) => {
    try {
      const deleted = await store.deleteLead(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Lead not found' });
        return;
      }
      res.json({ deleted: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete lead', details: err.message });
    }
  });

  // --- API: Algorithmic Property Valuation Calculator ---
  app.post('/api/valuation/calculate', async (req, res) => {
    try {
      const { locality, category, areaSqFt, bedrooms, condition } = req.body;
      const localities = await store.getLocalities();
      const locProfile = localities.find((l) => l.name === locality);
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
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to calculate valuation', details: err.message });
    }
  });

  // --- API: Media / Image Upload Management ---
  app.get('/api/media', async (_req, res) => {
    try {
      const media = await store.getMedia();
      res.json(media);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch media', details: err.message });
    }
  });

  app.post('/api/media', requireAdminAuth, async (req, res) => {
    try {
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

      const result = await store.createMedia(newMedia, propertyId);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save media', details: err.message });
    }
  });

  // --- API: Admin Authentication ---
  app.post('/api/admin/login', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const email = req.body?.email;
    const password = req.body?.password;
    const configuredEmail = process.env.ADMIN_EMAIL || 'admin@trinetrarealty.com';
    const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (
      typeof email === 'string' &&
      typeof password === 'string' &&
      email === configuredEmail &&
      password === configuredPassword
    ) {
      const now = Date.now();
      for (const [existingToken, expiresAt] of activeAdminTokens) {
        if (expiresAt <= now) activeAdminTokens.delete(existingToken);
      }
      const token = randomUUID();
      const expiresAt = now + ADMIN_SESSION_DURATION_MS;
      activeAdminTokens.set(token, expiresAt);

      if (isMongoConnected()) {
        try {
          await AdminSessionModel.create({
            token,
            email,
            expiresAt: new Date(expiresAt),
          });
        } catch (err) {
          console.error('Failed to persist admin session in MongoDB:', err);
        }
      }

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

  app.post('/api/admin/logout', async (req, res) => {
    const token = getAdminToken(req);
    if (token) {
      activeAdminTokens.delete(token);
      if (isMongoConnected()) {
        try {
          await AdminSessionModel.deleteOne({ token });
        } catch {}
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).end();
  });

  // ==========================================
  // WHATSAPP AUTOMATION (NO-API / QR-CODE)
  // ==========================================

  app.get('/api/whatsapp/status', (_req, res) => {
    res.json(getWhatsAppStatus());
  });

  app.post('/api/whatsapp/init', async (req, res) => {
    const forceNew = req.body?.forceNew === true;
    void initWhatsApp(forceNew);
    res.json({ message: 'WhatsApp initialization initiated', status: getWhatsAppStatus() });
  });

  app.post('/api/whatsapp/disconnect', async (_req, res) => {
    await disconnectWhatsApp();
    res.json({ message: 'Disconnected', status: getWhatsAppStatus() });
  });

  app.post('/api/whatsapp/test', async (req, res) => {
    const target = req.body?.phone;
    const result = await sendTestWhatsAppMessage(target);
    res.json(result);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trinetra Realty Real Estate Server running on http://localhost:${PORT}`);
    console.log(`Storage Engine: ${isMongoConnected() ? '🍃 MongoDB' : '📁 JSON File Storage'}`);

    // Auto-initialize WhatsApp automation socket
    void initWhatsApp(false);
  });
}

startServer();
