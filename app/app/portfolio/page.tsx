
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PortfolioPage } from '@/components/portfolio/portfolio-page'

export default function Portfolio() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <PortfolioPage />
        </main>
      </div>
    </AuthWrapper>
  )
}
