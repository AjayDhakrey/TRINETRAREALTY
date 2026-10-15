import { Request, Response } from 'express';
import * as store from '../db/store';
import { CompanyProject } from '../../shared/types/realestate';
import { INITIAL_PROJECTS } from '../../frontend/src/data/seedData';
import { slugifyProjectName } from '../config';
import { isAdminAuthorized } from '../middleware/auth';
import { broadcastEvent } from '../services/realtimeService';

export async function getPublicProjects(req: Request, res: Response): Promise<void> {
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
}

export async function getProjectBySlugOrId(req: Request, res: Response): Promise<void> {
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
}

export async function getAllProjectsAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const projects = await store.getAllProjectsAdmin();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin projects', details: err.message });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
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
    broadcastEvent('project:created', created);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('❌ Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
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

    broadcastEvent('project:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update project', details: err.message });
  }
}

export async function updateProjectStatus(req: Request, res: Response): Promise<void> {
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
    broadcastEvent('project:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update project status', details: err.message });
  }
}

export async function duplicateProject(req: Request, res: Response): Promise<void> {
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
    broadcastEvent('project:created', created);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('❌ Error duplicating project:', err);
    res.status(500).json({ error: 'Failed to duplicate project', details: err.message });
  }
}

export async function deleteProjectImage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { imageUrl, imageType } = req.body;
    if (!imageUrl) {
      res.status(400).json({ error: 'imageUrl is required' });
      return;
    }

    const existing = await store.getProjectBySlugOrId(id, true);
    if (!existing || existing === 'UNAUTHORIZED') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updates: Partial<CompanyProject> = {};
    const normalizedUrl = imageUrl.trim();

    if (imageType === 'cover' || existing.coverImage === normalizedUrl) {
      updates.coverImage = '/hero-poster.jpg';
    }

    if (imageType === 'gallery' || !imageType || Array.isArray(existing.galleryImages)) {
      updates.galleryImages = (existing.galleryImages || []).filter(
        (img) => img.url !== normalizedUrl
      );
    }

    if (imageType === 'floorPlan' || Array.isArray(existing.floorPlanImages)) {
      updates.floorPlanImages = (existing.floorPlanImages || []).filter(
        (img) => img.url !== normalizedUrl
      );
    }

    if (existing.masterPlanImage === normalizedUrl) {
      updates.masterPlanImage = '';
    }
    if (existing.locationMapImage === normalizedUrl) {
      updates.locationMapImage = '';
    }

    const updated = await store.updateProject(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    broadcastEvent('project:updated', updated);
    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete project image', details: err.message });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await store.deleteProject(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    broadcastEvent('project:deleted', { id: req.params.id });
    res.json({ deleted: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
}


