'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Zap,
  Users,
  Shield,
  Clock,
  TrendingUp,
  Heart,
  Target
} from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    title: 'Confidence Boosters',
    description: 'Power poses, affirmations, social challenges',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500',
    hacks: ['Power Stance', '2-Minute Rule', 'Eye Contact Challenge']
  },
  {
    title: 'Energy Optimizers',
    description: 'Morning routines, focus techniques, recovery hacks',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    hacks: ['5-5-5 Morning', 'Pomodoro Plus', 'Power Nap Protocol']
  },
  {
    title: 'Social Skills',
    description: 'Conversation starters, networking, charisma builders',
    icon: Users,
    color: 'from-blue-500 to-purple-500',
    hacks: ['FORD Method', 'Mirror Technique', 'Active Listening']
  },
  {
    title: 'Mental Strength',
    description: 'Resilience training, stress management, mindfulness',
    icon: Shield,
    color: 'from-green-500 to-teal-500',
    hacks: ['Box Breathing', 'Reframe Practice', 'Gratitude Reset']
  },
  {
    title: 'Productivity',
    description: 'Time management, flow states, habit formation',
    icon: Clock,
    color: 'from-purple-500 to-pink-500',
    hacks: ['Time Blocking', 'Deep Work Mode', '2-Day Rule']
  },
  {
    title: 'Emotional Intelligence',
    description: 'Self-awareness, empathy, relationship skills',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    hacks: ['Emotion Labeling', 'Empathy Map', 'Conflict Resolution']
  }
];

export function HackCategories() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Energy Hack Categories
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Discover proven techniques across six key areas of personal development
          </p>
        </motion.div>

        {/* Category Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.div
                key={category.title}
                variants={cardVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <Link href="/hacks">
                  <div className="h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${category.color} mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2">
                      {category.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-sm mb-4">
                      {category.description}
                    </p>

                    {/* Sample hacks */}
                    <div className="space-y-1">
                      {category.hacks.map((hack) => (
                        <div
                          key={hack}
                          className="text-xs text-white/40 flex items-center gap-2"
                        >
                          <Target className="w-3 h-3" />
                          {hack}
                        </div>
                      ))}
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-white/60 text-sm flex items-center gap-1">
                        Explore
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="/hacks"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <span>View all 500+ energy hacks</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}