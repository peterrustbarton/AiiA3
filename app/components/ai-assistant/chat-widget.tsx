
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot,
  User,
  Loader2,
  MinusCircle,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { safeFormatTime } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatWidgetProps {
  className?: string
}

export function ChatWidget({ className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm AiiA, your AI investment assistant. I can help you understand trading concepts, market trends, and financial strategies. What would you like to learn about today?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages.slice(-5) // Keep last 5 messages for context
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error: any) {
      console.error('Chat error:', error)
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm AiiA, your AI investment assistant. I can help you understand trading concepts, market trends, and financial strategies. What would you like to learn about today?",
        timestamp: new Date()
      }
    ])
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 md:w-96"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="pb-3 space-y-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">AiiA Assistant</CardTitle>
                      <p className="text-xs text-muted-foreground">AI Trading Guide</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0">
                  <div className="h-80 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start space-x-2 ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-primary' 
                            : 'bg-secondary'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-3 w-3 text-primary-foreground" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                        </div>
                        <div className={`max-w-[240px] ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`rounded-lg px-3 py-2 text-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {message.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {safeFormatTime(message.timestamp, { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2"
                      >
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-3 w-3" />
                        </div>
                        <div className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about trading concepts..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Educational purposes only
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={clearChat}
                        className="text-xs h-6 px-2"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
