
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MarketMoversPage } from '@/components/market-movers/market-movers-page'

export default function MarketMovers() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <MarketMoversPage />
        </main>
      </div>
    </AuthWrapper>
  )
}
