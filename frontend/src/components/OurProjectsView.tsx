import React, { useMemo, useState, useEffect } from 'react';
import { Building2, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { CompanyProject, ProjectDevelopmentStatus } from '../types/realestate';
import { CompanyProjectCard } from './CompanyProjectCard';

interface OurProjectsViewProps {
  projects: CompanyProject[];
  onSelectProject: (project: CompanyProject) => void;
  onEnquireProject?: (
    project: CompanyProject,
    mode: 'Enquire Now' | 'Schedule Site Visit'
  ) => void;
}

const STATUS_OPTIONS: Array<'All' | ProjectDevelopmentStatus> = [
  'All',
  'New Launch',
  'Ready to Move',
  'Under Construction',
  'Upcoming',
  'Completed',
];

export const OurProjectsView: React.FC<OurProjectsViewProps> = ({
  projects,
  onSelectProject,
  onEnquireProject,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'All' | ProjectDevelopmentStatus>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Only show PUBLISHED projects on the public /projects page
  const publishedProjects = useMemo(
    () => projects.filter((p) => p.publicationState === 'PUBLISHED'),
    [projects]
  );

  const cities = useMemo(() => {
    const set = new Set<string>();
    publishedProjects.forEach((p) => {
      if (p.city) set.add(p.city);
    });
    return ['All', ...Array.from(set)];
  }, [publishedProjects]);

  const projectTypes = useMemo(() => {
    const set = new Set<string>();
    publishedProjects.forEach((p) => {
      if (p.projectType) set.add(p.projectType);
    });
    return ['All', ...Array.from(set)];
  }, [publishedProjects]);

  const filteredProjects = useMemo(() => {
    return publishedProjects.filter((p) => {
      if (selectedStatus !== 'All' && p.projectStatus !== selectedStatus) {
        return false;
      }
      if (selectedCity !== 'All' && p.city !== selectedCity) {
        return false;
      }
      if (selectedType !== 'All' && p.projectType !== selectedType) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.configurationSummary.toLowerCase().includes(q) ||
          p.reraNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [publishedProjects, selectedStatus, selectedCity, selectedType, searchQuery]);

  useEffect(() => {
    document.title = 'Our Projects — Trinetra Realty Official Developments & Landmarks';
  }, []);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-6 sm:pb-10 mb-6 sm:mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase text-[#1E3A2F]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Trinetra Realty · Proprietary Developments &amp; Mandates</span>
            </div>
            <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
              Our Signature Projects
            </h1>
            <p className="text-xs sm:text-base text-[#57534E] leading-relaxed">
              Every project conceived, developed, or exclusively represented by Trinetra Realty adheres to rigorous architectural provenance, low-density botanical planning, and full RERA statutory compliance.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 text-xs text-[#615E59] bg-[#F3F2EE] px-4 sm:px-5 py-3 sm:py-3.5 border border-stone-200 shrink-0">
            <div>
              <div className="font-mono-tabular text-base sm:text-lg font-semibold text-[#141413]">
                {publishedProjects.length}
              </div>
              <div className="text-[11px] sm:text-xs">Published Developments</div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-stone-300" />
            <div className="inline-flex items-center gap-1.5 text-[#1E3A2F] font-medium text-[11px] sm:text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>100% RERA Registered</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 pt-6 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Status Pills */}
          <div className="md:col-span-6 flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-[#141413] text-white border-[#141413]'
                    : 'bg-white text-[#57534E] border-stone-200 hover:border-stone-400 hover:text-[#141413]'
                }`}
              >
                {status === 'All' ? 'All Statuses' : status}
              </button>
            ))}
          </div>

          {/* City Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by City"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Cities' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Project Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
            >
              {projectTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Project Types' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-[#615E59] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, locality, RERA..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-300 text-[#141413] focus:border-[#141413] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="border border-stone-200 bg-[#F3F2EE]/50 p-12 text-center space-y-3">
          <SlidersHorizontal className="w-6 h-6 text-[#615E59] mx-auto" />
          <div className="font-serif-display text-2xl font-semibold text-[#141413]">
            No Matching Developments Found
          </div>
          <p className="text-xs text-[#57534E] max-w-md mx-auto">
            Adjust your status, city, or typology filters to view all published Trinetra Realty projects.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('All');
              setSelectedCity('All');
              setSelectedType('All');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
          >
            Reset Project Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, idx) => (
            <CompanyProjectCard
              key={project.id}
              index={idx}
              project={project}
              onSelectProject={onSelectProject}
              onEnquireProject={onEnquireProject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
