import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {
  Property,
  CompanyProject,
  CustomerLead,
  LocalityProfile,
  BlogPost,
  UploadedMedia,
} from '../../frontend/src/types/realestate';
import {
  INITIAL_PROPERTIES,
  INITIAL_PROJECTS,
  INITIAL_LEADS,
  INITIAL_LOCALITIES,
  INITIAL_BLOG_POSTS,
  INITIAL_MEDIA,
} from '../../frontend/src/data/seedData';
import { isMongoConnected } from './mongo';
import { PropertyModel } from '../models/Property';
import { ProjectModel } from '../models/Project';
import { LeadModel } from '../models/Lead';
import { LocalityModel } from '../models/Locality';
import { BlogPostModel } from '../models/BlogPost';
import { MediaModel } from '../models/Media';

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(BACKEND_DIR, '../data');
const DB_FILE = path.join(DATA_DIR, 'realestate-db.json');

export interface DatabaseSchema {
  properties: Property[];
  projects: CompanyProject[];
  leads: CustomerLead[];
  localities: LocalityProfile[];
  blogPosts: BlogPost[];
  media: UploadedMedia[];
}

let jsonDbCache: DatabaseSchema | null = null;

export function loadJsonDatabase(): DatabaseSchema {
  if (jsonDbCache) return jsonDbCache;

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
          saveJsonDatabase(parsed);
        }
        jsonDbCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read JSON database file, falling back to initial seed:', err);
  }

  const initialDb: DatabaseSchema = {
    properties: [...INITIAL_PROPERTIES],
    projects: [...INITIAL_PROJECTS],
    leads: [...INITIAL_LEADS],
    localities: [...INITIAL_LOCALITIES],
    blogPosts: [...INITIAL_BLOG_POSTS],
    media: [...INITIAL_MEDIA],
  };

  saveJsonDatabase(initialDb);
  jsonDbCache = initialDb;
  return initialDb;
}

export function saveJsonDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    jsonDbCache = db;
  } catch (err) {
    console.error('Failed to persist JSON database:', err);
  }
}

// ---------------------------------------------------------------------------
// Unified Repository Operations (MongoDB with JSON File fallback)
// ---------------------------------------------------------------------------

export async function getBootstrapData(isAdmin: boolean) {
  if (isMongoConnected()) {
    const [properties, allProjects, leads, localities, blogPosts, media] = await Promise.all([
      PropertyModel.find({}).sort({ createdAt: -1 }).lean(),
      ProjectModel.find({}).sort({ createdAt: -1 }).lean(),
      isAdmin ? LeadModel.find({}).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
      LocalityModel.find({}).lean(),
      BlogPostModel.find({}).sort({ publishedAt: -1 }).lean(),
      MediaModel.find({}).sort({ uploadedAt: -1 }).lean(),
    ]);

    const visibleProjects = isAdmin
      ? allProjects
      : allProjects.filter((p) => p.publicationState === 'PUBLISHED');

    return {
      properties,
      projects: visibleProjects,
      allProjectsCount: allProjects.length,
      leads: isAdmin ? leads : [],
      localities,
      blogPosts,
      media,
      engine: 'mongodb',
    };
  }

  // JSON Fallback
  const db = loadJsonDatabase();
  const visibleProjects = isAdmin
    ? db.projects
    : db.projects.filter((p) => p.publicationState === 'PUBLISHED');

  return {
    properties: db.properties,
    projects: visibleProjects,
    allProjectsCount: db.projects.length,
    leads: isAdmin ? db.leads : [],
    localities: db.localities,
    blogPosts: db.blogPosts,
    media: db.media,
    engine: 'json-file',
  };
}

// --- PROJECTS ---

export async function getPublicProjects(filters: {
  status?: string;
  projectType?: string;
  city?: string;
  featured?: string;
  search?: string;
}): Promise<CompanyProject[]> {
  if (isMongoConnected()) {
    const query: any = { publicationState: 'PUBLISHED' };

    if (filters.status && filters.status !== 'All') {
      query.projectStatus = filters.status;
    }
    if (filters.projectType && filters.projectType !== 'All') {
      query.projectType = { $regex: String(filters.projectType), $options: 'i' };
    }
    if (filters.city && filters.city !== 'All') {
      query.city = { $regex: `^${String(filters.city)}$`, $options: 'i' };
    }
    if (filters.featured === 'true') {
      query.featured = true;
    }
    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const q = filters.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { locality: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { configurationSummary: { $regex: q, $options: 'i' } },
        { reraNumber: { $regex: q, $options: 'i' } },
      ];
    }

    return (await ProjectModel.find(query).sort({ featured: -1, createdAt: -1 }).lean()) as any;
  }

  // JSON Fallback
  const db = loadJsonDatabase();
  let list = db.projects.filter((p) => p.publicationState === 'PUBLISHED');

  if (filters.status && filters.status !== 'All') {
    list = list.filter((p) => p.projectStatus === filters.status);
  }
  if (filters.projectType && filters.projectType !== 'All') {
    list = list.filter((p) =>
      p.projectType.toLowerCase().includes(String(filters.projectType).toLowerCase())
    );
  }
  if (filters.city && filters.city !== 'All') {
    list = list.filter((p) => p.city.toLowerCase() === String(filters.city).toLowerCase());
  }
  if (filters.featured === 'true') {
    list = list.filter((p) => p.featured);
  }
  if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
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

  return list;
}

export async function getProjectBySlugOrId(
  slugOrId: string,
  isAdmin: boolean
): Promise<CompanyProject | 'UNAUTHORIZED' | null> {
  if (isMongoConnected()) {
    const project = await ProjectModel.findOne({
      $or: [{ slug: slugOrId }, { id: slugOrId }],
    }).lean();

    if (!project) return null;
    if (project.publicationState !== 'PUBLISHED' && !isAdmin) {
      return 'UNAUTHORIZED';
    }
    return project as any;
  }

  const db = loadJsonDatabase();
  const project = db.projects.find((p) => p.slug === slugOrId || p.id === slugOrId);
  if (!project) return null;
  if (project.publicationState !== 'PUBLISHED' && !isAdmin) {
    return 'UNAUTHORIZED';
  }
  return project;
}

export async function getAllProjectsAdmin(): Promise<CompanyProject[]> {
  if (isMongoConnected()) {
    return (await ProjectModel.find({}).sort({ createdAt: -1 }).lean()) as any;
  }
  const db = loadJsonDatabase();
  return db.projects;
}

export async function createProject(project: CompanyProject): Promise<CompanyProject> {
  if (isMongoConnected()) {
    await ProjectModel.create(project);
    return project;
  }
  const db = loadJsonDatabase();
  db.projects.unshift(project);
  saveJsonDatabase(db);
  return project;
}

export async function updateProject(id: string, updates: Partial<CompanyProject>): Promise<CompanyProject | null> {
  if (isMongoConnected()) {
    const updated = await ProjectModel.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    ).lean();
    return (updated as any) || null;
  }

  const db = loadJsonDatabase();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  db.projects[idx] = {
    ...db.projects[idx],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveJsonDatabase(db);
  return db.projects[idx];
}

export async function deleteProject(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await ProjectModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  const db = loadJsonDatabase();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.projects.splice(idx, 1);
  saveJsonDatabase(db);
  return true;
}

// --- PROPERTIES ---

export async function getProperties(filters: {
  transactionType?: string;
  category?: string;
  locality?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  bedrooms?: string | number;
  search?: string;
}): Promise<Property[]> {
  if (isMongoConnected()) {
    const query: any = {};
    if (filters.transactionType && filters.transactionType !== 'All') {
      query.transactionType = filters.transactionType;
    }
    if (filters.category && filters.category !== 'All') {
      query.category = filters.category;
    }
    if (filters.locality && filters.locality !== 'All') {
      query.locality = filters.locality;
    }
    if (filters.minPrice) {
      query.price = { ...(query.price || {}), $gte: Number(filters.minPrice) };
    }
    if (filters.maxPrice) {
      query.price = { ...(query.price || {}), $lte: Number(filters.maxPrice) };
    }
    if (filters.bedrooms && filters.bedrooms !== 'All') {
      query.bedrooms = { $gte: Number(filters.bedrooms) };
    }
    if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
      const q = filters.search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subtitle: { $regex: q, $options: 'i' } },
        { locality: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { architecturalStyle: { $regex: q, $options: 'i' } },
      ];
    }
    return (await PropertyModel.find(query).sort({ featured: -1, createdAt: -1 }).lean()) as any;
  }

  const db = loadJsonDatabase();
  let result = [...db.properties];

  if (filters.transactionType && filters.transactionType !== 'All') {
    result = result.filter((p) => p.transactionType === filters.transactionType);
  }
  if (filters.category && filters.category !== 'All') {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.locality && filters.locality !== 'All') {
    result = result.filter((p) => p.locality === filters.locality);
  }
  if (filters.minPrice) {
    result = result.filter((p) => p.price >= Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    result = result.filter((p) => p.price <= Number(filters.maxPrice));
  }
  if (filters.bedrooms && filters.bedrooms !== 'All') {
    result = result.filter((p) => p.bedrooms >= Number(filters.bedrooms));
  }
  if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
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

  return result;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (isMongoConnected()) {
    return (await PropertyModel.findOne({ id }).lean()) as any;
  }
  const db = loadJsonDatabase();
  return db.properties.find((p) => p.id === id) || null;
}

export async function createProperty(property: Property): Promise<Property> {
  if (isMongoConnected()) {
    await PropertyModel.create(property);
    return property;
  }
  const db = loadJsonDatabase();
  db.properties.unshift(property);
  saveJsonDatabase(db);
  return property;
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  if (isMongoConnected()) {
    const updated = await PropertyModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return (updated as any) || null;
  }

  const db = loadJsonDatabase();
  const idx = db.properties.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  db.properties[idx] = {
    ...db.properties[idx],
    ...updates,
    id,
  };
  saveJsonDatabase(db);
  return db.properties[idx];
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await PropertyModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  const db = loadJsonDatabase();
  const idx = db.properties.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  db.properties.splice(idx, 1);
  saveJsonDatabase(db);
  return true;
}

// --- LEADS ---

export async function getLeads(): Promise<CustomerLead[]> {
  if (isMongoConnected()) {
    return (await LeadModel.find({}).sort({ createdAt: -1 }).lean()) as any;
  }
  const db = loadJsonDatabase();
  return db.leads;
}

export async function createLead(lead: CustomerLead): Promise<CustomerLead> {
  if (isMongoConnected()) {
    await LeadModel.create(lead);
    return lead;
  }
  const db = loadJsonDatabase();
  db.leads.unshift(lead);
  saveJsonDatabase(db);
  return lead;
}

export async function updateLead(id: string, updates: Partial<CustomerLead>): Promise<CustomerLead | null> {
  if (isMongoConnected()) {
    const updated = await LeadModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return (updated as any) || null;
  }

  const db = loadJsonDatabase();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  db.leads[idx] = {
    ...db.leads[idx],
    ...updates,
  };
  saveJsonDatabase(db);
  return db.leads[idx];
}

export async function deleteLead(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const res = await LeadModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  const db = loadJsonDatabase();
  const idx = db.leads.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  db.leads.splice(idx, 1);
  saveJsonDatabase(db);
  return true;
}

// --- LOCALITIES & BLOG & MEDIA ---

export async function getLocalities(): Promise<LocalityProfile[]> {
  if (isMongoConnected()) {
    return (await LocalityModel.find({}).lean()) as any;
  }
  const db = loadJsonDatabase();
  return db.localities;
}

export async function getMedia(): Promise<UploadedMedia[]> {
  if (isMongoConnected()) {
    return (await MediaModel.find({}).sort({ uploadedAt: -1 }).lean()) as any;
  }
  const db = loadJsonDatabase();
  return db.media;
}

export async function createMedia(media: UploadedMedia, propertyId?: string): Promise<{ media: UploadedMedia; updatedProperty: Property | null }> {
  let updatedProperty: Property | null = null;

  if (isMongoConnected()) {
    await MediaModel.create(media);
    if (propertyId && propertyId !== 'none') {
      const prop = await PropertyModel.findOne({ id: propertyId });
      if (prop) {
        if (!prop.images.includes(media.url)) {
          prop.images.unshift(media.url);
          await prop.save();
        }
        updatedProperty = prop.toObject();
      }
    }
    return { media, updatedProperty };
  }

  const db = loadJsonDatabase();
  db.media.unshift(media);

  if (propertyId && propertyId !== 'none') {
    const propIdx = db.properties.findIndex((p) => p.id === propertyId);
    if (propIdx !== -1) {
      if (!db.properties[propIdx].images.includes(media.url)) {
        db.properties[propIdx].images.unshift(media.url);
      }
      updatedProperty = db.properties[propIdx];
    }
  }

  saveJsonDatabase(db);
  return { media, updatedProperty };
}
