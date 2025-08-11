
import { NextRequest, NextResponse } from "next/server"
import { marketDataService } from "@/lib/market-data"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get market movers data
    const marketMovers = await marketDataService.getMarketMovers()

    // Update assets in database
    const allAssets = [...marketMovers.gainers, ...marketMovers.losers]
    
    for (const asset of allAssets) {
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
      const dbAsset = await prisma.asset.findUnique({ where: { symbol: asset.symbol } })
      if (dbAsset) {
        await prisma.assetPrice.create({
          data: {
            assetId: dbAsset.id,
            price: asset.price,
            change: asset.change,
            changePercent: asset.changePercent,
            volume: asset.volume ? BigInt(asset.volume) : null,
            marketCap: asset.marketCap
          }
        })
      }
    }

    return NextResponse.json(marketMovers)
  } catch (error) {
    console.error('Market movers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
