import { apiFetch } from './services/api';
import { getAdminSession, setAdminSession, clearAdminSession } from './services/session';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  Scale,
  Calculator,
  Calendar,
  MessageSquare,
  Send,
  RotateCcw,
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react';
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  GoogleMapsIcon,
} from './components/SocialIcons';
import {
  Property,
  CompanyProject,
  CustomerLead,
  LocalityProfile,
  BlogPost,
  UploadedMedia,
  ActiveRoute,
  LeadType,
  TransactionType,
} from './types/realestate';
import {
  INITIAL_PROPERTIES,
  INITIAL_PROJECTS,
  INITIAL_LEADS,
  INITIAL_LOCALITIES,
  INITIAL_BLOG_POSTS,
  INITIAL_MEDIA,
} from './data/seedData';
import { Navbar } from './components/Navbar';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailsView } from './components/PropertyDetailsView';
import { CompanyProjectCard } from './components/CompanyProjectCard';
import { OurProjectsView } from './components/OurProjectsView';
import { CompanyProjectDetailView } from './components/CompanyProjectDetailView';
import { CustomerLeadsModal } from './components/CustomerLeadsModal';
import {
  BuyView,
  RentView,
  SellView,
  ComparisonView,
  EmiCalculatorView,
  LocalitiesView,
  BlogView,
  ContactView,
} from './components/ToolsAndPortals';
import { AdminPanelView } from './components/AdminPanelView';
import { ArchitecturalImage } from './components/ArchitecturalImage';
import { WelcomeIntroScreen } from './components/WelcomeIntroScreen';
import { HeroBackgroundVideo } from './components/HeroBackgroundVideo';
import { formatCurrency } from './utils/formatters';

export default function App() {
  // --- WELCOME INTRO VIDEO STATE ---
  // If the user has already seen the intro in this session, skip directly to 'done' for instant page loading
  const [introStage, setIntroStage] = useState<'playing' | 'fading' | 'done'>(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('trinetra_seen_intro');
      if (hasSeen || window.location.pathname.startsWith('/admin')) {
        return 'done';
      }
    }
    return 'playing';
  });

  const handleBeginIntroFadeOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('trinetra_seen_intro', 'true');
    }
    setIntroStage((prev) => (prev === 'playing' ? 'fading' : prev));
  }, []);

  useEffect(() => {
    if (introStage === 'playing' || introStage === 'fading') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    if (introStage === 'fading') {
      const timer = window.setTimeout(() => {
        setIntroStage('done');
      }, 760);
      return () => window.clearTimeout(timer);
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [introStage]);

  // --- PLATFORM DATA STATE ---
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [projects, setProjects] = useState<CompanyProject[]>(INITIAL_PROJECTS);
  const [leads, setLeads] = useState<CustomerLead[]>(INITIAL_LEADS);
  const [localities, setLocalities] = useState<LocalityProfile[]>(INITIAL_LOCALITIES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [media, setMedia] = useState<UploadedMedia[]>(INITIAL_MEDIA);

  // --- NAVIGATION & VIEW STATE ---
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const h = window.location.hash.toLowerCase();
      if (p === '/admin' || p === '/admin/' || h === '#admin' || h === '#/admin') return 'admin';
      if (p.startsWith('/projects/') && p.split('/projects/')[1]) {
        return 'project-details';
      }
      if (p === '/projects' || p === '/projects/' || h === '#projects') {
        return 'projects';
      }
    }
    return 'home';
  });
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    INITIAL_PROPERTIES[0].id
  );
  const [selectedProjectSlugOrId, setSelectedProjectSlugOrId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/projects/') && p.split('/projects/')[1]) {
        return decodeURIComponent(p.split('/projects/')[1].replace(/\/+$/, ''));
      }
    }
    return INITIAL_PROJECTS[0]?.slug || INITIAL_PROJECTS[0]?.id || '';
  });
  const [isProjectAdminPreview, setIsProjectAdminPreview] = useState<boolean>(false);
  const [projectDetailInquiryMode, setProjectDetailInquiryMode] = useState<
    'Enquire Now' | 'Schedule Site Visit' | 'Request Price' | 'Download Brochure' | 'WhatsApp'
  >('Enquire Now');
  const [compareIds, setCompareIds] = useState<string[]>([
    INITIAL_PROPERTIES[0].id,
    INITIAL_PROPERTIES[1].id,
  ]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    Boolean(getAdminSession())
  );
  const [adminToken, setAdminToken] = useState<string>(() =>
    getAdminSession()
  );

  // --- SEARCH & FILTER STATE ---
  const [searchTransaction, setSearchTransaction] = useState<'All' | TransactionType>('All');
  const [searchLocality, setSearchLocality] = useState<string>('All');
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [searchMinBeds, setSearchMinBeds] = useState<number>(0);
  const [searchMaxPrice, setSearchMaxPrice] = useState<number>(200000000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSort, setSearchSort] = useState<
    'featured' | 'price-desc' | 'price-asc' | 'area-desc'
  >('featured');

  // --- CUSTOMER LEADS MODAL STATE ---
  const [leadModalOpen, setLeadModalOpen] = useState<boolean>(false);
  const [leadModalTab, setLeadModalTab] = useState<LeadType>('Property Inquiry');
  const [leadModalPropertyId, setLeadModalPropertyId] = useState<string | undefined>(
    undefined
  );

  // Hydrate live data from Node.js Express backend (/api/bootstrap)
  useEffect(() => {
    let mounted = true;
    apiFetch('/api/bootstrap')
      .then((res) => {
        if (!res.ok) throw new Error('Bootstrap failed');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data.properties)) {
          setProperties(data.properties);
        }
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
        if (Array.isArray(data.leads)) setLeads(data.leads);
        if (Array.isArray(data.localities) && data.localities.length > 0) {
          setLocalities(data.localities);
        }
        if (Array.isArray(data.blogPosts) && data.blogPosts.length > 0) {
          setBlogPosts(data.blogPosts);
        }
        if (Array.isArray(data.media)) {
          setMedia(data.media);
        }
      })
      .catch(() => {
        // Fallback to seed data already initialized in state
      });

    return () => {
      mounted = false;
    };
  }, []);

  // When Admin logs in, fetch all projects (including DRAFT projects) from /api/admin/projects
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    apiFetch('/api/admin/projects', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-admin-token': adminToken,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((allProjects) => {
        if (Array.isArray(allProjects)) {
          setProjects(allProjects);
        }
      })
      .catch(() => {});
  }, [isAdminAuthenticated, adminToken]);

  // Synchronize clean URL path for /projects and /projects/:slug
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeRoute === 'admin') {
      if (window.location.pathname !== '/admin') window.history.pushState({}, '', '/admin');
    } else if (activeRoute === 'projects') {
      if (window.location.pathname !== '/projects') {
        window.history.pushState({}, '', '/projects');
      }
    } else if (activeRoute === 'project-details') {
      const proj =
        projects.find(
          (p) => p.slug === selectedProjectSlugOrId || p.id === selectedProjectSlugOrId
        ) || projects[0];
      if (proj) {
        const targetPath = `/projects/${proj.slug}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, '', targetPath);
        }
      }
    } else if (window.location.pathname.startsWith('/projects') || window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
  }, [activeRoute, selectedProjectSlugOrId, projects]);

  const handleSelectProject = (project: CompanyProject) => {
    setSelectedProjectSlugOrId(project.slug || project.id);
    setProjectDetailInquiryMode('Enquire Now');
    setIsProjectAdminPreview(false);
    setActiveRoute('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnquireProject = (
    project: CompanyProject,
    mode: 'Enquire Now' | 'Schedule Site Visit'
  ) => {
    setSelectedProjectSlugOrId(project.slug || project.id);
    setProjectDetailInquiryMode(mode);
    setIsProjectAdminPreview(false);
    setActiveRoute('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviewProjectFromAdmin = (project: CompanyProject) => {
    setSelectedProjectSlugOrId(project.slug || project.id);
    setProjectDetailInquiryMode('Enquire Now');
    setIsProjectAdminPreview(true);
    setActiveRoute('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickPublishProject = async (projectId: string) => {
    try {
      const res = await apiFetch(`/api/admin/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ publicationState: 'PUBLISHED' }),
      });
      if (res.ok) {
        const updated: CompanyProject = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch {
      // ignore
    }
  };

  const handleOpenLeadModal = (defaultTab: LeadType, propertyId?: string) => {
    setLeadModalTab(defaultTab);
    setLeadModalPropertyId(propertyId);
    setLeadModalOpen(true);
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
    setActiveRoute('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (propertyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), propertyId];
      }
      return [...prev, propertyId];
    });
  };

  const handleExploreLocality = (localityName: string) => {
    setSearchLocality(localityName);
    setSearchTransaction('All');
    setSearchCategory('All');
    setActiveRoute('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSearchFilters = () => {
    setSearchTransaction('All');
    setSearchLocality('All');
    setSearchCategory('All');
    setSearchMinBeds(0);
    setSearchMaxPrice(200000000);
    setSearchQuery('');
    setSearchSort('featured');
  };

  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        if (searchTransaction !== 'All' && p.transactionType !== searchTransaction) {
          return false;
        }
        if (searchLocality !== 'All' && p.locality !== searchLocality) {
          return false;
        }
        if (searchCategory !== 'All' && p.category !== searchCategory) {
          return false;
        }
        if (searchMinBeds > 0 && p.bedrooms < searchMinBeds) {
          return false;
        }
        if (p.price > searchMaxPrice) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const match =
            p.title.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.locality.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.architecturalStyle.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (searchSort === 'price-desc') return b.price - a.price;
        if (searchSort === 'price-asc') return a.price - b.price;
        if (searchSort === 'area-desc') return b.areaSqFt - a.areaSqFt;
        return Number(b.featured) - Number(a.featured);
      });
  }, [
    properties,
    searchTransaction,
    searchLocality,
    searchCategory,
    searchMinBeds,
    searchMaxPrice,
    searchQuery,
    searchSort,
  ]);

  const featuredProperties = useMemo(() => {
    const feat = properties.filter((p) => p.featured);
    return feat.length >= 3 ? feat.slice(0, 6) : properties.slice(0, 6);
  }, [properties]);

  const publishedProjects = useMemo(() => {
    return projects.filter((p) => p.publicationState === 'PUBLISHED');
  }, [projects]);

  const featuredCompanyProjects = useMemo(() => {
    const feat = publishedProjects.filter((p) => p.featured);
    return feat.length > 0 ? feat.slice(0, 3) : publishedProjects.slice(0, 3);
  }, [publishedProjects]);

  const activeProperty =
    properties.find((p) => p.id === selectedPropertyId) || properties[0];

  const activeProject = useMemo(() => {
    const pool = isAdminAuthenticated || isProjectAdminPreview ? projects : publishedProjects;
    return (
      pool.find(
        (p) => p.slug === selectedProjectSlugOrId || p.id === selectedProjectSlugOrId
      ) || pool[0]
    );
  }, [projects, publishedProjects, selectedProjectSlugOrId, isAdminAuthenticated, isProjectAdminPreview]);

  return (
    <>
      {introStage !== 'done' && (
        <WelcomeIntroScreen
          isFadingOut={introStage === 'fading'}
          onBeginFadeOut={handleBeginIntroFadeOut}
        />
      )}

      <div
        aria-hidden={introStage === 'playing'}
        className={`min-h-screen flex flex-col bg-[#FBFBF9] text-[#141413] ${
          introStage === 'playing'
            ? 'opacity-0 invisible pointer-events-none select-none h-screen overflow-hidden tr-landing-staging'
            : 'opacity-100 visible tr-landing-revealed'
        }`}
      >
      {/* Top Navigation Bar */}
      <Navbar
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        compareCount={compareIds.length}
        leadsCount={leads.length}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenLeadModal={handleOpenLeadModal}
      />

      {/* Main Content Stage */}
      <main className="flex-1">
        {/* =================================================================
         * VIEW 1: PUBLIC WEBSITE -> HOME
         * =============================================================== */}
        {activeRoute === 'home' && (
          <div>
            {/* SECTION 1: Architectural Hero Showcase (16:9) + Integrated Search */}
            <section className="relative border-b border-stone-200">
              <div className="max-w-[1360px] mx-auto px-6 py-10 lg:py-14">
                <div className="relative aspect-[16/9] min-h-[520px] sm:min-h-[460px] w-full bg-[#141413] overflow-hidden border border-stone-300 tr-reveal-hero">
                  {/* Lowest Layer (z-0): Hero Background Property Video (Memoized) */}
                  <HeroBackgroundVideo />

                  {/* Middle Layer (z-10): Cinematic Readability Overlay & Directional Gradient */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(180deg,rgba(12,12,11,0.44)_0%,rgba(12,12,11,0.16)_34%,rgba(12,12,11,0.54)_68%,rgba(12,12,11,0.84)_100%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(115%_95%_at_18%_85%,rgba(12,12,11,0.62)_0%,rgba(12,12,11,0.24)_52%,rgba(12,12,11,0)_100%)]"
                  />

                  {/* Foreground Layer (z-20): Existing Hero Content (opacity: 1) */}
                  <div className="absolute inset-0 z-20 p-6 sm:p-12 flex flex-col justify-between opacity-100">
                    {/* Top Regional Trust Marker (Placed in Hero, never Top Bar) */}
                    <div className="flex items-center justify-between text-xs text-white font-medium [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] tr-reveal-supporting">
                      <span>
                        New York · Beverly Hills · San Francisco · Marin Coast
                      </span>
                      <span className="font-mono-tabular hidden sm:inline">
                        2026 Private Portfolio Collection
                      </span>
                    </div>

                    {/* Hero Focal Proposition */}
                    <div className="max-w-3xl space-y-5 opacity-100">
                      <h1 className="font-serif-display text-4xl sm:text-6xl font-semibold text-white leading-[1.08] tracking-tight text-balance [text-shadow:0_2px_16px_rgba(0,0,0,0.65)] tr-reveal-heading">
                        Architectural Residences of Enduring Provenance.
                      </h1>
                      <p className="text-sm sm:text-base text-stone-100 max-w-2xl leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.65)] tr-reveal-supporting">
                        Trinetra Realty represents collector-grade penthouses, modernist courtyard villas, and historic townhouses across North America’s premier residential enclaves.
                      </p>

                      {/* Primary Hero Search & Filter Bar */}
                      <div className="bg-[#FBFBF9] p-3 sm:p-4 border border-stone-300 text-[#141413] shadow-xl mt-4 opacity-100 tr-reveal-controls">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Segmented Buy / Rent Selector */}
                          <div className="sm:col-span-3 flex bg-[#F3F2EE] p-1 border border-stone-200">
                            {(['All', 'Buy', 'Rent'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setSearchTransaction(mode)}
                                className={`flex-1 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                  searchTransaction === mode
                                    ? 'bg-[#141413] text-white'
                                    : 'text-[#57534E] hover:text-[#141413]'
                                }`}
                              >
                                {mode === 'All' ? 'All' : mode}
                              </button>
                            ))}
                          </div>

                          {/* Locality Selector */}
                          <div className="sm:col-span-3">
                            <select
                              aria-label="Filter by Locality"
                              value={searchLocality}
                              onChange={(e) => setSearchLocality(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                            >
                              <option value="All">All Localities</option>
                              {localities.map((loc) => (
                                <option key={loc.id} value={loc.name}>
                                  {loc.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Typology Selector */}
                          <div className="sm:col-span-3">
                            <select
                              aria-label="Filter by Property Type"
                              value={searchCategory}
                              onChange={(e) => setSearchCategory(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                            >
                              <option value="All">All Typologies</option>
                              <option value="Penthouse">Penthouse</option>
                              <option value="Villa">Villa</option>
                              <option value="Townhouse">Townhouse</option>
                              <option value="Waterfront">Waterfront</option>
                              <option value="Estate">Estate</option>
                            </select>
                          </div>

                          {/* Primary Search Action */}
                          <div className="sm:col-span-3">
                            <button
                              type="button"
                              onClick={() => setActiveRoute('search')}
                              className="w-full py-2 px-4 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Search Portfolio ({filteredProperties.length})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Featured Portfolio Collection Grid (3-Column Desktop) */}
            <section className="max-w-[1360px] mx-auto px-6 py-16 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
                <div>
                  <div className="text-xs text-[#615E59]">
                    Curated Architectural Mandates · Available for Private Showing
                  </div>
                  <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#141413] mt-1">
                    Featured Residences & Estates
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRoute('compare')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] transition-colors cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Selected ({compareIds.length}/3)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('search')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                  >
                    <span>View Complete Portfolio ({properties.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProperties.map((property, idx) => (
                  <PropertyCard
                    key={property.id}
                    index={idx}
                    property={property}
                    onSelect={handleSelectProperty}
                    isCompared={compareIds.includes(property.id)}
                    onToggleCompare={handleToggleCompare}
                    onOpenLeadModal={handleOpenLeadModal}
                  />
                ))}
              </div>
            </section>

            {/* SECTION 2B: Trinetra Realty "Our Projects" Featured Showcase */}
            {featuredCompanyProjects.length > 0 && (
              <section className="max-w-[1360px] mx-auto px-6 pb-16 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-[#1E3A2F]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Trinetra Realty · Proprietary Developments &amp; Official Projects</span>
                    </div>
                    <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#141413] mt-1">
                      Our Signature Projects
                    </h2>
                    <p className="text-xs sm:text-sm text-[#57534E] mt-1 max-w-2xl">
                      Explore landmark residential and commercial developments conceived, built, and officially represented by Trinetra Realty.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#F3F2EE] text-[#1E3A2F] border border-stone-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>RERA Registered Developments</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRoute('projects');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                    >
                      <span>Explore All Our Projects ({publishedProjects.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredCompanyProjects.map((project, idx) => (
                    <CompanyProjectCard
                      key={project.id}
                      index={idx}
                      project={project}
                      onSelectProject={handleSelectProject}
                      onEnquireProject={handleEnquireProject}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: Capabilities, Quantified Proof of Impact & Customer Leads Hub */}
            <section className="bg-[#F3F2EE] border-y border-stone-200 py-16">
              <div className="max-w-[1360px] mx-auto px-6 space-y-14">
                {/* Quantified Proof of Impact adjacent to Advisory Claims */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end border-b border-stone-300 pb-12">
                  <div className="lg:col-span-6 space-y-3">
                    <div className="text-xs text-[#615E59]">
                      Empirical Performance & Private Placement Advisory
                    </div>
                    <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#141413] text-balance">
                      Full-Spectrum Real Estate Advisory, Valuation, and Financing
                    </h2>
                    <p className="text-sm text-[#57534E] leading-relaxed max-w-xl">
                      Whether acquiring a primary penthouse, leasing a turnkey courtyard villa, or appraising a generational townhouse for disposition, our integrated platform connects principals directly with quantitative market data and senior partners.
                    </p>
                  </div>

                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#FBFBF9] border border-stone-200 p-5">
                      <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413]">
                        ₹1,480 Cr
                      </div>
                      <div className="text-xs text-[#615E59] mt-1">
                        Closed Transaction Volume Across 12 Months (2025–2026)
                      </div>
                    </div>
                    <div className="bg-[#FBFBF9] border border-stone-200 p-5">
                      <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A2F]">
                        98.4%
                      </div>
                      <div className="text-xs text-[#615E59] mt-1">
                        List-to-Close Realization on Verified Mandates
                      </div>
                    </div>
                    <div className="bg-[#FBFBF9] border border-stone-200 p-5">
                      <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413]">
                        24 Days
                      </div>
                      <div className="text-xs text-[#615E59] mt-1">
                        Median Private Placement Velocity for Valued Estates
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asymmetric Bento Grid of Platform Capabilities & Customer Lead Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-[#FBFBF9] border border-stone-200 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
                        01. Algorithmic Property Valuation & Seller Mandates
                      </div>
                      <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413]">
                        Instant Per-Square-Foot Benchmarking & Disposition Modeling
                      </h3>
                      <p className="text-sm text-[#57534E] leading-relaxed">
                        Calculate your residence’s fair market valuation range using live locality indices across Tribeca, Beverly Hills Trousdale, Gramercy, Sausalito, and Pacific Heights.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveRoute('sell')}
                        className="px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                      >
                        Launch Property Valuation Engine
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLeadModal('Property Valuation')}
                        className="px-4 py-2.5 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer"
                      >
                        Quick Valuation Modal
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#FBFBF9] border border-stone-200 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
                        02. Jumbo Debt Service & EMI Modeling
                      </div>
                      <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                        Interactive Amortization & Carrying Cost Calculator
                      </h3>
                      <p className="text-sm text-[#57534E] leading-relaxed">
                        Stress-test monthly principal, interest, and estate maintenance across 5-to-30-year tenures with full annual amortization schedules.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveRoute('emi')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Open EMI Calculator</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct 4 Customer Lead Channels Bar */}
                  <div className="lg:col-span-12 bg-[#141413] text-white p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="text-xs text-stone-400">
                        Direct Customer Lead Channels · Integrated Admin CRM
                      </div>
                      <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold">
                        Initiate a Private Inquiry, Viewing, Valuation, or WhatsApp Dispatch
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenLeadModal('Property Inquiry')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-white text-[#141413] hover:bg-stone-200 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Property Inquiry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLeadModal('Schedule Visit')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-stone-600 text-white hover:border-white cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Visit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLeadModal('Property Valuation')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-stone-600 text-white hover:border-white cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Property Valuation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLeadModal('WhatsApp Contact')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#274B3D] cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp Contact</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =================================================================
         * VIEW 1B: PUBLIC WEBSITE -> OUR PROJECTS (/projects)
         * =============================================================== */}
        {activeRoute === 'projects' && (
          <OurProjectsView
            projects={projects}
            onSelectProject={handleSelectProject}
            onEnquireProject={handleEnquireProject}
          />
        )}

        {/* =================================================================
         * VIEW 1C: PUBLIC WEBSITE -> PROJECT DETAILS (/projects/:slug)
         * =============================================================== */}
        {activeRoute === 'project-details' && activeProject && (
          <CompanyProjectDetailView
            project={activeProject}
            onBackToProjects={() => {
              setIsProjectAdminPreview(false);
              setActiveRoute('projects');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
            isAdminPreview={isProjectAdminPreview}
            onReturnToAdmin={() => {
              setIsProjectAdminPreview(false);
              setActiveRoute('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickPublish={handleQuickPublishProject}
            initialInquiryMode={projectDetailInquiryMode}
          />
        )}

        {/* =================================================================
         * VIEW 2: PUBLIC WEBSITE -> PROPERTY SEARCH
         * =============================================================== */}
        {activeRoute === 'search' && (
          <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
            <div className="border-b border-stone-200 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <div className="text-xs text-[#615E59]">
                  Multi-Facet Portfolio Search · {filteredProperties.length} Matching Mandates
                </div>
                <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413] mt-1">
                  Property Search & Directory
                </h1>
              </div>

              <button
                type="button"
                onClick={resetSearchFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#141413] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>

            {/* Comprehensive Filter Bar */}
            <div className="bg-[#F3F2EE] border border-stone-200 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Keyword Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Keyword, Architect, or Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Mercer, Limestone, AV-0104..."
                      className="w-full pl-3.5 pr-8 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-[#615E59] absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Mandate Type
                  </label>
                  <select
                    value={searchTransaction}
                    onChange={(e) => setSearchTransaction(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="All">All (Buy & Rent)</option>
                    <option value="Buy">Buy (Freehold)</option>
                    <option value="Rent">Rent (Luxury Lease)</option>
                  </select>
                </div>

                {/* Locality */}
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Locality
                  </label>
                  <select
                    value={searchLocality}
                    onChange={(e) => setSearchLocality(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="All">All Localities</option>
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Property Typology
                  </label>
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="All">All Typologies</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Villa">Villa</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Waterfront">Waterfront</option>
                    <option value="Estate">Estate</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Sort Portfolio
                  </label>
                  <select
                    value={searchSort}
                    onChange={(e) => setSearchSort(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="featured">Curated Featured First</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="area-desc">Interior Area: Largest First</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-300/70 flex flex-wrap items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#57534E]">Min Bedrooms:</span>
                    {[0, 3, 4, 5].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSearchMinBeds(b)}
                        className={`px-2.5 py-1 text-xs font-mono-tabular border cursor-pointer ${
                          searchMinBeds === b
                            ? 'bg-[#141413] text-white border-[#141413]'
                            : 'bg-white text-[#57534E] border-stone-300'
                        }`}
                      >
                        {b === 0 ? 'Any' : `${b}+ BD`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#57534E]">
                      Max Budget:{' '}
                      <strong className="font-mono-tabular text-[#141413]">
                        {formatCurrency(searchMaxPrice, true)}
                      </strong>
                    </span>
                    <input
                      type="range"
                      min={200000}
                      max={200000000}
                      step={2500000}
                      value={searchMaxPrice}
                      onChange={(e) => setSearchMaxPrice(Number(e.target.value))}
                      className="w-36 accent-[#1E3A2F]"
                    />
                  </div>
                </div>

                <div className="text-xs text-[#615E59] font-mono-tabular">
                  Showing {filteredProperties.length} of {properties.length} properties
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {filteredProperties.length === 0 ? (
              <div className="bg-[#F3F2EE] border border-stone-200 p-12 text-center space-y-4">
                <SlidersHorizontal className="w-8 h-8 text-[#615E59] mx-auto" />
                <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
                  No Residences Match Your Exact Filter Criteria
                </h2>
                <p className="text-xs text-[#57534E] max-w-md mx-auto">
                  Adjust your price ceiling, locality selection, or reset filters to view all published architectural mandates.
                </p>
                <button
                  type="button"
                  onClick={resetSearchFilters}
                  className="px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property, idx) => (
                  <PropertyCard
                    key={property.id}
                    index={idx}
                    property={property}
                    onSelect={handleSelectProperty}
                    isCompared={compareIds.includes(property.id)}
                    onToggleCompare={handleToggleCompare}
                    onOpenLeadModal={handleOpenLeadModal}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
         * VIEW 3: PUBLIC WEBSITE -> PROPERTY DETAILS
         * =============================================================== */}
        {activeRoute === 'details' && activeProperty && (
          <PropertyDetailsView
            property={activeProperty}
            isCompared={compareIds.includes(activeProperty.id)}
            onToggleCompare={handleToggleCompare}
            onBack={() => setActiveRoute('search')}
            onNavigate={setActiveRoute}
            onOpenLeadModal={handleOpenLeadModal}
            onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
          />
        )}

        {/* =================================================================
         * VIEW 4: PUBLIC WEBSITE -> BUY
         * =============================================================== */}
        {activeRoute === 'buy' && (
          <BuyView
            properties={properties}
            compareIds={compareIds}
            onSelectProperty={handleSelectProperty}
            onToggleCompare={handleToggleCompare}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 5: PUBLIC WEBSITE -> RENT
         * =============================================================== */}
        {activeRoute === 'rent' && (
          <RentView
            properties={properties}
            compareIds={compareIds}
            onSelectProperty={handleSelectProperty}
            onToggleCompare={handleToggleCompare}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 6: PUBLIC WEBSITE -> SELL & VALUATION
         * =============================================================== */}
        {activeRoute === 'sell' && (
          <SellView
            localities={localities}
            onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
            onNavigate={setActiveRoute}
          />
        )}

        {/* =================================================================
         * VIEW 7: PUBLIC WEBSITE -> PROPERTY COMPARISON
         * =============================================================== */}
        {activeRoute === 'compare' && (
          <ComparisonView
            properties={properties}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
            onSelectProperty={handleSelectProperty}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 8: PUBLIC WEBSITE -> EMI CALCULATOR
         * =============================================================== */}
        {activeRoute === 'emi' && (
          <EmiCalculatorView
            properties={properties}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 9: PUBLIC WEBSITE -> LOCALITIES
         * =============================================================== */}
        {activeRoute === 'localities' && (
          <LocalitiesView
            localities={localities}
            properties={properties}
            onExploreLocality={handleExploreLocality}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 10: PUBLIC WEBSITE -> BLOG
         * =============================================================== */}
        {activeRoute === 'blog' && (
          <BlogView posts={blogPosts} onOpenLeadModal={handleOpenLeadModal} />
        )}

        {/* =================================================================
         * VIEW 11: PUBLIC WEBSITE -> CONTACT
         * =============================================================== */}
        {activeRoute === 'contact' && (
          <ContactView
            properties={properties}
            onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
            onOpenLeadModal={handleOpenLeadModal}
          />
        )}

        {/* =================================================================
         * VIEW 12: ADMIN PANEL (Our Projects, Login, Add/Edit Property, Upload Images, Manage Listings & Leads)
         * =============================================================== */}
        {activeRoute === 'admin' && (
          <AdminPanelView
            isAuthenticated={isAdminAuthenticated}
            adminToken={adminToken}
            onLoginSuccess={(token) => {
              if (token) {
                setAdminToken(token);
                setAdminSession(token);
              }
              setIsAdminAuthenticated(true);
            }}
            onLogout={() => {
              void apiFetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
              clearAdminSession();
              setAdminToken('');
              setIsAdminAuthenticated(false);
            }}
            properties={properties}
            projects={projects}
            leads={leads}
            media={media}
            localities={localities}
            onNavigate={setActiveRoute}
            onSelectProperty={(id) => {
              setSelectedPropertyId(id);
              setActiveRoute('details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProjectsUpdated={(updatedProjects) => setProjects(updatedProjects)}
            onPreviewProject={handlePreviewProjectFromAdmin}
            onPropertyAdded={(created) =>
              setProperties((prev) => [created, ...prev])
            }
            onPropertyUpdated={(updated) =>
              setProperties((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
              )
            }
            onPropertyDeleted={(id) =>
              setProperties((prev) => prev.filter((p) => p.id !== id))
            }
            onLeadUpdated={(updated) =>
              setLeads((prev) =>
                prev.map((l) => (l.id === updated.id ? updated : l))
              )
            }
            onLeadDeleted={(id) =>
              setLeads((prev) => prev.filter((l) => l.id !== id))
            }
            onMediaUploaded={(newMedia, updatedProp) => {
              setMedia((prev) => [newMedia, ...prev]);
              if (updatedProp) {
                setProperties((prev) =>
                  prev.map((p) => (p.id === updatedProp.id ? updatedProp : p))
                );
              }
            }}
          />
        )}
      </main>

      {/* Ready to Explore Your Next Property? Global CTA (Shown on public pages except contact/admin) */}
      {activeRoute !== 'contact' && activeRoute !== 'admin' && (
        <section className="max-w-[1360px] mx-auto px-6 mt-20">
          <div className="bg-[#1E3A2F] text-white p-8 sm:p-12 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-md">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs uppercase tracking-widest text-emerald-200/80 font-medium">
                Trinetra Realty · Business Owners: Rahul Khatri &amp; Rohit Joon
              </div>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-white">
                Ready to Explore Your Next Property?
              </h2>
              <p className="text-sm text-stone-200 font-medium">
                Have a property enquiry or want to schedule a site visit?
              </p>
              <p className="text-xs text-stone-300/90 leading-relaxed pt-1">
                Connect directly with business owners Rahul Khatri &amp; Rohit Joon for project details, inventory availability, and site visits.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveRoute('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3.5 text-xs font-semibold bg-white text-[#141413] hover:bg-stone-100 transition-colors cursor-pointer shadow-sm text-center"
              >
                Get in Touch
              </button>
              <button
                type="button"
                onClick={() => handleOpenLeadModal('Schedule Visit')}
                className="px-6 py-3.5 text-xs font-semibold border-2 border-white/80 text-white hover:bg-white hover:text-[#1E3A2F] transition-all cursor-pointer text-center"
              >
                Schedule a Site Visit
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quiet Architectural Footer (Complete Sitemap Mirror) */}
      <footer className="bg-[#F3F2EE] border-t border-stone-200 mt-20">
        <div className="max-w-[1360px] mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-300/80">
            {/* Office & Direct Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="font-serif-display text-2xl font-semibold text-[#141413]">
                  Trinetra Realty
                </div>
                <div className="font-serif-display text-base text-[#1E3A2F] italic">
                  Your Future, Our Focus.
                </div>
                <div className="pt-1 text-xs">
                  <span className="font-semibold text-[#141413]">Business Owners: </span>
                  <span className="text-[#1E3A2F] font-semibold">Rahul Khatri &amp; Rohit Joon</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#57534E]">
                {/* Clickable Office Location to Google Maps */}
                <div className="flex items-start gap-2">
                  <GoogleMapsIcon className="w-4 h-4 text-[#EA4335] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#141413]">Office: </span>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=F3%2C+Supermax+Galleria+Market%2C+Sector+33%2C+Sonipat%2C+Haryana%2C+India"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Maps"
                      className="hover:text-[#1E3A2F] hover:underline"
                    >
                      F3, Supermax Galleria Market, Sector 33, Sonipat, Haryana, India
                    </a>
                  </div>
                </div>

                {/* Clickable Phone Numbers */}
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#1E3A2F] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#141413]">Phone: </span>
                    <a href="tel:+919186221008" className="hover:text-[#1E3A2F] hover:underline font-mono-tabular" title="Call Rahul Khatri (Business Owner)">
                      +91 9186221008 (Rahul)
                    </a>
                    <span className="mx-1.5 text-stone-300">·</span>
                    <a href="tel:+919034969308" className="hover:text-[#1E3A2F] hover:underline font-mono-tabular" title="Call Rohit Joon (Business Owner)">
                      +91 9034969308 (Rohit)
                    </a>
                  </div>
                </div>

                {/* Clickable Email */}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#1E3A2F] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#141413]">Email: </span>
                    <a
                      href="mailto:trinetrarealty29@gmail.com"
                      className="hover:text-[#1E3A2F] hover:underline"
                    >
                      trinetrarealty29@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Channels with Authentic Brand Icons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
                <a
                  href="https://www.instagram.com/trinetrarealty_?stkn=MW52OXVra2cxcXhmaw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-[#141413] hover:text-[#E1306C] hover:border-[#E1306C]/40 rounded-sm shadow-2xs hover:shadow-xs transition-all"
                  title="Follow Trinetra Realty on Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                  <span className="font-medium">Instagram</span>
                </a>
                <a
                  href="https://www.facebook.com/share/1VBsJ1bSHk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-[#141413] hover:text-[#1877F2] hover:border-[#1877F2]/40 rounded-sm shadow-2xs hover:shadow-xs transition-all"
                  title="Visit Trinetra Realty on Facebook"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span className="font-medium">Facebook</span>
                </a>
                <a
                  href="https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-[#141413] hover:text-[#25D366] hover:border-[#25D366]/40 rounded-sm shadow-2xs hover:shadow-xs transition-all"
                  title="Chat with Trinetra Realty on WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span className="font-medium">WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Column 1: Public Website */}
            <div className="space-y-2.5 text-xs">
              <div className="font-semibold text-[#141413]">Public Website</div>
              <ul className="space-y-2 text-[#57534E]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('home')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoute('projects');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="font-medium text-[#1E3A2F] hover:text-[#141413] cursor-pointer"
                  >
                    Our Projects
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('search')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Property Search
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('buy')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Buy Residences
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('rent')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Rent & Leases
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('sell')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Sell & Valuation
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Financial Tools & Editorial */}
            <div className="space-y-2.5 text-xs">
              <div className="font-semibold text-[#141413]">Tools & Intelligence</div>
              <ul className="space-y-2 text-[#57534E]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('compare')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Property Comparison ({compareIds.length}/3)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('emi')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    EMI Calculator
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('localities')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Localities Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('blog')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Editorial Blog
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoute('contact');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#141413] font-medium text-[#1E3A2F] cursor-pointer"
                  >
                    Contact Desks
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Leads & Admin Governance */}
            <div className="space-y-2.5 text-xs">
              <div className="font-semibold text-[#141413]">
                Customer Leads & Admin
              </div>
              <ul className="space-y-2 text-[#57534E]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLeadModal('Property Inquiry')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Property Inquiry
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLeadModal('Schedule Visit')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Schedule Visit
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLeadModal('Property Valuation')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    Property Valuation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLeadModal('WhatsApp Contact')}
                    className="hover:text-[#141413] cursor-pointer"
                  >
                    WhatsApp Contact
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('admin')}
                    className="font-semibold text-[#1E3A2F] hover:underline cursor-pointer"
                  >
                    Admin Panel Suite →
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#615E59] gap-4">
            <div>
              © Trinetra Realty · Business Owners: Rahul Khatri &amp; Rohit Joon. All Rights Reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Your Future, Our Focus.</span>
              <span>·</span>
              <span>Sonipat, Haryana</span>
              <span>·</span>
              <span>Licensed Real Estate Advisory</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Customer Leads Modal (Property Inquiry, Schedule Visit, Property Valuation, WhatsApp Contact) */}
      <CustomerLeadsModal
        isOpen={leadModalOpen}
        initialTab={leadModalTab}
        selectedPropertyId={leadModalPropertyId}
        properties={properties}
        localities={localities}
        onClose={() => setLeadModalOpen(false)}
        onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
      />

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href="https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat with Trinetra Realty on WhatsApp (+91 9186221008)"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
      >
        <WhatsAppIcon className="w-5 h-5 text-white shrink-0 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          WhatsApp Desk
        </span>
      </a>
      </div>
    </>
  );
}
