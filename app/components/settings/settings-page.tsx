
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  LogOut,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Bot
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AutomationSettings } from './automation-settings'

export function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    tradeExecutions: true,
    marketNews: false,
    emailAlerts: false
  })

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const SettingCard = ({ icon: Icon, title, description, children }: {
    icon: any
    title: string
    description: string
    children: React.ReactNode
  }) => (
    <Card className="border-muted bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="h-8 w-8 mr-3 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SettingCard
            icon={User}
            title="Account Information"
            description="View and manage your account details"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                </div>
                <Badge variant="outline">
                  {session?.user?.role || 'User'}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Account Type</p>
                <Badge variant="secondary">Simulated Trading</Badge>
              </div>
            </div>
          </SettingCard>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SettingCard
            icon={Palette}
            title="Appearance"
            description="Customize the look and feel of the application"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingCard>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SettingCard
            icon={Bell}
            title="Notifications"
            description="Configure how you want to be notified"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="price-alerts">Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when price targets are reached</p>
                </div>
                <Switch
                  id="price-alerts"
                  checked={notifications.priceAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, priceAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trade-executions">Trade Executions</Label>
                  <p className="text-sm text-muted-foreground">Notifications for completed trades</p>
                </div>
                <Switch
                  id="trade-executions"
                  checked={notifications.tradeExecutions}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, tradeExecutions: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="market-news">Market News</Label>
                  <p className="text-sm text-muted-foreground">Important market updates and news</p>
                </div>
                <Switch
                  id="market-news"
                  checked={notifications.marketNews}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, marketNews: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailAlerts: checked }))
                  }
                />
              </div>
            </div>
          </SettingCard>
        </motion.div>

        {/* Automation Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AutomationSettings />
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SettingCard
            icon={Shield}
            title="Privacy & Security"
            description="Manage your privacy and security preferences"
          >
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">Simulated Environment</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      This is a paper trading environment. No real money or personal financial data is at risk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingCard>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-medium text-orange-700 dark:text-orange-300">
                    Educational Purpose Only
                  </h3>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    AiiA 3.0 is designed for educational and simulation purposes only. This application provides 
                    AI-generated investment insights and allows paper trading with virtual money. Nothing in this 
                    application constitutes actual financial advice. Always consult with qualified financial 
                    professionals before making real investment decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-muted bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sign Out</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account
                  </p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
