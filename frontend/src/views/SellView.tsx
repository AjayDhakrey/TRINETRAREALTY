import React, { useState } from 'react';
import { Calculator, CheckCircle2 } from 'lucide-react';
import type {
  LocalityProfile,
  CustomerLead,
  PropertyCategory,
  ActiveRoute,
} from '../types/realestate';
import { apiFetch } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

export interface SellViewProps {
  localities: LocalityProfile[];
  onLeadSubmitted: (lead: CustomerLead) => void;
  onNavigate: (route: ActiveRoute) => void;
}

export const SellView: React.FC<SellViewProps> = ({
  localities,
  onLeadSubmitted,
  onNavigate,
}) => {
  const [locality, setLocality] = useState(localities[0]?.name || 'Tribeca & SoHo');
  const [category, setCategory] = useState<PropertyCategory>('Penthouse');
  const [areaSqFt, setAreaSqFt] = useState(4200);
  const [bedrooms, setBedrooms] = useState(4);
  const [condition, setCondition] = useState<
    'Museum Grade / New' | 'Architecturally Restored' | 'Original / Needs Work'
  >('Museum Grade / New');
  const [timeline, setTimeline] = useState('Within 3 Months');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<CustomerLead | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const locProfile = localities.find((l) => l.name === locality);
  const baseSqFt = locProfile ? locProfile.avgPricePerSqFt : 19000;
  const catMult =
    category === 'Estate'
      ? 1.18
      : category === 'Penthouse'
      ? 1.14
      : category === 'Waterfront'
      ? 1.12
      : category === 'Villa'
      ? 1.08
      : 1.0;
  const condMult =
    condition === 'Museum Grade / New'
      ? 1.12
      : condition === 'Architecturally Restored'
      ? 1.04
      : 0.88;
  const bedBonus = Math.max(0, (bedrooms - 3) * 0.025);
  const adjustedPerSqFt = Math.round(baseSqFt * catMult * condMult * (1 + bedBonus));
  const estimatedValue = Math.round(adjustedPerSqFt * (areaSqFt || 1000));
  const lowVal = Math.round(estimatedValue * 0.95);
  const highVal = Math.round(estimatedValue * 1.05);
  const rangeString = `${formatCurrency(lowVal, true)} – ${formatCurrency(highVal, true)}`;

  const handleValuationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please enter your name, email, and phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Property Valuation',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: notes.trim() || 'Seller mandate valuation inquiry.',
          valuationDetails: {
            locality,
            category,
            areaSqFt,
            bedrooms,
            condition,
            estimatedValue,
            estimatedRange: rangeString,
            timeline,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to submit valuation dossier');
      const created: CustomerLead = await response.json();
      onLeadSubmitted(created);
      setSubmittedLead(created);
    } catch {
      setErrorMsg('Could not submit valuation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-10 sm:space-y-14">
      <div className="border-b border-stone-200 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Seller Representation & Algorithmic Property Valuation
          </div>
          <h1 className="font-serif-display text-2xl sm:text-5xl font-semibold text-[#141413] text-balance">
            List Your Residence & Request a Private Valuation
          </h1>
          <p className="text-xs sm:text-base text-[#57534E] leading-relaxed">
            Combine our real-time locality valuation index with bespoke editorial representation. Model your property’s current market basis below and dispatch a formal appraisal mandate to our partners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="px-4 py-2.5 text-xs font-semibold border border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Direct Listing Upload (Admin Portal)
        </button>
      </div>

      {/* Interactive Split Valuation Engine + Lead Capture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        {/* Left 7 Cols: Algorithmic Valuation Configurator */}
        <div className="lg:col-span-7 bg-[#F3F2EE] border border-stone-200 p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300 pb-4">
            <div>
              <div className="text-xs text-[#615E59]">Step 01 · Property Parameters</div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
                Algorithmic Valuation Model
              </h2>
            </div>
            <Calculator className="w-5 h-5 text-[#1E3A2F]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Locality / Enclave
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              >
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name} (₹{formatNumber(loc.avgPricePerSqFt)}/sq.ft. base)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Architectural Typology
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              >
                <option value="Penthouse">Penthouse (+14% Index Premium)</option>
                <option value="Estate">Estate (+18% Index Premium)</option>
                <option value="Waterfront">Waterfront (+12% Index Premium)</option>
                <option value="Villa">Villa (+8% Index Premium)</option>
                <option value="Townhouse">Townhouse (Baseline Index)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Interior Square Footage: <span className="font-mono-tabular">{formatNumber(areaSqFt)} sq.ft.</span>
              </label>
              <input
                type="range"
                min={1200}
                max={15000}
                step={100}
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                className="w-full accent-[#1E3A2F] mt-2"
              />
              <div className="flex justify-between text-[11px] text-[#615E59] font-mono-tabular mt-1">
                <span>1,200 sq.ft.</span>
                <span>8,000 sq.ft.</span>
                <span>15,000 sq.ft.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Bedrooms: <span className="font-mono-tabular">{bedrooms} Bedrooms</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full accent-[#1E3A2F] mt-2"
              />
              <div className="flex justify-between text-[11px] text-[#615E59] font-mono-tabular mt-1">
                <span>1 BD</span>
                <span>5 BD</span>
                <span>10 BD</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Architectural Condition & Provenance
              </label>
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(
                    e.target.value as
                      | 'Museum Grade / New'
                      | 'Architecturally Restored'
                      | 'Original / Needs Work'
                  )
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              >
                <option value="Museum Grade / New">Museum Grade / New (+12%)</option>
                <option value="Architecturally Restored">Architecturally Restored (+4%)</option>
                <option value="Original / Needs Work">Original / Needs Work (-12%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1.5">
                Desired Disposition Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
              >
                <option value="Immediate Mandate">Immediate Mandate</option>
                <option value="Within 3 Months">Within 3 Months</option>
                <option value="Within 6–12 Months">Within 6–12 Months</option>
                <option value="Confidential Appraisal Only">Confidential Appraisal Only</option>
              </select>
            </div>
          </div>

          {/* Live Valuation Output Card */}
          <div className="bg-[#FBFBF9] border border-stone-300 p-6 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <div className="text-xs text-[#615E59]">
                  Estimated Private Market Valuation Range
                </div>
                <div className="font-mono-tabular text-3xl sm:text-4xl font-semibold text-[#1E3A2F] mt-1">
                  {rangeString}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#615E59]">Midpoint Benchmark</div>
                <div className="font-mono-tabular text-lg font-medium text-[#141413] mt-1">
                  {formatCurrency(estimatedValue)}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#615E59] block">Adjusted Sq.Ft. Basis</span>
                <span className="font-mono-tabular font-semibold text-[#141413]">
                  ₹{formatNumber(adjustedPerSqFt)} / sq.ft.
                </span>
              </div>
              <div>
                <span className="text-[#615E59] block">District YoY Trend</span>
                <span className="font-mono-tabular font-semibold text-[#1E3A2F]">
                  +{locProfile?.yoyAppreciation || 6.5}% Annualized
                </span>
              </div>
              <div>
                <span className="text-[#615E59] block">Est. Rental Yield</span>
                <span className="font-mono-tabular font-semibold text-[#141413]">
                  {locProfile?.rentalYield || 4.1}% Gross
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Formal Valuation Lead Submission */}
        <div className="lg:col-span-5 bg-[#FBFBF9] border border-stone-300 p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs text-[#615E59]">Step 02 · Partner Appraisal Dispatch</div>
            <h2 className="font-serif-display text-2xl font-semibold text-[#141413] mt-0.5">
              Request Certified Partner Valuation
            </h2>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
              Submit your valuation parameters to receive a confidential comparative dossier and schedule an in-person architectural walk-through.
            </p>
          </div>

          {submittedLead ? (
            <div className="p-6 bg-[#F3F2EE] border border-stone-200 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-[#1E3A2F] mx-auto" />
              <div className="space-y-1">
                <div className="text-xs font-mono-tabular text-[#615E59]">
                  Lead ID: {submittedLead.id}
                </div>
                <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                  Valuation Dossier Logged
                </h3>
                <p className="text-xs text-[#57534E]">
                  Your property valuation estimate ({rangeString}) has been recorded in our Admin CRM for {locality}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittedLead(null)}
                className="px-4 py-2 text-xs font-medium bg-[#141413] text-white cursor-pointer"
              >
                Model Another Property
              </button>
            </div>
          ) : (
            <form onSubmit={handleValuationSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Homeowner / Principal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jonathan & Claire Vance"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Confidential Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="principal@domain.com"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Direct Telephone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (310) 555-0144"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Property Address & Architectural Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include street address, architect of record, or recent structural renovations..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Recording Valuation Request...'
                  : `Submit Valuation Mandate (${rangeString})`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
