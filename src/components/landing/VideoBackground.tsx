'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoBackgroundProps {
  videoUrl?: string;
  posterUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export function VideoBackground({
  videoUrl = '/videos/energy-loop.mp4', // We'll need to add this video
  posterUrl = '/images/energy-poster.jpg', // Fallback poster image
  className = '',
  children
}: VideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // For now, using a gradient background as we don't have a video yet
  // In production, you would add actual video files to public/videos/
  const fallbackGradient = (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 animate-gradient-shift">
      {/* Animated energy particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            initial={{
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1920,
              y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1080
            }}
            animate={{
              y: -20,
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1920
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 overflow-hidden -z-10 ${className}`}>
      {/* For mobile or when video isn't available, show animated gradient */}
      {isMobile || !videoUrl ? (
        fallbackGradient
      ) : (
        <>
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterUrl}
            onLoadedData={() => setIsVideoLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: isVideoLoaded ? 'block' : 'none' }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl.replace('.mp4', '.webm')} type="video/webm" />
          </video>

          {/* Show gradient while video loads */}
          <AnimatePresence>
            {!isVideoLoaded && fallbackGradient}
          </AnimatePresence>
        </>
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Gradient overlay for more visual interest */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}