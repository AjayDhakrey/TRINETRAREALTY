import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  FileText,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  HomepageContent,
  CompanyProject,
  Property,
  DEFAULT_HOMEPAGE_CONTENT,
} from '../types/realestate';
import { updateHomepageContent } from '../services/homepageApi';
import { ArchitecturalImage } from './ArchitecturalImage';
import { realtimeClient } from '../services/realtime';

interface AdminHomepageManagerProps {
  homepageContent: HomepageContent;
  projects: CompanyProject[];
  properties: Property[];
  onHomepageUpdated: (content: HomepageContent) => void;
  onPreviewProject?: (project: CompanyProject) => void;
  onSelectProperty?: (propertyId: string) => void;
}

export const AdminHomepageManager: React.FC<AdminHomepageManagerProps> = ({
  homepageContent,
  projects,
  properties,
  onHomepageUpdated,
  onPreviewProject,
  onSelectProperty,
}) => {
  const [formData, setFormData] = useState<HomepageContent>({
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...(homepageContent || {}),
  });

  React.useEffect(() => {
    if (homepageContent && !saving) {
      setFormData({
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...homepageContent,
      });
    }
  }, [homepageContent]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [activeSubSection, setActiveSubSection] = useState<'text' | 'projects' | 'metrics'>('text');

  const handleTextChange = (field: keyof HomepageContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateHomepageContent(formData);
      onHomepageUpdated(updated);
      realtimeClient.broadcastLocally('homepage:updated', updated);
      setFeedback({
        type: 'success',
        message: 'Homepage content successfully published & synchronized live across all clients!',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update homepage content',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all homepage text & metrics to system default copy?')) {
      setFormData(DEFAULT_HOMEPAGE_CONTENT);
    }
  };

  const featuredProjects = projects.filter((p) => p.featured);
  const featuredProperties = properties.filter((p) => p.featured);

  return (
    <div className="space-y-8">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#1E3A2F] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage Experience & Real-Time Content Hub</span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413] mt-0.5">
            Homepage Content &amp; Showcase Manager
          </h2>
          <p className="text-xs text-[#57534E] max-w-2xl mt-1">
            Edit live hero copy, section headlines, quantitative proof metrics, and curate which official projects &amp; residential mandates are featured directly on the public homepage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-300 text-[#57534E] hover:text-[#141413] hover:border-[#141413] transition-colors cursor-pointer w-full sm:w-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Publishing Live...' : 'Publish to Live Homepage'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-[#EBF3EE] border-[#1E3A2F]/30 text-[#1E3A2F]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sub-navigation pills */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSubSection('text')}
          className={`px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubSection === 'text'
              ? 'bg-[#141413] text-white font-semibold'
              : 'bg-[#F3F2EE] text-[#57534E] hover:text-[#141413]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Hero &amp; Section Text</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('projects')}
          className={`px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubSection === 'projects'
              ? 'bg-[#141413] text-white font-semibold'
              : 'bg-[#F3F2EE] text-[#57534E] hover:text-[#141413]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Homepage Projects ({featuredProjects.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('metrics')}
          className={`px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubSection === 'metrics'
              ? 'bg-[#141413] text-white font-semibold'
              : 'bg-[#F3F2EE] text-[#57534E] hover:text-[#141413]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Proof &amp; Impact Metrics</span>
        </button>
      </div>

      {/* =====================================================================
       * SUB-SECTION 1: HERO & SECTION VISIBLE TEXT CONTENT
       * =================================================================== */}
      {activeSubSection === 'text' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-[#FBFBF9] border border-stone-300 p-5 sm:p-7 space-y-6">
            <h3 className="font-serif-display text-lg font-semibold text-[#141413] border-b border-stone-200 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1E3A2F]" />
              <span>Hero Cinematic Proposition &amp; Primary Messaging</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Hero Main Headline (H1) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.heroTitle}
                  onChange={(e) => handleTextChange('heroTitle', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
                <p className="text-[11px] text-[#615E59] mt-0.5">
                  The primary bold headline rendered over the 16:9 cinematic video hero.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Hero Subtitle / Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle}
                  onChange={(e) => handleTextChange('heroSubtitle', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#FBFBF9] border border-stone-300 p-5 sm:p-7 space-y-6">
            <h3 className="font-serif-display text-lg font-semibold text-[#141413] border-b border-stone-200 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1E3A2F]" />
              <span>Section Titles &amp; Explanatory Subheadings</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Featured Residences Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.featuredSectionTitle}
                    onChange={(e) => handleTextChange('featuredSectionTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Featured Residences Eyebrow
                  </label>
                  <input
                    type="text"
                    value={formData.featuredSectionEyebrow}
                    onChange={(e) => handleTextChange('featuredSectionEyebrow', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Signature Projects Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.ourProjectsSectionTitle}
                    onChange={(e) => handleTextChange('ourProjectsSectionTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Signature Projects Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={formData.ourProjectsSectionSubtitle}
                    onChange={(e) => handleTextChange('ourProjectsSectionSubtitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FBFBF9] border border-stone-300 p-5 sm:p-7 space-y-6">
            <h3 className="font-serif-display text-lg font-semibold text-[#141413] border-b border-stone-200 pb-2">
              Advisory Proposition &amp; Global Call to Action (CTA)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Advisory Heading
                  </label>
                  <input
                    type="text"
                    value={formData.advisoryTitle}
                    onChange={(e) => handleTextChange('advisoryTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Advisory Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.advisorySubtitle}
                    onChange={(e) => handleTextChange('advisorySubtitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Global CTA Heading
                  </label>
                  <input
                    type="text"
                    value={formData.ctaTitle}
                    onChange={(e) => handleTextChange('ctaTitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Global CTA Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={formData.ctaSubtitle}
                    onChange={(e) => handleTextChange('ctaSubtitle', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing Changes...' : 'Save & Publish All Text Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
       * SUB-SECTION 2: FEATURED HOMEPAGE PROJECTS & RESIDENCES
       * =================================================================== */}
      {activeSubSection === 'projects' && (
        <div className="space-y-8">
          {/* Projects Showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-xl font-semibold text-[#141413]">
                  property Projects on Homepage ({featuredProjects.length} Featured)
                </h3>
                <p className="text-xs text-[#57534E]">
                  These official developments appear under &ldquo;Our Signature Projects&rdquo; on the homepage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#FBFBF9] border border-stone-300 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-[16/9] w-full bg-stone-100 overflow-hidden relative">
                      <ArchitecturalImage
                        src={proj.coverImage || proj.galleryImages?.[0]?.url || ''}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#1E3A2F] text-white text-[10px] font-semibold tracking-wide uppercase">
                        Featured on Home
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#615E59] uppercase tracking-wider">
                        {proj.projectType} · {proj.city}
                      </div>
                      <h4 className="font-serif-display text-base font-semibold text-[#141413] mt-0.5">
                        {proj.name}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    {onPreviewProject && (
                      <button
                        type="button"
                        onClick={() => onPreviewProject(proj)}
                        className="inline-flex items-center gap-1 text-xs text-[#1E3A2F] font-medium hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Project</span>
                      </button>
                    )}
                    <span className="text-[11px] font-mono-tabular text-[#615E59]">
                      Status: {proj.projectStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Properties Showcase */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div>
              <h3 className="font-serif-display text-xl font-semibold text-[#141413]">
                Residential Mandates on Homepage ({featuredProperties.length} Featured)
              </h3>
              <p className="text-xs text-[#57534E]">
                These residences appear under &ldquo;Featured Residences &amp; Estates&rdquo; on the homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-[#FBFBF9] border border-stone-300 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-[16/9] w-full bg-stone-100 overflow-hidden relative">
                      <ArchitecturalImage
                        src={prop.images[0] || ''}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#141413] text-white text-[10px] font-semibold tracking-wide uppercase">
                        {prop.code}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#615E59]">
                        {prop.locality} · {prop.category}
                      </div>
                      <h4 className="font-serif-display text-base font-semibold text-[#141413] mt-0.5 line-clamp-1">
                        {prop.title}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    {onSelectProperty && (
                      <button
                        type="button"
                        onClick={() => onSelectProperty(prop.id)}
                        className="inline-flex items-center gap-1 text-xs text-[#1E3A2F] font-medium hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    )}
                    <span className="text-[11px] font-mono-tabular font-semibold text-[#141413]">
                      ₹{(prop.price / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * SUB-SECTION 3: QUANTIFIED PROOF & IMPACT METRICS
       * =================================================================== */}
      {activeSubSection === 'metrics' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-[#FBFBF9] border border-stone-300 p-5 sm:p-7 space-y-6">
            <div>
              <h3 className="font-serif-display text-lg font-semibold text-[#141413] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1E3A2F]" />
                <span>Quantified Proof of Impact (3 Core Performance Badges)</span>
              </h3>
              <p className="text-xs text-[#57534E] mt-1">
                These three metrics are prominently featured alongside our advisory claims on the public homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Metric 1 */}
              <div className="p-4 bg-white border border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                  Badge 01
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Value / Stat *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.metric1Value}
                    onChange={(e) => handleTextChange('metric1Value', e.target.value)}
                    placeholder="e.g. ₹1,480 Cr"
                    className="w-full px-3 py-2 text-sm font-mono-tabular font-semibold bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Badge Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.metric1Label}
                    onChange={(e) => handleTextChange('metric1Label', e.target.value)}
                    placeholder="Closed Transaction Volume Across 12 Months..."
                    className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-4 bg-white border border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                  Badge 02
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Value / Stat *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.metric2Value}
                    onChange={(e) => handleTextChange('metric2Value', e.target.value)}
                    placeholder="e.g. 98.4%"
                    className="w-full px-3 py-2 text-sm font-mono-tabular font-semibold text-[#1E3A2F] bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Badge Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.metric2Label}
                    onChange={(e) => handleTextChange('metric2Label', e.target.value)}
                    placeholder="List-to-Close Realization on Verified Mandates..."
                    className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-4 bg-white border border-stone-200 space-y-3">
                <div className="text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                  Badge 03
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Value / Stat *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.metric3Value}
                    onChange={(e) => handleTextChange('metric3Value', e.target.value)}
                    placeholder="e.g. 24 Days"
                    className="w-full px-3 py-2 text-sm font-mono-tabular font-semibold bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Badge Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.metric3Label}
                    onChange={(e) => handleTextChange('metric3Label', e.target.value)}
                    placeholder="Median Private Placement Velocity..."
                    className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing Changes...' : 'Save & Publish Metrics'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

