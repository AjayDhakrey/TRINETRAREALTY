import React, { useState } from 'react';
import { Property, LeadType } from '../types/realestate';
import { PropertyCard } from '../components/PropertyCard';
import { BuyRentViewProps } from './BuyView';

export const RentView: React.FC<BuyRentViewProps> = ({
  properties,
  compareIds,
  onSelectProperty,
  onToggleCompare,
  onOpenLeadModal,
}) => {
  const [furnishedFilter, setFurnishedFilter] = useState<string>('All');
  const rentProperties = properties.filter(
    (p) =>
      p.transactionType === 'Rent' &&
      (furnishedFilter === 'All' || p.furnishedStatus === furnishedFilter)
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-10 sm:space-y-14">
      <div className="border-b border-stone-200 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Executive &amp; Diplomatic Leasing · Turnkey Architectural Residences
          </div>
          <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413] text-balance">
            Architectural Residences for Lease
          </h1>
          <p className="text-base text-[#57534E] leading-relaxed">
            Curated 12-to-36-month residential leases featuring bespoke furnishings, private estate management, and diplomatic lease clauses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F2EE] border border-stone-200">
          {['All', 'Fully Furnished', 'Bespoke Millwork'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFurnishedFilter(mode)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                furnishedFilter === mode
                  ? 'bg-[#141413] text-white'
                  : 'text-[#57534E] hover:text-[#141413]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rentProperties.map((prop, idx) => (
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

      <section className="bg-[#F3F2EE] border border-stone-200 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="text-xs text-[#615E59]">Bespoke Corporate &amp; Family Office Terms</div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
            Require a Short-Notice Diplomatic or Film-Production Sanctuary?
          </h2>
          <p className="text-sm text-[#57534E]">
            Our leasing desk maintains off-market turnkey villas and penthouses available for immediate occupancy with full staff.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenLeadModal('WhatsApp Contact')}
          className="px-5 py-3 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors whitespace-nowrap cursor-pointer"
        >
          Contact Leasing Concierge via WhatsApp
        </button>
      </section>
    </div>
  );
};

