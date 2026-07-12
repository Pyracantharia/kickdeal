import AppHeader from '@/components/AppHeader'
import HeroSection from '@/components/HeroSection'
import BeforeAfterSection from '@/components/BeforeAfterSection'
import FeaturesSection from '@/components/FeaturesSection'
import ClubSection from '@/components/ClubSection'
import AgentSection from '@/components/AgentSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import PricingSection from '@/components/PricingSection'
import CtaSection from '@/components/CtaSection'
import AppFooter from '@/components/AppFooter'

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <HeroSection />
        <BeforeAfterSection />
        <FeaturesSection />
        <ClubSection />
        <AgentSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <AppFooter />
    </>
  )
}