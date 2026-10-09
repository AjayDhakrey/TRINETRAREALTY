import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ActiveRoute, LeadType } from '../types/realestate';

interface NavbarProps {
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute) => void;
  compareCount: number;
  leadsCount: number;
  isAdminAuthenticated: boolean;
  onOpenLeadModal: (defaultTab: LeadType, propertyId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  onNavigate,
  compareCount,
  onOpenLeadModal,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryLinks: Array<{ id: ActiveRoute; label: string }> = [
    { id: 'projects', label: 'Our Projects' },
    { id: 'search', label: 'Property Search' },
    { id: 'buy', label: 'Buy' },
    { id: 'rent', label: 'Rent' },
    { id: 'sell', label: 'Sell & Valuation' },
    { id: 'localities', label: 'Localities' },
  ];

  const secondaryLinks: Array<{ id: ActiveRoute; label: string }> = [
    {
      id: 'compare',
      label: compareCount > 0 ? `Property Comparison (${compareCount})` : 'Property Comparison',
    },
    { id: 'emi', label: 'EMI Calculator' },
    { id: 'blog', label: 'Editorial Blog' },
    { id: 'contact', label: 'Contact & Desks' },
  ];

  const handleNav = (route: ActiveRoute) => {
    onNavigate(route);
    setMoreOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBF9]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single text element wordmark + Official Golden Emblem */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 sm:gap-3 group shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A2F] cursor-pointer"
        >
          <img
            src="/trinetra-logo-symbol.png"
            alt="Trinetra Realty Official Logo"
            className="h-7 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <div className="flex flex-col text-left leading-tight">
            <span className="font-serif-display text-lg sm:text-2xl font-semibold tracking-tight text-[#141413]">
              Trinetra Realty
            </span>
            <span className="text-[8px] sm:text-[10px] tracking-[0.14em] sm:tracking-[0.16em] uppercase text-[#1E3A2F] font-semibold">
              Architectural Advisory
            </span>
          </div>
        </button>

        {/* Zone 2: 5 Primary Navigation Links + More Menu for Tools & Advisory */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          {primaryLinks.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-[#141413] border-[#141413]'
                    : 'border-transparent hover:text-[#141413] hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`flex items-center gap-1 whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 cursor-pointer ${
                ['compare', 'emi', 'blog', 'contact'].includes(activeRoute)
                  ? 'text-[#141413] border-[#141413]'
                  : 'border-transparent hover:text-[#141413]'
              }`}
            >
              <span>Tools & Advisory</span>
              {compareCount > 0 && (
                <span className="font-mono-tabular text-xs text-[#1E3A2F] font-semibold">
                  ({compareCount})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#FBFBF9] border border-stone-200 shadow-lg py-2 z-50">
                {secondaryLinks.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleNav(sub.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between whitespace-nowrap cursor-pointer ${
                      activeRoute === sub.id
                        ? 'bg-[#F3F2EE] text-[#141413] font-semibold'
                        : 'text-[#57534E] hover:bg-[#F3F2EE] hover:text-[#141413]'
                    }`}
                  >
                    <span>{sub.label}</span>
                  </button>
                ))}
                <div className="my-1.5 border-t border-stone-200/80" />
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onOpenLeadModal('Schedule Visit');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#1E3A2F] hover:bg-[#F3F2EE] whitespace-nowrap cursor-pointer"
                >
                  Schedule Private Visit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onOpenLeadModal('WhatsApp Contact');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#1E3A2F] hover:bg-[#F3F2EE] whitespace-nowrap cursor-pointer"
                >
                  WhatsApp Concierge Desk
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: 2 Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenLeadModal('Property Inquiry')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-[#141413] border border-stone-300 hover:border-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Client Desk
          </button>

          <button
            type="button"
            onClick={() => handleNav('admin')}
            className={`hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeRoute === 'admin'
                ? 'bg-[#1E3A2F] text-white'
                : 'bg-[#141413] text-white hover:bg-[#292524]'
            }`}
          >
            Admin Panel
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 text-[#141413] hover:bg-stone-100 rounded-sm cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Secondary Quick-Access Bar on Desktop for Instant 1-Click Discovery of All Modules */}
      <div className="hidden md:block border-t border-stone-200/60 bg-[#F3F2EE]/60">
        <div className="max-w-[1360px] mx-auto px-6 h-9 flex items-center justify-between text-xs text-[#57534E]">
          <div className="flex items-center gap-5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'home' ? 'text-[#141413] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Home
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => handleNav('projects')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'projects' || activeRoute === 'project-details'
                  ? 'text-[#141413] font-semibold underline underline-offset-4'
                  : 'text-[#1E3A2F] font-medium'
              }`}
            >
              Our Projects
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => handleNav('compare')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'compare' ? 'text-[#141413] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Property Comparison {compareCount > 0 ? `(${compareCount}/3)` : ''}
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => handleNav('emi')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'emi' ? 'text-[#141413] font-semibold underline underline-offset-4' : ''
              }`}
            >
              EMI Calculator
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => handleNav('blog')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'blog' ? 'text-[#141413] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Blog & Market Ledger
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => handleNav('contact')}
              className={`whitespace-nowrap hover:text-[#141413] transition-colors cursor-pointer ${
                activeRoute === 'contact' ? 'text-[#141413] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Contact
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onOpenLeadModal('Property Inquiry')}
              className="hover:text-[#141413] transition-colors whitespace-nowrap cursor-pointer"
            >
              Property Inquiry
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => onOpenLeadModal('Schedule Visit')}
              className="hover:text-[#141413] transition-colors whitespace-nowrap cursor-pointer"
            >
              Schedule Visit
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => onOpenLeadModal('Property Valuation')}
              className="hover:text-[#141413] transition-colors whitespace-nowrap cursor-pointer"
            >
              Property Valuation
            </button>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => onOpenLeadModal('WhatsApp Contact')}
              className="text-[#1E3A2F] font-medium hover:underline whitespace-nowrap cursor-pointer"
            >
              WhatsApp Contact
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FBFBF9] border-b border-stone-200 px-6 py-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
            <img
              src="/trinetra-logo-symbol.png"
              alt="Trinetra Realty Logo"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="font-serif-display text-lg font-semibold text-[#141413]">
                Trinetra Realty
              </div>
              <div className="text-[10px] tracking-wider uppercase text-[#1E3A2F] font-semibold">
                Your Future, Our Focus.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'home' as ActiveRoute, label: 'Home' },
              ...primaryLinks,
              ...secondaryLinks,
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-left px-3 py-2 text-sm border ${
                  activeRoute === item.id
                    ? 'border-[#141413] bg-[#F3F2EE] font-semibold text-[#141413]'
                    : 'border-stone-200 text-[#57534E]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLeadModal('Property Inquiry');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#F3F2EE] text-[#141413] cursor-pointer"
            >
              Property Inquiry
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLeadModal('Schedule Visit');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#F3F2EE] text-[#141413] cursor-pointer"
            >
              Schedule Visit
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLeadModal('WhatsApp Contact');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#1E3A2F] text-white cursor-pointer"
            >
              WhatsApp Contact
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleNav('admin');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#141413] text-white cursor-pointer"
            >
              Admin Panel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
