
import { NextRequest, NextResponse } from "next/server"
import { enhancedMarketDataService } from "@/lib/enhanced-market-data"
import { auditLogger } from "@/lib/audit-logger"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Search using enhanced market data service - Task B-006
    const results = await enhancedMarketDataService.searchAssets(query)

    // Update/create assets in database
    for (const asset of results) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: {
          name: asset.name,
          type: asset.type,
          exchange: asset.exchange,
          updatedAt: new Date()
        },
        create: {
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          exchange: asset.exchange
        }
      })

      // Update price data
      await prisma.assetPrice.create({
        data: {
          assetId: (await prisma.asset.findUnique({ where: { symbol: asset.symbol } }))!.id,
          price: asset.price,
          change: asset.change,
          changePercent: asset.changePercent,
          volume: asset.volume ? BigInt(asset.volume) : null,
          marketCap: asset.marketCap
        }
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Asset search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
