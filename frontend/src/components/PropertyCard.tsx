import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Scale } from 'lucide-react';
import { Property, LeadType } from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import { formatPropertyPrice, formatNumber } from '../utils/formatters';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  isCompared: boolean;
  onToggleCompare: (propertyId: string) => void;
  onOpenLeadModal: (type: LeadType, propertyId: string) => void;
  index?: number;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  isCompared,
  onToggleCompare,
  onOpenLeadModal,
  index = 0,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRevealSettled, setIsRevealSettled] = useState<boolean>(false);

  // Subtle left-to-right column stagger (0ms, 90ms, 180ms)
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
        {/* Image Frame (4:3 aspect ratio, neutral stone backdrop, overflow: hidden) */}
        <div
          onClick={() => onSelect(property)}
          className="relative aspect-[4/3] w-full bg-[#F3F2EE] overflow-hidden cursor-pointer"
        >
          <ArchitecturalImage
            src={property.images[0]}
            alt={property.title}
            fallbackLabel={property.title}
            className="w-full h-full object-cover tr-property-card__image"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/5 opacity-60 tr-property-card__scrim pointer-events-none"
          />

          {/* Clean single status/transaction text at bottom-left over measured scrim */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/95 pointer-events-none">
            <span className="font-medium tracking-wide">
              {property.transactionType === 'Rent' ? 'For Lease' : 'For Acquisition'} · {property.status}
            </span>
            <span className="font-mono-tabular text-white/85">{property.code}</span>
          </div>
        </div>

        {/* Content Block — Zero-Pill Metadata Discipline */}
        <div className="p-4 sm:p-6">
          {/* Quiet unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#615E59] mb-2">
            <span>{property.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[120px] sm:max-w-none">{property.locality}</span>
            <span aria-hidden="true">·</span>
            <span>{property.architecturalStyle}</span>
          </div>

          {/* Primary Title */}
          <h3
            onClick={() => onSelect(property)}
            className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413] group-hover:text-[#1E3A2F] transition-colors duration-300 ease-out cursor-pointer line-clamp-1"
          >
            {property.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#57534E] mt-1 line-clamp-2 leading-relaxed">
            {property.subtitle}
          </p>

          {/* Price & Specs in Tabular Numerals (Stable on Hover) */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-stone-200/70 flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-mono-tabular text-base sm:text-lg font-medium text-[#141413]">
              {formatPropertyPrice(property.price, property.transactionType)}
            </div>
            <div className="text-[11px] sm:text-xs text-[#615E59] font-mono-tabular">
              {property.bedrooms} BD · {property.bathrooms} BA · {formatNumber(property.areaSqFt)} sq.ft.
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar — Functional Single-Line Controls with 250ms Subtle Hover Transitions */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onSelect(property)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141413] hover:text-[#1E3A2F] py-1.5 transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer"
        >
          <span>Examine Dossier</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-colors duration-250 ease-out" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenLeadModal('Schedule Visit', property.id)}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#141413] hover:bg-[#F3F2EE]/70 border border-stone-200 hover:border-stone-400 transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer"
          >
            Schedule Visit
          </button>

          <button
            type="button"
            onClick={() => onToggleCompare(property.id)}
            title="Compare Property"
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border transition-colors duration-250 ease-out whitespace-nowrap cursor-pointer ${
              isCompared
                ? 'bg-[#1E3A2F] text-white border-[#1E3A2F] hover:bg-[#162B22]'
                : 'text-[#57534E] border-stone-200 hover:border-stone-400 hover:text-[#141413] hover:bg-[#F3F2EE]/70'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Comparing</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5" />
                <span>Compare</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
