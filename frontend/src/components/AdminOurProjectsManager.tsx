import { apiFetch } from '../services/api';
import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CompanyProject,
  ProjectConfiguration,
  ProjectDevelopmentStatus,
  ProjectMediaGalleryItem,
  ProjectPublicationState,
  UploadedMedia,
} from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface AdminOurProjectsManagerProps {
  projects: CompanyProject[];
  mediaLibrary: UploadedMedia[];
  adminToken: string;
  onProjectsUpdated: (updatedProjects: CompanyProject[]) => void;
  onPreviewProject: (project: CompanyProject) => void;
}

type ProjectsSubView = 'all' | 'add' | 'drafts' | 'published';

const STANDARD_AMENITIES = [
  'Swimming Pool',
  'Clubhouse',
  'Gym',
  'Landscaped Garden',
  "Children's Play Area",
  'Security',
  'CCTV',
  'Parking',
  'Power Backup',
  'Lift',
  'Sports Facilities',
  'Jogging Track',
  'Community Hall',
];

const PROJECT_STATUS_CHOICES: ProjectDevelopmentStatus[] = [
  'Upcoming',
  'New Launch',
  'Under Construction',
  'Ready to Move',
  'Completed',
];

const PROJECT_TYPE_CHOICES = [
  'Apartment',
  'Villa',
  'Penthouse',
  'Plot',
  'Commercial',
  'Luxury Residential & Sky Penthouses',
  'Mixed-Use Development',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Optimizes an uploaded image file on the client using an HTML5 canvas
 * (max 1600px width, JPEG 0.84 quality) for fast web rendering.
 */
function optimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export const AdminOurProjectsManager: React.FC<AdminOurProjectsManagerProps> = ({
  projects,
  mediaLibrary,
  adminToken,
  onProjectsUpdated,
  onPreviewProject,
}) => {
  const [subView, setSubView] = useState<ProjectsSubView>('all');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // --- FORM STATE ---
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('Apartment');
  const [developerBrand, setDeveloperBrand] = useState<string>('Trinetra Realty Developments');
  const [projectStatus, setProjectStatus] = useState<ProjectDevelopmentStatus>('New Launch');
  const [publicationState, setPublicationState] = useState<ProjectPublicationState>('DRAFT');
  const [featured, setFeatured] = useState<boolean>(false);
  const [shortDescription, setShortDescription] = useState<string>('');
  const [fullDescription, setFullDescription] = useState<string>('');

  // Location
  const [city, setCity] = useState<string>('Noida');
  const [locality, setLocality] = useState<string>('Sector 94 · Noida Expressway');
  const [stateName, setStateName] = useState<string>('Uttar Pradesh');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [googleMapsLink, setGoogleMapsLink] = useState<string>('');
  const [coordinates, setCoordinates] = useState<string>('');

  // Pricing (INR)
  const [startingPrice, setStartingPrice] = useState<number>(25000000);
  const [maxPrice, setMaxPrice] = useState<number>(65000000);
  const [priceOnRequest, setPriceOnRequest] = useState<boolean>(false);

  // Property Configuration Summary
  const [configurationSummary, setConfigurationSummary] = useState<string>(
    '2 BHK, 3 BHK & 4 BHK Luxury Residences'
  );
  const [areaRangeSqFt, setAreaRangeSqFt] = useState<string>('1,450 – 3,200 sq.ft.');
  const [unitsAvailable, setUnitsAvailable] = useState<number>(48);
  const [totalUnits, setTotalUnits] = useState<number>(140);

  // Project Information
  const [possessionDate, setPossessionDate] = useState<string>('December 2028');
  const [reraNumber, setReraNumber] = useState<string>('UPRERAPRJ902410');
  const [projectArea, setProjectArea] = useState<string>('6.0 Acres (74% Open Green Area)');
  const [numberOfTowers, setNumberOfTowers] = useState<number>(3);
  const [numberOfFloors, setNumberOfFloors] = useState<number>(32);
  const [constructionStatus, setConstructionStatus] = useState<string>(
    'Podium & Tower Core Construction Underway'
  );

  // Media
  const [coverImage, setCoverImage] = useState<string>(
    mediaLibrary[0]?.url || '/hero-poster.jpg'
  );
  const [galleryImages, setGalleryImages] = useState<ProjectMediaGalleryItem[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState<string>('');
  const [newGalleryCaption, setNewGalleryCaption] = useState<string>('');

  const [floorPlanImages, setFloorPlanImages] = useState<ProjectMediaGalleryItem[]>([]);
  const [newFloorPlanUrl, setNewFloorPlanUrl] = useState<string>('');
  const [newFloorPlanCaption, setNewFloorPlanCaption] = useState<string>('');

  const [masterPlanImage, setMasterPlanImage] = useState<string>('');
  const [locationMapImage, setLocationMapImage] = useState<string>('');
  const [brochurePdfUrl, setBrochurePdfUrl] = useState<string>('/hero-poster.jpg');
  const [projectVideoUrl, setProjectVideoUrl] = useState<string>('/hero-property.mp4');

  // Amenities & Highlights
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Swimming Pool',
    'Clubhouse',
    'Gym',
    'Landscaped Garden',
    'Security',
    'CCTV',
    'Parking',
    'Power Backup',
    'Lift',
  ]);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>('');

  const [highlights, setHighlights] = useState<string[]>([
    '5 minutes from Metro Station & Expressway connectivity',
    '74% open landscaped botanical greens',
    'RERA registered luxury development by Trinetra Realty',
  ]);
  const [newHighlightInput, setNewHighlightInput] = useState<string>('');

  // Configurations (2 BHK, 3 BHK, 4 BHK, etc.)
  const [configurations, setConfigurations] = useState<ProjectConfiguration[]>([
    {
      id: 'cfg-init-1',
      name: '2 BHK Luxury Residence',
      propertyType: 'Apartment',
      carpetAreaSqFt: 980,
      builtUpAreaSqFt: 1250,
      price: 12500000,
      priceOnRequest: false,
      floorPlanImage: mediaLibrary[1]?.url || '',
      unitsAvailable: 20,
    },
    {
      id: 'cfg-init-2',
      name: '3 BHK Grand Residence',
      propertyType: 'Apartment',
      carpetAreaSqFt: 1380,
      builtUpAreaSqFt: 1750,
      price: 17500000,
      priceOnRequest: false,
      floorPlanImage: mediaLibrary[2]?.url || '',
      unitsAvailable: 18,
    },
    {
      id: 'cfg-init-3',
      name: '4 BHK Sky Residence',
      propertyType: 'Apartment',
      carpetAreaSqFt: 1890,
      builtUpAreaSqFt: 2400,
      price: 24000000,
      priceOnRequest: false,
      floorPlanImage: mediaLibrary[0]?.url || '',
      unitsAvailable: 10,
    },
  ]);

  // New Configuration Row Builder
  const [cfgName, setCfgName] = useState<string>('3 BHK Sovereign Suite');
  const [cfgType, setCfgType] = useState<string>('Apartment');
  const [cfgCarpet, setCfgCarpet] = useState<number>(1420);
  const [cfgBuiltUp, setCfgBuiltUp] = useState<number>(1850);
  const [cfgPrice, setCfgPrice] = useState<number>(18500000);
  const [cfgUnits, setCfgUnits] = useState<number>(12);
  const [cfgFloorPlanUrl, setCfgFloorPlanUrl] = useState<string>('');

  // SEO
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken || 'tr-admin-session-token-2026'}`,
  };

  const resetFormForNewProject = () => {
    setEditingProjectId(null);
    setName('');
    setSlug('');
    setCode(`TR-PRJ-0${projects.length + 1}`);
    setProjectType('Apartment');
    setDeveloperBrand('Trinetra Realty Developments');
    setProjectStatus('New Launch');
    setPublicationState('DRAFT');
    setFeatured(false);
    setShortDescription('');
    setFullDescription('');
    setCity('Noida');
    setLocality('Sector 94 · Noida Expressway');
    setStateName('Uttar Pradesh');
    setFullAddress('');
    setGoogleMapsLink('');
    setCoordinates('');
    setStartingPrice(12500000);
    setMaxPrice(24000000);
    setPriceOnRequest(false);
    setConfigurationSummary('2 BHK, 3 BHK & 4 BHK Residences');
    setAreaRangeSqFt('1,250 – 2,400 sq.ft.');
    setUnitsAvailable(48);
    setTotalUnits(140);
    setPossessionDate('December 2028');
    setReraNumber('UPRERAPRJ902410');
    setProjectArea('6.0 Acres (70% Open Green Area)');
    setNumberOfTowers(3);
    setNumberOfFloors(32);
    setConstructionStatus('Foundation & Podium Structure Underway');
    setCoverImage(mediaLibrary[0]?.url || '/hero-poster.jpg');
    setGalleryImages(
      mediaLibrary.slice(0, 2).map((m) => ({ url: m.url, caption: m.name }))
    );
    setFloorPlanImages([]);
    setMasterPlanImage(mediaLibrary[2]?.url || '');
    setLocationMapImage(mediaLibrary[3]?.url || '');
    setBrochurePdfUrl('/hero-poster.jpg');
    setProjectVideoUrl('/hero-property.mp4');
    setSelectedAmenities([
      'Swimming Pool',
      'Clubhouse',
      'Gym',
      'Landscaped Garden',
      "Children's Play Area",
      'Security',
      'CCTV',
      'Parking',
      'Power Backup',
      'Lift',
    ]);
    setHighlights([
      '5 minutes from Metro Station',
      'Premium 35,000 sq.ft. clubhouse',
      '70% open green area',
      'RERA registered development',
      'Luxury architectural specifications',
      'Excellent expressway connectivity',
    ]);
    setConfigurations([
      {
        id: `cfg-${Date.now()}-1`,
        name: '2 BHK',
        propertyType: 'Apartment',
        carpetAreaSqFt: 980,
        builtUpAreaSqFt: 1250,
        price: 12500000,
        priceOnRequest: false,
        floorPlanImage: mediaLibrary[1]?.url || '',
        unitsAvailable: 20,
      },
      {
        id: `cfg-${Date.now()}-2`,
        name: '3 BHK',
        propertyType: 'Apartment',
        carpetAreaSqFt: 1380,
        builtUpAreaSqFt: 1750,
        price: 17500000,
        priceOnRequest: false,
        floorPlanImage: mediaLibrary[2]?.url || '',
        unitsAvailable: 18,
      },
      {
        id: `cfg-${Date.now()}-3`,
        name: '4 BHK',
        propertyType: 'Apartment',
        carpetAreaSqFt: 1890,
        builtUpAreaSqFt: 2400,
        price: 24000000,
        priceOnRequest: false,
        floorPlanImage: mediaLibrary[0]?.url || '',
        unitsAvailable: 10,
      },
    ]);
    setSeoTitle('');
    setSeoDescription('');
  };

  const loadProjectIntoForm = (proj: CompanyProject) => {
    setEditingProjectId(proj.id);
    setName(proj.name);
    setSlug(proj.slug);
    setCode(proj.code);
    setProjectType(proj.projectType);
    setDeveloperBrand(proj.developerBrand);
    setProjectStatus(proj.projectStatus);
    setPublicationState(proj.publicationState);
    setFeatured(proj.featured);
    setShortDescription(proj.shortDescription);
    setFullDescription(proj.fullDescription);
    setCity(proj.city);
    setLocality(proj.locality);
    setStateName(proj.state);
    setFullAddress(proj.fullAddress);
    setGoogleMapsLink(proj.googleMapsLink || '');
    setCoordinates(proj.coordinates || '');
    setStartingPrice(proj.startingPrice);
    setMaxPrice(proj.maxPrice || proj.startingPrice);
    setPriceOnRequest(proj.priceOnRequest);
    setConfigurationSummary(proj.configurationSummary);
    setAreaRangeSqFt(proj.areaRangeSqFt);
    setUnitsAvailable(proj.unitsAvailable);
    setTotalUnits(proj.totalUnits);
    setPossessionDate(proj.possessionDate);
    setReraNumber(proj.reraNumber);
    setProjectArea(proj.projectArea);
    setNumberOfTowers(proj.numberOfTowers);
    setNumberOfFloors(proj.numberOfFloors);
    setConstructionStatus(proj.constructionStatus);
    setCoverImage(proj.coverImage);
    setGalleryImages(proj.galleryImages || []);
    setFloorPlanImages(proj.floorPlanImages || []);
    setMasterPlanImage(proj.masterPlanImage || '');
    setLocationMapImage(proj.locationMapImage || '');
    setBrochurePdfUrl(proj.brochurePdfUrl || '');
    setProjectVideoUrl(proj.projectVideoUrl || '');
    setSelectedAmenities(proj.amenities || []);
    setHighlights(proj.highlights || []);
    setConfigurations(proj.configurations || []);
    setSeoTitle(proj.seoTitle || '');
    setSeoDescription(proj.seoDescription || '');
    setSubView('add');
    setFeedbackBanner('');
    setErrorBanner('');
  };

  const handleSaveProject = async (
    targetState: ProjectPublicationState,
    openPreviewAfterSave = false
  ) => {
    setErrorBanner('');
    setFeedbackBanner('');

    if (!name.trim()) {
      setErrorBanner('Project Name is required.');
      return;
    }

    setSaving(true);

    const payload: Partial<CompanyProject> = {
      code: code.trim() || `TR-PRJ-0${projects.length + 1}`,
      name: name.trim(),
      slug: slug.trim() ? slugify(slug) : slugify(name),
      projectType: projectType.trim(),
      developerBrand: developerBrand.trim(),
      projectStatus,
      publicationState: targetState,
      featured,
      shortDescription:
        shortDescription.trim() ||
        `${name.trim()} — ${configurationSummary} in ${locality}, ${city}.`,
      fullDescription:
        fullDescription.trim() ||
        shortDescription.trim() ||
        `${name.trim()} is an official architectural development by ${developerBrand.trim()} in ${locality}, ${city}.`,
      city: city.trim(),
      locality: locality.trim(),
      state: stateName.trim(),
      fullAddress: fullAddress.trim() || `${locality.trim()}, ${city.trim()}, ${stateName.trim()}`,
      googleMapsLink: googleMapsLink.trim(),
      coordinates: coordinates.trim(),
      startingPrice: Number(startingPrice) || 12500000,
      maxPrice: Number(maxPrice) || undefined,
      priceOnRequest,
      configurationSummary: configurationSummary.trim(),
      areaRangeSqFt: areaRangeSqFt.trim(),
      unitsAvailable: Number(unitsAvailable) || 0,
      totalUnits: Number(totalUnits) || 0,
      possessionDate: possessionDate.trim(),
      reraNumber: reraNumber.trim(),
      projectArea: projectArea.trim(),
      numberOfTowers: Number(numberOfTowers) || 0,
      numberOfFloors: Number(numberOfFloors) || 0,
      constructionStatus: constructionStatus.trim(),
      coverImage: coverImage.trim() || '/hero-poster.jpg',
      galleryImages:
        galleryImages.length > 0
          ? galleryImages
          : [{ url: coverImage.trim() || '/hero-poster.jpg', caption: name.trim() }],
      floorPlanImages,
      masterPlanImage: masterPlanImage.trim(),
      locationMapImage: locationMapImage.trim(),
      brochurePdfUrl: brochurePdfUrl.trim(),
      projectVideoUrl: projectVideoUrl.trim(),
      amenities: selectedAmenities,
      highlights,
      configurations,
      seoTitle: seoTitle.trim() || `${name.trim()} — ${locality.trim()}, ${city.trim()}`,
      seoDescription: seoDescription.trim() || shortDescription.trim(),
    };

    try {
      const url = editingProjectId
        ? `/api/admin/projects/${editingProjectId}`
        : '/api/admin/projects';
      const method = editingProjectId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save project.');
      }

      const savedProject = (await res.json()) as CompanyProject;

      const updatedList = editingProjectId
        ? projects.map((p) => (p.id === savedProject.id ? savedProject : p))
        : [savedProject, ...projects];

      onProjectsUpdated(updatedList);
      setEditingProjectId(savedProject.id);
      setPublicationState(savedProject.publicationState);

      if (openPreviewAfterSave) {
        onPreviewProject(savedProject);
        return;
      }

      setFeedbackBanner(
        targetState === 'PUBLISHED'
          ? `Published "${savedProject.name}" (/projects/${savedProject.slug}). It is now live on the public website.`
          : `Saved "${savedProject.name}" as ${targetState}. It remains hidden from public visitors until published.`
      );
      setSubView(targetState === 'PUBLISHED' ? 'published' : 'drafts');
    } catch (err: any) {
      setErrorBanner(err.message || 'Error saving project.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (
    proj: CompanyProject,
    nextState: ProjectPublicationState
  ) => {
    setErrorBanner('');
    try {
      const res = await apiFetch(`/api/admin/projects/${proj.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ publicationState: nextState }),
      });
      if (!res.ok) throw new Error('Failed to update project publication status.');
      const updated = (await res.json()) as CompanyProject;
      onProjectsUpdated(projects.map((p) => (p.id === updated.id ? updated : p)));
      setFeedbackBanner(
        nextState === 'PUBLISHED'
          ? `"${updated.name}" is now PUBLISHED and visible on /projects.`
          : `"${updated.name}" has been UNPUBLISHED (saved as ${nextState}) and removed from the public website without losing its data.`
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Unable to update publication state.');
    }
  };

  const handleToggleFeatured = async (proj: CompanyProject) => {
    setErrorBanner('');
    try {
      const res = await apiFetch(`/api/admin/projects/${proj.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ featured: !proj.featured }),
      });
      if (!res.ok) throw new Error('Failed to update featured flag.');
      const updated = (await res.json()) as CompanyProject;
      onProjectsUpdated(projects.map((p) => (p.id === updated.id ? updated : p)));
      setFeedbackBanner(
        updated.featured
          ? `"${updated.name}" marked as Featured for the Homepage.`
          : `"${updated.name}" removed from Homepage Featured showcase.`
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Unable to update featured status.');
    }
  };

  const handleDuplicateProject = async (proj: CompanyProject) => {
    setErrorBanner('');
    try {
      const res = await apiFetch(`/api/admin/projects/${proj.id}/duplicate`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to duplicate project.');
      const duplicated = (await res.json()) as CompanyProject;
      onProjectsUpdated([duplicated, ...projects]);
      setFeedbackBanner(
        `Duplicated "${proj.name}" as Draft "${duplicated.name}".`
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Unable to duplicate project.');
    }
  };

  const handleDeleteProject = async (proj: CompanyProject) => {
    setErrorBanner('');
    try {
      const res = await apiFetch(`/api/admin/projects/${proj.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete project.');
      onProjectsUpdated(projects.filter((p) => p.id !== proj.id));
      setFeedbackBanner(`Deleted project "${proj.name}".`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Unable to delete project.');
    }
  };

  const publishedCount = projects.filter((p) => p.publicationState === 'PUBLISHED').length;
  const draftCount = projects.filter((p) => p.publicationState !== 'PUBLISHED').length;

  const displayedProjects =
    subView === 'published'
      ? projects.filter((p) => p.publicationState === 'PUBLISHED')
      : subView === 'drafts'
      ? projects.filter((p) => p.publicationState !== 'PUBLISHED')
      : projects;

  return (
    <div className="space-y-8">
      {/* Sub-Navigation Bar for Our Projects */}
      <div className="bg-[#F3F2EE] border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('all')}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer ${
              subView === 'all'
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#57534E] border-stone-200 hover:text-[#141413]'
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('published')}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer ${
              subView === 'published'
                ? 'bg-[#1E3A2F] text-white border-[#1E3A2F]'
                : 'bg-white text-[#57534E] border-stone-200 hover:text-[#141413]'
            }`}
          >
            Published Projects ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setSubView('drafts')}
            className={`px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer ${
              subView === 'drafts'
                ? 'bg-[#141413] text-white border-[#141413]'
                : 'bg-white text-[#57534E] border-stone-200 hover:text-[#141413]'
            }`}
          >
            Draft Projects ({draftCount})
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            resetFormForNewProject();
            setSubView('add');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A2F] hover:bg-[#162B22] text-white transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Project</span>
        </button>
      </div>

      {feedbackBanner && (
        <div className="p-4 bg-[#1E3A2F]/10 border border-[#1E3A2F]/30 text-xs text-[#1E3A2F] flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-xs underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner('')}
            className="text-xs underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
       * SUB-VIEW A: ALL / PUBLISHED / DRAFT PROJECTS TABLE & CARDS
       * =================================================================== */}
      {subView !== 'add' && (
        <div className="space-y-4">
          {displayedProjects.length === 0 ? (
            <div className="p-12 border border-stone-200 bg-white text-center space-y-3">
              <Building2 className="w-6 h-6 text-[#615E59] mx-auto" />
              <div className="font-serif-display text-2xl font-semibold text-[#141413]">
                No Projects in This View
              </div>
              <button
                type="button"
                onClick={() => {
                  resetFormForNewProject();
                  setSubView('add');
                }}
                className="px-4 py-2 text-xs font-medium bg-[#141413] text-white cursor-pointer"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white border border-stone-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-full sm:w-44 aspect-[16/10] bg-[#F3F2EE] border border-stone-200 overflow-hidden shrink-0">
                      <ArchitecturalImage
                        src={proj.coverImage}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono-tabular uppercase tracking-wider font-semibold ${
                            proj.publicationState === 'PUBLISHED'
                              ? 'bg-[#1E3A2F] text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {proj.publicationState}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-[#F3F2EE] text-[#141413] border border-stone-200">
                          {proj.projectStatus}
                        </span>
                        <span className="text-xs font-mono-tabular text-[#615E59]">
                          {proj.code} · /projects/{proj.slug}
                        </span>
                        {proj.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-[#D4AF6A]/20 text-[#141413] border border-[#D4AF6A]/50">
                            <Star className="w-3 h-3 fill-[#D4AF6A] text-[#D4AF6A]" />
                            <span>Featured on Homepage</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                        {proj.name}
                      </h3>

                      <div className="text-xs text-[#57534E]">
                        {proj.locality}, {proj.city} ({proj.state}) · {proj.projectType} ·{' '}
                        {proj.configurationSummary}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <span className="font-mono-tabular font-semibold text-[#141413]">
                          {proj.priceOnRequest
                            ? 'Price on Request'
                            : `${formatCurrency(proj.startingPrice)} Onwards`}
                        </span>
                        <span className="text-[#615E59]">RERA: {proj.reraNumber}</span>
                        <span className="text-[#615E59]">
                          Possession: {proj.possessionDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* All 7 Required Admin Actions + Featured Toggle */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                    <button
                      type="button"
                      onClick={() => onPreviewProject(proj)}
                      title="View / Preview Project Page"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#F3F2EE] hover:bg-stone-200 text-[#141413] border border-stone-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{proj.publicationState === 'PUBLISHED' ? 'View' : 'Preview'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadProjectIntoForm(proj)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F3F2EE] text-[#141413] border border-stone-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {proj.publicationState === 'PUBLISHED' ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(proj, 'DRAFT')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                      >
                        <span>Unpublish</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(proj, 'PUBLISHED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#1E3A2F] hover:bg-[#162B22] text-white border border-[#1E3A2F] transition-colors cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(proj)}
                      title="Toggle Homepage Featured Project"
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                        proj.featured
                          ? 'bg-[#D4AF6A]/25 border-[#D4AF6A] text-[#141413]'
                          : 'bg-white border-stone-300 text-[#57534E] hover:text-[#141413]'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          proj.featured ? 'fill-[#D4AF6A] text-[#D4AF6A]' : ''
                        }`}
                      />
                      <span>{proj.featured ? 'Featured' : 'Feature'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateProject(proj)}
                      title="Duplicate Project"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F3F2EE] text-[#57534E] hover:text-[#141413] border border-stone-300 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj)}
                      title="Delete Project"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white hover:bg-red-50 text-red-700 border border-stone-200 hover:border-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
       * SUB-VIEW B: ADD NEW PROJECT / EDIT PROJECT COMPREHENSIVE FORM
       * =================================================================== */}
      {subView === 'add' && (
        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#1E3A2F] font-semibold">
                {editingProjectId
                  ? `Editing Project · ${code}`
                  : 'New Trinetra Realty Project Dossier'}
              </div>
              <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-0.5">
                {editingProjectId ? `Edit "${name}"` : 'Launch New Company Project'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSubView('all')}
              className="px-3.5 py-2 text-xs font-medium text-[#57534E] hover:text-[#141413] border border-stone-300 cursor-pointer self-start"
            >
              ← Back to All Projects
            </button>
          </div>

          {/* 1. BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              1. Basic Project Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingProjectId) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="e.g., Trinetra Celestia Sky Villas"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Project Slug / URL
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="trinetra-celestia-sky-villas"
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-[#F3F2EE] border border-stone-300 text-[#141413]"
                />
                <span className="text-[10px] text-[#615E59] block mt-0.5">
                  Public URL: /projects/{slug || 'project-slug'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Project Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                >
                  {PROJECT_TYPE_CHOICES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Developer / Brand
                </label>
                <input
                  type="text"
                  value={developerBrand}
                  onChange={(e) => setDeveloperBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Project Status
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) =>
                    setProjectStatus(e.target.value as ProjectDevelopmentStatus)
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                >
                  {PROJECT_STATUS_CHOICES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#141413] cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="accent-[#1E3A2F]"
                />
                <span>
                  Mark as <strong>Featured Project</strong> (Showcase in Homepage Featured Projects section)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Short Description (Card &amp; Hero Summary)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Concise 1–2 sentence editorial summary of the project..."
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Full Project Description
              </label>
              <textarea
                rows={4}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Comprehensive architectural narrative, planning philosophy, and specifications..."
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
              />
            </div>
          </div>

          {/* 2. LOCATION */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              2. Project Location &amp; Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Noida / Gurugram / New Delhi / Mumbai"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Locality / Sector *
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Sector 94 · Noida Expressway"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">State *</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Uttar Pradesh"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Full Site Address
                </label>
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Plot A-04, Sector 94, Noida Expressway, Uttar Pradesh 201301"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Coordinates
                </label>
                <input
                  type="text"
                  value={coordinates}
                  onChange={(e) => setCoordinates(e.target.value)}
                  placeholder="28.5494° N, 77.3319° E"
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                />
              </div>
            </div>
          </div>

          {/* 3. PRICING (INR) & PROPERTY CONFIGURATION SUMMARY */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              3. Pricing (INR / ₹) &amp; Property Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Starting Price (INR)
                </label>
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(Number(e.target.value))}
                  disabled={priceOnRequest}
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413] disabled:opacity-50"
                />
                <span className="text-[11px] font-mono-tabular text-[#1E3A2F] block mt-0.5">
                  Formatted: {priceOnRequest ? 'Price on Request' : formatCurrency(startingPrice)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Maximum Price (INR, Optional)
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  disabled={priceOnRequest}
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413] disabled:opacity-50"
                />
                <span className="text-[11px] font-mono-tabular text-[#615E59] block mt-0.5">
                  Formatted: {maxPrice ? formatCurrency(maxPrice) : '—'}
                </span>
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#141413] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceOnRequest}
                    onChange={(e) => setPriceOnRequest(e.target.checked)}
                    className="accent-[#1E3A2F]"
                  />
                  <span>Display as “Price on Request”</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  BHK / Configuration Options
                </label>
                <input
                  type="text"
                  value={configurationSummary}
                  onChange={(e) => setConfigurationSummary(e.target.value)}
                  placeholder="2 BHK, 3 BHK & 4 BHK Residences"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Area Range
                </label>
                <input
                  type="text"
                  value={areaRangeSqFt}
                  onChange={(e) => setAreaRangeSqFt(e.target.value)}
                  placeholder="1,250 – 2,400 sq.ft."
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Units Available
                  </label>
                  <input
                    type="number"
                    value={unitsAvailable}
                    onChange={(e) => setUnitsAvailable(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Total Units
                  </label>
                  <input
                    type="number"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. PROJECT STATUTORY & STRUCTURAL INFORMATION */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              4. RERA, Possession &amp; Structural Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Possession Date
                </label>
                <input
                  type="text"
                  value={possessionDate}
                  onChange={(e) => setPossessionDate(e.target.value)}
                  placeholder="December 2028 / Ready to Move"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  RERA Registration Number
                </label>
                <input
                  type="text"
                  value={reraNumber}
                  onChange={(e) => setReraNumber(e.target.value)}
                  placeholder="UPRERAPRJ849201"
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Total Project Area
                </label>
                <input
                  type="text"
                  value={projectArea}
                  onChange={(e) => setProjectArea(e.target.value)}
                  placeholder="7.5 Acres (76% Open Green Area)"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Number of Towers
                </label>
                <input
                  type="number"
                  value={numberOfTowers}
                  onChange={(e) => setNumberOfTowers(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Number of Floors
                </label>
                <input
                  type="number"
                  value={numberOfFloors}
                  onChange={(e) => setNumberOfFloors(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-stone-300 text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Construction Status
                </label>
                <input
                  type="text"
                  value={constructionStatus}
                  onChange={(e) => setConstructionStatus(e.target.value)}
                  placeholder="Superstructure in Progress"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                />
              </div>
            </div>
          </div>

          {/* 5. FLOOR PLANS & CONFIGURATIONS BUILDER */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              5. Unit Configurations &amp; Floor Plan Pricing (2 BHK / 3 BHK / 4 BHK)
            </h3>

            {/* Existing Configurations Table */}
            {configurations.length > 0 && (
              <div className="border border-stone-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3F2EE] border-b border-stone-200 text-[#615E59] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Config Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Carpet Area</th>
                      <th className="py-2.5 px-3">Built-Up Area</th>
                      <th className="py-2.5 px-3">Price (INR)</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {configurations.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-semibold text-[#141413]">{c.name}</td>
                        <td className="py-2.5 px-3 text-[#57534E]">{c.propertyType}</td>
                        <td className="py-2.5 px-3 font-mono-tabular">
                          {formatNumber(c.carpetAreaSqFt)} sq.ft.
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular">
                          {formatNumber(c.builtUpAreaSqFt)} sq.ft.
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#1E3A2F]">
                          {formatCurrency(c.price)}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular">{c.unitsAvailable ?? '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setConfigurations(configurations.filter((item) => item.id !== c.id))
                            }
                            className="text-red-700 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Configuration Row */}
            <div className="p-4 bg-[#F3F2EE] border border-stone-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#141413] mb-1">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={cfgName}
                  onChange={(e) => setCfgName(e.target.value)}
                  placeholder="e.g., 3 BHK Luxury"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#141413] mb-1">
                  Carpet (sq.ft.)
                </label>
                <input
                  type="number"
                  value={cfgCarpet}
                  onChange={(e) => setCfgCarpet(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#141413] mb-1">
                  Built-Up (sq.ft.)
                </label>
                <input
                  type="number"
                  value={cfgBuiltUp}
                  onChange={(e) => setCfgBuiltUp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#141413] mb-1">
                  Price (INR) · {formatCurrency(cfgPrice)}
                </label>
                <input
                  type="number"
                  value={cfgPrice}
                  onChange={(e) => setCfgPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-300"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (!cfgName.trim()) return;
                    setConfigurations([
                      ...configurations,
                      {
                        id: `cfg-${Date.now()}`,
                        name: cfgName.trim(),
                        propertyType: cfgType,
                        carpetAreaSqFt: Number(cfgCarpet) || 1000,
                        builtUpAreaSqFt: Number(cfgBuiltUp) || 1350,
                        price: Number(cfgPrice) || 12500000,
                        priceOnRequest: false,
                        floorPlanImage: cfgFloorPlanUrl || coverImage,
                        unitsAvailable: Number(cfgUnits) || 10,
                      },
                    ]);
                    setCfgName('');
                  }}
                  className="w-full py-1.5 px-3 bg-[#141413] text-white text-xs font-medium hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                >
                  + Add Config
                </button>
              </div>
            </div>
          </div>

          {/* 6. PROJECT MEDIA MANAGEMENT */}
          <div className="space-y-5">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              6. Project Media Management (Cover, Gallery, Floor Plans, Master Plan, Brochure &amp; Video)
            </h3>

            {/* Cover Image Upload & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-stone-200 pb-6">
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-semibold text-[#141413]">
                  Project Cover Image (Preview Before Publishing)
                </label>
                <div className="aspect-[16/10] w-full bg-[#F3F2EE] border border-stone-300 overflow-hidden">
                  <ArchitecturalImage
                    src={coverImage}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-7 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Cover Image URL or Upload File
                  </label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Cover Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const optimized = await optimizeImageFile(file);
                        setCoverImage(optimized);
                      }}
                    />
                  </label>
                </div>

                {/* Quick Select from Studio Media Library */}
                <div>
                  <span className="text-[11px] text-[#615E59] block mb-1.5">
                    Or select from Trinetra Studio Library:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {mediaLibrary.slice(0, 5).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCoverImage(m.url)}
                        className={`aspect-[16/10] border-2 overflow-hidden cursor-pointer ${
                          coverImage === m.url ? 'border-[#1E3A2F]' : 'border-transparent'
                        }`}
                      >
                        <ArchitecturalImage
                          src={m.url}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Images with Ordering, Captions & Cover Selection */}
            <div className="space-y-3 border-b border-stone-200 pb-6">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#141413]">
                  Project Gallery Images ({galleryImages.length}) — Reorder, Caption or Set Cover
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1E3A2F] text-white cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Gallery Image(s)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []) as File[];
                      const added: ProjectMediaGalleryItem[] = [];
                      for (const file of files) {
                        const opt = await optimizeImageFile(file);
                        added.push({
                          url: opt,
                          caption: file.name.replace(/\.[^/.]+$/, ''),
                        });
                      }
                      setGalleryImages((prev) => [...prev, ...added]);
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryImages.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-stone-200 bg-[#F3F2EE]/50 p-3 space-y-2"
                  >
                    <div className="aspect-[16/10] w-full bg-stone-200 overflow-hidden">
                      <ArchitecturalImage
                        src={item.url}
                        alt={item.caption || `Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => {
                        const next = [...galleryImages];
                        next[idx] = { ...next[idx], caption: e.target.value };
                        setGalleryImages(next);
                      }}
                      placeholder="Image caption..."
                      className="w-full px-2 py-1 text-xs bg-white border border-stone-300"
                    />
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const next = [...galleryImages];
                            const temp = next[idx - 1];
                            next[idx - 1] = next[idx];
                            next[idx] = temp;
                            setGalleryImages(next);
                          }}
                          className="p-1 bg-white border border-stone-300 disabled:opacity-40 cursor-pointer"
                          title="Move Earlier"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === galleryImages.length - 1}
                          onClick={() => {
                            const next = [...galleryImages];
                            const temp = next[idx + 1];
                            next[idx + 1] = next[idx];
                            next[idx] = temp;
                            setGalleryImages(next);
                          }}
                          className="p-1 bg-white border border-stone-300 disabled:opacity-40 cursor-pointer"
                          title="Move Later"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverImage(item.url)}
                          className="px-2 py-1 text-[10px] font-medium bg-white border border-stone-300 hover:border-[#1E3A2F] cursor-pointer"
                        >
                          Set as Cover
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryImages(galleryImages.filter((_, i) => i !== idx))
                        }
                        className="text-xs text-red-700 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <input
                  type="text"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300"
                />
                <input
                  type="text"
                  value={newGalleryCaption}
                  onChange={(e) => setNewGalleryCaption(e.target.value)}
                  placeholder="Caption (optional)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newGalleryUrl.trim()) return;
                    setGalleryImages([
                      ...galleryImages,
                      { url: newGalleryUrl.trim(), caption: newGalleryCaption.trim() },
                    ]);
                    setNewGalleryUrl('');
                    setNewGalleryCaption('');
                  }}
                  className="px-4 py-1.5 text-xs font-medium bg-[#141413] text-white cursor-pointer"
                >
                  + Add Gallery URL
                </button>
              </div>
            </div>

            {/* Floor Plan Images, Master Plan, Location Map, Brochure & Project Video */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Master Plan Image (URL or Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={masterPlanImage}
                    onChange={(e) => setMasterPlanImage(e.target.value)}
                    placeholder="Master plan image URL..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300"
                  />
                  <label className="px-3 py-2 text-xs bg-[#F3F2EE] border border-stone-300 cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setMasterPlanImage(await optimizeImageFile(f));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Location Map Image (URL or Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationMapImage}
                    onChange={(e) => setLocationMapImage(e.target.value)}
                    placeholder="Location map image URL..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300"
                  />
                  <label className="px-3 py-2 text-xs bg-[#F3F2EE] border border-stone-300 cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setLocationMapImage(await optimizeImageFile(f));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Brochure PDF / Dossier URL
                </label>
                <input
                  type="text"
                  value={brochurePdfUrl}
                  onChange={(e) => setBrochurePdfUrl(e.target.value)}
                  placeholder="/hero-poster.jpg or PDF link"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Project Walkthrough Video URL
                </label>
                <input
                  type="text"
                  value={projectVideoUrl}
                  onChange={(e) => setProjectVideoUrl(e.target.value)}
                  placeholder="/hero-property.mp4"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300"
                />
              </div>
            </div>
          </div>

          {/* 7. PROJECT AMENITIES */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              7. Project Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Array.from(new Set([...STANDARD_AMENITIES, ...selectedAmenities])).map(
                (amenity) => {
                  const checked = selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className={`p-2.5 border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#1E3A2F]/10 border-[#1E3A2F] text-[#141413] font-medium'
                          : 'bg-white border-stone-200 text-[#57534E]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedAmenities((prev) =>
                            prev.includes(amenity)
                              ? prev.filter((a) => a !== amenity)
                              : [...prev, amenity]
                          );
                        }}
                        className="accent-[#1E3A2F]"
                      />
                      <span className="truncate">{amenity}</span>
                    </label>
                  );
                }
              )}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={customAmenityInput}
                onChange={(e) => setCustomAmenityInput(e.target.value)}
                placeholder="Add custom amenity (e.g., Helipad, Cigar Lounge)..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300"
              />
              <button
                type="button"
                onClick={() => {
                  if (!customAmenityInput.trim()) return;
                  if (!selectedAmenities.includes(customAmenityInput.trim())) {
                    setSelectedAmenities([...selectedAmenities, customAmenityInput.trim()]);
                  }
                  setCustomAmenityInput('');
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#141413] text-white cursor-pointer"
              >
                + Add Amenity
              </button>
            </div>
          </div>

          {/* 8. PROJECT HIGHLIGHTS */}
          <div className="space-y-4">
            <h3 className="font-serif-display text-xl font-semibold text-[#141413] border-b border-stone-200 pb-2">
              8. Project Highlights
            </h3>
            <div className="space-y-2">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 bg-[#F3F2EE] border border-stone-200 text-xs"
                >
                  <span>• {h}</span>
                  <button
                    type="button"
                    onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                    className="text-red-700 hover:underline cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newHighlightInput}
                onChange={(e) => setNewHighlightInput(e.target.value)}
                placeholder="e.g., 5 minutes from Metro Station / 70% open green area..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newHighlightInput.trim()) return;
                  setHighlights([...highlights, newHighlightInput.trim()]);
                  setNewHighlightInput('');
                }}
                className="px-4 py-2 text-xs font-medium bg-[#141413] text-white cursor-pointer"
              >
                + Add Highlight
              </button>
            </div>
          </div>

          {/* 9. DRAFT / PREVIEW / PUBLISH WORKFLOW ACTIONS */}
          <div className="pt-6 border-t border-stone-300 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[#615E59]">
              Saving as <strong>Draft</strong> keeps the project private inside the Admin Panel. Clicking{' '}
              <strong>Publish Project</strong> makes it immediately visible on{' '}
              <span className="font-mono-tabular">/projects</span>.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveProject('DRAFT', false)}
                className="px-4 py-2.5 text-xs font-semibold bg-[#F3F2EE] hover:bg-stone-200 text-[#141413] border border-stone-300 transition-colors cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveProject(publicationState, true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-white hover:bg-[#F3F2EE] text-[#141413] border border-stone-400 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Save &amp; Preview</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveProject('PUBLISHED', false)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-[#1E3A2F] hover:bg-[#162B22] text-white transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Publish Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
