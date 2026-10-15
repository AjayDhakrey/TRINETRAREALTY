import React, { useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import type { Property, LeadType } from '../types/realestate';
import { ArchitecturalImage } from '../components/ArchitecturalImage';
import {
  formatCurrency,
  formatPropertyPrice,
  formatNumber,
  calculateMonthlyEMI,
} from '../utils/formatters';

export interface ComparisonViewProps {
  properties: Property[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenLeadModal: (type: LeadType, propertyId?: string) => void;
}

interface SpecItem {
  key: string;
  label: string;
  renderValue: (p: Property) => React.ReactNode;
  highlight?: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  properties,
  compareIds,
  onToggleCompare,
  onSelectProperty,
  onOpenLeadModal,
}) => {
  const comparedProperties = properties.filter((p) => compareIds.includes(p.id));
  const availableToAdd = properties.filter((p) => !compareIds.includes(p.id));

  // Mobile pairing state for head-to-head comparison
  const [mobilePair, setMobilePair] = useState<[number, number]>([0, 1]);
  const [mobileViewMode, setMobileViewMode] = useState<'head-to-head' | 'swipe'>('head-to-head');

  const count = comparedProperties.length;
  const indexA = Math.min(mobilePair[0], Math.max(0, count - 1));
  let indexB = Math.min(mobilePair[1], Math.max(0, count - 1));
  if (count >= 2 && indexA === indexB) {
    indexB = indexA === 0 ? 1 : 0;
  }
  const propA = comparedProperties[indexA];
  const propB = comparedProperties[indexB];

  const SPEC_ITEMS: SpecItem[] = [
    {
      key: 'price',
      label: 'Offering Price',
      renderValue: (p) => (
        <span className="font-mono-tabular font-semibold text-[#141413]">
          {formatPropertyPrice(p.price, p.transactionType)}
        </span>
      ),
      highlight: true,
    },
    {
      key: 'pricePerSqFt',
      label: 'Price / Sq.Ft.',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          ₹{formatNumber(p.pricePerSqFt)} / sq.ft.
        </span>
      ),
    },
    {
      key: 'transaction',
      label: 'Transaction & Status',
      renderValue: (p) => (
        <span className="text-[#141413]">
          {p.transactionType === 'Rent' ? 'Luxury Lease' : 'Freehold Acquisition'} · {p.status}
        </span>
      ),
    },
    {
      key: 'area',
      label: 'Interior Area',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          {formatNumber(p.areaSqFt)} sq.ft.
        </span>
      ),
    },
    {
      key: 'bedrooms',
      label: 'Bedrooms & Baths',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          {p.bedrooms} Beds · {p.bathrooms} Baths
        </span>
      ),
    },
    {
      key: 'style',
      label: 'Architectural Style',
      renderValue: (p) => <span className="text-[#141413]">{p.architecturalStyle}</span>,
    },
    {
      key: 'architect',
      label: 'Architect of Record',
      renderValue: (p) => (
        <span className="text-[#57534E]">
          {p.architect} ({p.yearBuilt})
        </span>
      ),
    },
    {
      key: 'condition',
      label: 'Condition / Furnishing',
      renderValue: (p) => <span className="text-[#141413]">{p.furnishedStatus}</span>,
    },
    {
      key: 'parking',
      label: 'Parking Provision',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          {p.parkingSpaces} Private Spaces
        </span>
      ),
    },
    {
      key: 'maintenance',
      label: 'Monthly Maintenance',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          {p.monthlyMaintenance > 0
            ? `${formatCurrency(p.monthlyMaintenance)} / mo`
            : 'Included in Lease'}
        </span>
      ),
    },
    {
      key: 'emi',
      label: 'Est. Monthly EMI',
      renderValue: (p) => {
        if (p.transactionType === 'Rent') {
          return <span className="font-mono-tabular text-[#615E59]">N/A (Monthly Lease)</span>;
        }
        const emi = calculateMonthlyEMI(p.price * 0.7, 6.25, 20).monthlyEMI;
        return (
          <span className="font-mono-tabular font-medium text-[#1E3A2F]">
            {formatCurrency(emi)} / mo
          </span>
        );
      },
      highlight: true,
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 sm:py-12 space-y-5 sm:space-y-10">
      {/* Top Header */}
      <div className="border-b border-stone-200 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <div className="text-[11px] sm:text-xs text-[#615E59]">
            Side-by-Side Architectural &amp; Financial Matrix
          </div>
          <h1 className="font-serif-display text-2xl sm:text-4xl font-semibold text-[#141413] mt-1">
            Property Comparison ({comparedProperties.length} of 3 Selected)
          </h1>
        </div>

        {/* Header Controls: Add & Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {comparedProperties.length < 3 && availableToAdd.length > 0 && (
            <select
              aria-label="Add residence to comparison"
              onChange={(e) => {
                if (e.target.value) {
                  onToggleCompare(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="w-full sm:w-auto px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
            >
              <option value="" disabled>
                + Add Residence to Compare...
              </option>
              {availableToAdd.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title} ({formatPropertyPrice(p.price, p.transactionType)})
                </option>
              ))}
            </select>
          )}

          {comparedProperties.length > 0 && (
            <button
              type="button"
              onClick={() => {
                comparedProperties.forEach((p) => onToggleCompare(p.id));
              }}
              className="text-xs text-[#57534E] hover:text-[#141413] px-2 py-1.5 border border-stone-200 hover:border-stone-400 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* STATE 0: No Properties Selected */}
      {comparedProperties.length === 0 && (
        <div className="bg-[#F3F2EE] border border-stone-200 p-6 sm:p-12 text-center space-y-4">
          <Building2 className="w-10 h-10 text-[#615E59] mx-auto stroke-[1.25]" />
          <h2 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413]">
            No Residences Currently Selected for Comparison
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto">
            Select up to three residences below to evaluate per-square-foot valuation, carrying costs, and architectural specifications side by side.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {properties.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleCompare(p.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {p.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STATE 1: Only 1 Property Selected */}
      {comparedProperties.length === 1 && (
        <div className="space-y-6">
          <div className="bg-[#F3F2EE] border border-stone-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#1E3A2F]">
                1 Residence Selected · Add Another to Compare
              </div>
              <p className="text-xs text-[#57534E]">
                Select at least one additional residence to generate a side-by-side comparative architectural and financial dossier.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {availableToAdd.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleCompare(p.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add {p.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Single Property Summary Card */}
          <div className="bg-[#FBFBF9] border border-stone-200 p-4 sm:p-6 max-w-md mx-auto sm:mx-0 space-y-3">
            <div className="aspect-[16/10] w-full bg-stone-200 overflow-hidden relative">
              <ArchitecturalImage
                src={comparedProperties[0].images[0]}
                alt={comparedProperties[0].title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onToggleCompare(comparedProperties[0].id)}
                title="Remove from Comparison"
                className="absolute top-2 right-2 p-1.5 bg-black/75 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="text-[10px] text-[#615E59] font-mono-tabular">
                {comparedProperties[0].code} · {comparedProperties[0].locality}
              </div>
              <div className="font-serif-display text-lg font-semibold text-[#141413]">
                {comparedProperties[0].title}
              </div>
              <div className="font-mono-tabular font-semibold text-sm text-[#141413] mt-1">
                {formatPropertyPrice(comparedProperties[0].price, comparedProperties[0].transactionType)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: 2 or 3 Properties Selected */}
      {comparedProperties.length >= 2 && (
        <div className="space-y-4">
          {/* ===============================================================
           * MOBILE VIEW (< 768px): Dedicated Head-to-Head & Responsive Matrix
           * ============================================================= */}
          <div className="block md:hidden space-y-4">
            {/* If 3 properties are selected: View Mode / Pair Switcher */}
            {comparedProperties.length === 3 && (
              <div className="bg-[#F3F2EE] border border-stone-200 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#615E59]">
                  <span className="font-medium text-[#141413]">Mobile Comparison Mode:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMobileViewMode('head-to-head')}
                      className={`px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        mobileViewMode === 'head-to-head'
                          ? 'bg-[#141413] text-white'
                          : 'bg-white text-[#57534E] border border-stone-200'
                      }`}
                    >
                      Side-by-Side (2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileViewMode('swipe')}
                      className={`px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        mobileViewMode === 'swipe'
                          ? 'bg-[#141413] text-white'
                          : 'bg-white text-[#57534E] border border-stone-200'
                      }`}
                    >
                      All 3 (Scroll)
                    </button>
                  </div>
                </div>

                {mobileViewMode === 'head-to-head' && (
                  <div className="pt-1 border-t border-stone-200/80 flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-[#615E59]">Compare Pair:</span>
                    <div className="flex items-center gap-1 font-mono-tabular">
                      {[
                        { pair: [0, 1] as [number, number], label: '1 vs 2' },
                        { pair: [0, 2] as [number, number], label: '1 vs 3' },
                        { pair: [1, 2] as [number, number], label: '2 vs 3' },
                      ].map((item, idx) => {
                        const isSelected =
                          (mobilePair[0] === item.pair[0] && mobilePair[1] === item.pair[1]) ||
                          (mobilePair[0] === item.pair[1] && mobilePair[1] === item.pair[0]);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setMobilePair(item.pair)}
                            className={`px-2 py-0.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E3A2F] text-white border-[#1E3A2F] font-semibold'
                                : 'bg-white text-[#57534E] border-stone-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* A. MOBILE HEAD-TO-HEAD 2-COLUMN VIEW (100% viewport width, zero horizontal overflow) */}
            {(comparedProperties.length === 2 || mobileViewMode === 'head-to-head') && propA && propB && (
              <div className="border border-stone-200 bg-[#FBFBF9] shadow-xs divide-y divide-stone-200">
                {/* 2 Property Top Cards Side-by-Side */}
                <div className="grid grid-cols-2 divide-x divide-stone-200 bg-[#F3F2EE]/50">
                  {[propA, propB].map((prop) => (
                    <div key={prop.id} className="p-2.5 sm:p-3 flex flex-col justify-between space-y-2">
                      <div className="space-y-1.5">
                        <div className="aspect-[16/11] w-full bg-stone-200 overflow-hidden relative">
                          <ArchitecturalImage
                            src={prop.images[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => onToggleCompare(prop.id)}
                            title="Remove from comparison"
                            className="absolute top-1 right-1 p-1 bg-black/75 text-white hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#615E59] font-mono-tabular truncate">
                            {prop.code} · {prop.locality}
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectProperty(prop)}
                            className="font-serif-display text-sm font-semibold text-[#141413] hover:text-[#1E3A2F] text-left line-clamp-2 cursor-pointer mt-0.5"
                          >
                            {prop.title}
                          </button>
                          <div className="font-mono-tabular text-xs font-bold text-[#141413] mt-1">
                            {formatPropertyPrice(prop.price, prop.transactionType)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 pt-1 border-t border-stone-200/60">
                        <button
                          type="button"
                          onClick={() => onSelectProperty(prop)}
                          className="w-full py-1 text-[11px] font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer text-center"
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenLeadModal('Schedule Visit', prop.id)}
                          className="w-full py-1 text-[10px] font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer text-center"
                        >
                          Visit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Synchronized Metric Rows for propA and propB */}
                {SPEC_ITEMS.map((item) => (
                  <div key={item.key} className="bg-white">
                    {/* Full-width Specification Category Banner */}
                    <div className="bg-[#F3F2EE] px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-[#615E59] border-t border-b border-stone-200/80">
                      {item.label}
                    </div>
                    {/* 2-Column Values Underneath */}
                    <div className="grid grid-cols-2 divide-x divide-stone-200 p-2.5 text-xs">
                      <div className="pr-1.5 break-words">
                        {item.renderValue(propA)}
                      </div>
                      <div className="pl-2 break-words">
                        {item.renderValue(propB)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* B. MOBILE ALL 3 (SWIPE) VIEW: Horizontal Scroll Track Without Broken Sticky Column */}
            {comparedProperties.length === 3 && mobileViewMode === 'swipe' && (
              <div className="border border-stone-200 bg-[#FBFBF9] shadow-xs">
                <div className="px-3 py-1.5 bg-[#F3F2EE] text-[11px] text-[#615E59] flex items-center justify-between border-b border-stone-200">
                  <span>← Swipe horizontally across 3 residences →</span>
                  <span className="font-mono-tabular font-semibold text-[#1E3A2F]">3/3</span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[460px] divide-y divide-stone-200">
                    {/* Top Property Cards Track */}
                    <div className="grid grid-cols-3 divide-x divide-stone-200 bg-[#F3F2EE]/40">
                      {comparedProperties.map((prop) => (
                        <div key={prop.id} className="p-2.5 flex flex-col justify-between space-y-2">
                          <div className="space-y-1">
                            <div className="aspect-[16/11] w-full bg-stone-200 overflow-hidden relative">
                              <ArchitecturalImage
                                src={prop.images[0]}
                                alt={prop.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => onToggleCompare(prop.id)}
                              title="Remove from comparison"
                              className="absolute top-1 right-1 p-1 bg-black/75 text-white hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-[#615E59] font-mono-tabular truncate">
                            {prop.code} · {prop.locality}
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectProperty(prop)}
                            className="font-serif-display text-xs font-semibold text-[#141413] hover:text-[#1E3A2F] text-left line-clamp-2 cursor-pointer mt-0.5"
                          >
                            {prop.title}
                          </button>
                          <div className="font-mono-tabular text-xs font-bold text-[#141413]">
                            {formatPropertyPrice(prop.price, prop.transactionType)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 pt-1 border-t border-stone-200/60">
                          <button
                            type="button"
                            onClick={() => onSelectProperty(prop)}
                            className="w-full py-1 text-[10px] font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer text-center"
                          >
                            Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenLeadModal('Schedule Visit', prop.id)}
                            className="w-full py-1 text-[10px] font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer text-center"
                          >
                            Visit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Spec Rows for All 3 */}
                  {SPEC_ITEMS.map((item) => (
                    <div key={item.key} className="bg-white">
                      <div className="bg-[#F3F2EE] px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-[#615E59] border-t border-b border-stone-200/80">
                        {item.label}
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-stone-200 p-2.5 text-xs">
                        {comparedProperties.map((p) => (
                          <div key={p.id} className="px-1.5 break-words">
                            {item.renderValue(p)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===============================================================
         * DESKTOP TABLE VIEW (>= 768px): Spacious Side-by-Side Matrix
         * ============================================================= */}
        <div className="hidden md:block overflow-x-auto border border-stone-200 bg-[#FBFBF9] shadow-xs">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-200 bg-[#F3F2EE]/90">
                <th className="p-4 sm:p-5 w-44 sm:w-56 text-xs font-semibold text-[#615E59] align-top sticky left-0 z-20 bg-[#F3F2EE] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                  Specification
                </th>
                {comparedProperties.map((prop) => (
                  <th key={prop.id} className="p-4 sm:p-5 border-l border-stone-200 align-top w-64 sm:w-80 min-w-[220px]">
                    <div className="space-y-3">
                      <div className="aspect-[16/10] w-full bg-stone-200 overflow-hidden relative">
                        <ArchitecturalImage
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onToggleCompare(prop.id)}
                          title="Remove from Comparison"
                          className="absolute top-2 right-2 p-1.5 bg-black/75 text-white hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <div className="text-xs text-[#615E59] font-mono-tabular">
                          {prop.code} · {prop.locality}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectProperty(prop)}
                          className="font-serif-display text-lg sm:text-xl font-semibold text-[#141413] hover:text-[#1E3A2F] text-left cursor-pointer mt-0.5 line-clamp-2"
                        >
                          {prop.title}
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
              {SPEC_ITEMS.map((item) => (
                <tr key={item.key}>
                  <td className="p-3 sm:p-4 text-xs font-medium text-[#615E59] sticky left-0 z-10 bg-[#FBFBF9] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                    {item.label}
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 sm:p-4 border-l border-stone-200">
                      {item.renderValue(p)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 sm:p-4 text-xs font-medium text-[#615E59] sticky left-0 z-10 bg-[#FBFBF9] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                  Actions
                </td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l border-stone-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectProperty(p)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer"
                      >
                        Examine Dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLeadModal('Schedule Visit', p.id)}
                        className="px-3 py-1.5 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer"
                      >
                        Schedule Visit
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
  );
};

