import { apiFetch } from '../services/api';
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, MessageSquare, Calendar, Calculator, Send, Copy, Check } from 'lucide-react';
import { WhatsAppIcon } from './SocialIcons';
import {
  LeadType,
  Property,
  CustomerLead,
  PropertyCategory,
  LocalityProfile,
} from '../types/realestate';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface CustomerLeadsModalProps {
  isOpen: boolean;
  initialTab: LeadType;
  selectedPropertyId?: string;
  properties: Property[];
  localities: LocalityProfile[];
  onClose: () => void;
  onLeadSubmitted: (lead: CustomerLead) => void;
}

export const CustomerLeadsModal: React.FC<CustomerLeadsModalProps> = ({
  isOpen,
  initialTab,
  selectedPropertyId,
  properties,
  localities,
  onClose,
  onLeadSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<LeadType>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyId, setPropertyId] = useState(selectedPropertyId || properties[0]?.id || '');
  const [financingType, setFinancingType] = useState('All-Cash Principal');
  const [message, setMessage] = useState('');

  // Schedule Visit fields
  const [preferredDate, setPreferredDate] = useState('2026-10-03');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('16:30 (Golden Hour Viewing)');
  const [visitMode, setVisitMode] = useState<'In-Person Private Tour' | 'Live Video Walkthrough'>(
    'In-Person Private Tour'
  );

  // Property Valuation fields
  const [valLocality, setValLocality] = useState(localities[0]?.name || 'Tribeca & SoHo');
  const [valCategory, setValCategory] = useState<PropertyCategory>('Penthouse');
  const [valArea, setValArea] = useState(3800);
  const [valBedrooms, setValBedrooms] = useState(4);
  const [valCondition, setValCondition] = useState<
    'Museum Grade / New' | 'Architecturally Restored' | 'Original / Needs Work'
  >('Architecturally Restored');
  const [valTimeline, setValTimeline] = useState('Within 3 Months');

  // WhatsApp fields
  const [whatsappContext, setWhatsappContext] = useState(
    'Requesting private dossier, floorplans, and immediate viewing availability.'
  );
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedLead, setSubmittedLead] = useState<CustomerLead | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setSubmittedLead(null);
    setErrorMsg('');
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  if (!isOpen) return null;

  const selectedProperty = properties.find((p) => p.id === propertyId);

  // Compute live valuation estimate
  const locObj = localities.find((l) => l.name === valLocality);
  const baseSqFt = locObj ? locObj.avgPricePerSqFt : 19000;
  const catMult =
    valCategory === 'Estate'
      ? 1.18
      : valCategory === 'Penthouse'
      ? 1.14
      : valCategory === 'Waterfront'
      ? 1.12
      : valCategory === 'Villa'
      ? 1.08
      : 1.0;
  const condMult =
    valCondition === 'Museum Grade / New'
      ? 1.12
      : valCondition === 'Architecturally Restored'
      ? 1.04
      : 0.88;
  const bedBonus = Math.max(0, (valBedrooms - 3) * 0.025);
  const estPerSqFt = Math.round(baseSqFt * catMult * condMult * (1 + bedBonus));
  const estTotalValue = Math.round(estPerSqFt * (valArea || 1000));
  const estLow = Math.round(estTotalValue * 0.95);
  const estHigh = Math.round(estTotalValue * 1.05);
  const estRangeText = `${formatCurrency(estLow, true)} – ${formatCurrency(estHigh, true)}`;

  const validateInputs = () => {
    if (!name.trim()) return 'Please provide your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please provide a valid email address.';
    }
    if (phone.trim().length < 7) {
      return 'Please provide a valid telephone or WhatsApp number.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateInputs();
    if (validationErr) {
      setErrorMsg(validationErr);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload: Partial<CustomerLead> = {
      type: activeTab,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      propertyId: activeTab !== 'Property Valuation' ? selectedProperty?.id : undefined,
      propertyTitle: activeTab !== 'Property Valuation' ? selectedProperty?.title : undefined,
      message: message.trim() || undefined,
    };

    if (activeTab === 'Property Inquiry') {
      payload.financingType = financingType;
    } else if (activeTab === 'Schedule Visit') {
      payload.preferredDate = preferredDate;
      payload.preferredTimeSlot = preferredTimeSlot;
      payload.visitMode = visitMode;
    } else if (activeTab === 'Property Valuation') {
      payload.valuationDetails = {
        locality: valLocality,
        category: valCategory,
        areaSqFt: valArea,
        bedrooms: valBedrooms,
        condition: valCondition,
        estimatedValue: estTotalValue,
        estimatedRange: estRangeText,
        timeline: valTimeline,
      };
    } else if (activeTab === 'WhatsApp Contact') {
      payload.whatsappContext = whatsappContext;
    }

    try {
      const response = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request.');
      }

      const created: CustomerLead = await response.json();
      onLeadSubmitted(created);
      setSubmittedLead(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit request at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappFormattedText = `Hello Trinetra Realty Desk, I am ${
    name || '[Principal Name]'
  }. Regarding ${selectedProperty ? `${selectedProperty.title} (${selectedProperty.code})` : 'your portfolio'}: ${whatsappContext}`;

  const tabs: Array<{ id: LeadType; label: string }> = [
    { id: 'Property Inquiry', label: 'Property Inquiry' },
    { id: 'Schedule Visit', label: 'Schedule Visit' },
    { id: 'Property Valuation', label: 'Property Valuation' },
    { id: 'WhatsApp Contact', label: 'WhatsApp Contact' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leads-modal-title"
    >
      <div className="bg-[#FBFBF9] border border-stone-300 w-full max-w-2xl overflow-hidden shadow-2xl my-auto sm:my-8 max-h-[92vh] flex flex-col rounded-sm">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-[#F3F2EE] border-b border-stone-200 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] sm:text-xs text-[#615E59] tracking-wide">
              Trinetra Realty · Business Owners: Rahul Khatri &amp; Rohit Joon
            </p>
            <h2
              id="leads-modal-title"
              className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413] mt-0.5"
            >
              Customer Leads &amp; Concierge Dispatch
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Modal"
            className="p-2 text-[#57534E] hover:text-[#141413] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Interactive Segmented Lead Type Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-stone-200 bg-[#F3F2EE]/50 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSubmittedLead(null);
                setErrorMsg('');
              }}
              className={`px-2 sm:px-3 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium text-center border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#141413] bg-[#FBFBF9] text-[#141413] font-semibold'
                  : 'border-transparent text-[#615E59] hover:text-[#141413]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {submittedLead ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#1E3A2F] mx-auto stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-xs text-[#615E59] font-mono-tabular">
                  Reference ID: {submittedLead.id} · Recorded in Admin CRM
                </p>
                <h3 className="font-serif-display text-3xl font-semibold text-[#141413]">
                  {submittedLead.type} Confirmed
                </h3>
                <p className="text-sm text-[#57534E] max-w-md mx-auto">
                  Thank you, {submittedLead.name}. A Senior Managing Partner has been assigned to your dossier and will respond via {submittedLead.email}.
                </p>
              </div>

              {submittedLead.type === 'Property Valuation' && submittedLead.valuationDetails && (
                <div className="bg-[#F3F2EE] border border-stone-200 p-5 max-w-md mx-auto text-left space-y-2">
                  <div className="text-xs text-[#615E59]">Algorithmic Benchmark Valuation</div>
                  <div className="font-mono-tabular text-2xl font-semibold text-[#1E3A2F]">
                    {submittedLead.valuationDetails.estimatedRange}
                  </div>
                  <div className="text-xs text-[#57534E]">
                    {submittedLead.valuationDetails.locality} · {submittedLead.valuationDetails.category} ·{' '}
                    {submittedLead.valuationDetails.areaSqFt.toLocaleString()} sq.ft.
                  </div>
                </div>
              )}

              {submittedLead.type === 'WhatsApp Contact' && (
                <div className="bg-[#F3F2EE] border border-stone-200 p-4 max-w-md mx-auto text-left space-y-3">
                  <div className="text-xs font-medium text-[#141413]">
                    Direct WhatsApp Concierge Message Ready:
                  </div>
                  <p className="text-xs text-[#57534E] italic bg-white p-3 border border-stone-200">
                    "{whatsappFormattedText}"
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                    <a
                      href={`https://wa.me/919186221008?text=${encodeURIComponent(whatsappFormattedText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors cursor-pointer rounded-xs w-full sm:w-auto"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp Rahul (+91 9186221008)</span>
                    </a>
                    <a
                      href={`https://wa.me/919034969308?text=${encodeURIComponent(whatsappFormattedText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors cursor-pointer rounded-xs w-full sm:w-auto"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp Rohit (+91 9034969308)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappFormattedText);
                        setCopiedWhatsApp(true);
                        setTimeout(() => setCopiedWhatsApp(false), 2500);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-300 text-[#141413] hover:bg-stone-50 cursor-pointer w-full sm:w-auto"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSubmittedLead(null)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium border border-stone-300 text-[#141413] hover:border-[#141413] cursor-pointer text-center"
                >
                  Submit Another Request
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium bg-[#141413] text-white hover:bg-[#292524] cursor-pointer text-center"
                >
                  Return to Platform
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Common Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1.5">
                    Principal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Victoria Sterling"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="v.sterling@familyoffice.com"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1.5">
                    Direct Phone / WhatsApp *
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

              {/* Property Selection for Inquiry / Visit / WhatsApp */}
              {activeTab !== 'Property Valuation' && (
                <div>
                  <label className="block text-xs font-medium text-[#141413] mb-1.5">
                    Subject Residence
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title} ({p.locality} ·{' '}
                        {p.transactionType === 'Rent'
                          ? `${formatCurrency(p.price)}/mo`
                          : formatCurrency(p.price)}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* TAB 1: Property Inquiry Specific Fields */}
              {activeTab === 'Property Inquiry' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1.5">
                      Acquisition / Financing Structure
                    </label>
                    <select
                      value={financingType}
                      onChange={(e) => setFinancingType(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    >
                      <option value="All-Cash Principal">All-Cash Principal</option>
                      <option value="Private Bank Financing (60% LTV)">
                        Private Bank Financing (60% LTV)
                      </option>
                      <option value="1031 Tax-Deferred Exchange">1031 Tax-Deferred Exchange</option>
                      <option value="Corporate / Diplomatic Lease">
                        Corporate / Diplomatic Lease
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1.5">
                      Specific Dossier & Due Diligence Requests
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Request architectural floorplans, offering plan, tax history, or private disclosures..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Schedule Visit Specific Fields */}
              {activeTab === 'Schedule Visit' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Time Window
                      </label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="10:30 (Morning Natural Light)">
                          10:30 (Morning Natural Light)
                        </option>
                        <option value="14:00 (Afternoon Viewing)">14:00 (Afternoon Viewing)</option>
                        <option value="16:30 (Golden Hour Viewing)">
                          16:30 (Golden Hour Viewing)
                        </option>
                        <option value="19:00 (Evening Illumination)">
                          19:00 (Evening Illumination)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Viewing Format
                      </label>
                      <select
                        value={visitMode}
                        onChange={(e) =>
                          setVisitMode(
                            e.target.value as 'In-Person Private Tour' | 'Live Video Walkthrough'
                          )
                        }
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="In-Person Private Tour">In-Person Private Tour</option>
                        <option value="Live Video Walkthrough">Live Video Walkthrough</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1.5">
                      Attending Principals / Art or Architectural Advisors
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Let us know if your architect, security detail, or family office representative will accompany you..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Property Valuation Specific Fields */}
              {activeTab === 'Property Valuation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F3F2EE] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-[#615E59]">
                        Real-Time Algorithmic Market Benchmark
                      </div>
                      <div className="font-mono-tabular text-2xl font-semibold text-[#1E3A2F] mt-0.5">
                        {estRangeText}
                      </div>
                      <div className="text-xs text-[#57534E] font-mono-tabular mt-0.5">
                        Midpoint: {formatCurrency(estTotalValue)} (₹{formatNumber(estPerSqFt)}/sq.ft.)
                      </div>
                    </div>
                    <div className="text-xs text-[#615E59] sm:text-right">
                      <div>Locality Index: ₹{formatNumber(baseSqFt)}/sq.ft.</div>
                      <div>Category: {valCategory}</div>
                      <div>Condition: {valCondition}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Locality / District
                      </label>
                      <select
                        value={valLocality}
                        onChange={(e) => setValLocality(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        {localities.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Property Typology
                      </label>
                      <select
                        value={valCategory}
                        onChange={(e) => setValCategory(e.target.value as PropertyCategory)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="Penthouse">Penthouse</option>
                        <option value="Villa">Villa</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Waterfront">Waterfront</option>
                        <option value="Estate">Estate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Interior Area (Sq.Ft.)
                      </label>
                      <input
                        type="number"
                        min={500}
                        max={35000}
                        step={100}
                        value={valArea}
                        onChange={(e) => setValArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none font-mono-tabular"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={valBedrooms}
                        onChange={(e) => setValBedrooms(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Architectural Condition
                      </label>
                      <select
                        value={valCondition}
                        onChange={(e) => setValCondition(e.target.value as any)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="Museum Grade / New">Museum Grade / New</option>
                        <option value="Architecturally Restored">Architecturally Restored</option>
                        <option value="Original / Needs Work">Original / Needs Work</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141413] mb-1.5">
                        Disposition Timeline
                      </label>
                      <select
                        value={valTimeline}
                        onChange={(e) => setValTimeline(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                      >
                        <option value="Immediate Mandate">Immediate Mandate</option>
                        <option value="Within 3 Months">Within 3 Months</option>
                        <option value="Within 6–12 Months">Within 6–12 Months</option>
                        <option value="Portfolio Appraisal Only">Portfolio Appraisal Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WhatsApp Contact Specific Fields */}
              {activeTab === 'WhatsApp Contact' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F3F2EE] border border-stone-200 space-y-2">
                    <div className="text-xs font-semibold text-[#1E3A2F]">
                      Direct WhatsApp Advisory Desk · Business Owners: Rahul Khatri (+91 9186221008) · Rohit Joon (+91 9034969308)
                    </div>
                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Submitting this form logs your priority WhatsApp dispatch directly in our Admin CRM and prepares an instant encrypted message thread with our duty partner.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141413] mb-1.5">
                      WhatsApp Priority Topic
                    </label>
                    <textarea
                      rows={3}
                      value={whatsappContext}
                      onChange={(e) => setWhatsappContext(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Footer */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-4">
                <span className="text-xs text-[#615E59]">
                  Strict confidentiality guaranteed under NDA protocol.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-medium text-[#57534E] hover:text-[#141413] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold bg-[#141413] text-white hover:bg-[#1E3A2F] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {activeTab === 'Property Inquiry' && <MessageSquare className="w-3.5 h-3.5" />}
                    {activeTab === 'Schedule Visit' && <Calendar className="w-3.5 h-3.5" />}
                    {activeTab === 'Property Valuation' && <Calculator className="w-3.5 h-3.5" />}
                    {activeTab === 'WhatsApp Contact' && <Send className="w-3.5 h-3.5" />}
                    <span>
                      {submitting ? 'Recording Dossier...' : `Submit ${activeTab}`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
