import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, ArrowLeftRight, ChevronRight, ChevronLeft, MessageCircle, X } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from './SocialIcons';

interface SocialLink {
  name: string;
  href: string;
  ariaLabel: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  hoverRotateClass: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties.',
    ariaLabel: 'Chat with Trinetra Realty on WhatsApp',
    title: 'Chat with Trinetra Realty on WhatsApp (+91 9186221008)',
    icon: WhatsAppIcon,
    bgClass: 'bg-[#25D366] hover:bg-[#20bd5a]',
    hoverRotateClass: 'group-hover:rotate-12',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/trinetrarealty_?stkn=MW52OXVra2cxcXhmaw==',
    ariaLabel: 'Follow Trinetra Realty on Instagram',
    title: 'Follow Trinetra Realty on Instagram (@trinetrarealty_)',
    icon: InstagramIcon,
    bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    hoverRotateClass: 'group-hover:rotate-6',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/share/1VBsJ1bSHk/',
    ariaLabel: 'Visit Trinetra Realty on Facebook',
    title: 'Visit Trinetra Realty on Facebook',
    icon: FacebookIcon,
    bgClass: 'bg-[#1877F2] hover:bg-[#166fe5]',
    hoverRotateClass: 'group-hover:rotate-6',
  },
];

const STORAGE_KEY = 'trinetra_floating_dock_prefs';

interface DockPrefs {
  side: 'right' | 'left';
  topPct: number; // percentage from top (e.g. 50 = middle)
  collapsed: boolean;
}

const DEFAULT_PREFS: DockPrefs = {
  side: 'right', // Default to right side to avoid blocking left-aligned reading and menus
  topPct: 50,
  collapsed: false,
};

export const FloatingSocialDock: React.FC = () => {
  // Check if current route is admin to guarantee it never renders on admin panel
  const [isAdminPath, setIsAdminPath] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname;
    const h = window.location.hash.toLowerCase();
    return p.startsWith('/admin') || h.includes('admin');
  });

  useEffect(() => {
    const checkRoute = () => {
      const p = window.location.pathname;
      const h = window.location.hash.toLowerCase();
      setIsAdminPath(p.startsWith('/admin') || h.includes('admin'));
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const [prefs, setPrefs] = useState<DockPrefs>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          side: parsed.side === 'left' ? 'left' : 'right',
          topPct: typeof parsed.topPct === 'number' ? Math.max(15, Math.min(85, parsed.topPct)) : 50,
          collapsed: Boolean(parsed.collapsed),
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFS;
  });

  const savePrefs = (updated: Partial<DockPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartPct = useRef(prefs.topPct);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartPct.current = prefs.topPct;
  };

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - dragStartY.current;
    const windowHeight = window.innerHeight;
    const deltaPct = (deltaY / windowHeight) * 100;
    const newPct = Math.max(12, Math.min(86, dragStartPct.current + deltaPct));
    setPrefs((prev) => ({ ...prev, topPct: newPct }));
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    savePrefs({ topPct: prefs.topPct });
  }, [isDragging, prefs.topPct]);

  // Global mouse & touch listeners during drag
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientY);
    };
    const onMouseUp = () => {
      handleDragEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleDragMove(e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Flip between right and left side
  const toggleSide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSide = prefs.side === 'right' ? 'left' : 'right';
    savePrefs({ side: newSide });
  };

  // Toggle collapsed / expanded state
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    savePrefs({ collapsed: !prefs.collapsed });
  };

  if (isAdminPath) {
    return null; // Strictly excluded from Admin Panel
  }

  const isRight = prefs.side === 'right';

  return (
    <aside
      ref={dockRef}
      aria-label="Adjustable Social Media Quick Links"
      style={{ top: `${prefs.topPct}%` }}
      className={`fixed -translate-y-1/2 z-40 select-none transition-transform pointer-events-auto ${
        isRight ? 'right-2.5 sm:right-4' : 'left-2.5 sm:left-4'
      }`}
    >
      {/* COLLAPSED FLOATING TRIGGER */}
      {prefs.collapsed ? (
        <button
          type="button"
          onClick={toggleCollapse}
          title="Click to expand Trinetra Social & WhatsApp Desk"
          aria-label="Expand Trinetra Social and WhatsApp Desk"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#141413]/95 hover:bg-[#1E3A2F] text-white text-xs font-semibold rounded-full shadow-2xl border border-stone-600/50 backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span className="text-[11px] font-sans hidden sm:inline">Connect</span>
          {isRight ? (
            <ChevronLeft className="w-3 h-3 text-stone-300 group-hover:-translate-x-0.5 transition-transform" />
          ) : (
            <ChevronRight className="w-3 h-3 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      ) : (
        /* EXPANDED ADJUSTABLE DOCK */
        <div
          className={`flex flex-col gap-2.5 sm:gap-3 ${
            isRight ? 'items-end' : 'items-start'
          }`}
        >
          {/* ADJUSTMENT CONTROLS BAR (DRAG HANDLE + FLIP SIDE + MINIMIZE) */}
          <div
            className={`flex items-center gap-1 bg-[#141413]/90 text-white rounded-full px-2 py-1 shadow-md border border-stone-700/60 backdrop-blur-md text-[10px] ${
              isRight ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Vertical Drag Handle */}
            <div
              role="slider"
              aria-label="Drag vertically to reposition social buttons"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                handleDragStart(e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) handleDragStart(e.touches[0].clientY);
              }}
              title="Click and drag up or down to adjust position on your screen"
              className={`flex items-center gap-0.5 px-1 py-0.5 text-stone-300 hover:text-white cursor-ns-resize transition-colors ${
                isDragging ? 'text-[#D4AF6A]' : ''
              }`}
            >
              <GripVertical className="w-3 h-3" />
              <span className="text-[9px] font-mono tracking-tighter uppercase hidden sm:inline">
                Move
              </span>
            </div>

            <span className="text-stone-600">|</span>

            {/* Switch Side (Left <-> Right) */}
            <button
              type="button"
              onClick={toggleSide}
              title={`Switch dock to ${isRight ? 'Left' : 'Right'} side`}
              aria-label={`Switch dock to ${isRight ? 'Left' : 'Right'} side`}
              className="p-1 text-stone-300 hover:text-[#D4AF6A] transition-colors cursor-pointer rounded-full"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>

            <span className="text-stone-600">|</span>

            {/* Minimize / Collapse */}
            <button
              type="button"
              onClick={toggleCollapse}
              title="Minimize social dock"
              aria-label="Minimize social dock"
              className="p-1 text-stone-300 hover:text-white transition-colors cursor-pointer rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* SOCIAL ACTION LINKS */}
          <div
            className={`flex flex-col gap-2.5 sm:gap-3 ${
              isRight ? 'items-end' : 'items-start'
            }`}
          >
            {SOCIAL_LINKS.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  title={item.title}
                  className={`group flex items-center h-10 sm:h-11 rounded-full text-white shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
                    item.bgClass
                  } ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Social Icon */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                    <IconComponent
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-300 ${item.hoverRotateClass}`}
                    />
                  </div>

                  {/* Social Name - expands smoothly on hover */}
                  <span
                    className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ease-out select-none ${
                      isRight
                        ? 'translate-x-2 group-hover:max-w-40 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pl-3.5 sm:group-hover:pl-4 group-hover:pr-0.5'
                        : '-translate-x-2 group-hover:max-w-40 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pr-3.5 sm:group-hover:pr-4 group-hover:pl-0.5'
                    }`}
                  >
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

