'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import '@/styles/glitch.css';

const taglines = [
  "How much of your mind is actually yours?",
  "Learn to evict pestering thoughts.",
  "5-minute energy recovery techniques that actually work.",
  "Stop feeding algorithms. Start feeding your mind.",
  "No need for crystals or sound baths here.",
  "Like coffee, but without the crash.",
  "Charisma, confidence, and control, step by step.",
  "Maybe one day science will catch up.",
];

export function EnergyHero() {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);

  // Hide navbar and footer on home page
  useEffect(() => {
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');

    if (navbar) {
      (navbar as HTMLElement).style.display = 'none';
    }
    if (footer) {
      (footer as HTMLElement).style.display = 'none';
    }

    return () => {
      if (navbar) {
        (navbar as HTMLElement).style.display = '';
      }
      if (footer) {
        (footer as HTMLElement).style.display = '';
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#fb0] dark:bg-black">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        {/* Floating badge */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">No Gurus. No Crystals. Just Results.</span>
        </motion.div> */}

        {/* Main headline - black in light, orange with glitch in dark */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: 0.6, delay: 0.1 },
            y: { duration: 0.6, delay: 0.1 }
          }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold relative group cursor-default text-black dark:text-[#fb0]"
        >
          <span className="relative inline-block">
            {/* Glitch layers - only visible in dark mode */}
            <span className="hidden dark:block absolute inset-0 animate-glitch-1 text-white opacity-70">
              Energy Hacks
            </span>
            <span className="hidden dark:block absolute inset-0 animate-glitch-2 text-purple-500 opacity-70">
              Energy Hacks
            </span>
            <span className="relative z-10">Energy Hacks</span>
          </span>
        </motion.h1>

        {/* Subtitle - black in light, orange in dark */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-light text-black dark:text-[#fb0]"
        >
          Practical bio-energy methods without the mysticism.
        </motion.h2>

        {/* Rotating taglines - purple for both themes */}
        <div className="h-16 md:h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTaglineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600"
            >
              {taglines[currentTaglineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Description */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto space-y-2"
        >
          <p>
            <strong className="text-white">Tired of feeling drained?</strong> Every app is designed to harvest your attention. Every platform feeds on your energy.
          </p>
          <p>
            Here&apos;s how to take it back. <strong className="text-white">Real techniques. Real results. Real fast.</strong> No wellness BS.
          </p>
        </motion.div> */}

        {/* Single CTA Button - Jedi Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center pt-8"
        >
          <Link
            href="/library"
            className="inline-flex items-center gap-3 px-12 py-5 text-xl font-bold text-black bg-[#fb0] hover:bg-[#fb0]/90 transition-all duration-300 shadow-lg glitch-cta-wrapper group"
            aria-label="Start your Jedi training"
          >
            <span className="glitch-cta" data-text="Jedi Time">
              Jedi Time
            </span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}