
import { NextRequest, NextResponse } from "next/server"
import { enhancedMarketDataService } from "@/lib/enhanced-market-data"
import { auditLogger } from "@/lib/audit-logger"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase()

    // Get asset details from enhanced market data service - Task B-006
    const assetData = await enhancedMarketDataService.getAssetDetails(symbol)
    if (!assetData) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Update/create asset in database
    const asset = await prisma.asset.upsert({
      where: { symbol },
      update: {
        name: assetData.name,
        type: assetData.type,
        exchange: assetData.exchange,
        updatedAt: new Date()
      },
      create: {
        symbol,
        name: assetData.name,
        type: assetData.type,
        exchange: assetData.exchange
      }
    })

    // Update price data
    await prisma.assetPrice.create({
      data: {
        assetId: asset.id,
        price: assetData.price,
        change: assetData.change,
        changePercent: assetData.changePercent,
        volume: assetData.volume ? BigInt(assetData.volume) : null,
        marketCap: assetData.marketCap
      }
    })

    // Get price history - Task E-019
    const priceHistory = await enhancedMarketDataService.getPriceHistory(symbol, '1D')

    return NextResponse.json({
      asset: assetData,
      priceHistory
    })
  } catch (error) {
    console.error('Asset details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
