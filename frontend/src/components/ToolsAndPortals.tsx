import { apiFetch } from '../services/api';
import React, { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  Send,
  Calendar,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Property,
  LocalityProfile,
  BlogPost,
  CustomerLead,
  LeadType,
  PropertyCategory,
  ActiveRoute,
} from '../types/realestate';
import { PropertyCard } from './PropertyCard';
import { ArchitecturalImage } from './ArchitecturalImage';
import {
  formatCurrency,
  formatFullINR,
  formatPropertyPrice,
  formatNumber,
  calculateMonthlyEMI,
} from '../utils/formatters';
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  GoogleMapsIcon,
} from './SocialIcons';

/* ============================================================================
 * 1. BUY PORTAL VIEW
 * ========================================================================== */
interface BuyRentViewProps {
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
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-14">
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Private Sales & Freehold Acquisitions · {buyProperties.length} Curated Mandates
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413] text-balance">
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
              01. Portfolio Curation & Off-Market Access
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Principals receive access to both published mandates and pocket whisper listings held quietly by family offices across New York and California.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
              02. Architectural & Engineering Audit
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Our AIA-licensed technical team audits building envelope integrity, mechanical acoustics, and municipal landmark preservation covenants.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-mono-tabular text-xs font-semibold text-[#1E3A2F]">
              03. Trust Structuring & Escrow Closing
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

/* ============================================================================
 * 2. RENT PORTAL VIEW
 * ========================================================================== */
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
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-14">
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Executive & Diplomatic Leasing · Turnkey Architectural Residences
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413] text-balance">
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
          <div className="text-xs text-[#615E59]">Bespoke Corporate & Family Office Terms</div>
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

/* ============================================================================
 * 3. SELL & PROPERTY VALUATION PORTAL VIEW
 * ========================================================================== */
interface SellViewProps {
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
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-14">
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Seller Representation & Algorithmic Property Valuation
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413] text-balance">
            List Your Residence & Request a Private Valuation
          </h1>
          <p className="text-base text-[#57534E] leading-relaxed">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 7 Cols: Algorithmic Valuation Configurator */}
        <div className="lg:col-span-7 bg-[#F3F2EE] border border-stone-200 p-6 sm:p-8 space-y-6">
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
                onChange={(e) => setCondition(e.target.value as any)}
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

/* ============================================================================
 * 4. PROPERTY COMPARISON VIEW
 * ========================================================================== */
interface ComparisonViewProps {
  properties: Property[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenLeadModal: (type: LeadType, propertyId?: string) => void;
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

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
      <div className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-[#615E59]">
            Side-by-Side Architectural & Financial Matrix
          </div>
          <h1 className="font-serif-display text-4xl font-semibold text-[#141413] mt-1">
            Property Comparison ({comparedProperties.length} of 3 Selected)
          </h1>
        </div>

        {/* Selector to add properties if < 3 */}
        {comparedProperties.length < 3 && availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              aria-label="Add residence to comparison"
              onChange={(e) => {
                if (e.target.value) {
                  onToggleCompare(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-3.5 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
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
          </div>
        )}
      </div>

      {comparedProperties.length === 0 ? (
        <div className="bg-[#F3F2EE] border border-stone-200 p-12 text-center space-y-4">
          <Building2 className="w-10 h-10 text-[#615E59] mx-auto stroke-[1.25]" />
          <h2 className="font-serif-display text-2xl font-semibold text-[#141413]">
            No Residences Currently Selected for Comparison
          </h2>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            Select up to three residences below to evaluate per-square-foot valuation, carrying costs, and architectural specifications side by side.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {properties.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleCompare(p.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {p.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-200 bg-[#FBFBF9]">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-stone-200 bg-[#F3F2EE]/70">
                <th className="p-5 w-52 text-xs font-semibold text-[#615E59] align-top">
                  Specification / Metric
                </th>
                {comparedProperties.map((prop) => (
                  <th key={prop.id} className="p-5 border-l border-stone-200 align-top w-80">
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
                          className="font-serif-display text-xl font-semibold text-[#141413] hover:text-[#1E3A2F] text-left cursor-pointer mt-0.5"
                        >
                          {prop.title}
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Offering Price</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular font-semibold text-[#141413]"
                  >
                    {formatPropertyPrice(p.price, p.transactionType)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Price / Sq.Ft.</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular text-[#141413]"
                  >
                    ₹{formatNumber(p.pricePerSqFt)} / sq.ft.
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Transaction Mandate</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-4 border-l border-stone-200 text-[#141413]">
                    {p.transactionType === 'Rent' ? 'Luxury Lease' : 'Freehold Acquisition'} ·{' '}
                    {p.status}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Interior Area</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular text-[#141413]"
                  >
                    {formatNumber(p.areaSqFt)} sq.ft.
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Bedrooms / Bathrooms</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular text-[#141413]"
                  >
                    {p.bedrooms} Bedrooms · {p.bathrooms} Bathrooms
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Architectural Style</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-4 border-l border-stone-200 text-[#141413]">
                    {p.architecturalStyle}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Architect of Record</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-4 border-l border-stone-200 text-[#57534E]">
                    {p.architect} ({p.yearBuilt})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Delivery Condition</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-4 border-l border-stone-200 text-[#141413]">
                    {p.furnishedStatus}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Parking Allocation</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular text-[#141413]"
                  >
                    {p.parkingSpaces} Private Spaces
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Monthly Maintenance</td>
                {comparedProperties.map((p) => (
                  <td
                    key={p.id}
                    className="p-4 border-l border-stone-200 font-mono-tabular text-[#141413]"
                  >
                    {p.monthlyMaintenance > 0
                      ? `${formatCurrency(p.monthlyMaintenance)} / mo`
                      : 'Included in Lease'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">
                  Est. Monthly EMI (70% LTV, 20Y @ 6.25%)
                </td>
                {comparedProperties.map((p) => {
                  if (p.transactionType === 'Rent') {
                    return (
                      <td
                        key={p.id}
                        className="p-4 border-l border-stone-200 font-mono-tabular text-[#615E59]"
                      >
                        N/A (Monthly Lease)
                      </td>
                    );
                  }
                  const emi = calculateMonthlyEMI(p.price * 0.7, 6.25, 20).monthlyEMI;
                  return (
                    <td
                      key={p.id}
                      className="p-4 border-l border-stone-200 font-mono-tabular font-medium text-[#1E3A2F]"
                    >
                      {formatCurrency(emi)} / mo
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 text-xs font-medium text-[#615E59]">Advisory Actions</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="p-4 border-l border-stone-200">
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
      )}
    </div>
  );
};

/* ============================================================================
 * 5. EMI CALCULATOR VIEW
 * ========================================================================== */
interface EmiCalculatorViewProps {
  properties: Property[];
  onOpenLeadModal: (type: LeadType, propertyId?: string) => void;
}

export const EmiCalculatorView: React.FC<EmiCalculatorViewProps> = ({
  properties,
  onOpenLeadModal,
}) => {
  const buyProperties = properties.filter((p) => p.transactionType === 'Buy');
  const [selectedPropId, setSelectedPropId] = useState<string>('custom');
  const [propertyValue, setPropertyValue] = useState<number>(84500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(6.25);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const handleSelectPreset = (id: string) => {
    setSelectedPropId(id);
    if (id !== 'custom') {
      const found = buyProperties.find((p) => p.id === id);
      if (found) setPropertyValue(found.price);
    }
  };

  const downPaymentAmount = Math.round((propertyValue * downPaymentPercent) / 100);
  const loanAmount = Math.max(0, propertyValue - downPaymentAmount);
  const { monthlyEMI, totalPayment, totalInterest, schedule } = calculateMonthlyEMI(
    loanAmount,
    interestRate,
    tenureYears
  );

  const principalShare =
    totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 100;
  const interestShare = 100 - principalShare;

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-stone-200 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Private Wealth Debt Service & Amortization Modeling
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413]">
            Jumbo Mortgage & EMI Calculator
          </h1>
        </div>

        <div>
          <label className="block text-xs text-[#615E59] mb-1">
            Benchmark Against Portfolio Residence
          </label>
          <select
            value={selectedPropId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
          >
            <option value="custom">Custom Principal Valuation</option>
            {buyProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.title} ({formatCurrency(p.price)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 5 Cols: Interactive Sliders */}
        <div className="lg:col-span-5 bg-[#F3F2EE] border border-stone-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Acquisition Price</span>
              <span className="font-mono-tabular font-semibold">
                {formatCurrency(propertyValue)}
              </span>
            </div>
            <input
              type="range"
              min={5000000}
              max={250000000}
              step={2500000}
              value={propertyValue}
              onChange={(e) => {
                setSelectedPropId('custom');
                setPropertyValue(Number(e.target.value));
              }}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Down Payment Equity ({downPaymentPercent}%)</span>
              <span className="font-mono-tabular font-semibold">
                {formatCurrency(downPaymentAmount)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Annual Interest Rate</span>
              <span className="font-mono-tabular font-semibold">{interestRate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={2.5}
              max={10.0}
              step={0.125}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-[#141413] mb-2">
              <span>Amortization Tenure</span>
              <span className="font-mono-tabular font-semibold">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-[#1E3A2F]"
            />
          </div>

          <div className="pt-4 border-t border-stone-300 space-y-3">
            <div className="text-xs text-[#615E59]">
              Principal ({principalShare}%) vs. Cumulative Interest ({interestShare}%)
            </div>
            <div className="w-full h-3 bg-stone-300 flex overflow-hidden">
              <div
                style={{ width: `${principalShare}%` }}
                className="bg-[#141413] h-full transition-all"
                title={`Principal: ${principalShare}%`}
              />
              <div
                style={{ width: `${interestShare}%` }}
                className="bg-[#1E3A2F] h-full transition-all"
                title={`Interest: ${interestShare}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-[#57534E] font-mono-tabular">
              <span>Principal: {formatCurrency(loanAmount, true)}</span>
              <span>Interest: {formatCurrency(totalInterest, true)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenLeadModal(
                'Property Inquiry',
                selectedPropId !== 'custom' ? selectedPropId : undefined
              )
            }
            className="w-full py-3 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
          >
            Request Private Bank Term Sheet
          </button>
        </div>

        {/* Right 7 Cols: Summary Metrics + Annual Amortization Table */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Monthly Equated Installment (EMI)</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A2F] mt-1">
                {formatCurrency(monthlyEMI)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                {tenureYears * 12} Monthly Payments
              </div>
            </div>

            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Financed Loan Principal</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413] mt-1">
                {formatCurrency(loanAmount, true)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                LTV Ratio: {100 - downPaymentPercent}%
              </div>
            </div>

            <div className="p-6 bg-[#FBFBF9] border border-stone-300">
              <div className="text-xs text-[#615E59]">Total Debt Service Outlay</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413] mt-1">
                {formatCurrency(totalPayment, true)}
              </div>
              <div className="text-xs text-[#615E59] mt-1 font-mono-tabular">
                Incl. {formatCurrency(totalInterest, true)} Interest
              </div>
            </div>
          </div>

          {/* Yearly Amortization Schedule Table */}
          <div className="border border-stone-200 bg-[#FBFBF9] overflow-hidden">
            <div className="px-6 py-4 bg-[#F3F2EE] border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-serif-display text-xl font-semibold text-[#141413]">
                Annual Amortization Ledger
              </h2>
              <span className="text-xs text-[#615E59] font-mono-tabular">
                Values in INR (₹) · Tabular Figures
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F3F2EE]/50 border-b border-stone-200 sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-[#615E59]">Year</th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Opening Balance
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Principal Paid
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Interest Paid
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#615E59] text-right">
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono-tabular">
                  {schedule.map((row) => (
                    <tr key={row.year} className="hover:bg-[#F3F2EE]/40">
                      <td className="py-2.5 px-4 font-medium text-[#141413]">Year {row.year}</td>
                      <td className="py-2.5 px-4 text-right text-[#57534E]">
                        {formatFullINR(row.openingBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#141413] font-medium">
                        {formatFullINR(row.principalPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#1E3A2F]">
                        {formatFullINR(row.interestPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#141413] font-semibold">
                        {formatFullINR(row.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. LOCALITIES INTELLIGENCE VIEW
 * ========================================================================== */
interface LocalitiesViewProps {
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
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#615E59]">
            Micro-Market Liquidity & Architectural Enclaves
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413]">
            Premier Localities & District Intelligence
          </h1>
          <p className="text-base text-[#57534E] leading-relaxed">
            Quantitative per-square-foot benchmarks, historical appreciation trajectories, and architectural zoning profiles across our core residential districts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenLeadModal('Property Valuation')}
          className="px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors whitespace-nowrap cursor-pointer"
        >
          Benchmark Your Property in These Localities
        </button>
      </div>

      <div className="space-y-10">
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

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs text-[#615E59]">{loc.architecturalCharacter}</div>
                  <h2 className="font-serif-display text-3xl font-semibold text-[#141413]">
                    {loc.name}
                  </h2>
                  <p className="text-sm text-[#57534E] leading-relaxed">{loc.description}</p>

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

                <div className="pt-5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-6">
                  <div className="grid grid-cols-4 gap-6">
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

/* ============================================================================
 * 7. EDITORIAL BLOG VIEW
 * ========================================================================== */
interface BlogViewProps {
  posts: BlogPost[];
  onOpenLeadModal: (type: LeadType) => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ posts, onOpenLeadModal }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost>(posts[0]);

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-stone-200 pb-8">
        <div className="text-xs text-[#615E59]">
          The Architectural Ledger · Quarterly Research & Advisory Essays
        </div>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413] mt-1">
          Editorial Journal & Market Monographs
        </h1>
      </div>

      {/* Featured Active Essay Reader */}
      {selectedPost && (
        <article className="bg-[#F3F2EE] border border-stone-200 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-[4/3] w-full bg-stone-200 overflow-hidden">
              <ArchitecturalImage
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Unboxed Metadata */}
            <div className="flex items-center gap-2 text-xs text-[#615E59]">
              <span>{selectedPost.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.readTime}</span>
            </div>
            <div className="pt-2 border-t border-stone-300 text-xs">
              <div className="font-semibold text-[#141413]">{selectedPost.author}</div>
              <div className="text-[#615E59]">{selectedPost.authorRole}</div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#141413] leading-tight">
              {selectedPost.title}
            </h2>
            <p className="text-base font-medium text-[#3F3C38] leading-relaxed">
              {selectedPost.subtitle}
            </p>
            <div className="space-y-4 pt-2 border-t border-stone-300 text-sm text-[#3F3C38] leading-relaxed max-w-[68ch]">
              {selectedPost.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => onOpenLeadModal('Property Inquiry')}
                className="px-5 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
              >
                Request Full Empirical Research PDF from Advisory Desk
              </button>
            </div>
          </div>
        </article>
      )}

      {/* All Journal Articles Grid */}
      <div className="space-y-4">
        <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
          All Published Monographs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => {
            const isSelected = selectedPost?.id === post.id;
            return (
              <div
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`border p-5 flex flex-col justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#141413] bg-[#F3F2EE]'
                    : 'border-stone-200 bg-[#FBFBF9] hover:border-stone-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] w-full bg-stone-200 overflow-hidden">
                    <ArchitecturalImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#615E59]">
                    <span>{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h4 className="font-serif-display text-xl font-semibold text-[#141413] line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-xs text-[#57534E] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-[#615E59]">{post.author}</span>
                  <span className="font-semibold text-[#1E3A2F]">Read Essay →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 8. CONTACT & PRIVATE CLIENT DESKS VIEW
 * ========================================================================== */
interface ContactViewProps {
  properties: Property[];
  onLeadSubmitted: (lead: CustomerLead) => void;
  onOpenLeadModal: (type: LeadType) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  properties,
  onLeadSubmitted,
  onOpenLeadModal,
}) => {
  const [leadType, setLeadType] = useState<LeadType>('Property Inquiry');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    setSubmitting(true);

    const prop = properties.find((p) => p.id === propertyId);
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: leadType,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          propertyId: prop?.id,
          propertyTitle: prop?.title,
          message: message.trim() || 'Private Client Desk Contact Request',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        onLeadSubmitted(created);
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const MAPS_URL =
    'https://www.google.com/maps/search/?api=1&query=F3%2C+Supermax+Galleria+Market%2C+Sector+33%2C+Sonipat%2C+Haryana%2C+India';

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E3A2F]/10 text-[#1E3A2F] text-xs font-semibold tracking-wider uppercase rounded-full">
            Get in Touch · Trinetra Realty
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#141413]">
            Trinetra Realty
          </h1>
          <p className="font-serif-display text-2xl text-[#1E3A2F] italic">
            Your Future, Our Focus.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-xs font-medium text-[#141413] rounded-sm shadow-2xs">
            <span className="font-semibold text-[#1E3A2F]">Business Owners:</span>
            <span className="font-semibold text-[#141413]">Rahul Khatri</span>
            <span className="text-stone-300">·</span>
            <span className="font-semibold text-[#141413]">Rohit Joon</span>
          </div>
          <p className="text-base text-[#57534E] leading-relaxed">
            Whether you&apos;re looking for a new property, exploring an investment opportunity, or planning a site visit, our team is here to help you find the right opportunity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenLeadModal('Schedule Visit')}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule a Site Visit</span>
          </button>
          <a
            href="https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors cursor-pointer shadow-sm rounded-sm"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>WhatsApp Our Desk</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left 6 Cols: Office, Team, Email, Socials */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Visit Our Office Card (Clickable Google Maps) */}
          <div className="p-4 sm:p-7 bg-[#F3F2EE] border border-stone-200 rounded-sm space-y-4 relative overflow-hidden group hover:border-[#1E3A2F]/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                <GoogleMapsIcon className="w-4 h-4 text-red-500" />
                <span>Visit Our Office</span>
              </div>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5 bg-white px-2.5 py-1 border border-stone-200 rounded-sm shadow-2xs hover:shadow-sm transition-all"
              >
                <GoogleMapsIcon className="w-3.5 h-3.5 text-red-500" />
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>
            </div>

            <div>
              <h3 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413] mb-0.5">
                Trinetra Realty
              </h3>
              <p className="text-xs text-[#57534E] mb-2 font-medium">
                Business Owners: <span className="text-[#141413] font-semibold">Rahul Khatri</span> &amp; <span className="text-[#141413] font-semibold">Rohit Joon</span>
              </p>
              {/* Clickable Full Address */}
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open full location on Google Maps"
                className="block text-sm text-[#44403C] hover:text-[#1E3A2F] leading-relaxed transition-colors group/addr"
              >
                <div className="font-medium text-[#141413] group-hover/addr:underline">F3, Supermax Galleria Market</div>
                <div>Sector 33, Sonipat, Haryana, India</div>
              </a>
            </div>

            <div className="pt-2 border-t border-stone-300/60">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] hover:text-[#141413] transition-colors"
              >
                <GoogleMapsIcon className="w-3.5 h-3.5 text-red-500" />
                <span>Get Directions on Google Maps →</span>
              </a>
            </div>
          </div>

          {/* 2. Contact Business Owners & Team Card */}
          <div className="p-4 sm:p-7 bg-[#F3F2EE] border border-stone-200 rounded-sm space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                <Phone className="w-4 h-4 text-[#1E3A2F]" />
                <span>Contact Business Owners</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#1E3A2F]/10 text-[#1E3A2F] rounded-xs uppercase tracking-wide">
                Owners &amp; Principals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Rahul Khatri */}
              <div className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-sm space-y-2 hover:border-emerald-300 transition-colors shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 uppercase tracking-wider font-semibold">Business Owner</span>
                  <span className="text-[#1E3A2F] font-medium text-[11px]">Advisory Partner</span>
                </div>
                <div className="font-serif-display text-lg font-semibold text-[#141413]">
                  Rahul Khatri
                </div>
                <div className="text-sm font-semibold text-[#1E3A2F]">
                  <a href="tel:+919186221008" className="hover:underline">
                    +91 9186221008
                  </a>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-stone-100">
                  <a
                    href="tel:+919186221008"
                    className="inline-flex items-center gap-1 text-[#141413] hover:text-[#1E3A2F] font-medium"
                  >
                    <Phone className="w-3 h-3 text-stone-600" />
                    <span>Call</span>
                  </a>
                  <span className="text-stone-300">·</span>
                  <a
                    href="https://wa.me/919186221008?text=Hello%20Rahul%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-[#20bd5a] font-semibold"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Rohit Joon */}
              <div className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-sm space-y-2 hover:border-emerald-300 transition-colors shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 uppercase tracking-wider font-semibold">Business Owner</span>
                  <span className="text-[#1E3A2F] font-medium text-[11px]">Managing Partner</span>
                </div>
                <div className="font-serif-display text-lg font-semibold text-[#141413]">
                  Rohit Joon
                </div>
                <div className="text-sm font-semibold text-[#1E3A2F]">
                  <a href="tel:+919034969308" className="hover:underline">
                    +91 9034969308
                  </a>
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-stone-100">
                  <a
                    href="tel:+919034969308"
                    className="inline-flex items-center gap-1 text-[#141413] hover:text-[#1E3A2F] font-medium"
                  >
                    <Phone className="w-3 h-3 text-stone-600" />
                    <span>Call</span>
                  </a>
                  <span className="text-stone-300">·</span>
                  <a
                    href="https://wa.me/919034969308?text=Hello%20Rohit%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-[#20bd5a] font-semibold"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Email Us Card */}
          <div className="p-4 sm:p-7 bg-[#F3F2EE] border border-stone-200 rounded-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
              <Mail className="w-4 h-4 text-[#1E3A2F]" />
              <span>Email Us</span>
            </div>
            <div>
              <a
                href="mailto:trinetrarealty29@gmail.com"
                className="font-serif-display text-lg sm:text-2xl font-semibold text-[#141413] hover:text-[#1E3A2F] underline decoration-stone-300 hover:decoration-[#1E3A2F] break-all"
              >
                trinetrarealty29@gmail.com
              </a>
            </div>
            <p className="text-xs text-[#57534E] leading-relaxed">
              For property enquiries, project details, investment opportunities, site visits and the latest inventory, feel free to connect with our team.
            </p>
            <div className="pt-1">
              <a
                href="#enquiry-form"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A2F] hover:underline"
              >
                <span>Send an Enquiry →</span>
              </a>
            </div>
          </div>

          {/* 4. Follow Trinetra Realty (Social Links) */}
          <div className="p-4 sm:p-7 bg-[#F3F2EE] border border-stone-200 rounded-sm space-y-4">
            <div>
              <div className="text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider">
                Follow Trinetra Realty
              </div>
              <p className="text-xs text-[#57534E] mt-1">
                Stay connected with Trinetra Realty for new projects, property updates, investment opportunities, site visits and latest inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/trinetrarealty_?stkn=MW52OXVra2cxcXhmaw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-white border border-stone-200 rounded-sm hover:border-[#E1306C] group transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#E1306C] mb-1.5">
                  <InstagramIcon className="w-5 h-5 text-[#E1306C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-[#141413]">Instagram</span>
                </div>
                <div className="text-xs text-stone-500 group-hover:text-[#E1306C] font-mono-tabular">
                  @trinetrarealty_
                </div>
                <div className="text-[11px] font-semibold text-[#1E3A2F] mt-2 group-hover:underline inline-flex items-center gap-1">
                  <span>Follow on Instagram →</span>
                </div>
              </a>

              {/* Facebook Page 1 */}
              <a
                href="https://www.facebook.com/share/1VBsJ1bSHk/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-white border border-stone-200 rounded-sm hover:border-[#1877F2] group transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#1877F2] mb-1.5">
                  <FacebookIcon className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-[#141413]">Facebook</span>
                </div>
                <div className="text-xs text-stone-500 group-hover:text-[#1877F2]">
                  Trinetra Realty
                </div>
                <div className="text-[11px] font-semibold text-[#1E3A2F] mt-2 group-hover:underline inline-flex items-center gap-1">
                  <span>Visit Facebook →</span>
                </div>
              </a>

              {/* Facebook Page 2 */}
              <a
                href="https://www.facebook.com/share/1D3uLHSo58/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-white border border-stone-200 rounded-sm hover:border-[#1877F2] group transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#1877F2] mb-1.5">
                  <FacebookIcon className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-[#141413]">Facebook</span>
                </div>
                <div className="text-xs text-stone-500 group-hover:text-[#1877F2]">
                  Trinetra Realty
                </div>
                <div className="text-[11px] font-semibold text-[#1E3A2F] mt-2 group-hover:underline inline-flex items-center gap-1">
                  <span>Visit Facebook →</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Direct Customer Lead Dispatch Form */}
        <div id="enquiry-form" className="lg:col-span-6 bg-[#FBFBF9] border border-stone-300 p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E3A2F] uppercase tracking-wider mb-2">
              <Send className="w-3.5 h-3.5" />
              <span>Direct Client Inquiry Desk</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413] mb-2">
              Send an Enquiry
            </h2>
            <p className="text-xs text-[#57534E] mb-6 leading-relaxed">
              For property enquiries, project details, investment opportunities, site visits and the latest inventory, feel free to connect with our team. All submissions trigger instant notification directly to our managing partners.
            </p>

            {submitted ? (
              <div className="p-5 sm:p-8 bg-[#F3F2EE] border border-stone-200 text-center space-y-4 rounded-sm">
                <CheckCircle2 className="w-12 h-12 text-[#1E3A2F] mx-auto" />
                <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                  Enquiry Received Successfully
                </h3>
                <p className="text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Your enquiry for <strong>{leadType}</strong> has been received. Our team will help you with project details, availability, and the next steps.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="px-5 py-2.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {(
                    [
                      'Property Inquiry',
                      'Schedule Visit',
                      'Property Valuation',
                      'WhatsApp Contact',
                    ] as LeadType[]
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeadType(t)}
                      className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-medium border text-center cursor-pointer transition-colors ${
                        leadType === t
                          ? 'bg-[#141413] text-white border-[#141413]'
                          : 'bg-[#F3F2EE] text-[#57534E] border-stone-200 hover:text-[#141413]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9186221008"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Interested Property / Asset (Optional)
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    <option value="">General Portfolio Inquiry (Sonipat / NCR)</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title} ({p.locality})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1">
                    Your Requirements &amp; Inquiries
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you're looking for, preferred budget, property type, or desired site visit date..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#141413] transition-colors cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{submitting ? 'Sending Enquiry...' : `Send ${leadType} →`}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Ready to Explore Your Next Property? Call-to-Action Section */}
      <div className="bg-[#1E3A2F] text-white p-5 sm:p-8 md:p-12 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 shadow-md">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-emerald-200/80 font-medium">
            Trinetra Realty · Sonipat, Haryana
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            Ready to Explore Your Next Property?
          </h2>
          <p className="text-sm text-stone-200 font-medium">
            Have a property enquiry or want to schedule a site visit?
          </p>
          <p className="text-xs text-stone-300/90 leading-relaxed pt-1">
            Our team will help you with project details, availability and the next steps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 w-full md:w-auto">
          <a
            href="#enquiry-form"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 text-xs font-semibold bg-white text-[#141413] hover:bg-stone-100 transition-colors cursor-pointer shadow-sm text-center"
          >
            Get in Touch
          </a>
          <button
            type="button"
            onClick={() => onOpenLeadModal('Schedule Visit')}
            className="px-6 py-3.5 text-xs font-semibold border-2 border-white/80 text-white hover:bg-white hover:text-[#1E3A2F] transition-all cursor-pointer text-center"
          >
            Schedule a Site Visit
          </button>
        </div>
      </div>
    </div>
  );
};

