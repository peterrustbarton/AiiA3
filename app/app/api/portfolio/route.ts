
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { 
        userId: session.user.id,
        isActive: true
      },
      include: {
        items: {
          include: {
            asset: {
              include: {
                prices: {
                  orderBy: { timestamp: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        trades: {
          orderBy: { executedAt: 'desc' },
          take: 10,
          include: {
            asset: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate portfolio values and serialize BigInt
    const portfoliosWithValues = portfolios.map(portfolio => {
      let totalValue = portfolio.balance
      let totalCost = 0
      
      portfolio.items.forEach(item => {
        const currentPrice = item.asset.prices[0]?.price || 0
        const currentValue = item.quantity * currentPrice
        totalValue += currentValue
        totalCost += item.totalCost
      })

      const totalReturn = totalValue - 100000 // Starting balance
      const totalReturnPercent = totalReturn / 100000 * 100

      return {
        ...portfolio,
        totalValue,
        totalReturn,
        totalReturnPercent,
        items: portfolio.items.map(item => ({
          ...item,
          asset: {
            ...item.asset,
            prices: item.asset.prices.map(price => ({
              ...price,
              volume: price.volume ? price.volume.toString() : null
            }))
          }
        })),
        trades: portfolio.trades.map(trade => ({
          ...trade,
          asset: trade.asset
        }))
      }
    })

    return NextResponse.json({ portfolios: portfoliosWithValues })
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
