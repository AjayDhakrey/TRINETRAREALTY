import { apiFetch } from '../services/api';
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Dumbbell,
  Eye,
  FileText,
  Flower2,
  Layers,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Users,
  Video,
  Waves,
  Zap,
} from 'lucide-react';
import { CompanyProject, CustomerLead, LeadType } from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface CompanyProjectDetailViewProps {
  project: CompanyProject;
  onBackToProjects: () => void;
  onLeadSubmitted: (newLead: CustomerLead) => void;
  isAdminPreview?: boolean;
  onReturnToAdmin?: () => void;
  onQuickPublish?: (projectId: string) => void;
  initialInquiryMode?:
    | 'Enquire Now'
    | 'Schedule Site Visit'
    | 'Request Price'
    | 'Download Brochure'
    | 'WhatsApp';
}

type InquiryTabMode =
  | 'Enquire Now'
  | 'Schedule Site Visit'
  | 'Request Price'
  | 'Download Brochure'
  | 'WhatsApp';

function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  if (lower.includes('pool') || lower.includes('water')) return Waves;
  if (lower.includes('gym') || lower.includes('fitness')) return Dumbbell;
  if (lower.includes('garden') || lower.includes('green') || lower.includes('park')) return Trees;
  if (lower.includes('play') || lower.includes('child')) return Sparkles;
  if (lower.includes('security') || lower.includes('guard') || lower.includes('biometric'))
    return Shield;
  if (lower.includes('cctv') || lower.includes('camera') || lower.includes('surveillance'))
    return Eye;
  if (lower.includes('parking') || lower.includes('valet') || lower.includes('car')) return Car;
  if (lower.includes('power') || lower.includes('backup') || lower.includes('solar')) return Zap;
  if (lower.includes('lift') || lower.includes('elevator')) return Layers;
  if (lower.includes('sport') || lower.includes('tennis') || lower.includes('squash'))
    return Trophy;
  if (lower.includes('jogging') || lower.includes('track') || lower.includes('walk'))
    return Compass;
  if (lower.includes('club') || lower.includes('hall') || lower.includes('community'))
    return Users;
  return Flower2;
}

export const CompanyProjectDetailView: React.FC<CompanyProjectDetailViewProps> = ({
  project,
  onBackToProjects,
  onLeadSubmitted,
  isAdminPreview = false,
  onReturnToAdmin,
  onQuickPublish,
  initialInquiryMode = 'Enquire Now',
}) => {
  const inquirySectionRef = useRef<HTMLDivElement | null>(null);

  const [activeHeroMedia, setActiveHeroMedia] = useState<'image' | 'video'>('image');
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number>(0);
  const [selectedFloorPlanIdx, setSelectedFloorPlanIdx] = useState<number>(0);
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);

  // Inquiry form state
  const [inquiryMode, setInquiryMode] = useState<InquiryTabMode>(initialInquiryMode);
  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorEmail, setVisitorEmail] = useState<string>('');
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [selectedConfigName, setSelectedConfigName] = useState<string>(
    project.configurations[0]?.name || project.configurationSummary
  );
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('11:00 AM – 01:00 PM');
  const [visitMode, setVisitMode] = useState<'In-Person Private Tour' | 'Live Video Walkthrough'>(
    'In-Person Private Tour'
  );
  const [inquiryMessage, setInquiryMessage] = useState<string>('');
  const [submittingLead, setSubmittingLead] = useState<boolean>(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState<string>('');
  const [leadErrorMsg, setLeadErrorMsg] = useState<string>('');

  useEffect(() => {
    setInquiryMode(initialInquiryMode);
  }, [initialInquiryMode]);

  // SEO & OpenGraph Meta Tag Synchronization
  useEffect(() => {
    const prevTitle = document.title;
    const pageTitle =
      project.seoTitle ||
      `${project.name} — ${project.locality}, ${project.city} | Trinetra Realty`;
    const pageDesc =
      project.seoDescription ||
      project.shortDescription ||
      `Explore ${project.name} in ${project.locality}, ${project.city} by Trinetra Realty.`;

    document.title = pageTitle;

    const setMetaTag = (selector: string, attr: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const propMatch = selector.match(/property="([^"]+)"/);
          if (propMatch) el.setAttribute('property', propMatch[1]);
        } else if (selector.includes('name=')) {
          const nameMatch = selector.match(/name="([^"]+)"/);
          if (nameMatch) el.setAttribute('name', nameMatch[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };

    setMetaTag('meta[name="description"]', 'content', pageDesc);
    setMetaTag('meta[property="og:title"]', 'content', pageTitle);
    setMetaTag('meta[property="og:description"]', 'content', pageDesc);
    setMetaTag('meta[property="og:image"]', 'content', project.coverImage);
    setMetaTag(
      'meta[name="robots"]',
      'content',
      project.publicationState === 'PUBLISHED' ? 'index, follow' : 'noindex, nofollow'
    );

    return () => {
      document.title = prevTitle;
      setMetaTag('meta[name="robots"]', 'content', 'index, follow');
    };
  }, [project]);

  const scrollToInquiry = (mode: InquiryTabMode) => {
    setInquiryMode(mode);
    setLeadSuccessMsg('');
    setLeadErrorMsg('');
    if (inquirySectionRef.current) {
      inquirySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const shareableUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/projects/${project.slug}`
      : `/projects/${project.slug}`;

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl).catch(() => {});
    }
    setCopiedShareUrl(true);
    window.setTimeout(() => setCopiedShareUrl(false), 2500);
  };

  const galleryList =
    project.galleryImages && project.galleryImages.length > 0
      ? project.galleryImages
      : [{ url: project.coverImage, caption: `${project.name} — Cover Perspective` }];

  const allFloorPlans = [
    ...(project.floorPlanImages || []),
    ...project.configurations
      .filter((c) => c.floorPlanImage)
      .map((c) => ({
        url: c.floorPlanImage as string,
        caption: `${c.name} — ${formatNumber(c.builtUpAreaSqFt)} sq.ft. (${
          c.priceOnRequest ? 'Price on Request' : formatCurrency(c.price)
        })`,
      })),
  ].filter((item, idx, self) => self.findIndex((t) => t.url === item.url && t.caption === item.caption) === idx);

  const formattedPriceDisplay = project.priceOnRequest
    ? 'Price on Request'
    : project.maxPrice && project.maxPrice > project.startingPrice
    ? `${formatCurrency(project.startingPrice)} – ${formatCurrency(project.maxPrice)}`
    : `${formatCurrency(project.startingPrice)} Onwards`;

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadErrorMsg('');
    setLeadSuccessMsg('');

    if (!visitorName.trim() || !visitorEmail.trim() || !visitorPhone.trim()) {
      setLeadErrorMsg('Please provide your full name, email address, and phone number.');
      return;
    }

    setSubmittingLead(true);

    const mappedLeadType: LeadType =
      inquiryMode === 'Schedule Site Visit'
        ? 'Schedule Visit'
        : inquiryMode === 'WhatsApp'
        ? 'WhatsApp Contact'
        : 'Property Inquiry';

    const defaultContextMessage =
      inquiryMode === 'Request Price'
        ? `Requesting complete price sheet & payment plan for ${project.name} (${selectedConfigName}).`
        : inquiryMode === 'Download Brochure'
        ? `Requested official project brochure download for ${project.name} (${selectedConfigName}).`
        : inquiryMode === 'Schedule Site Visit'
        ? `Site visit request for ${project.name} (${selectedConfigName}).`
        : inquiryMode === 'WhatsApp'
        ? `WhatsApp direct advisory request for ${project.name} (${selectedConfigName}).`
        : `Project inquiry regarding ${project.name} (${selectedConfigName}).`;

    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mappedLeadType,
          name: visitorName.trim(),
          email: visitorEmail.trim(),
          phone: visitorPhone.trim(),
          propertyId: project.id,
          propertyTitle: `${project.name} (${project.code})`,
          projectId: project.id,
          projectName: project.name,
          projectSlug: project.slug,
          inquirySubType: inquiryMode,
          leadSource: `Our Projects (/projects/${project.slug})`,
          financingType: selectedConfigName,
          preferredDate: inquiryMode === 'Schedule Site Visit' ? preferredDate : undefined,
          preferredTimeSlot:
            inquiryMode === 'Schedule Site Visit' ? preferredTimeSlot : undefined,
          visitMode: inquiryMode === 'Schedule Site Visit' ? visitMode : undefined,
          whatsappContext:
            inquiryMode === 'WhatsApp'
              ? inquiryMessage.trim() || defaultContextMessage
              : undefined,
          message: inquiryMessage.trim() || defaultContextMessage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit project inquiry.');
      }

      const createdLead = (await res.json()) as CustomerLead;
      onLeadSubmitted(createdLead);

      setLeadSuccessMsg(
        inquiryMode === 'Download Brochure'
          ? `Thank you, ${visitorName.trim()}. Your inquiry is recorded and the ${project.name} brochure dossier is unlocked below.`
          : `Thank you, ${visitorName.trim()}. Your ${inquiryMode} mandate for ${project.name} has been assigned to our Project Advisory Desk.`
      );
      setInquiryMessage('');
    } catch (err: any) {
      setLeadErrorMsg(err.message || 'Unable to record inquiry at this moment.');
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="bg-[#FBFBF9]">
      {/* ADMIN DRAFT / ARCHIVED PREVIEW BANNER */}
      {(isAdminPreview || project.publicationState !== 'PUBLISHED') && (
        <div className="bg-[#141413] text-[#FBFBF9] border-b border-[#D4AF6A]/40 px-6 py-3">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="px-2 py-0.5 text-[10px] font-mono-tabular uppercase tracking-wider bg-[#D4AF6A] text-[#141413] font-semibold">
                {project.publicationState} PREVIEW
              </span>
              <span className="text-stone-200">
                {project.publicationState === 'PUBLISHED'
                  ? 'Viewing live published project page.'
                  : 'This project is currently NOT visible to the public website.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {project.publicationState !== 'PUBLISHED' && onQuickPublish && (
                <button
                  type="button"
                  onClick={() => onQuickPublish(project.id)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#1E3A2F] hover:bg-[#274B3D] text-white border border-white/15 transition-colors cursor-pointer"
                >
                  Publish Project Now
                </button>
              )}
              {onReturnToAdmin && (
                <button
                  type="button"
                  onClick={onReturnToAdmin}
                  className="px-3.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
                >
                  Return to Admin Projects
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 space-y-10 sm:space-y-14">
        {/* Top Breadcrumb & Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToProjects}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#141413] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Trinetra Projects</span>
            </button>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-mono-tabular text-[#615E59] truncate max-w-[180px] sm:max-w-none">
              /projects/{project.slug}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#141413] bg-[#F3F2EE] border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
            >
              {copiedShareUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1E3A2F]" />
                  <span className="text-[#1E3A2F]">Copied URL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Share Project URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===================================================================
         * 1. HERO SHOWCASE (Cover Image / Video + Core Valuation & CTAs)
         * ================================================================= */}
        <section className="space-y-6">
          <div className="relative aspect-auto sm:aspect-[16/9] min-h-[460px] sm:min-h-[440px] w-full bg-[#141413] overflow-hidden border border-stone-300">
            {activeHeroMedia === 'video' && project.projectVideoUrl ? (
              <video
                src={project.projectVideoUrl}
                poster={project.coverImage}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <ArchitecturalImage
                  src={project.coverImage}
                  alt={project.name}
                  fallbackLabel={project.name}
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15 pointer-events-none"
                />
              </>
            )}

            {/* Media Switcher (Cover vs Walkthrough Video) */}
            {project.projectVideoUrl && (
              <div className="absolute top-5 right-5 z-20 flex bg-black/75 border border-white/20 p-1">
                <button
                  type="button"
                  onClick={() => setActiveHeroMedia('image')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    activeHeroMedia === 'image'
                      ? 'bg-[#FBFBF9] text-[#141413]'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  Architectural Cover
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroMedia('video')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    activeHeroMedia === 'video'
                      ? 'bg-[#FBFBF9] text-[#141413]'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Project Film</span>
                </button>
              </div>
            )}

            {activeHeroMedia === 'image' && (
              <div className="absolute inset-0 p-4 sm:p-12 flex flex-col justify-between z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-medium tracking-[0.15em] uppercase bg-[#1E3A2F] text-white border border-white/15">
                    {project.projectStatus}
                  </span>
                  <span className="px-3 py-1 text-xs font-mono-tabular bg-black/70 text-stone-200 border border-white/15">
                    RERA: {project.reraNumber}
                  </span>
                  <span className="px-3 py-1 text-xs font-mono-tabular bg-black/70 text-[#D4AF6A] border border-white/15">
                    {project.code}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                  <div className="lg:col-span-8 space-y-3">
                    <div className="inline-flex items-center gap-1.5 text-xs text-stone-200 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF6A]" />
                      <span>
                        {project.locality} · {project.city}, {project.state}
                      </span>
                    </div>
                    <h1 className="font-serif-display text-3xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.06] tracking-tight">
                      {project.name}
                    </h1>
                    <p className="text-sm sm:text-base text-stone-200 max-w-2xl leading-relaxed">
                      {project.shortDescription}
                    </p>
                  </div>

                  <div className="lg:col-span-4 bg-[#FBFBF9] p-4 sm:p-5 border border-stone-300 text-[#141413] space-y-3">
                    <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                          Starting Price
                        </div>
                        <div className="font-mono-tabular text-xl sm:text-2xl font-semibold text-[#141413] mt-0.5">
                          {formattedPriceDisplay}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                          Possession
                        </div>
                        <div className="text-xs font-medium text-[#1E3A2F] mt-0.5">
                          {project.possessionDate.split('(')[0].trim()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToInquiry('Enquire Now')}
                        className="py-2.5 px-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer text-center"
                      >
                        Enquire Now
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToInquiry('Schedule Site Visit')}
                        className="py-2.5 px-3 text-xs font-semibold bg-[#F3F2EE] text-[#141413] hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer text-center"
                      >
                        Schedule Site Visit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Strip (5 Required Lead Actions) */}
          <div className="bg-[#F3F2EE] border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#57534E]">
              <span className="font-semibold text-[#141413]">{project.developerBrand}</span> ·{' '}
              {project.configurationSummary} ({project.areaRangeSqFt})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToInquiry('Enquire Now')}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                Enquire Now
              </button>
              <button
                type="button"
                onClick={() => scrollToInquiry('Schedule Site Visit')}
                className="px-3.5 py-1.5 text-xs font-medium bg-white text-[#141413] border border-stone-300 hover:border-[#141413] transition-colors cursor-pointer"
              >
                Schedule Site Visit
              </button>
              <button
                type="button"
                onClick={() => scrollToInquiry('Request Price')}
                className="px-3.5 py-1.5 text-xs font-medium bg-white text-[#141413] border border-stone-300 hover:border-[#141413] transition-colors cursor-pointer"
              >
                Request Price
              </button>
              <button
                type="button"
                onClick={() => scrollToInquiry('Download Brochure')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white text-[#141413] border border-stone-300 hover:border-[#141413] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Brochure</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToInquiry('WhatsApp')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#1E3A2F] text-white hover:bg-[#162B22] transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================================
         * 2. MAIN TWO-COLUMN EDITORIAL DOSSIER + STICKY PROJECT INQUIRY DESK
         * ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT 8 COLUMNS: OVERVIEW, HIGHLIGHTS, CONFIGS, FLOOR PLANS, AMENITIES, GALLERY, MASTER PLAN, LOCATION, VIDEO, RERA */}
          <div className="lg:col-span-8 space-y-12">
            {/* OVERVIEW & KEY SPECIFICATIONS */}
            <section className="space-y-6 border-b border-stone-200 pb-10">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                  Architectural Overview
                </div>
                <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                  Project Provenance &amp; Key Specifications
                </h2>
              </div>

              <div className="space-y-4 text-sm text-[#57534E] leading-relaxed whitespace-pre-line">
                {project.fullDescription}
              </div>

              {/* Key Specifications Ledger */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Project Type
                  </div>
                  <div className="text-sm font-semibold text-[#141413] mt-1">
                    {project.projectType}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Configurations
                  </div>
                  <div className="text-sm font-semibold text-[#141413] mt-1">
                    {project.configurationSummary}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Area Range
                  </div>
                  <div className="font-mono-tabular text-sm font-semibold text-[#141413] mt-1">
                    {project.areaRangeSqFt}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Total Project Area
                  </div>
                  <div className="text-sm font-semibold text-[#141413] mt-1">
                    {project.projectArea}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Towers &amp; Elevation
                  </div>
                  <div className="font-mono-tabular text-sm font-semibold text-[#141413] mt-1">
                    {project.numberOfTowers > 0
                      ? `${project.numberOfTowers} Towers · ${project.numberOfFloors} Floors`
                      : `Horizontal Enclave · G+${project.numberOfFloors - 1} Levels`}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Inventory Status
                  </div>
                  <div className="font-mono-tabular text-sm font-semibold text-[#141413] mt-1">
                    {project.unitsAvailable} Available / {project.totalUnits} Total Units
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Possession Timeline
                  </div>
                  <div className="text-sm font-semibold text-[#1E3A2F] mt-1">
                    {project.possessionDate}
                  </div>
                </div>
                <div className="p-4 bg-[#F3F2EE]/70 border border-stone-200 sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-[#615E59]">
                    Construction Status
                  </div>
                  <div className="text-sm font-semibold text-[#141413] mt-1">
                    {project.constructionStatus}
                  </div>
                </div>
              </div>
            </section>

            {/* PROJECT HIGHLIGHTS */}
            {project.highlights && project.highlights.length > 0 && (
              <section className="space-y-5 border-b border-stone-200 pb-10">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                    Distinguishing Attributes
                  </div>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                    Project Highlights
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {project.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-stone-200 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1E3A2F] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-[#141413] leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CONFIGURATIONS & PRICING MATRIX */}
            <section className="space-y-5 border-b border-stone-200 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                    Unit Typologies &amp; INR Schedule
                  </div>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                    Configurations &amp; Floor Matrix
                  </h2>
                </div>
                <span className="text-xs font-mono-tabular text-[#615E59]">
                  All Valuations in Indian Rupees (₹ Lakh / ₹ Cr)
                </span>
              </div>

              {project.configurations && project.configurations.length > 0 ? (
                <div className="border border-stone-200 bg-white overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F3F2EE] border-b border-stone-200 text-[11px] uppercase tracking-wider text-[#615E59]">
                        <th className="py-3.5 px-4">Configuration</th>
                        <th className="py-3.5 px-4">Carpet Area</th>
                        <th className="py-3.5 px-4">Built-Up Area</th>
                        <th className="py-3.5 px-4">Price (INR)</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
                      {project.configurations.map((cfg) => (
                        <tr key={cfg.id} className="hover:bg-[#F3F2EE]/40">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-[#141413]">{cfg.name}</div>
                            <div className="text-xs text-[#615E59]">{cfg.propertyType}</div>
                          </td>
                          <td className="py-4 px-4 font-mono-tabular text-[#57534E]">
                            {formatNumber(cfg.carpetAreaSqFt)} sq.ft.
                          </td>
                          <td className="py-4 px-4 font-mono-tabular text-[#141413] font-medium">
                            {formatNumber(cfg.builtUpAreaSqFt)} sq.ft.
                          </td>
                          <td className="py-4 px-4 font-mono-tabular font-semibold text-[#1E3A2F]">
                            {cfg.priceOnRequest ? 'Price on Request' : formatCurrency(cfg.price)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedConfigName(cfg.name);
                                scrollToInquiry('Request Price');
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                            >
                              Request Cost Sheet
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#F3F2EE]/60 border border-stone-200 text-xs text-[#57534E]">
                  Configurations: {project.configurationSummary} ({project.areaRangeSqFt}) —{' '}
                  {formattedPriceDisplay}
                </div>
              )}
            </section>

            {/* FLOOR PLANS & MASTER PLAN */}
            {(allFloorPlans.length > 0 || project.masterPlanImage) && (
              <section className="space-y-6 border-b border-stone-200 pb-10">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                    Spatial Architecture
                  </div>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                    Floor Plans &amp; Master Layout
                  </h2>
                </div>

                {allFloorPlans.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {allFloorPlans.map((fp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedFloorPlanIdx(idx)}
                          className={`px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                            selectedFloorPlanIdx === idx
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-white text-[#57534E] border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {fp.caption || `Floor Plan ${idx + 1}`}
                        </button>
                      ))}
                    </div>

                    <div className="border border-stone-200 bg-[#F3F2EE] overflow-hidden">
                      <div className="aspect-[16/10] w-full overflow-hidden bg-stone-900">
                        <ArchitecturalImage
                          src={allFloorPlans[selectedFloorPlanIdx]?.url || project.coverImage}
                          alt={
                            allFloorPlans[selectedFloorPlanIdx]?.caption ||
                            `${project.name} Floor Plan`
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex items-center justify-between text-xs bg-white border-t border-stone-200">
                        <span className="font-medium text-[#141413]">
                          {allFloorPlans[selectedFloorPlanIdx]?.caption}
                        </span>
                        <button
                          type="button"
                          onClick={() => scrollToInquiry('Download Brochure')}
                          className="text-[#1E3A2F] font-semibold hover:underline cursor-pointer"
                        >
                          Download Dimensioned CAD / PDF Plan →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {project.masterPlanImage && (
                  <div className="pt-4 space-y-3">
                    <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                      Site Master Plan ({project.projectArea})
                    </h3>
                    <div className="border border-stone-200 bg-white overflow-hidden">
                      <div className="aspect-[16/9] w-full overflow-hidden">
                        <ArchitecturalImage
                          src={project.masterPlanImage}
                          alt={`${project.name} Master Plan`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3.5 text-xs text-[#57534E] bg-[#F3F2EE]/60 border-t border-stone-200">
                        Master Site Plan illustrating tower orientation, botanical greens, internal pedestrian boulevards, and clubhouse zoning.
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* PROJECT AMENITIES */}
            <section className="space-y-5 border-b border-stone-200 pb-10">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                  Curated Lifestyle Infrastructure
                </div>
                <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                  Project Amenities &amp; Resident Privileges
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {project.amenities.map((amenity, idx) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-stone-200 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-[#F3F2EE] border border-stone-200 flex items-center justify-center shrink-0 text-[#1E3A2F]">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-[#141413]">
                        {amenity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ARCHITECTURAL GALLERY */}
            <section className="space-y-5 border-b border-stone-200 pb-10">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                  Visual Documentation
                </div>
                <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                  Project Gallery
                </h2>
              </div>

              <div className="space-y-3">
                <div className="aspect-[16/10] w-full bg-[#141413] border border-stone-200 overflow-hidden">
                  <ArchitecturalImage
                    src={galleryList[selectedGalleryIdx]?.url || project.coverImage}
                    alt={galleryList[selectedGalleryIdx]?.caption || project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {galleryList[selectedGalleryIdx]?.caption && (
                  <div className="text-xs text-[#57534E] italic">
                    Plate {selectedGalleryIdx + 1} of {galleryList.length}:{' '}
                    {galleryList[selectedGalleryIdx].caption}
                  </div>
                )}

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                  {galleryList.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedGalleryIdx(idx)}
                      className={`aspect-[16/10] overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedGalleryIdx === idx
                          ? 'border-[#1E3A2F] opacity-100'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                    >
                      <ArchitecturalImage
                        src={item.url}
                        alt={item.caption || `${project.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* PROJECT VIDEO */}
            {project.projectVideoUrl && (
              <section className="space-y-4 border-b border-stone-200 pb-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                      Motion Presentation
                    </div>
                    <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                      Architectural Walkthrough Film
                    </h2>
                  </div>
                  <Video className="w-5 h-5 text-[#1E3A2F]" />
                </div>

                <div className="aspect-[16/9] w-full bg-[#141413] border border-stone-300 overflow-hidden">
                  <video
                    src={project.projectVideoUrl}
                    poster={project.coverImage}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                </div>
              </section>
            )}

            {/* LOCATION & CONNECTIVITY */}
            <section className="space-y-5 border-b border-stone-200 pb-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1E3A2F] font-medium">
                    Geographical Context
                  </div>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#141413] mt-1">
                    Location &amp; Micro-Market Connectivity
                  </h2>
                </div>
                {project.googleMapsLink && (
                  <a
                    href={project.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2F] hover:underline"
                  >
                    <span>Open in Google Maps</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="p-5 bg-[#F3F2EE] border border-stone-200 space-y-2">
                <div className="text-xs uppercase tracking-wider text-[#615E59]">
                  Site Address
                </div>
                <div className="text-sm font-semibold text-[#141413]">
                  {project.fullAddress}
                </div>
                {project.coordinates && (
                  <div className="text-xs font-mono-tabular text-[#615E59]">
                    GPS Coordinates: {project.coordinates}
                  </div>
                )}
              </div>

              {project.locationMapImage && (
                <div className="aspect-[16/9] w-full border border-stone-200 overflow-hidden bg-stone-100">
                  <ArchitecturalImage
                    src={project.locationMapImage}
                    alt={`${project.name} Location Map`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </section>

            {/* RERA STATUTORY DISCLOSURE & BROCHURE DOWNLOAD */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#F3F2EE] border border-stone-200 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>RERA Statutory Registration</span>
                </div>
                <div className="font-mono-tabular text-base font-semibold text-[#141413]">
                  {project.reraNumber || 'Registered with State RERA Authority'}
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Developed and marketed by {project.developerBrand} in accordance with Real Estate (Regulation and Development) Act guidelines. Approved building plans and title certificates are available for inspection at the Trinetra Realty Advisory Desk.
                </p>
              </div>

              <div className="p-6 bg-[#141413] text-[#FBFBF9] border border-stone-800 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#D4AF6A] uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Official Investor Dossier</span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-semibold text-white">
                    Download Project Brochure &amp; Floor Plans
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Receive the complete architectural e-brochure, floor plate dimensions, specification schedule, and INR payment plan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => scrollToInquiry('Download Brochure')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#D4AF6A] text-[#141413] hover:bg-[#e3be78] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Request Brochure PDF</span>
                  </button>
                  {project.brochurePdfUrl && (
                    <a
                      href={project.brochurePdfUrl}
                      download={`${project.slug}-brochure.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border border-white/25 text-white hover:bg-white/10 transition-colors"
                    >
                      <span>Direct Lookbook</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT 4 COLUMNS: STICKY PROJECT LEAD / INQUIRY DESK */}
          <aside
            ref={inquirySectionRef}
            className="lg:col-span-4 lg:sticky lg:top-24 bg-[#F3F2EE] border border-stone-300 p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <div className="border-b border-stone-200 pb-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#1E3A2F] font-semibold">
                Trinetra Realty · Project Desk
              </div>
              <h3 className="font-serif-display text-2xl font-semibold text-[#141413] mt-0.5">
                {project.name}
              </h3>
              <p className="text-xs text-[#57534E] mt-1">
                Direct registration with our project team. Inquiries are logged against{' '}
                <span className="font-mono-tabular font-medium text-[#141413]">
                  {project.code}
                </span>
                .
              </p>
            </div>

            {/* 5 Inquiry Action Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 bg-white p-1.5 border border-stone-200">
              {(
                [
                  'Enquire Now',
                  'Schedule Site Visit',
                  'Request Price',
                  'Download Brochure',
                  'WhatsApp',
                ] as InquiryTabMode[]
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setInquiryMode(mode);
                    setLeadErrorMsg('');
                  }}
                  className={`py-1.5 px-2 text-[11px] font-medium text-center transition-colors cursor-pointer ${
                    mode === 'WhatsApp' ? 'col-span-2' : ''
                  } ${
                    inquiryMode === mode
                      ? 'bg-[#141413] text-white'
                      : 'text-[#57534E] hover:text-[#141413] hover:bg-[#F3F2EE]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g., Vikramaditya Singhania"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Phone (India / Intl) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="+91 98100 00000"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="principal@domain.in"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Preferred Configuration
                </label>
                <select
                  value={selectedConfigName}
                  onChange={(e) => setSelectedConfigName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                >
                  {project.configurations && project.configurations.length > 0 ? (
                    project.configurations.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({formatNumber(c.builtUpAreaSqFt)} sq.ft. ·{' '}
                        {c.priceOnRequest ? 'Price on Request' : formatCurrency(c.price)})
                      </option>
                    ))
                  ) : (
                    <option value={project.configurationSummary}>
                      {project.configurationSummary}
                    </option>
                  )}
                </select>
              </div>

              {inquiryMode === 'Schedule Site Visit' && (
                <div className="space-y-3 pt-1 border-t border-stone-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1">
                        Time Slot
                      </label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-stone-300 text-[#141413]"
                      >
                        <option value="10:30 AM – 12:30 PM">10:30 AM – 12:30 PM</option>
                        <option value="02:00 PM – 04:00 PM">02:00 PM – 04:00 PM</option>
                        <option value="04:30 PM – 06:30 PM">04:30 PM – 06:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1">
                      Presentation Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        ['In-Person Private Tour', 'Live Video Walkthrough'] as const
                      ).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setVisitMode(fmt)}
                          className={`py-1.5 px-2 text-[11px] font-medium border cursor-pointer ${
                            visitMode === fmt
                              ? 'bg-[#1E3A2F] text-white border-[#1E3A2F]'
                              : 'bg-white text-[#57534E] border-stone-300'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Specific Requirements / Notes
                </label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={`Questions regarding ${project.name}, floor preference, or payment schedule...`}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
                />
              </div>

              {leadErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
                  {leadErrorMsg}
                </div>
              )}

              {leadSuccessMsg && (
                <div className="p-3 bg-[#1E3A2F]/10 border border-[#1E3A2F]/30 text-xs text-[#1E3A2F] space-y-2">
                  <div className="font-medium">{leadSuccessMsg}</div>
                  {project.brochurePdfUrl && (
                    <a
                      href={project.brochurePdfUrl}
                      download={`${project.slug}-brochure.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A2F] text-white text-xs font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {project.name} Brochure Now</span>
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingLead}
                className="w-full py-3 px-4 bg-[#141413] hover:bg-[#1E3A2F] text-white text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingLead ? 'Registering Mandate...' : `Submit — ${inquiryMode}`}
              </button>
            </form>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-[#615E59]">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#1E3A2F]" />
                <span>Direct Developer Desk</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono-tabular text-[#141413]">
                <Phone className="w-3 h-3 text-[#1E3A2F]" />
                <span>+91 (120) 480-0190</span>
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
