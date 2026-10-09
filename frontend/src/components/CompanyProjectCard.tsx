import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { CompanyProject } from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import { formatCurrency } from '../utils/formatters';

interface CompanyProjectCardProps {
  project: CompanyProject;
  onSelectProject: (project: CompanyProject) => void;
  onEnquireProject?: (
    project: CompanyProject,
    mode: 'Enquire Now' | 'Schedule Site Visit'
  ) => void;
  index?: number;
}

export const CompanyProjectCard: React.FC<CompanyProjectCardProps> = ({
  project,
  onSelectProject,
  onEnquireProject,
  index = 0,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRevealSettled, setIsRevealSettled] = useState<boolean>(false);

  const staggerDelayMs = (index % 3) * 90;

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      setIsRevealSettled(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      setIsRevealSettled(true);
      return;
    }

    let settleTimer: number | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            settleTimer = window.setTimeout(() => {
              setIsRevealSettled(true);
            }, 720 + staggerDelayMs);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -32px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (settleTimer !== undefined) {
        window.clearTimeout(settleTimer);
      }
    };
  }, [staggerDelayMs]);

  const formattedStartingPrice = project.priceOnRequest
    ? 'Price on Request'
    : `${formatCurrency(project.startingPrice)} Onwards`;

  return (
    <article
      ref={cardRef}
      style={
        !isRevealSettled && isVisible
          ? { transitionDelay: `${staggerDelayMs}ms` }
          : undefined
      }
      className={`group bg-[#FBFBF9] border border-stone-200/90 flex flex-col justify-between tr-property-card ${
        isVisible ? 'tr-property-card--visible' : 'tr-property-card--hidden'
      } ${isRevealSettled ? 'tr-property-card--ready' : ''}`}
    >
      <div>
        {/* Architectural Cover Image (16:10 aspect ratio) */}
        <div
          onClick={() => onSelectProject(project)}
          className="relative aspect-[16/10] w-full bg-[#F3F2EE] overflow-hidden cursor-pointer"
        >
          <ArchitecturalImage
            src={project.coverImage}
            alt={project.name}
            fallbackLabel={project.name}
            className="w-full h-full object-cover tr-property-card__image"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 opacity-65 tr-property-card__scrim pointer-events-none"
          />

          {/* Top Status Marker */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
            <span className="px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] uppercase bg-[#141413]/85 text-[#FBFBF9] border border-white/15">
              {project.projectStatus}
            </span>
            {project.reraNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-tabular bg-black/65 text-stone-200 border border-white/10">
                <ShieldCheck className="w-3 h-3 text-[#D4AF6A]" />
                <span>RERA Verified</span>
              </span>
            )}
          </div>

          {/* Bottom Location & Code */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/95 pointer-events-none">
            <span className="inline-flex items-center gap-1 font-medium truncate">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF6A] shrink-0" />
              <span className="truncate">
                {project.locality} · {project.city}
              </span>
            </span>
            <span className="font-mono-tabular text-white/80 shrink-0 ml-2">
              {project.code}
            </span>
          </div>
        </div>

        {/* Editorial Content Block */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#615E59] mb-2">
            <span>{project.projectType}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[140px] sm:max-w-none">{project.developerBrand}</span>
          </div>

          <h3
            onClick={() => onSelectProject(project)}
            className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413] group-hover:text-[#1E3A2F] transition-colors duration-300 ease-out cursor-pointer line-clamp-1"
          >
            {project.name}
          </h3>

          <p className="text-xs sm:text-sm text-[#57534E] mt-1.5 line-clamp-2 leading-relaxed">
            {project.shortDescription}
          </p>

          {/* Price & Configuration Summary */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-stone-200/70 space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#615E59]">
                  Starting Valuation
                </div>
                <div className="font-mono-tabular text-base sm:text-lg font-semibold text-[#141413] mt-0.5">
                  {formattedStartingPrice}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#615E59]">
                  Dimensions
                </div>
                <div className="font-mono-tabular text-xs font-medium text-[#141413] mt-0.5">
                  {project.areaRangeSqFt}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] sm:text-xs text-[#57534E]">
              <span className="font-medium text-[#141413] truncate max-w-[160px] sm:max-w-none">
                {project.configurationSummary}
              </span>
              <span className="inline-flex items-center gap-1 text-[#615E59] shrink-0 ml-2">
                <Calendar className="w-3 h-3" />
                <span>{project.possessionDate.split('(')[0].trim()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onSelectProject(project)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141413] hover:text-[#1E3A2F] py-1.5 transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer"
        >
          <span>Explore Project</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-colors duration-250 ease-out" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() =>
              onEnquireProject
                ? onEnquireProject(project, 'Schedule Site Visit')
                : onSelectProject(project)
            }
            className="px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#141413] hover:bg-[#F3F2EE]/70 border border-stone-200 hover:border-stone-400 transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer"
          >
            Site Visit
          </button>
          <button
            type="button"
            onClick={() =>
              onEnquireProject
                ? onEnquireProject(project, 'Enquire Now')
                : onSelectProject(project)
            }
            className="px-3 py-1.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] border border-[#141413] hover:border-[#1E3A2F] transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer"
          >
            Enquire
          </button>
        </div>
      </div>
    </article>
  );
};
