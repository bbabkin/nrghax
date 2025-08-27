import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { Navbar } from '@/components/Navbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SkipLink } from '@/components/AccessibilityUtilities'
import './globals.css'

export const metadata: Metadata = {
  title: 'Supabase Auth Starter',
  description: 'Next.js application with Supabase authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <ErrorBoundary>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <SkipLink />
              <ErrorBoundary>
                <Navbar />
              </ErrorBoundary>
              <main id="main-content" className="flex-1" tabIndex={-1}>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}