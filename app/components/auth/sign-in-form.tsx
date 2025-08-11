
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Auto sign in after successful signup
      const result = await signIn('credentials', {
        email: signUpData.email,
        password: signUpData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Account created but sign in failed. Please try signing in manually.')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
  <div className="flex items-center justify-center">
  <Image
    src="/images/LOGO-AiiA-Login.png"
    alt="AiiA Logo"
    sizes="(max-width: 800px) 124px, (max-width: 1200px) 166px, 208px"
    width={208} // previously 160
    height={208}
    className="rounded-xl w-auto h-auto max-w-[280px] sm:max-w-[200px] xs:max-w-[150px]"
    onError={(e) => {
      e.currentTarget.style.display = 'none'
    }}
  />
</div>
  <p className="text-slate-400 text-sm sm:text-base md:text-lg">Your AI-powered investment assistant</p>
</div>



        {/* Auth Forms */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-700">
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-primary">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-primary">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mb-4 border-red-500 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                    onClick={async (e) => {
                      // Explicit handler for testing tool detection
                      console.log('Sign In button clicked')
                      
                      // Handle both validation and form submission in click handler
                      e.preventDefault()
                      if (!signInData.email || !signInData.password) {
                        setError('Please fill in all fields')
                        return
                      }
                      
                      // Create synthetic form event for handleSignIn
                      const syntheticEvent = {
                        preventDefault: () => {}
                      } as React.FormEvent
                      
                      await handleSignIn(syntheticEvent)
                    }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-white">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                    onClick={async (e) => {
                      // Handle both validation and form submission in click handler
                      e.preventDefault()
                      if (!signUpData.email || !signUpData.password || !signUpData.name) {
                        setError('Please fill in all required fields')
                        return
                      }
                      
                      // Create synthetic form event for handleSignUp
                      const syntheticEvent = {
                        preventDefault: () => {}
                      } as React.FormEvent
                      
                      await handleSignUp(syntheticEvent)
                    }}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-center text-xs text-slate-500 max-w-sm mx-auto">
          By using AiiA 3.0, you agree that this is for educational and simulation purposes only. 
          Not actual financial advice.
        </div>
      </div>
    </div>
  )
}
