import { VideoBackground } from '@/components/landing/VideoBackground'
import { EnergyHero } from '@/components/landing/EnergyHero'
import { HackCategories } from '@/components/landing/HackCategories'
import { TransformationStats } from '@/components/landing/TransformationStats'

export default async function HomePage() {
  return (
    <>
      {/* Video Background covers the entire page */}
      <VideoBackground />

      {/* Main Content */}
      <div className="relative">
        {/* Hero Section */}
        <EnergyHero />

        {/* Stats Section */}
        <TransformationStats />

        {/* Categories Section */}
        <HackCategories />

        {/* Additional CTA Section */}
        <section className="py-20 px-4 bg-black/60 backdrop-blur-md">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Transform Your Energy?
            </h2>
            <p className="text-xl text-white/70">
              Join thousands who are already experiencing breakthrough results
            </p>
            <div className="pt-8">
              <a
                href="/auth"
                className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-pink-500/25"
              >
                Start Your Free Journey Today
                <span className="text-2xl">→</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}