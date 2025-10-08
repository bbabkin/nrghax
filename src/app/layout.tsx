import type { Metadata } from 'next'
import { Nunito, Montserrat } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { NavbarWrapper } from '@/components/navbar-wrapper'
import { Footer } from '@/components/Footer'
import { ThemeScript } from '@/components/theme-script'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Energy Hacks - Practical Energy Control Without the BS | NRGHAX',
  description: 'Tired of feeling drained by social media? Learn practical energy techniques that actually work. No gurus, no crystals, just real results in 5 minutes. Take back control from the algorithms.',
  keywords: 'energy techniques without meditation, stop feeling drained from social media, practical energy exercises, control your energy without spirituality, psychology energy techniques, bioenergy for beginners no mysticism, NRGHAX, digital detox energy, attention economy escape',
  authors: [{ name: 'NRGHAX Team' }],
  creator: 'NRGHAX',
  publisher: 'NRGHAX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nrghax.com'),
  openGraph: {
    title: 'Energy Hacks - Your Mind Is Someone Else\'s Real Estate | NRGHAX',
    description: 'Every app feeds on your energy. Here\'s how to take it back. Practical techniques that work in 5 minutes. No mysticism.',
    url: 'https://nrghax.com',
    siteName: 'NRGHAX - Energy Hacks',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NRGHAX - Energy Hacks for Life Transformation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Energy Hacks - Stop Being Algorithm Food | NRGHAX',
    description: 'Algorithms eat your energy. Learn to starve them out. Real techniques, real results, no BS.',
    creator: '@nrghax',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://nrghax.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${nunito.variable} ${montserrat.variable} font-sans min-h-screen flex flex-col`}>
        <NavbarWrapper />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}