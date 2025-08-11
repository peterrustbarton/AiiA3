
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Dashboard } from '@/components/dashboard/dashboard'
import { ChatWidget } from '@/components/ai-assistant/chat-widget'

export default function HomePage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <MobileNav />
        <main className="pb-16 md:pb-0">
          <Dashboard />
        </main>
        {/* AI Assistant Bot - Floating Widget */}
        <ChatWidget />
      </div>
    </AuthWrapper>
  )
}
