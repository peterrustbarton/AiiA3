
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
        tradingMode: true,
        riskTolerance: true,
        maxPositionSize: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      tradingMode: user.tradingMode || 'PAPER',
      riskTolerance: user.riskTolerance || 'MEDIUM',
      maxPositionSize: user.maxPositionSize || 1000,
      alpacaConfigured: !!(process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY)
    })
  } catch (error) {
    console.error('Trading settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tradingMode, riskTolerance, maxPositionSize } = await request.json()

    // Validate trading mode
    if (!['PAPER', 'LIVE'].includes(tradingMode)) {
      return NextResponse.json({ error: 'Invalid trading mode' }, { status: 400 })
    }

    // Check if live trading is available
    if (tradingMode === 'LIVE' && (!process.env.ALPACA_API_KEY_ID || !process.env.ALPACA_API_SECRET_KEY)) {
      return NextResponse.json({ error: 'Live trading not configured' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        tradingMode,
        riskTolerance,
        maxPositionSize: parseFloat(maxPositionSize)
      }
    })

    return NextResponse.json({
      tradingMode: user.tradingMode,
      riskTolerance: user.riskTolerance,
      maxPositionSize: user.maxPositionSize,
      message: 'Trading settings updated successfully'
    })
  } catch (error) {
    console.error('Trading settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
