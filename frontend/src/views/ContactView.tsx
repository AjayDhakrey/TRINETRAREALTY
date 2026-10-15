import React, { useState } from 'react';
import {
  Send,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import type { Property, CustomerLead, LeadType } from '../types/realestate';
import { apiFetch } from '../services/api';
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  GoogleMapsIcon,
} from '../components/SocialIcons';

export interface ContactViewProps {
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
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E3A2F]/10 text-[#1E3A2F] text-xs font-semibold tracking-wider uppercase rounded-full">
            Get in Touch · Trinetra Realty
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#141413]">
            Trinetra Realty
          </h1>
          <p className="font-serif-display text-xl sm:text-2xl text-[#1E3A2F] italic">
            Your Future, Our Focus.
          </p>
          <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-[#1E3A2F]/10 via-[#D4AF6A]/20 to-[#1E3A2F]/10 border border-[#D4AF6A]/50 text-xs rounded-sm shadow-2xs">
            <span className="font-semibold text-[#1E3A2F] uppercase tracking-wider text-[11px]">Business Owners:</span>
            <span className="font-owner-brand font-bold text-[#141413] text-sm tracking-wide">Rahul Khatri</span>
            <span className="text-[#D4AF6A] text-xs">✦</span>
            <span className="font-owner-brand font-bold text-[#141413] text-sm tracking-wide">Rohit Joon</span>
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
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/trinetra-logo-symbol.png"
                  alt="Trinetra Realty Logo"
                  className="h-10 sm:h-11 w-auto object-contain shrink-0"
                />
                <div>
                  <h3 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#141413]">
                    Trinetra Realty
                  </h3>
                  <p className="text-xs text-[#57534E] font-medium pt-0.5">
                    Business Owners: <span className="font-owner-brand font-bold text-[#141413] tracking-wide text-xs sm:text-sm">Rahul Khatri</span> &amp; <span className="font-owner-brand font-bold text-[#141413] tracking-wide text-xs sm:text-sm">Rohit Joon</span>
                  </p>
                </div>
              </div>
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
              <div className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-sm space-y-2 hover:border-[#D4AF6A] transition-colors shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">Business Owner</span>
                  <span className="text-[#1E3A2F] font-medium text-[11px]">Advisory Partner</span>
                </div>
                <div className="font-owner-brand text-lg sm:text-xl font-bold text-[#141413] tracking-wide text-emerald-950">
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
              <div className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-sm space-y-2 hover:border-[#D4AF6A] transition-colors shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">Business Owner</span>
                  <span className="text-[#1E3A2F] font-medium text-[11px]">Managing Partner</span>
                </div>
                <div className="font-owner-brand text-lg sm:text-xl font-bold text-[#141413] tracking-wide text-emerald-950">
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
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/trinetra-logo-symbol.png"
                alt="Trinetra Realty Logo"
                className="h-9 sm:h-10 w-auto object-contain shrink-0"
              />
              <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#141413]">
                Send an Enquiry
              </h2>
            </div>
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

