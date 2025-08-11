
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { marketDataService } from "@/lib/market-data"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol, type, quantity, portfolioId } = await request.json()

    if (!symbol || !type || !quantity || !portfolioId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId: session.user.id
      }
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Get current market price
    const assetData = await marketDataService.getAssetDetails(symbol)
    if (!assetData) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const price = assetData.price
    const totalAmount = quantity * price
    const fees = totalAmount * 0.001 // 0.1% fee

    // Check if user has sufficient balance for buy orders
    if (type === 'BUY') {
      if (portfolio.balance < totalAmount + fees) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
    }

    // For sell orders, check if user has sufficient quantity
    if (type === 'SELL') {
      const portfolioItem = await prisma.portfolioItem.findFirst({
        where: {
          portfolioId,
          asset: { symbol }
        }
      })

      if (!portfolioItem || portfolioItem.quantity < quantity) {
        return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 })
      }
    }

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })

    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          symbol: symbol.toUpperCase(),
          name: assetData.name,
          type: assetData.type,
          exchange: assetData.exchange
        }
      })
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        portfolioId,
        assetId: asset.id,
        type,
        quantity,
        price,
        totalAmount,
        fees,
        isSimulated: portfolio.type === 'SIMULATED'
      }
    })

    // Update portfolio balance
    const newBalance = type === 'BUY' 
      ? portfolio.balance - totalAmount - fees
      : portfolio.balance + totalAmount - fees

    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { balance: newBalance }
    })

    // Update portfolio item
    if (type === 'BUY') {
      await prisma.portfolioItem.upsert({
        where: {
          portfolioId_assetId: {
            portfolioId,
            assetId: asset.id
          }
        },
        update: {
          quantity: {
            increment: quantity
          },
          totalCost: {
            increment: totalAmount
          },
          avgPrice: {
            // Recalculate average price
            set: price // Simplified - should calculate weighted average
          }
        },
        create: {
          portfolioId,
          assetId: asset.id,
          quantity,
          avgPrice: price,
          totalCost: totalAmount
        }
      })
    } else {
      // SELL - reduce quantity
      const portfolioItem = await prisma.portfolioItem.findFirst({
        where: {
          portfolioId,
          assetId: asset.id
        }
      })

      if (portfolioItem) {
        const newQuantity = portfolioItem.quantity - quantity
        if (newQuantity <= 0) {
          await prisma.portfolioItem.delete({
            where: { id: portfolioItem.id }
          })
        } else {
          await prisma.portfolioItem.update({
            where: { id: portfolioItem.id },
            data: {
              quantity: newQuantity,
              totalCost: portfolioItem.totalCost * (newQuantity / portfolioItem.quantity)
            }
          })
        }
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'TRADE',
        description: `${type} ${quantity} shares of ${symbol} at $${price}`,
        metadata: {
          tradeId: trade.id,
          symbol,
          type,
          quantity,
          price,
          totalAmount
        }
      }
    })

    return NextResponse.json({ trade, success: true })
  } catch (error) {
    console.error('Trade execution error:', error)
    return NextResponse.json({ error: 'Trade execution failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: any = { userId: session.user.id }
    if (portfolioId) {
      whereClause.portfolioId = portfolioId
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        asset: true,
        portfolio: true
      },
      orderBy: { executedAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Trades fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
