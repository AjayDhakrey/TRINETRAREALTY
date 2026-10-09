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
      let autoExitTimer: number | undefined;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = false;
      video.playbackRate = 2.75; // Fast-forward complete 10s video to play in ~3.6 seconds

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
              if (video) {
                video.playbackRate = 2.75;
              }
              setIsVideoReady(true);
              // Complete video intro and transition to website in ~3.7 seconds
              autoExitTimer = window.setTimeout(() => {
                triggerCleanExit();
              }, 3750);
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
        if (autoExitTimer !== undefined) {
          window.clearTimeout(autoExitTimer);
        }
      };
    }, [triggerCleanExit]);

    const handleVideoReady = useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = 2.75;
      }
      setIsVideoReady(true);
    }, []);

    return (
      <div
        className={`tr-intro-overlay flex items-center justify-center p-3 sm:p-6 md:p-8 ${
          isFadingOut ? 'tr-intro-overlay--exiting' : 'tr-intro-overlay--active'
        }`}
        aria-label="Trinetra Realty Welcome Intro"
      >
        {/* Centered Cinema Frame: Optimized natural sizing for mobile phones and laptops */}
        <div className="relative w-full max-w-[94vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] aspect-video flex items-center justify-center mx-auto">
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
            className={`intro-video-no-controls w-full h-full object-contain object-center block m-0 p-0 border-0 outline-none pointer-events-none tr-intro-video ${
              isFadingOut
                ? 'tr-intro-video--exiting'
                : isVideoReady
                ? 'tr-intro-video--ready'
                : ''
            }`}
          />
        </div>

        {/* Subtle Edge Vignette */}
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

        {/* Bottom-Left Subtle Brand Reveal & Single Architectural Line (Shown on tablets & desktops) */}
        <div
          aria-hidden="true"
          className={`hidden sm:block fixed bottom-6 left-6 sm:bottom-9 sm:left-10 z-20 pointer-events-none max-w-xs sm:max-w-md tr-intro-brand ${
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

        {/* Subtle "Skip Intro" Control: Top-right on mobile for clean viewing, bottom-right on desktop */}
        <button
          type="button"
          onClick={handleSkipClick}
          aria-label="Skip Intro"
          className={`fixed top-4 right-4 sm:top-auto sm:bottom-8 sm:right-10 z-30 px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#E8D7B9]/90 hover:text-[#FBFBF9] bg-[#0B0C0E]/75 hover:bg-[#141413]/90 border border-[#D4AF6A]/35 hover:border-[#D4AF6A]/70 rounded-full sm:rounded-none transition-colors duration-200 cursor-pointer focus:outline-none ${
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
