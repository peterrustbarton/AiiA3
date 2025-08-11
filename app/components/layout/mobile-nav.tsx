'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  TrendingUp,
  Briefcase,
  Bell,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/analyze', label: 'Analyze', icon: Search },
  { href: '/market-movers', label: 'Market', icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Top Navigation - Desktop */}
      <div className="hidden md:flex sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between pt-[10px]">
          {/* Logo */}
          <Link href="/" className="h-full flex items-center">
            <div className="relative h-full aspect-[4/1]">
              <Image
                src="/images/aiia-logo.png"
                alt="AiiA Logo"
                fill
                style={{ objectFit: "contain", maxHeight: "80%" }}
                className="rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="flex h-14 items-center justify-betweenpt-[10px]">
          {/* Logo */}
          <Link href="/" className="h-full flex items-center">
            <div className="relative h-full aspect-[4/1]">
              <Image
                src="/images/aiia-logo.png"
                alt="AiiA Logo"
                fill
                style={{ objectFit: "contain", maxHeight: "80%" }}
                className="rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </Link>

          {/* Menu Button (optional, if Sheet is active) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 text-sm font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}