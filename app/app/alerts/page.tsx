
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { AlertsPage } from '@/components/alerts/alerts-page'

export default function Alerts() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <AlertsPage />
        </main>
      </div>
    </AuthWrapper>
  )
}
