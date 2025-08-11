
'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
