import { DEMO_MODE } from '../services/session';
import {
  ADMIN_SERVICE_UNAVAILABLE,
  apiFetch,
  isApiBaseConfigured,
  readApiJson,
} from '../services/api';
import React, { useState, useEffect } from 'react';
import {
  Lock,
  Plus,
  Edit3,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  LogOut,
  Star,
  Image as ImageIcon,
  Users,
  Building2,
} from 'lucide-react';
import {
  Property,
  CompanyProject,
  CustomerLead,
  UploadedMedia,
  LocalityProfile,
  AdminSubTab,
  TransactionType,
  PropertyCategory,
  PropertyStatus,
  FurnishedStatus,
  LeadStatus,
  LeadType,
  ActiveRoute,
} from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import { AdminOurProjectsManager } from './AdminOurProjectsManager';
import { formatPropertyPrice, formatNumber } from '../utils/formatters';

interface AdminPanelViewProps {
  isAuthenticated: boolean;
  adminToken?: string;
  onLoginSuccess: (token?: string) => void;
  onLogout: () => void;
  onNavigate?: (route: ActiveRoute) => void;
  onSelectProperty?: (propertyId: string) => void;
  properties: Property[];
  projects: CompanyProject[];
  leads: CustomerLead[];
  media: UploadedMedia[];
  localities: LocalityProfile[];
  onProjectsUpdated: (projects: CompanyProject[]) => void;
  onPreviewProject: (project: CompanyProject) => void;
  onPropertyAdded: (prop: Property) => void;
  onPropertyUpdated: (prop: Property) => void;
  onPropertyDeleted: (id: string) => void;
  onLeadUpdated: (lead: CustomerLead) => void;
  onLeadDeleted: (id: string) => void;
  onMediaUploaded: (media: UploadedMedia, updatedProperty?: Property | null) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  isAuthenticated,
  adminToken = '',
  onLoginSuccess,
  onLogout,
  onNavigate,
  onSelectProperty,
  properties,
  projects,
  leads,
  media,
  localities,
  onProjectsUpdated,
  onPreviewProject,
  onPropertyAdded,
  onPropertyUpdated,
  onPropertyDeleted,
  onLeadUpdated,
  onLeadDeleted,
  onMediaUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('our-projects');

  // --- LOGIN STATE ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // --- MANAGE LISTINGS FILTER STATE ---
  const [listingSearch, setListingSearch] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'All' | TransactionType>('All');

  // --- ADD / EDIT PROPERTY FORM STATE ---
  const [editingPropertyId, setEditingPropertyId] = useState<string>(properties[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTransactionType, setFormTransactionType] = useState<TransactionType>('Buy');
  const [formCategory, setFormCategory] = useState<PropertyCategory>('Penthouse');
  const [formStatus, setFormStatus] = useState<PropertyStatus>('Available');
  const [formPrice, setFormPrice] = useState<number>(75000000);
  const [formArea, setFormArea] = useState<number>(4000);
  const [formBedrooms, setFormBedrooms] = useState<number>(4);
  const [formBathrooms, setFormBathrooms] = useState<number>(4.5);
  const [formParking, setFormParking] = useState<number>(2);
  const [formLocality, setFormLocality] = useState<string>(
    localities[0]?.name || 'Tribeca & SoHo'
  );
  const [formAddress, setFormAddress] = useState('');
  const [formStyle, setFormStyle] = useState('Contemporary Minimalist');
  const [formArchitect, setFormArchitect] = useState('Trinetra Realty Design Group');
  const [formYearBuilt, setFormYearBuilt] = useState<number>(2026);
  const [formMaintenance, setFormMaintenance] = useState<number>(34000);
  const [formFurnished, setFormFurnished] = useState<FurnishedStatus>('Bespoke Millwork');
  const [formFeatured, setFormFeatured] = useState<boolean>(true);
  const [formDescription, setFormDescription] = useState('');
  const [formAmenities, setFormAmenities] = useState(
    'Direct Keyed Elevator, Private Terrace, Concierge Security, Radiant Flooring'
  );
  const [formImages, setFormImages] = useState<string[]>(
    media[0] ? [media[0].url] : []
  );
  const [formFeedback, setFormFeedback] = useState('');
  const [formError, setFormError] = useState('');
  const [lastCreatedProperty, setLastCreatedProperty] = useState<Property | null>(null);
  const [savingProperty, setSavingProperty] = useState(false);

  // --- UPLOAD IMAGES STATE ---
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Interior Living');
  const [uploadAttachPropId, setUploadAttachPropId] = useState('none');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // --- MANAGE LEADS STATE ---
  const [leadTypeFilter, setLeadTypeFilter] = useState<'All' | LeadType>('All');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'All' | LeadStatus>('All');
  const [leadSourceFilter, setLeadSourceFilter] = useState<'All' | 'Our Projects' | 'Property Listings'>('All');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  // Populate Edit Property form whenever editingPropertyId changes and we're on edit-property tab
  useEffect(() => {
    if (activeTab === 'edit-property') {
      const target = properties.find((p) => p.id === editingPropertyId) || properties[0];
      if (target) {
        setEditingPropertyId(target.id);
        setFormTitle(target.title);
        setFormSubtitle(target.subtitle);
        setFormTransactionType(target.transactionType);
        setFormCategory(target.category);
        setFormStatus(target.status);
        setFormPrice(target.price);
        setFormArea(target.areaSqFt);
        setFormBedrooms(target.bedrooms);
        setFormBathrooms(target.bathrooms);
        setFormParking(target.parkingSpaces);
        setFormLocality(target.locality);
        setFormAddress(target.address);
        setFormStyle(target.architecturalStyle);
        setFormArchitect(target.architect);
        setFormYearBuilt(target.yearBuilt);
        setFormMaintenance(target.monthlyMaintenance);
        setFormFurnished(target.furnishedStatus);
        setFormFeatured(target.featured);
        setFormDescription(target.description);
        setFormAmenities(target.amenities.join(', '));
        setFormImages(target.images);
      }
    } else if (activeTab === 'add-property') {
      setFormTitle('');
      setFormSubtitle('');
      setFormTransactionType('Buy');
      setFormCategory('Penthouse');
      setFormStatus('Available');
      setFormPrice(78000000);
      setFormArea(4000);
      setFormBedrooms(4);
      setFormBathrooms(4);
      setFormParking(2);
      setFormLocality(localities[0]?.name || 'Tribeca & SoHo');
      setFormAddress('');
      setFormStyle('Contemporary Minimalist');
      setFormArchitect('Trinetra Realty Design Group');
      setFormYearBuilt(2026);
      setFormMaintenance(32000);
      setFormFurnished('Bespoke Millwork');
      setFormFeatured(true);
      setFormDescription('');
      setFormAmenities(
        'Direct Keyed Elevator, Private Terrace, Wine Vault, 24-Hour Concierge'
      );
      setFormImages(media[0] ? [media[0].url] : []);
    }
    setFormFeedback('');
    setFormError('');
    setLastCreatedProperty(null);
  }, [activeTab, editingPropertyId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      if (!isApiBaseConfigured()) {
        if (import.meta.env.DEV) {
          console.error('VITE_API_BASE_URL is missing from the production frontend build.');
        }
        setLoginError(ADMIN_SERVICE_UNAVAILABLE);
        return;
      }
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await readApiJson<{ error?: string; token?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      if (!data.token) throw new Error(ADMIN_SERVICE_UNAVAILABLE);
      onLoginSuccess(data.token);
    } catch (err: any) {
      if (import.meta.env.PROD && err instanceof TypeError) {
        setLoginError(ADMIN_SERVICE_UNAVAILABLE);
      } else {
        setLoginError(err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSavingProperty(true);
    setFormFeedback('');
    setFormError('');

    try {
      const selectedImages = formImages.filter((img) => typeof img === 'string' && img.trim().length > 0);
      const imagesPayload = selectedImages.length > 0
        ? selectedImages
        : media[0]?.url
        ? [media[0].url]
        : [];

      const res = await apiFetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          transactionType: formTransactionType,
          category: formCategory,
          status: formStatus,
          price: Number(formPrice),
          areaSqFt: Number(formArea),
          bedrooms: Number(formBedrooms),
          bathrooms: Number(formBathrooms),
          parkingSpaces: Number(formParking),
          locality: formLocality,
          address: formAddress.trim() || `${formLocality} Private Address`,
          architecturalStyle: formStyle.trim(),
          architect: formArchitect.trim(),
          yearBuilt: Number(formYearBuilt),
          monthlyMaintenance: Number(formMaintenance),
          furnishedStatus: formFurnished,
          featured: formFeatured,
          description: formDescription.trim(),
          amenities: formAmenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
          images: imagesPayload,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your admin session has expired. Please sign out and sign in again.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Failed to create listing. Please verify all required fields.');
      }
      const created: Property = await res.json();
      onPropertyAdded(created);
      setLastCreatedProperty(created);
      setFormFeedback(`Published "${created.title}" (${created.code}) to live portfolio.`);
      setFormTitle('');
      setFormSubtitle('');
    } catch (err: any) {
      setFormError(err.message || 'Error creating property.');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropertyId || !formTitle.trim()) return;
    setSavingProperty(true);
    setFormFeedback('');

    try {
      const res = await apiFetch(`/api/properties/${editingPropertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          transactionType: formTransactionType,
          category: formCategory,
          status: formStatus,
          price: Number(formPrice),
          areaSqFt: Number(formArea),
          bedrooms: Number(formBedrooms),
          bathrooms: Number(formBathrooms),
          parkingSpaces: Number(formParking),
          locality: formLocality,
          address: formAddress.trim(),
          architecturalStyle: formStyle.trim(),
          architect: formArchitect.trim(),
          yearBuilt: Number(formYearBuilt),
          monthlyMaintenance: Number(formMaintenance),
          furnishedStatus: formFurnished,
          featured: formFeatured,
          description: formDescription.trim(),
          amenities: formAmenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
          images: formImages,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your admin session has expired. Please sign out and sign in again.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Failed to update property.');
      }
      const updated: Property = await res.json();
      onPropertyUpdated(updated);
      setFormError('');
      setFormFeedback(`Saved changes to "${updated.title}" (${updated.code}).`);
    } catch (err: any) {
      setFormError(err.message || 'Error updating property.');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleQuickStatusChange = async (prop: Property, newStatus: PropertyStatus) => {
    const res = await apiFetch(`/api/properties/${prop.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      onPropertyUpdated(updated);
    }
  };

  const handleQuickFeaturedToggle = async (prop: Property) => {
    const res = await apiFetch(`/api/properties/${prop.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !prop.featured }),
    });
    if (res.ok) {
      const updated = await res.json();
      onPropertyUpdated(updated);
    }
  };

  const handleDeleteListing = async (id: string) => {
    const res = await apiFetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onPropertyDeleted(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadName) {
      setUploadName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadUrl.trim()) return;
    setUploadingMedia(true);
    setUploadFeedback('');

    try {
      const res = await apiFetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName.trim(),
          url: uploadUrl.trim(),
          category: uploadCategory,
          propertyId: uploadAttachPropId,
        }),
      });

      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      onMediaUploaded(data.media, data.updatedProperty);
      setUploadFeedback(
        data.updatedProperty
          ? `Uploaded "${data.media.name}" and attached to ${data.updatedProperty.title}.`
          : `Uploaded "${data.media.name}" to Studio Media Library.`
      );
      setUploadName('');
      setUploadUrl('');
    } catch (err: any) {
      setUploadFeedback(err.message || 'Upload failed.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUpdateLead = async (leadId: string, status: LeadStatus, notes?: string) => {
    const res = await apiFetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      onLeadUpdated(updated);
      setEditingNotesId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const res = await apiFetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (res.ok) {
      onLeadDeleted(leadId);
    }
  };

  const toggleImageSelection = (url: string) => {
    setFormImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  // --- IF NOT AUTHENTICATED: RENDER ADMIN LOGIN MODULE ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="bg-[#FBFBF9] border border-stone-300 p-8 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#1E3A2F] font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Trinetra Realty · Administrative Governance</span>
            </div>
            <h1 className="font-serif-display text-3xl font-semibold text-[#141413]">
              Admin Panel Login
            </h1>
            <p className="text-xs text-[#57534E]">
              Sign in to manage listings, add or edit properties, upload architectural photography, and process customer leads.
            </p>
          </div>

          {DEMO_MODE && (
            <p className="text-xs text-[#615E59]">Client demo: Changes are saved only in this browser tab.</p>
          )}

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-[#141413] mb-1">
                Partner Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-[#141413] mb-1">
                Passkey / Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
            >
              {loggingIn ? 'Authenticating...' : 'Enter Admin Suite'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ADMIN SUITE ---
  const filteredListings = properties.filter((p) => {
    const matchesType =
      listingTypeFilter === 'All' || p.transactionType === listingTypeFilter;
    const matchesSearch =
      !listingSearch.trim() ||
      p.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(listingSearch.toLowerCase()) ||
      p.locality.toLowerCase().includes(listingSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredLeads = leads.filter((l) => {
    const matchesType = leadTypeFilter === 'All' || l.type === leadTypeFilter;
    const matchesStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
    const matchesSource =
      leadSourceFilter === 'All' ||
      (leadSourceFilter === 'Our Projects' && Boolean(l.projectId || l.projectName)) ||
      (leadSourceFilter === 'Property Listings' && !l.projectId && !l.projectName);
    return matchesType && matchesStatus && matchesSource;
  });

  const adminTabs: Array<{ id: AdminSubTab; label: string; count?: number }> = [
    { id: 'our-projects', label: 'Our Projects', count: projects.length },
    { id: 'listings', label: 'Manage Listings', count: properties.length },
    { id: 'add-property', label: 'Add Property' },
    { id: 'edit-property', label: 'Edit Property' },
    { id: 'upload-images', label: 'Upload Images', count: media.length },
    { id: 'leads', label: 'Manage Leads', count: leads.length },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
      {/* Admin Header & Executive Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <div className="text-xs text-[#615E59]">
            Trinetra Realty · Executive Inventory, Proprietary Projects &amp; Lead Management Suite
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#141413] mt-0.5">
            Admin Panel &amp; Portfolio Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-5 px-4 py-2 bg-[#F3F2EE] border border-stone-200 text-xs font-mono-tabular">
            <span className="font-semibold text-[#1E3A2F]">Our Projects: {projects.length}</span>
            <span>·</span>
            <span>Mandates: {properties.length}</span>
            <span>·</span>
            <span>Customer Leads: {leads.length}</span>
            <span>·</span>
            <span>Studio Assets: {media.length}</span>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 text-[#57534E] hover:text-[#141413] hover:border-[#141413] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {DEMO_MODE && (
        <p className="text-xs text-[#615E59]">Client demo: Sample data and changes stay in this browser tab. No live records are changed.</p>
      )}

      {/* Sub-Navigation Tabs for the 5 Authenticated Admin Modules */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-3">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#141413] text-white font-semibold'
                : 'bg-[#F3F2EE] text-[#57534E] hover:text-[#141413]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono-tabular text-[11px] ${
                  activeTab === tab.id ? 'text-stone-300' : 'text-[#615E59]'
                }`}
              >
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* =====================================================================
       * MODULE 0: OUR PROJECTS (COMPANY PROPRIETARY PROJECTS MANAGEMENT)
       * =================================================================== */}
      {activeTab === 'our-projects' && (
        <AdminOurProjectsManager
          projects={projects}
          mediaLibrary={media}
          adminToken={adminToken}
          onProjectsUpdated={onProjectsUpdated}
          onPreviewProject={onPreviewProject}
        />
      )}

      {/* =====================================================================
       * MODULE 1: MANAGE LISTINGS
       * =================================================================== */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder="Search by code, title, or locality..."
                className="px-3.5 py-2 text-xs bg-white border border-stone-300 w-64 focus:border-[#141413] focus:outline-none"
              />
              <div className="flex items-center gap-1 bg-[#F3F2EE] p-1 border border-stone-200">
                {(['All', 'Buy', 'Rent'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListingTypeFilter(t)}
                    className={`px-3 py-1 text-xs font-medium cursor-pointer ${
                      listingTypeFilter === t
                        ? 'bg-[#141413] text-white'
                        : 'text-[#57534E] hover:text-[#141413]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('add-property')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Property</span>
            </button>
          </div>

          <div className="border border-stone-200 bg-[#FBFBF9] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead className="bg-[#F3F2EE] border-b border-stone-200 text-[#615E59]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Residence</th>
                  <th className="py-3.5 px-4 font-semibold">Mandate</th>
                  <th className="py-3.5 px-4 font-semibold">Locality</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Offering Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Specs</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredListings.map((prop) => (
                  <tr key={prop.id} className="hover:bg-[#F3F2EE]/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 bg-stone-200 shrink-0 overflow-hidden">
                          <ArchitecturalImage
                            src={prop.images[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-mono-tabular text-[11px] text-[#615E59]">
                            {prop.code} · {prop.category}
                          </div>
                          <div className="font-semibold text-[#141413] text-sm">
                            {prop.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#141413]">
                      {prop.transactionType}
                    </td>
                    <td className="py-3.5 px-4 text-[#57534E]">{prop.locality}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#141413]">
                      {formatPropertyPrice(prop.price, prop.transactionType)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-[#57534E]">
                      {prop.bedrooms} BD · {formatNumber(prop.areaSqFt)} sq.ft.
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${prop.title}`}
                        value={prop.status}
                        onChange={(e) =>
                          handleQuickStatusChange(prop, e.target.value as PropertyStatus)
                        }
                        className="px-2.5 py-1 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="Available">Available</option>
                        <option value="Under Offer">Under Offer</option>
                        <option value="Sold">Sold</option>
                        <option value="Leased">Leased</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleQuickFeaturedToggle(prop)}
                        title="Toggle Featured Status"
                        className={`p-1.5 cursor-pointer ${
                          prop.featured ? 'text-[#1E3A2F]' : 'text-stone-300 hover:text-stone-500'
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 mx-auto ${prop.featured ? 'fill-[#1E3A2F]' : ''}`}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPropertyId(prop.id);
                            setActiveTab('edit-property');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(prop.id)}
                          title="Delete Property"
                          className="p-1.5 text-[#57534E] hover:text-red-700 border border-stone-200 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODULE 2 & 3: ADD PROPERTY & EDIT PROPERTY
       * =================================================================== */}
      {(activeTab === 'add-property' || activeTab === 'edit-property') && (
        <div className="bg-[#FBFBF9] border border-stone-300 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="text-xs text-[#615E59]">
                {activeTab === 'add-property'
                  ? 'New Portfolio Mandate Creation'
                  : 'Existing Mandate Modification'}
              </div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
                {activeTab === 'add-property'
                  ? 'Add New Architectural Property'
                  : 'Edit Property Specifications & Pricing'}
              </h2>
            </div>

            {activeTab === 'edit-property' && (
              <div>
                <label className="block text-xs text-[#615E59] mb-1">
                  Select Residence to Edit
                </label>
                <select
                  value={editingPropertyId}
                  onChange={(e) => setEditingPropertyId(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formError && (
            <div className="p-4 bg-red-50 border border-red-300 text-xs text-red-800 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
              {formError.includes('expired') && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1 bg-red-800 text-white font-semibold text-[11px] hover:bg-red-900 cursor-pointer"
                >
                  Sign Out &amp; Sign In Again
                </button>
              )}
            </div>
          )}

          {formFeedback && (
            <div className="p-4 bg-[#F3F2EE] border-2 border-[#1E3A2F] text-xs text-[#1E3A2F] font-medium space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E3A2F]" />
                  <span className="font-semibold text-sm">{formFeedback}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {lastCreatedProperty && onSelectProperty && (
                    <button
                      type="button"
                      onClick={() => onSelectProperty(lastCreatedProperty.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A2F] text-white font-semibold cursor-pointer hover:bg-[#141413] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Live Property Details →</span>
                    </button>
                  )}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('search')}
                      className="underline font-semibold cursor-pointer hover:text-[#141413]"
                    >
                      View in Property Search →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('listings')}
                    className="underline font-semibold cursor-pointer hover:text-[#141413]"
                  >
                    View in Manage Listings →
                  </button>
                </div>
              </div>

              {lastCreatedProperty && (
                <div className="pt-2 border-t border-stone-300 text-[11px] text-[#57534E]">
                  {lastCreatedProperty.featured ? (
                    <span>
                      ⭐ <strong>Featured Property:</strong> This residence is live on both the <strong>Homepage Showcase</strong> and the <strong>Property Search</strong> directory.
                    </span>
                  ) : (
                    <span>
                      ℹ️ <strong>Standard Listing:</strong> This residence is live in the <strong>Property Search</strong>, <strong>{lastCreatedProperty.transactionType}</strong>, and <strong>{lastCreatedProperty.locality}</strong> directories. (To feature it on the Homepage Showcase, check the "Feature on Homepage Showcase" box).
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={
              activeTab === 'add-property' ? handleCreateProperty : handleUpdateProperty
            }
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Residence Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., The Cortlandt Limestone Penthouse"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Locality / District *
                </label>
                <select
                  value={formLocality}
                  onChange={(e) => setFormLocality(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                >
                  {localities.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Architectural Subtitle / Summary Line
              </label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Full-floor travertine and bronze residence with private Hudson loggia"
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Transaction Type
                </label>
                <select
                  value={formTransactionType}
                  onChange={(e) => setFormTransactionType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                >
                  <option value="Buy">Buy (Freehold)</option>
                  <option value="Rent">Rent (Monthly Lease)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PropertyCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                >
                  <option value="Penthouse">Penthouse</option>
                  <option value="Villa">Villa</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Waterfront">Waterfront</option>
                  <option value="Estate">Estate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as PropertyStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Under Offer">Under Offer</option>
                  <option value="Sold">Sold</option>
                  <option value="Leased">Leased</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Price (INR / ₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Area (Sq.Ft.) *
                </label>
                <input
                  type="number"
                  required
                  value={formArea}
                  onChange={(e) => setFormArea(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular focus:border-[#141413] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={formBedrooms}
                  onChange={(e) => setFormBedrooms(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formBathrooms}
                  onChange={(e) => setFormBathrooms(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Parking
                </label>
                <input
                  type="number"
                  value={formParking}
                  onChange={(e) => setFormParking(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  value={formYearBuilt}
                  onChange={(e) => setFormYearBuilt(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Maint. (₹/mo)
                </label>
                <input
                  type="number"
                  value={formMaintenance}
                  onChange={(e) => setFormMaintenance(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Furnished
                </label>
                <select
                  value={formFurnished}
                  onChange={(e) => setFormFurnished(e.target.value as FurnishedStatus)}
                  className="w-full px-2 py-2 text-xs bg-white border border-stone-300"
                >
                  <option value="Bespoke Millwork">Bespoke Millwork</option>
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="142 Mercer Street, New York"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Architectural Style
                </label>
                <input
                  type="text"
                  value={formStyle}
                  onChange={(e) => setFormStyle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Architect of Record
                </label>
                <input
                  type="text"
                  value={formArchitect}
                  onChange={(e) => setFormArchitect(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Architectural Monograph Description
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Detailed architectural narrative, materials, and daylight exposures..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Amenities (Comma-Separated)
              </label>
              <input
                type="text"
                value={formAmenities}
                onChange={(e) => setFormAmenities(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300"
              />
            </div>

            {/* Select Images from Studio Media Library */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#141413]">
                  Select Property Gallery Plates ({formImages.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload-images')}
                  className="text-xs text-[#1E3A2F] underline cursor-pointer"
                >
                  + Upload New Image Asset
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {media.map((item) => {
                  const selected = formImages.includes(item.url);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleImageSelection(item.url)}
                      className={`text-left border-2 p-1.5 transition-all cursor-pointer ${
                        selected
                          ? 'border-[#1E3A2F] bg-[#F3F2EE]'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full bg-stone-200 overflow-hidden mb-1">
                        <ArchitecturalImage
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[11px] font-medium text-[#141413] truncate">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#141413] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="accent-[#1E3A2F]"
                />
                <span>Feature on Homepage Showcase</span>
              </label>

              <button
                type="submit"
                disabled={savingProperty}
                className="px-6 py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                {savingProperty
                  ? 'Saving...'
                  : activeTab === 'add-property'
                  ? 'Publish New Property Listing'
                  : 'Save Property Updates'}
              </button>
            </div>
          </form>

        </div>
      )}

      {/* =====================================================================
       * MODULE 4: UPLOAD IMAGES
       * =================================================================== */}
      {activeTab === 'upload-images' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Cols: Upload Form */}
          <div className="lg:col-span-5 bg-[#F3F2EE] border border-stone-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-300 pb-3">
              <div>
                <div className="text-xs text-[#615E59]">Studio Asset Ingestion</div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
                  Upload Architectural Photography
                </h2>
              </div>
              <Upload className="w-5 h-5 text-[#1E3A2F]" />
            </div>

            {uploadFeedback && (
              <div className="p-3 bg-white border border-[#1E3A2F] text-xs text-[#1E3A2F] font-medium">
                {uploadFeedback}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1.5">
                  Upload Local Image File (JPG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-[#57534E] file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#141413] file:text-white hover:file:bg-[#1E3A2F] bg-white border border-stone-300 p-1.5 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Or Provide Direct Image Asset Path / Data URL
                </label>
                <input
                  type="text"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="/src/assets/images/... or data:image/..."
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Plate Title / Caption *
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g., Mercer Penthouse — West Sunset Loggia"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Plate Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300"
                  >
                    <option value="Interior Living">Interior Living</option>
                    <option value="Exterior & Pool">Exterior & Pool</option>
                    <option value="Courtyard & Architecture">Courtyard & Architecture</option>
                    <option value="Waterfront">Waterfront</option>
                    <option value="Floorplan & Monograph">Floorplan & Monograph</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Attach to Listing
                  </label>
                  <select
                    value={uploadAttachPropId}
                    onChange={(e) => setUploadAttachPropId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300"
                  >
                    <option value="none">Library Only</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {uploadUrl && (
                <div className="p-2 bg-white border border-stone-200">
                  <div className="text-[11px] text-[#615E59] mb-1">Live Upload Preview:</div>
                  <div className="aspect-[16/9] w-full bg-stone-100 overflow-hidden">
                    <ArchitecturalImage
                      src={uploadUrl}
                      alt={uploadName || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingMedia}
                className="w-full py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                {uploadingMedia ? 'Uploading Asset...' : 'Save Image to Studio Library'}
              </button>
            </form>
          </div>

          {/* Right 7 Cols: Studio Media Library Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                Studio Media Repository ({media.length} Plates)
              </h3>
              <span className="text-xs text-[#615E59]">
                Available across all property listings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="border border-stone-200 bg-[#FBFBF9] overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] w-full bg-[#F3F2EE] overflow-hidden">
                    <ArchitecturalImage
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[#615E59]">{item.category}</div>
                    <div className="text-sm font-semibold text-[#141413] mt-0.5">
                      {item.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODULE 5: MANAGE LEADS (CRM FOR ALL 4 CUSTOMER LEAD VERTICALS)
       * =================================================================== */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  'All',
                  'Property Inquiry',
                  'Schedule Visit',
                  'Property Valuation',
                  'WhatsApp Contact',
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLeadTypeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                    leadTypeFilter === t
                      ? 'bg-[#141413] text-white border-[#141413]'
                      : 'bg-[#F3F2EE] text-[#57534E] border-stone-200 hover:text-[#141413]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#615E59]">Source:</span>
                <select
                  value={leadSourceFilter}
                  onChange={(e) => setLeadSourceFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-stone-300"
                >
                  <option value="All">All Sources</option>
                  <option value="Our Projects">Our Projects Only</option>
                  <option value="Property Listings">Property Listings Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#615E59]">Pipeline Stage:</span>
                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-stone-300"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-[#FBFBF9] border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6"
              >
                <div className="space-y-2.5 max-w-3xl">
                  {/* Unboxed Metadata Header */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#615E59]">
                    <span className="font-semibold text-[#1E3A2F]">{lead.type}</span>
                    {lead.inquirySubType && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#141413]">{lead.inquirySubType}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Stage: {lead.status}</span>
                    {lead.leadSource && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Source: {lead.leadSource}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{lead.id}</span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-4">
                    <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                      {lead.name}
                    </h3>
                    <span className="text-xs font-mono-tabular text-[#57534E]">
                      {lead.email} · {lead.phone}
                    </span>
                  </div>

                  {lead.projectName && (
                    <div className="text-xs font-medium text-[#1E3A2F] bg-[#F3F2EE] px-3 py-1.5 border border-stone-200 inline-flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Our Project Inquiry: <strong className="underline">{lead.projectName}</strong>
                        {lead.inquirySubType && ` (${lead.inquirySubType})`}
                      </span>
                    </div>
                  )}

                  {lead.propertyTitle && !lead.projectName && (
                    <div className="text-xs font-medium text-[#141413]">
                      Subject Residence: <span className="underline">{lead.propertyTitle}</span>
                      {lead.financingType && ` · Structure: ${lead.financingType}`}
                    </div>
                  )}

                  {lead.type === 'Schedule Visit' && (
                    <div className="text-xs text-[#1E3A2F] font-mono-tabular bg-[#F3F2EE] px-3 py-2 border border-stone-200 inline-block">
                      Requested Viewing: {lead.preferredDate} at {lead.preferredTimeSlot} (
                      {lead.visitMode})
                    </div>
                  )}

                  {lead.type === 'Property Valuation' && lead.valuationDetails && (
                    <div className="p-3 bg-[#F3F2EE] border border-stone-200 text-xs space-y-1">
                      <div className="font-semibold text-[#141413]">
                        Valuation Benchmark:{' '}
                        <span className="font-mono-tabular text-[#1E3A2F]">
                          {lead.valuationDetails.estimatedRange}
                        </span>
                      </div>
                      <div className="text-[#57534E] font-mono-tabular">
                        {lead.valuationDetails.locality} · {lead.valuationDetails.category} ·{' '}
                        {lead.valuationDetails.areaSqFt.toLocaleString()} sq.ft. ·{' '}
                        {lead.valuationDetails.bedrooms} BD · {lead.valuationDetails.condition} ·
                        Timeline: {lead.valuationDetails.timeline}
                      </div>
                    </div>
                  )}

                  {lead.whatsappContext && (
                    <div className="text-xs text-[#1E3A2F] bg-[#F3F2EE] p-2.5 border border-stone-200">
                      WhatsApp Priority Context: "{lead.whatsappContext}"
                    </div>
                  )}

                  {lead.message && (
                    <p className="text-sm text-[#3F3C38] leading-relaxed">"{lead.message}"</p>
                  )}

                  {/* Partner CRM Notes */}
                  {editingNotesId === lead.id ? (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Add partner follow-up notes..."
                        className="px-3 py-1.5 text-xs bg-white border border-stone-300 w-80"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateLead(lead.id, lead.status, notesDraft)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#141413] text-white cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-[#615E59] flex items-center gap-3 pt-1">
                      <span>
                        Partner Notes: {lead.notes ? lead.notes : 'No internal notes recorded.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(lead.id);
                          setNotesDraft(lead.notes || '');
                        }}
                        className="underline text-[#141413] cursor-pointer"
                      >
                        Edit Note
                      </button>
                    </div>
                  )}
                </div>

                {/* CRM Status Selector & Delete */}
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    aria-label={`Lead status for ${lead.name}`}
                    value={lead.status}
                    onChange={(e) =>
                      handleUpdateLead(lead.id, e.target.value as LeadStatus, lead.notes)
                    }
                    className="px-3 py-2 text-xs font-medium bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="New">Stage: New</option>
                    <option value="Contacted">Stage: Contacted</option>
                    <option value="Scheduled">Stage: Scheduled</option>
                    <option value="Closed">Stage: Closed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDeleteLead(lead.id)}
                    title="Delete Lead"
                    className="p-2 text-[#57534E] hover:text-red-700 border border-stone-200 hover:border-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
