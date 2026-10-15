import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ArchitecturalImage } from './ArchitecturalImage';

export interface LightboxPhoto {
  url: string;
  caption?: string;
  title?: string;
}

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: (LightboxPhoto | string)[];
  initialIndex?: number;
  title?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Normalize photos into standard LightboxPhoto objects
  const normalizedPhotos: LightboxPhoto[] = photos.map((item) => {
    if (typeof item === 'string') {
      return { url: item };
    }
    return item;
  });

  const total = normalizedPhotos.length;
  const currentPhoto = normalizedPhotos[currentIndex] || normalizedPhotos[0];

  // Update currentIndex when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, total - 1)));
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex, total]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXRef.current - touchEndX;
    const diffY = touchStartYRef.current - touchEndY;

    // Only swipe if horizontal move was significant and greater than vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* TOP CONTROLS BAR */}
      <div className="flex items-center justify-between p-3 sm:p-5 text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 max-w-[70%]">
          <div className="px-2.5 py-1 bg-white/10 border border-white/20 text-xs font-mono-tabular rounded-xs">
            {currentIndex + 1} / {total}
          </div>
          {title && (
            <div className="text-xs sm:text-sm font-medium text-stone-200 truncate hidden sm:block">
              {title}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            aria-label="Toggle photo zoom"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close photo viewer (Esc)"
            aria-label="Close photo viewer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-600/80 active:bg-rose-700 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* CENTER PHOTO VIEWPORT */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Previous button */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous photo (Left Arrow)"
            aria-label="Previous photo"
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Photo Container */}
        <div
          onClick={() => setIsZoomed((prev) => !prev)}
          className={`relative max-w-full max-h-[75vh] flex items-center justify-center transition-transform duration-200 cursor-${
            isZoomed ? 'zoom-out' : 'zoom-in'
          } ${isZoomed ? 'scale-125 sm:scale-150' : 'scale-100'}`}
        >
          <ArchitecturalImage
            src={currentPhoto.url}
            alt={currentPhoto.caption || title || `Photo ${currentIndex + 1}`}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xs shadow-2xl"
          />
        </div>

        {/* Next button */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next photo (Right Arrow)"
            aria-label="Next photo"
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* BOTTOM CAPTION & THUMBNAILS BAR */}
      <div className="p-3 sm:p-5 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent space-y-2.5">
        {/* Caption */}
        {currentPhoto.caption && (
          <p className="text-xs sm:text-sm text-center text-stone-200 font-light max-w-2xl mx-auto px-4 truncate">
            {currentPhoto.caption}
          </p>
        )}

        {/* Mobile Swipe / Tap Hint */}
        <div className="text-[10px] text-center text-white/50 sm:hidden">
          Swipe left/right to browse • Tap photo to zoom
        </div>

        {/* Thumbnail Strip */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 max-w-3xl mx-auto px-2">
            {normalizedPhotos.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 w-12 h-9 sm:w-16 sm:h-12 rounded-xs overflow-hidden border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-white opacity-100 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <ArchitecturalImage
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

