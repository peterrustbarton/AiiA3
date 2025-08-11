
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's automation settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        buyConfidenceThreshold: true,
        sellConfidenceThreshold: true,
        maxTradeAmountAuto: true,
        maxTradesPerDay: true,
        stopLossPercent: true,
        takeProfitPercent: true,
        requireManualConfirm: true,
        tradingMode: true,
        riskTolerance: true
      }
    })

    // Get today's automated activities
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayTrades, todayAnalyses, activeAlerts, recentActivities] = await Promise.all([
      prisma.trade.count({
        where: {
          userId: session.user.id,
          executedAt: { gte: today },
          isSimulated: user?.tradingMode === 'PAPER'
        }
      }),
      prisma.analysis.count({
        where: {
          asset: {
            trades: {
              some: {
                userId: session.user.id
              }
            }
          },
          generatedAt: { gte: today }
        }
      }),
      prisma.alert.count({
        where: {
          userId: session.user.id,
          isActive: true
        }
      }),
      prisma.activity.findMany({
        where: {
          userId: session.user.id,
          type: {
            in: ['AUTO_TRADE_EXECUTED', 'ANALYSIS_GENERATED', 'AUTOMATION_ERROR', 'RISK_MANAGEMENT_TRIGGERED']
          },
          createdAt: { gte: today }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Calculate automation health score
    const automationHealth = calculateAutomationHealth(
      todayTrades,
      todayAnalyses,
      recentActivities,
      user?.maxTradesPerDay || 5
    )

    return NextResponse.json({
      settings: user,
      statistics: {
        todayTrades,
        todayAnalyses,
        activeAlerts,
        tradesRemaining: Math.max(0, (user?.maxTradesPerDay || 5) - todayTrades)
      },
      automationHealth,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt,
        metadata: activity.metadata
      }))
    })

  } catch (error) {
    console.error('Automation status error:', error)
    return NextResponse.json({ error: 'Failed to fetch automation status' }, { status: 500 })
  }
}

function calculateAutomationHealth(
  todayTrades: number,
  todayAnalyses: number,
  recentActivities: any[],
  maxTrades: number
): {
  score: number,
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'ERROR',
  factors: string[]
} {
  let score = 100
  const factors: string[] = []

  // Check if approaching trade limit
  if (todayTrades >= maxTrades * 0.8) {
    score -= 20
    factors.push('Approaching daily trade limit')
  }

  // Check for recent errors
  const errorCount = recentActivities.filter(a => a.type === 'AUTOMATION_ERROR').length
  if (errorCount > 0) {
    score -= errorCount * 15
    factors.push(`${errorCount} automation errors today`)
  }

  // Check analysis to trade ratio
  if (todayAnalyses > 0 && todayTrades / todayAnalyses < 0.1) {
    score += 10
    factors.push('Conservative trading approach')
  }

  // Determine status
  let status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'ERROR'
  if (score >= 90) status = 'EXCELLENT'
  else if (score >= 70) status = 'GOOD'
  else if (score >= 50) status = 'WARNING'
  else status = 'ERROR'

  return { score, status, factors }
}
