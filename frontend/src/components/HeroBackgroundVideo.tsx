import React, { useEffect, useRef, memo } from 'react';

export const HeroBackgroundVideo: React.FC = memo(() => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.playbackRate = 1.0;

    const startPlayback = () => {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay fallback handled silently by poster
          });
        }
      }
    };

    startPlayback();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPlayback();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src="/hero-property.mp4"
      poster="/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      aria-label="Trinetra Realty Architectural Residence Showcase Video"
      className="intro-video-no-controls absolute inset-0 z-0 w-full h-full object-cover object-[center_45%] sm:object-center block m-0 p-0 border-0 outline-none pointer-events-none select-none transform-gpu backface-hidden"
    />
  );
});

HeroBackgroundVideo.displayName = 'HeroBackgroundVideo';
