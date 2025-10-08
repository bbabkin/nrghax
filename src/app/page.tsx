import { EnergyHero } from '@/components/landing/EnergyHero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Energy Hacks - Psychology + Energy - Mysticism | NRGHAX',
  description: 'Your mind is someone else\'s real estate. Time to evict them. Learn practical energy techniques that work in 5 minutes. No gurus, no crystals, just results that you can feel immediately.',
  keywords: 'energy techniques without meditation, practical bioenergy techniques, energy work for beginners no mysticism, stop doom scrolling energy drain, digital detox techniques, control your energy without spirituality, psychology energy exercises, attention economy escape, social media energy drain, mental energy recovery techniques, NRGHAX',
  openGraph: {
    title: 'Energy Hacks - Stop Being Food for Algorithms | NRGHAX',
    description: 'Every app is designed to drain you. Here\'s how to fight back. Practical techniques that work immediately. No wellness BS.',
    url: 'https://nrghax.com',
    type: 'website',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Energy Hacks by NRGHAX - Transform Your Personal Energy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Energy Hacks - Take Back Control from Apps | NRGHAX',
    description: 'Tired of doom scrolling? Learn to control your own energy. 5-minute techniques that actually work. No crystals required.',
  },
  alternates: {
    canonical: 'https://nrghax.com',
  },
}

export default async function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://nrghax.com/#website',
        url: 'https://nrghax.com',
        name: 'NRGHAX - Energy Hacks',
        description: 'Science-backed energy hacks to transform your life',
        publisher: {
          '@id': 'https://nrghax.com/#organization'
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://nrghax.com/search?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': 'https://nrghax.com/#organization',
        name: 'NRGHAX',
        url: 'https://nrghax.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://nrghax.com/logo.png',
          width: 512,
          height: 512
        },
        description: 'Energy Hacks platform helping people transform their lives through science-backed techniques',
        sameAs: [
          'https://twitter.com/nrghax',
          'https://instagram.com/nrghax',
          'https://youtube.com/@nrghax'
        ]
      },
      {
        '@type': 'WebPage',
        '@id': 'https://nrghax.com/#webpage',
        url: 'https://nrghax.com',
        name: 'Energy Hacks - Science-Based Personal Energy Transformation | NRGHAX',
        isPartOf: {
          '@id': 'https://nrghax.com/#website'
        },
        about: {
          '@type': 'Thing',
          name: 'Energy Hacks and Biohacking'
        },
        description: 'Discover proven energy hacks to boost confidence, mental clarity, and social skills with science-backed daily practices.'
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Main Content */}
      <div className="relative">
        {/* Hero Section */}
        <EnergyHero />
      </div>
    </>
  )
}