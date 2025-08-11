
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { EnhancedAnalyzePage } from '@/components/analyze/enhanced-analyze-page'

export default function Analyze() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <EnhancedAnalyzePage />
        </main>
      </div>
    </AuthWrapper>
  )
}
