

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

// Load environment variables
config()

const prisma = new PrismaClient()

async function createDemoUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('demo123', 12)
    
    // Create demo user
    const user = await prisma.user.upsert({
      where: { email: 'demo@aiia.com' },
      update: {},
      create: {
        email: 'demo@aiia.com',
        name: 'Demo User',
        password: hashedPassword,
        role: 'USER',
        disclaimerAccepted: true,
        tradingMode: 'PAPER',
        riskTolerance: 'MEDIUM',
        maxPositionSize: 1000.0,
        buyConfidenceThreshold: 75,
        sellConfidenceThreshold: 80,
        maxTradeAmountAuto: 500.0,
        maxTradesPerDay: 5,
        stopLossPercent: 5.0,
        takeProfitPercent: 10.0,
        requireManualConfirm: true
      }
    })
    
    console.log('Demo user created successfully:', user.email)
  } catch (error) {
    console.error('Error creating demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoUser()
