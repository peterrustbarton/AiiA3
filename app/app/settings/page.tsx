
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SettingsPage } from '@/components/settings/settings-page'

export default function Settings() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <SettingsPage />
        </main>
      </div>
    </AuthWrapper>
  )
}
