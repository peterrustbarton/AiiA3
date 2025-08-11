

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        buyConfidenceThreshold: true,
        sellConfidenceThreshold: true,
        maxTradeAmountAuto: true,
        maxTradesPerDay: true,
        stopLossPercent: true,
        takeProfitPercent: true,
        requireManualConfirm: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      buyConfidenceThreshold: user.buyConfidenceThreshold || 75,
      sellConfidenceThreshold: user.sellConfidenceThreshold || 80,
      maxTradeAmountAuto: user.maxTradeAmountAuto || 500,
      maxTradesPerDay: user.maxTradesPerDay || 5,
      stopLossPercent: user.stopLossPercent || 5.0,
      takeProfitPercent: user.takeProfitPercent || 10.0,
      requireManualConfirm: user.requireManualConfirm !== false, // Default to true
    })
  } catch (error) {
    console.error('Automation settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      buyConfidenceThreshold, 
      sellConfidenceThreshold, 
      maxTradeAmountAuto, 
      maxTradesPerDay, 
      stopLossPercent, 
      takeProfitPercent, 
      requireManualConfirm 
    } = await request.json()

    // Validation
    if (buyConfidenceThreshold < 0 || buyConfidenceThreshold > 100) {
      return NextResponse.json({ error: 'Buy confidence threshold must be between 0-100' }, { status: 400 })
    }

    if (sellConfidenceThreshold < 0 || sellConfidenceThreshold > 100) {
      return NextResponse.json({ error: 'Sell confidence threshold must be between 0-100' }, { status: 400 })
    }

    if (maxTradeAmountAuto < 0) {
      return NextResponse.json({ error: 'Max trade amount must be positive' }, { status: 400 })
    }

    if (maxTradesPerDay < 0 || maxTradesPerDay > 100) {
      return NextResponse.json({ error: 'Max trades per day must be between 0-100' }, { status: 400 })
    }

    if (stopLossPercent < 0 || stopLossPercent > 50) {
      return NextResponse.json({ error: 'Stop loss must be between 0-50%' }, { status: 400 })
    }

    if (takeProfitPercent < 0 || takeProfitPercent > 100) {
      return NextResponse.json({ error: 'Take profit must be between 0-100%' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        buyConfidenceThreshold: parseInt(buyConfidenceThreshold),
        sellConfidenceThreshold: parseInt(sellConfidenceThreshold),
        maxTradeAmountAuto: parseFloat(maxTradeAmountAuto),
        maxTradesPerDay: parseInt(maxTradesPerDay),
        stopLossPercent: parseFloat(stopLossPercent),
        takeProfitPercent: parseFloat(takeProfitPercent),
        requireManualConfirm: requireManualConfirm === true
      }
    })

    return NextResponse.json({
      buyConfidenceThreshold: user.buyConfidenceThreshold,
      sellConfidenceThreshold: user.sellConfidenceThreshold,
      maxTradeAmountAuto: user.maxTradeAmountAuto,
      maxTradesPerDay: user.maxTradesPerDay,
      stopLossPercent: user.stopLossPercent,
      takeProfitPercent: user.takeProfitPercent,
      requireManualConfirm: user.requireManualConfirm,
      message: 'Automation settings updated successfully'
    })
  } catch (error) {
    console.error('Automation settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
