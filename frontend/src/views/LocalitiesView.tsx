import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { LocalityProfile, Property, LeadType } from '../types/realestate';
import { ArchitecturalImage } from '../components/ArchitecturalImage';
import { formatNumber } from '../utils/formatters';

export interface LocalitiesViewProps {
  localities: LocalityProfile[];
  properties: Property[];
  onExploreLocality: (localityName: string) => void;
  onOpenLeadModal: (type: LeadType) => void;
}

export const LocalitiesView: React.FC<LocalitiesViewProps> = ({
  localities,
  properties,
  onExploreLocality,
  onOpenLeadModal,
}) => {
  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      <div className="border-b border-stone-200 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Micro-Market Liquidity & Architectural Enclaves
          </div>
          <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413]">
            Premier Localities & District Intelligence
          </h1>
          <p className="text-xs sm:text-base text-[#57534E] leading-relaxed">
            Quantitative per-square-foot benchmarks, historical appreciation trajectories, and architectural zoning profiles across our core residential districts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenLeadModal('Property Valuation')}
          className="px-4 sm:px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors whitespace-nowrap cursor-pointer text-center"
        >
          Benchmark Your Property in These Localities
        </button>
      </div>

      <div className="space-y-8 sm:space-y-10">
        {localities.map((loc, index) => {
          const matchingCount = properties.filter((p) => p.locality === loc.name).length;
          return (
            <article
              key={loc.id}
              className="grid grid-cols-1 lg:grid-cols-12 border border-stone-200 bg-[#FBFBF9] overflow-hidden"
            >
              <div className="lg:col-span-5 aspect-[4/3] lg:aspect-auto bg-[#F3F2EE] relative">
                <ArchitecturalImage
                  src={loc.heroImage}
                  alt={loc.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/75 text-white px-3 py-1 text-xs font-mono-tabular">
                  0{index + 1} · {loc.city}
                </div>
              </div>

              <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-between space-y-5 sm:space-y-6">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="text-xs text-[#615E59]">{loc.architecturalCharacter}</div>
                  <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413]">
                    {loc.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">{loc.description}</p>

                  <div className="pt-2 space-y-1.5">
                    {loc.keyHighlights.map((hl, i) => (
                      <div key={i} className="text-xs text-[#141413] flex items-baseline gap-2">
                        <span className="font-mono-tabular text-[#1E3A2F] font-semibold">
                          0{i + 1}.
                        </span>
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 sm:pt-5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full sm:w-auto">
                    <div>
                      <div className="text-[11px] text-[#615E59]">Avg. Basis</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#141413]">
                        ₹{formatNumber(loc.avgPricePerSqFt)}/sq.ft.
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#615E59]">YoY Growth</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#1E3A2F]">
                        +{loc.yoyAppreciation}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#615E59]">Gross Yield</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#141413]">
                        {loc.rentalYield}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#615E59]">Walk/Transit</div>
                      <div className="font-mono-tabular text-sm font-semibold text-[#141413]">
                        {loc.transitScore}/100
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onExploreLocality(loc.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>Explore {matchingCount} Mandates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

