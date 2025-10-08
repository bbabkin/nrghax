'use client';

import { useEffect, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { useRef } from 'react';
import { Users, Zap, Trophy, Calendar } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 10000,
    suffix: '+',
    label: 'Lives Transformed',
    color: 'from-blue-500 to-purple-500'
  },
  {
    icon: Zap,
    value: 500,
    suffix: '+',
    label: 'Energy Hacks',
    color: 'from-orange-500 to-pink-500'
  },
  {
    icon: Trophy,
    value: 95,
    suffix: '%',
    label: 'Report Increased Confidence',
    color: 'from-green-500 to-teal-500'
  },
  {
    icon: Calendar,
    value: 30,
    suffix: ' Days',
    label: 'To First Breakthrough',
    color: 'from-purple-500 to-pink-500'
  }
];

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(value * progress));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function TransformationStats() {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-black/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Join the Energy Revolution
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Thousands are transforming their lives with simple daily practices
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-all duration-300">
                  {/* Gradient glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300 blur-xl`} />

                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-br ${stat.color} mb-4 relative`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Number */}
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 relative">
                    <AnimatedCounter value={stat.value} />
                    <span>{stat.suffix}</span>
                  </div>

                  {/* Label */}
                  <p className="text-white/60 text-sm relative">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonial or CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <blockquote className="max-w-3xl mx-auto">
            <p className="text-xl text-white/80 italic mb-4">
              &ldquo;NRGHax changed my life. The daily energy practices helped me overcome social anxiety
              and build the confidence to start my own business. 30 days was all it took.&rdquo;
            </p>
            <footer className="text-white/60">
              — Sarah K., Entrepreneur
            </footer>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}