import { apiFetch } from '../services/api';
import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Calculator,
  MessageSquare,
  Scale,
  Send,
} from 'lucide-react';
import { Property, LeadType, CustomerLead, ActiveRoute } from '../types/realestate';
import { ArchitecturalImage } from './ArchitecturalImage';
import {
  formatPropertyPrice,
  formatCurrency,
  formatNumber,
  calculateMonthlyEMI,
} from '../utils/formatters';

interface PropertyDetailsViewProps {
  property: Property;
  isCompared: boolean;
  onToggleCompare: (propertyId: string) => void;
  onBack: () => void;
  onNavigate: (route: ActiveRoute) => void;
  onOpenLeadModal: (type: LeadType, propertyId: string) => void;
  onLeadSubmitted: (lead: CustomerLead) => void;
}

export const PropertyDetailsView: React.FC<PropertyDetailsViewProps> = ({
  property,
  isCompared,
  onToggleCompare,
  onBack,
  onNavigate,
  onOpenLeadModal,
  onLeadSubmitted,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Embedded quick-inquiry form state
  const [quickMode, setQuickMode] = useState<'Property Inquiry' | 'Schedule Visit'>('Property Inquiry');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState('2026-10-05');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Property-specific EMI preview (for Buy listings)
  const [downPaymentPct, setDownPaymentPct] = useState(30);
  const [interestRate, setInterestRate] = useState(6.25);
  const [tenureYears, setTenureYears] = useState(20);

  const loanPrincipal =
    property.transactionType === 'Buy'
      ? Math.round(property.price * (1 - downPaymentPct / 100))
      : 0;
  const emiData = calculateMonthlyEMI(loanPrincipal, interestRate, tenureYears);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please complete name, email, and phone.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: quickMode,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          propertyId: property.id,
          propertyTitle: property.title,
          preferredDate: quickMode === 'Schedule Visit' ? visitDate : undefined,
          preferredTimeSlot:
            quickMode === 'Schedule Visit' ? '16:30 (Golden Hour Viewing)' : undefined,
          visitMode: quickMode === 'Schedule Visit' ? 'In-Person Private Tour' : undefined,
          message:
            message.trim() ||
            `Direct dossier inquiry regarding ${property.title} (${property.code}).`,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');
      const created: CustomerLead = await res.json();
      onLeadSubmitted(created);
      setSubmitted(true);
    } catch {
      setErrorMsg('Unable to record inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#57534E] hover:text-[#141413] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portfolio Search</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#615E59]">
          <span>{property.locality}</span>
          <span aria-hidden="true">·</span>
          <span>{property.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-[#141413] font-medium">{property.code}</span>
        </div>
      </div>

      {/* Main Contiguous Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-8 items-start">
        {/* LEFT COLUMN (7 cols): Architectural Gallery + Narrative + Specs + EMI Preview */}
        <div className="lg:col-span-7 space-y-10">
          {/* Primary 16:9 Gallery Stage */}
          <div className="space-y-3">
            <div className="aspect-[16/9] w-full bg-[#F3F2EE] border border-stone-200 overflow-hidden relative">
              <ArchitecturalImage
                src={property.images[activeImageIdx] || property.images[0]}
                alt={`${property.title} — View ${activeImageIdx + 1}`}
                fallbackLabel={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-black/75 text-white px-3 py-1 text-xs font-mono-tabular">
                Plate {activeImageIdx + 1} of {property.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {property.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/3] overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-[#141413] opacity-100'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <ArchitecturalImage
                      src={imgUrl}
                      alt={`${property.title} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Architectural Provenance & Narrative */}
          <section className="space-y-4 border-t border-stone-200 pt-8">
            <div className="text-xs text-[#615E59]">
              Architectural Monograph · {property.architect} · Completed {property.yearBuilt}
            </div>
            <h2 className="font-serif-display text-3xl font-semibold text-[#141413]">
              Architectural Statement & Spatial Composition
            </h2>
            <p className="text-base text-[#3F3C38] leading-relaxed max-w-[68ch]">
              {property.description}
            </p>
          </section>

          {/* Curated Architectural Highlights (Editorial Numbering 01, 02, 03) */}
          <section className="space-y-4 border-t border-stone-200 pt-8">
            <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
              Distinguishing Architectural Merits
            </h3>
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {property.highlights.map((highlight, idx) => (
                <div key={idx} className="py-4 flex items-baseline gap-4">
                  <span className="font-mono-tabular text-xs font-semibold text-[#1E3A2F] shrink-0">
                    0{idx + 1}.
                  </span>
                  <span className="text-sm text-[#141413] font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities & Engineering Specifications */}
          <section className="space-y-4 border-t border-stone-200 pt-8">
            <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
              Building Systems & Private Amenities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 bg-[#F3F2EE] border border-stone-200/80 text-sm text-[#141413] flex items-center justify-between"
                >
                  <span>{amenity}</span>
                  <span className="text-xs text-[#615E59] font-mono-tabular">Included</span>
                </div>
              ))}
            </div>
          </section>

          {/* Property-Specific EMI & Carrying Cost Preview */}
          {property.transactionType === 'Buy' && (
            <section className="p-6 bg-[#F3F2EE] border border-stone-200 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#615E59]">
                    Private Bank Financing & Carrying Cost Model
                  </div>
                  <h3 className="font-serif-display text-2xl font-semibold text-[#141413]">
                    Estimated Amortization for {property.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('emi')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Open Full EMI Calculator</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">
                    Down Payment ({downPaymentPct}%)
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={5}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full accent-[#1E3A2F]"
                  />
                  <div className="font-mono-tabular text-xs text-[#141413] mt-1">
                    Equity: {formatCurrency((property.price * downPaymentPct) / 100)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">
                    Interest Rate ({interestRate}%)
                  </label>
                  <input
                    type="range"
                    min={3.5}
                    max={9.5}
                    step={0.25}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-[#1E3A2F]"
                  />
                  <div className="font-mono-tabular text-xs text-[#141413] mt-1">
                    Loan: {formatCurrency(loanPrincipal)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#57534E] mb-1">
                    Tenure ({tenureYears} Years)
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full accent-[#1E3A2F]"
                  />
                  <div className="font-mono-tabular text-xs text-[#141413] mt-1">
                    {tenureYears * 12} Monthly Payments
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-300/80 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-[#615E59]">Monthly Principal & Interest</div>
                  <div className="font-mono-tabular text-xl font-semibold text-[#141413] mt-0.5">
                    {formatCurrency(emiData.monthlyEMI)}/mo
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#615E59]">Building / Estate Maintenance</div>
                  <div className="font-mono-tabular text-xl font-semibold text-[#141413] mt-0.5">
                    {formatCurrency(property.monthlyMaintenance)}/mo
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#615E59]">Total Monthly Carrying Cost</div>
                  <div className="font-mono-tabular text-xl font-semibold text-[#1E3A2F] mt-0.5">
                    {formatCurrency(emiData.monthlyEMI + property.monthlyMaintenance)}/mo
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): Sticky Contiguous Purchase / Advisory Module */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[#FBFBF9] border border-stone-300 p-4 sm:p-8 space-y-5 sm:space-y-6">
          {/* Unboxed Metadata Line */}
          <div className="flex items-center justify-between text-xs text-[#615E59]">
            <span>
              {property.transactionType === 'Rent' ? 'Luxury Lease Mandate' : 'Private Sale Mandate'} ·{' '}
              {property.status}
            </span>
            <span className="font-mono-tabular">{property.code}</span>
          </div>

          {/* Residence Title & Address */}
          <div>
            <h1 className="font-serif-display text-2xl sm:text-4xl font-semibold text-[#141413] leading-tight">
              {property.title}
            </h1>
            <p className="text-xs text-[#57534E] mt-1.5">{property.address}</p>
          </div>

          {/* Primary Price Display */}
          <div className="py-3.5 sm:py-4 border-y border-stone-200 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <div className="text-[11px] sm:text-xs text-[#615E59]">Offering Price</div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141413] mt-0.5">
                {formatPropertyPrice(property.price, property.transactionType)}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] sm:text-xs text-[#615E59]">Per Sq.Ft. Index</div>
              <div className="font-mono-tabular text-xs sm:text-sm font-medium text-[#141413] mt-0.5">
                ₹{formatNumber(property.pricePerSqFt)} / sq.ft.
              </div>
            </div>
          </div>

          {/* Tabular Specifications Matrix */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 sm:gap-x-6 text-xs border-b border-stone-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Interior Area</span>
              <span className="font-mono-tabular font-medium text-[#141413] text-xs">
                {formatNumber(property.areaSqFt)} sq.ft.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Bedrooms</span>
              <span className="font-mono-tabular font-medium text-[#141413] text-xs">
                {property.bedrooms} Beds
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Bathrooms</span>
              <span className="font-mono-tabular font-medium text-[#141413] text-xs">
                {property.bathrooms} Baths
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Parking</span>
              <span className="font-mono-tabular font-medium text-[#141413] text-xs">
                {property.parkingSpaces} Spaces
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Delivery</span>
              <span className="font-medium text-[#141413] text-xs truncate" title={property.furnishedStatus}>
                {property.furnishedStatus}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <span className="text-[#615E59] text-[11px]">Completed</span>
              <span className="font-mono-tabular font-medium text-[#141413] text-xs">
                {property.yearBuilt}
              </span>
            </div>
          </div>

          {/* Direct Customer Lead Action Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => onOpenLeadModal('Schedule Visit', property.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors cursor-pointer text-center"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Schedule Visit</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenLeadModal('WhatsApp Contact', property.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-[#1E3A2F] text-white hover:bg-[#162B22] transition-colors cursor-pointer text-center"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp Desk</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenLeadModal('Property Inquiry', property.id)}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] transition-colors cursor-pointer text-center"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Full Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleCompare(property.id)}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium border transition-colors cursor-pointer text-center ${
                isCompared
                  ? 'bg-[#F3F2EE] border-[#141413] text-[#141413] font-semibold'
                  : 'border-stone-300 text-[#57534E] hover:border-[#141413] hover:text-[#141413]'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0" />
                  <span>In Compare</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>

          {/* Embedded Instant Lead Capture Form */}
          <div className="pt-4 border-t border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#141413]">
                Direct Partner Dispatch
              </span>
              <div className="flex items-center gap-1 bg-[#F3F2EE] p-0.5 border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setQuickMode('Property Inquiry');
                    setSubmitted(false);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                    quickMode === 'Property Inquiry'
                      ? 'bg-white text-[#141413] shadow-2xs'
                      : 'text-[#615E59]'
                  }`}
                >
                  Inquire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickMode('Schedule Visit');
                    setSubmitted(false);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                    quickMode === 'Schedule Visit'
                      ? 'bg-white text-[#141413] shadow-2xs'
                      : 'text-[#615E59]'
                  }`}
                >
                  Book Tour
                </button>
              </div>
            </div>

            {submitted ? (
              <div className="p-4 bg-[#F3F2EE] border border-stone-200 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-[#1E3A2F] mx-auto" />
                <div className="text-xs font-semibold text-[#141413]">
                  {quickMode} Logged in CRM
                </div>
                <p className="text-xs text-[#57534E]">
                  Our managing partner for {property.locality} will contact you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs underline text-[#1E3A2F] cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="space-y-2.5">
                {errorMsg && (
                  <div className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                    {errorMsg}
                  </div>
                )}
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address *"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone / WhatsApp *"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  />
                </div>
                {quickMode === 'Schedule Visit' && (
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none font-mono-tabular"
                  />
                )}
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Questions or viewing notes for ${property.title}...`}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#292524] transition-colors cursor-pointer"
                >
                  {submitting ? 'Sending...' : `Send ${quickMode}`}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
