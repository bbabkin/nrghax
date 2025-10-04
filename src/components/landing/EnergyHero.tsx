'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const taglines = [
  "How much of your mind is yours?",
  "Learn to evict pestering thoughts",
  "5-minute energy recovery techniques that actually work.",
  "Stop feeding apps. Start feeding your mind.",
  "You won't need crystals or sound baths here.",
  "Like coffee, but without the crash.",
  "Maybe one day the science will catch up...",
];

export function EnergyHero() {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
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

        {/* Main headline with glitch effect on hover */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white relative group cursor-default"
        >
          <span className="relative inline-block">
            <span className="absolute inset-0 animate-glitch-1 text-pink-500 opacity-70">
              Energy Hacks
            </span>
            <span className="absolute inset-0 animate-glitch-2 text-cyan-500 opacity-70">
              Energy Hacks
            </span>
            <span className="relative z-10">Energy Hacks</span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/80 font-light"
        >
          Practical methods without the mysticism.
        </motion.h2>

        {/* Rotating taglines with typewriter effect */}
        <div className="h-16 md:h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTaglineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
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

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-pink-500/25 group"
          >
            <Link href="/hacks" aria-label="Get Started with Energy Hacks">
              {/* <PlugZap className="w-5 h-5 mr-2" aria-hidden="true" /> */}
              Jedi Time
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </Button>

          {/* <Button
            size="lg"
            variant="outline"
            asChild
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
          >
            <Link href="/hacks" aria-label="See What Actually Works">
              See The Techniques
            </Link>
          </Button> */}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}