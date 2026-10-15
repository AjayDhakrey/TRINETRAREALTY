import React, { useState } from 'react';
import { Property, LeadType } from '../types/realestate';
import { PropertyCard } from '../components/PropertyCard';

export interface BuyRentViewProps {
  properties: Property[];
  compareIds: string[];
  onSelectProperty: (property: Property) => void;
  onToggleCompare: (id: string) => void;
  onOpenLeadModal: (type: LeadType, propertyId?: string) => void;
}

export const BuyView: React.FC<BuyRentViewProps> = ({
  properties,
  compareIds,
  onSelectProperty,
  onToggleCompare,
  onOpenLeadModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const buyProperties = properties.filter(
    (p) =>
      p.transactionType === 'Buy' &&
      (selectedCategory === 'All' || p.category === selectedCategory)
  );

  const categories = ['All', 'Penthouse', 'Villa', 'Townhouse', 'Waterfront', 'Estate'];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-10 sm:space-y-14">
      <div className="border-b border-stone-200 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Private Sales &amp; Freehold Acquisitions · {buyProperties.length} Curated Mandates
          </div>
          <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413] text-balance">
            Residences for Private Acquisition
          </h1>
          <p className="text-base text-[#57534E] leading-relaxed">
            Each freehold residence and cooperative apartment in our acquisition portfolio undergoes independent structural, environmental, and title provenance verification prior to representation.
          </p>
        </div>

        {/* Interactive Category Filter Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F2EE] border border-stone-200">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#141413] text-white'
                  : 'text-[#57534E] hover:text-[#141413]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {buyProperties.map((prop, idx) => (
          <PropertyCard
            key={prop.id}
            index={idx}
            property={prop}
            onSelect={onSelectProperty}
            isCompared={compareIds.includes(prop.id)}
            onToggleCompare={onToggleCompare}
            onOpenLeadModal={onOpenLeadModal}
          />
        ))}
      </div>

      {/* Editorial Acquisition Protocol */}
      <section className="bg-[#F3F2EE] border border-stone-200 p-8 sm:p-10">
        <div className="max-w-xl mb-8">
          <div className="text-xs text-[#615E59] mb-1">Acquisition Governance</div>
          <h2 className="font-serif-display text-3xl font-semibold text-[#141413]">
            Three-Stage Private Acquisition Protocol
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-stone-300/80 pt-8">
          <div className="space-y-2">
            <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
              01. Portfolio Curation &amp; Off-Market Access
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Principals receive access to both published mandates and pocket whisper listings held quietly by family offices across New York and California.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
              02. Architectural &amp; Engineering Audit
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Our AIA-licensed technical team audits building envelope integrity, mechanical acoustics, and municipal landmark preservation covenants.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
              03. Trust Structuring &amp; Escrow Closing
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Seamless coordination with private wealth counsel, 1031 intermediaries, and jumbo private-bank lenders through title transfer.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

