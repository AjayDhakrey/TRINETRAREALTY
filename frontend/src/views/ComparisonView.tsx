import React, { useState } from 'react';
import { Building2, Plus, Trash2, Check, ArrowRight, ArrowLeftRight, CheckCircle2, Minus } from 'lucide-react';
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
  onClearCompare?: () => void;
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
  onClearCompare,
  onSelectProperty,
  onOpenLeadModal,
}) => {
  // Only compare properties that genuinely exist in the active catalog
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

  // Compute union of all amenities across compared properties
  const allComparedAmenities = Array.from(
    new Set(comparedProperties.flatMap((p) => p.amenities || []))
  );

  const SPEC_ITEMS: SpecItem[] = [
    {
      key: 'price',
      label: 'Offering Price',
      renderValue: (p) => (
        <div>
          <span className="font-mono-tabular font-bold text-[#141413] text-base sm:text-lg">
            {formatPropertyPrice(p.price, p.transactionType)}
          </span>
          <span className="block text-[11px] text-[#615E59]">
            {p.transactionType === 'Rent' ? 'Monthly Lease' : 'Freehold Acquisition'}
          </span>
        </div>
      ),
      highlight: true,
    },
    {
      key: 'pricePerSqFt',
      label: 'Price / Sq.Ft.',
      renderValue: (p) => (
        <span className="font-mono-tabular font-semibold text-[#1E3A2F]">
          ₹{formatNumber(p.pricePerSqFt || Math.round(p.price / (p.areaSqFt || 1)))} / sq.ft.
        </span>
      ),
    },
    {
      key: 'locality',
      label: 'Locality & Enclave',
      renderValue: (p) => (
        <div>
          <span className="font-semibold text-[#141413]">{p.locality}</span>
          <span className="block text-[11px] text-[#615E59] truncate max-w-[200px]" title={p.address}>
            {p.address}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Typology',
      renderValue: (p) => (
        <span className="inline-flex px-2 py-0.5 text-xs font-semibold bg-[#F3F2EE] text-[#141413] border border-stone-200">
          {p.category}
        </span>
      ),
    },
    {
      key: 'area',
      label: 'Interior Area',
      renderValue: (p) => (
        <span className="font-mono-tabular font-medium text-[#141413]">
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
      key: 'parking',
      label: 'Parking Provision',
      renderValue: (p) => (
        <span className="font-mono-tabular text-[#141413]">
          {p.parkingSpaces} Reserved Spaces
        </span>
      ),
    },
    {
      key: 'condition',
      label: 'Condition / Delivery',
      renderValue: (p) => <span className="text-[#141413]">{p.furnishedStatus}</span>,
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
        const emi = calculateMonthlyEMI(p.price * 0.7, 8.5, 20).monthlyEMI;
        return (
          <span className="font-mono-tabular font-semibold text-[#1E3A2F]">
            {formatCurrency(emi)} / mo
          </span>
        );
      },
      highlight: true,
    },
  ];

  const handleClearAll = () => {
    if (onClearCompare) {
      onClearCompare();
    } else {
      comparedProperties.forEach((p) => onToggleCompare(p.id));
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 sm:py-12 space-y-6 sm:space-y-10">
      {/* Top Header */}
      <div className="border-b border-stone-200 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] sm:text-xs text-[#615E59] tracking-wide uppercase font-semibold">
            Side-by-Side Architectural &amp; Financial Matrix
          </div>
          <h1 className="font-serif-display text-2xl sm:text-4xl font-semibold text-[#141413] mt-1">
            Property Comparison ({comparedProperties.length} of 3 Selected)
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1 max-w-xl">
            Evaluate price per square foot, carrying costs, spatial layout, and bespoke specifications side-by-side with live catalog synchronization.
          </p>
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
              className="w-full sm:w-auto px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none cursor-pointer"
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
              onClick={handleClearAll}
              className="text-xs text-[#57534E] hover:text-red-700 hover:border-red-300 px-3 py-2 border border-stone-200 transition-colors cursor-pointer bg-white"
            >
              Clear Comparison
            </button>
          )}
        </div>
      </div>

      {/* STATE 0: No Properties Selected */}
      {comparedProperties.length === 0 && (
        <div className="bg-[#F3F2EE] border border-stone-200 p-8 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1E3A2F]/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#1E3A2F] stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413]">
              No Residences Currently in Comparison
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Select up to three residences from our current portfolio below to inspect valuation benchmarks, carrying costs, and architectural layouts side by side.
            </p>
          </div>

          <div className="pt-2 max-w-4xl mx-auto">
            <div className="text-xs font-semibold text-[#141413] mb-3 text-left">
              Quick Select Available Residences:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {properties.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="bg-[#FBFBF9] border border-stone-300 p-3.5 text-left flex flex-col justify-between space-y-3 hover:border-[#141413] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="aspect-[16/10] w-full bg-stone-200 overflow-hidden">
                      <ArchitecturalImage
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#615E59] font-mono-tabular">
                        {p.code} · {p.locality}
                      </div>
                      <div className="font-serif-display text-sm font-semibold text-[#141413] line-clamp-1">
                        {p.title}
                      </div>
                      <div className="font-mono-tabular text-xs font-bold text-[#1E3A2F] mt-0.5">
                        {formatPropertyPrice(p.price, p.transactionType)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleCompare(p.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Compare</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATE 1: 1, 2, or 3 Properties Selected */}
      {comparedProperties.length >= 1 && (
        <div className="space-y-6">
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

            {/* Prompt to add another property when only 1 is selected on mobile */}
            {comparedProperties.length === 1 && availableToAdd.length > 0 && (
              <div className="p-3 bg-[#F3F2EE] border border-stone-300 space-y-2">
                <div className="text-xs font-semibold text-[#1E3A2F]">
                  1 Residence Selected · Choose a 2nd to compare
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableToAdd.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onToggleCompare(p.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer"
                    >
                      + {p.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* A. MOBILE HEAD-TO-HEAD 2-COLUMN VIEW */}
            {(comparedProperties.length >= 2 && (comparedProperties.length === 2 || mobileViewMode === 'head-to-head') && propA && propB) ? (
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
                          className="w-full py-1.5 text-[11px] font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer text-center"
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
                    <div className="bg-[#F3F2EE] px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-[#615E59] border-t border-b border-stone-200/80">
                      {item.label}
                    </div>
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

                {/* Amenities Comparison */}
                {allComparedAmenities.length > 0 && (
                  <div className="bg-white">
                    <div className="bg-[#F3F2EE] px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#615E59] border-t border-b border-stone-200">
                      Amenities Checklist
                    </div>
                    <div className="divide-y divide-stone-100">
                      {allComparedAmenities.map((amenity) => {
                        const hasA = (propA.amenities || []).includes(amenity);
                        const hasB = (propB.amenities || []).includes(amenity);
                        return (
                          <div key={amenity} className="grid grid-cols-2 divide-x divide-stone-200 p-2 text-xs">
                            <div className="pr-1.5 flex items-center gap-1.5 text-[11px]">
                              {hasA ? (
                                <Check className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                              )}
                              <span className={hasA ? 'font-medium text-[#141413]' : 'text-stone-400'}>
                                {amenity}
                              </span>
                            </div>
                            <div className="pl-2 flex items-center gap-1.5 text-[11px]">
                              {hasB ? (
                                <Check className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                              )}
                              <span className={hasB ? 'font-medium text-[#141413]' : 'text-stone-400'}>
                                {amenity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : comparedProperties.length === 1 ? (
              /* Single Property Mobile View with Specs & Add Option */
              <div className="space-y-4">
                <div className="bg-[#FBFBF9] border border-stone-200 p-4 space-y-3 shadow-xs">
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
                    <button
                      type="button"
                      onClick={() => onSelectProperty(comparedProperties[0])}
                      className="font-serif-display text-lg font-semibold text-[#141413] hover:text-[#1E3A2F] text-left cursor-pointer mt-0.5 line-clamp-2"
                    >
                      {comparedProperties[0].title}
                    </button>
                    <div className="font-mono-tabular font-bold text-sm text-[#141413] mt-1">
                      {formatPropertyPrice(comparedProperties[0].price, comparedProperties[0].transactionType)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={() => onSelectProperty(comparedProperties[0])}
                      className="w-full py-2 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer text-center"
                    >
                      View Dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLeadModal('Property Inquiry', comparedProperties[0].id)}
                      className="w-full py-2 text-xs font-semibold border border-stone-300 text-[#141413] hover:bg-stone-50 cursor-pointer text-center"
                    >
                      Inquire
                    </button>
                  </div>
                </div>

                {/* Add a Second Property Prompt */}
                {availableToAdd.length > 0 && (
                  <div className="bg-[#F3F2EE] border border-stone-300 p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 border border-stone-300">
                        <Plus className="w-4 h-4 text-[#1E3A2F]" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#141413]">
                          Select a Second Residence to Compare
                        </div>
                        <div className="text-[11px] text-[#615E59]">
                          Compare valuation, spatial layout, and carrying costs side-by-side.
                        </div>
                      </div>
                    </div>
                    <select
                      aria-label="Add second residence to comparison"
                      onChange={(e) => {
                        if (e.target.value) {
                          onToggleCompare(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        + Select Residence to Compare...
                      </option>
                      {availableToAdd.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.title} ({formatPropertyPrice(p.price, p.transactionType)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specifications Checklist for Single Residence */}
                <div className="border border-stone-200 bg-white divide-y divide-stone-200 shadow-xs">
                  <div className="bg-[#F3F2EE] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#615E59]">
                    Architectural &amp; Financial Specifications
                  </div>
                  {SPEC_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className={`p-3 text-xs flex justify-between items-start gap-3 ${
                        item.highlight ? 'bg-[#FAF8F5]' : ''
                      }`}
                    >
                      <span className="font-semibold text-[#57534E] shrink-0">{item.label}</span>
                      <div className="text-right text-[#141413]">{item.renderValue(comparedProperties[0])}</div>
                    </div>
                  ))}

                  {/* Amenities for Single Property */}
                  {comparedProperties[0].amenities && comparedProperties[0].amenities.length > 0 && (
                    <div className="bg-white">
                      <div className="bg-[#F3F2EE] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#615E59] border-t border-stone-200">
                        Amenities &amp; Features ({comparedProperties[0].amenities.length})
                      </div>
                      <div className="p-3 grid grid-cols-1 gap-2">
                        {comparedProperties[0].amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center gap-2 text-xs text-[#141413]">
                            <Check className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* B. MOBILE ALL 3 (SWIPE) VIEW */}
            {comparedProperties.length === 3 && mobileViewMode === 'swipe' && (
              <div className="border border-stone-200 bg-[#FBFBF9] shadow-xs">
                <div className="px-3 py-1.5 bg-[#F3F2EE] text-[11px] text-[#615E59] flex items-center justify-between border-b border-stone-200">
                  <span>← Swipe horizontally across all 3 residences →</span>
                  <span className="font-mono-tabular font-semibold text-[#1E3A2F]">3 of 3</span>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[480px] divide-y divide-stone-200">
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
                        <div className="grid grid-cols-3 divide-x divide-stone-200 p-2 text-xs">
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
           * DESKTOP TABLE VIEW (>= 768px): Spacious 3-Column Comparison Matrix
           * ============================================================= */}
          <div className="hidden md:block overflow-x-auto border border-stone-200 bg-[#FBFBF9] shadow-xs">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead>
                <tr className="border-b border-stone-200 bg-[#F3F2EE]/90">
                  <th className="p-4 sm:p-5 w-44 sm:w-56 text-xs font-semibold text-[#615E59] align-top sticky left-0 z-20 bg-[#F3F2EE] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                    Specification
                  </th>
                  {/* Render Compared Property Columns */}
                  {comparedProperties.map((prop) => (
                    <th key={prop.id} className="p-4 sm:p-5 border-l border-stone-200 align-top w-72 sm:w-80 min-w-[240px]">
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

                  {/* Empty Slot Columns for Remaining Slots (up to 3 total) */}
                  {Array.from({ length: Math.max(0, 3 - comparedProperties.length) }).map((_, slotIdx) => (
                    <th
                      key={`empty-slot-${slotIdx}`}
                      className="p-4 sm:p-5 border-l border-stone-200 align-top w-72 sm:w-80 min-w-[240px] bg-[#FBFBF9]"
                    >
                      <div className="border-2 border-dashed border-stone-300 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px] bg-white">
                        <div className="w-10 h-10 rounded-full bg-[#F3F2EE] flex items-center justify-center">
                          <Plus className="w-5 h-5 text-[#57534E]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#141413]">
                            Add Residence #{comparedProperties.length + slotIdx + 1}
                          </div>
                          <div className="text-[11px] text-[#615E59] mt-0.5">
                            {availableToAdd.length} more in portfolio
                          </div>
                        </div>

                        {availableToAdd.length > 0 && (
                          <select
                            aria-label={`Select residence for slot ${comparedProperties.length + slotIdx + 1}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                onToggleCompare(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-stone-300 focus:border-[#141413] cursor-pointer"
                          >
                            <option value="" disabled>
                              Select Residence...
                            </option>
                            {availableToAdd.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.code} — {p.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
                {SPEC_ITEMS.map((item) => (
                  <tr key={item.key}>
                    <td className="p-3 sm:p-4 text-xs font-semibold text-[#615E59] sticky left-0 z-10 bg-[#FBFBF9] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      {item.label}
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-3 sm:p-4 border-l border-stone-200 align-top">
                        {item.renderValue(p)}
                      </td>
                    ))}
                    {/* Empty placeholder cells for open slots */}
                    {Array.from({ length: Math.max(0, 3 - comparedProperties.length) }).map((_, slotIdx) => (
                      <td key={`empty-cell-${slotIdx}`} className="p-3 sm:p-4 border-l border-stone-200 text-stone-300">
                        —
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Amenities Comparison Section */}
                {allComparedAmenities.length > 0 && (
                  <>
                    <tr className="bg-[#F3F2EE]/80">
                      <td
                        colSpan={4}
                        className="p-2.5 sm:px-4 text-xs font-bold uppercase tracking-wider text-[#141413] border-t border-b border-stone-300"
                      >
                        Architectural Amenities Comparison
                      </td>
                    </tr>
                    {allComparedAmenities.map((amenity) => (
                      <tr key={amenity} className="hover:bg-stone-50/50">
                        <td className="p-3 sm:p-4 text-xs font-medium text-[#57534E] sticky left-0 z-10 bg-[#FBFBF9] border-r border-stone-200">
                          {amenity}
                        </td>
                        {comparedProperties.map((p) => {
                          const has = (p.amenities || []).includes(amenity);
                          return (
                            <td key={p.id} className="p-3 sm:p-4 border-l border-stone-200">
                              {has ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1E3A2F]">
                                  <Check className="w-4 h-4 text-[#1E3A2F]" />
                                  <span>Included</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                                  <Minus className="w-3.5 h-3.5" />
                                  <span>Not Listed</span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                        {Array.from({ length: Math.max(0, 3 - comparedProperties.length) }).map((_, slotIdx) => (
                          <td key={`empty-amenity-${slotIdx}`} className="p-3 sm:p-4 border-l border-stone-200 text-stone-300">
                            —
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}

                {/* Action Row */}
                <tr>
                  <td className="p-3 sm:p-4 text-xs font-semibold text-[#615E59] sticky left-0 z-10 bg-[#FBFBF9] border-r border-stone-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                    Actions &amp; Viewing
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 sm:p-4 border-l border-stone-200">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProperty(p)}
                          className="px-3.5 py-2 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                        >
                          Examine Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenLeadModal('Schedule Visit', p.id)}
                          className="px-3.5 py-2 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] transition-colors cursor-pointer"
                        >
                          Schedule Visit
                        </button>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparedProperties.length) }).map((_, slotIdx) => (
                    <td key={`empty-action-${slotIdx}`} className="p-3 sm:p-4 border-l border-stone-200 text-stone-300">
                      —
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
