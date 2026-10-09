import React, { useEffect, useRef, useState, useCallback, memo } from 'react';

interface WelcomeIntroScreenProps {
  isFadingOut: boolean;
  onBeginFadeOut: () => void;
}

export const WelcomeIntroScreen: React.FC<WelcomeIntroScreenProps> = memo(
  ({ isFadingOut, onBeginFadeOut }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
    const hasTriggeredExitRef = useRef<boolean>(false);

    const triggerCleanExit = useCallback(() => {
      if (hasTriggeredExitRef.current) return;
      hasTriggeredExitRef.current = true;
      onBeginFadeOut();
    }, [onBeginFadeOut]);

    const handleSkipClick = useCallback(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
      triggerCleanExit();
    }, [triggerCleanExit]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      let blockedFallbackTimer: number | undefined;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = false;

      if (video.readyState >= 2) {
        setIsVideoReady(true);
      }

      try {
        video.currentTime = 0;
      } catch {
        // Ignore if stream metadata is still initializing
      }

      const startPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoReady(true);
            })
            .catch(() => {
              // Graceful handling if browser strictly blocks muted autoplay
              setIsVideoReady(true);
              blockedFallbackTimer = window.setTimeout(() => {
                triggerCleanExit();
              }, 1800);
            });
        }
      };

      startPlay();

      return () => {
        if (blockedFallbackTimer !== undefined) {
          window.clearTimeout(blockedFallbackTimer);
        }
      };
    }, [triggerCleanExit]);

    const handleVideoReady = useCallback(() => {
      setIsVideoReady(true);
    }, []);

    return (
      <div
        className={`tr-intro-overlay ${
          isFadingOut ? 'tr-intro-overlay--exiting' : 'tr-intro-overlay--active'
        }`}
        aria-label="Trinetra Realty Welcome Intro"
      >
        {/* Full-screen HTML5 Welcome Video — Plays ONCE, transitions on actual ended event */}
        <video
          ref={videoRef}
          src="/welcome-intro.mp4"
          poster="/welcome-poster.jpg"
          autoPlay
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          onEnded={triggerCleanExit}
          onError={triggerCleanExit}
          className={`intro-video-no-controls w-full h-full object-contain sm:object-cover object-center block m-0 p-0 border-0 outline-none pointer-events-none tr-intro-video ${
            isFadingOut
              ? 'tr-intro-video--exiting'
              : isVideoReady
              ? 'tr-intro-video--ready'
              : ''
          }`}
        />

        {/* Subtle Edge Vignette — Center kept completely clear */}
        <div
          aria-hidden="true"
          className="tr-intro-vignette absolute inset-0 z-10 pointer-events-none"
        />

        {/* Single Subtle Champagne Light Sweep across branding */}
        {isVideoReady && !isFadingOut && (
          <div
            aria-hidden="true"
            className="tr-intro-light-sweep absolute inset-0 z-10 pointer-events-none"
          />
        )}

        {/* Bottom-Left Subtle Brand Reveal & Single Architectural Line */}
        <div
          aria-hidden="true"
          className={`fixed bottom-6 left-6 sm:bottom-9 sm:left-10 z-20 pointer-events-none max-w-xs sm:max-w-md tr-intro-brand ${
            isFadingOut
              ? 'tr-intro-brand--exiting'
              : isVideoReady
              ? 'tr-intro-brand--visible'
              : ''
          }`}
        >
          <div className="tr-intro-arch-line h-px w-24 sm:w-36 bg-gradient-to-r from-[#D4AF6A]/70 via-[#D4AF6A]/25 to-transparent mb-2.5" />
          <div className="flex items-center gap-3">
            <img
              src="/trinetra-logo-symbol.png"
              alt="Trinetra Realty Logo"
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-md"
            />
            <div>
              <div className="font-serif-display text-sm sm:text-base tracking-[0.08em] text-[#FBFBF9]/95 font-medium leading-tight">
                Trinetra Realty
              </div>
              <div className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#D6CFC2]/75 mt-0.5">
                Architectural Residences &amp; Private Advisory
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right Subtle "Skip Intro" Control */}
        <button
          type="button"
          onClick={handleSkipClick}
          aria-label="Skip Intro"
          className={`fixed bottom-6 right-6 sm:bottom-9 sm:right-10 z-30 px-4 py-2 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#E8D7B9]/85 hover:text-[#FBFBF9] bg-[#0B0C0E]/60 hover:bg-[#141413]/85 border border-[#D4AF6A]/30 hover:border-[#D4AF6A]/65 transition-colors duration-250 ease-out cursor-pointer focus:outline-none ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          Skip Intro
        </button>
      </div>
    );
  }
);

WelcomeIntroScreen.displayName = 'WelcomeIntroScreen';
