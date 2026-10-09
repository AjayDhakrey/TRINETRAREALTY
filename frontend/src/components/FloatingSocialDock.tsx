import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from './SocialIcons';
import { GripHorizontal } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'trinetra_floating_dock_position';
const MARGIN = 12;

export const FloatingSocialDock: React.FC = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dockRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Initialize or restore position clamped to current window bounds
  const getClampedPosition = useCallback((x: number, y: number, dockWidth = 56, dockHeight = 180): Position => {
    const maxX = Math.max(MARGIN, window.innerWidth - dockWidth - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - dockHeight - MARGIN);
    return {
      x: Math.min(Math.max(MARGIN, x), maxX),
      y: Math.min(Math.max(MARGIN, y), maxY),
    };
  }, []);

  useEffect(() => {
    const dockEl = dockRef.current;
    const width = dockEl ? dockEl.offsetWidth || 56 : 56;
    const height = dockEl ? dockEl.offsetHeight || 180 : 180;

    let initialPos: Position;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialPos = getClampedPosition(parsed.x, parsed.y, width, height);
      } catch {
        initialPos = {
          x: window.innerWidth - width - MARGIN - 4,
          y: window.innerHeight - height - MARGIN - 12,
        };
      }
    } else {
      initialPos = {
        x: window.innerWidth - width - MARGIN - 4,
        y: window.innerHeight - height - MARGIN - 12,
      };
    }

    setPosition(initialPos);

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const currentW = dockRef.current ? dockRef.current.offsetWidth || 56 : 56;
        const currentH = dockRef.current ? dockRef.current.offsetHeight || 180 : 180;
        return getClampedPosition(prev.x, prev.y, currentW, currentH);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getClampedPosition]);

  // Pointer event handlers (smooth drag for mouse & touch screens)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to main button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (!position || !dockRef.current) return;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    hasMovedRef.current = false;

    // Capture pointer
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const width = dockRef.current ? dockRef.current.offsetWidth : 56;
      const height = dockRef.current ? dockRef.current.offsetHeight : 180;
      const newPos = getClampedPosition(
        dragStartRef.current.startX + deltaX,
        dragStartRef.current.startY + deltaY,
        width,
        height
      );
      setPosition(newPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      if (hasMovedRef.current && position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // Ignore storage errors
        }
      }
      dragStartRef.current = null;
      setIsDragging(false);

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    // If the visitor was dragging, cancel the click so the link doesn't open
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={dockRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: position
          ? `translate3d(${position.x}px, ${position.y}px, 0)`
          : undefined,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-50 select-none ${
        position ? 'opacity-100' : 'opacity-0'
      } ${
        isDragging
          ? 'cursor-grabbing transition-none scale-105 shadow-2xl'
          : 'transition-transform duration-100 cursor-grab'
      }`}
      aria-label="Adjustable Social Connect Icons. Drag anywhere on screen."
    >
      <div className="flex flex-col items-end gap-2 bg-stone-900/15 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl group/dock">
        {/* Drag Handle Gripper */}
        <div
          title="Drag to reposition anywhere on screen"
          className="w-full flex items-center justify-center py-0.5 text-stone-700 hover:text-stone-900 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripHorizontal className="w-4 h-4 text-stone-600/80 group-hover/dock:text-stone-900" />
        </div>

        {/* Instagram Icon */}
        <a
          href="https://www.instagram.com/trinetrarealty_?stkn=MW52OXVra2cxcXhmaw=="
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          aria-label="Follow Trinetra Realty on Instagram"
          title="Follow Trinetra Realty on Instagram (@trinetrarealty_)"
          className="flex items-center gap-2 p-3 sm:px-3.5 sm:py-2.5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white rounded-full shadow-md hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer group"
        >
          <InstagramIcon className="w-5 h-5 text-white shrink-0 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            Instagram
          </span>
        </a>

        {/* Facebook Icon */}
        <a
          href="https://www.facebook.com/share/1VBsJ1bSHk/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          aria-label="Visit Trinetra Realty on Facebook"
          title="Visit Trinetra Realty on Facebook"
          className="flex items-center gap-2 p-3 sm:px-3.5 sm:py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full shadow-md hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer group"
        >
          <FacebookIcon className="w-5 h-5 text-white shrink-0 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            Facebook
          </span>
        </a>

        {/* WhatsApp Icon */}
        <a
          href="https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties."
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          aria-label="Chat on WhatsApp"
          title="Chat with Trinetra Realty on WhatsApp (+91 9186221008)"
          className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-md hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer group"
        >
          <WhatsAppIcon className="w-5 h-5 text-white shrink-0 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            WhatsApp Desk
          </span>
        </a>
      </div>
    </div>
  );
};
