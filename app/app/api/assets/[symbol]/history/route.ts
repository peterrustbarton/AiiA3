
// Asset Price History API v1.0.0
// Task E-019: Chart Interval Selector Support

import { NextRequest, NextResponse } from "next/server"
import { enhancedMarketDataService } from "@/lib/enhanced-market-data"
import { auditLogger } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get('interval') || '1D'
    const symbol = params.symbol.toUpperCase()

    console.log(`Fetching price history for ${symbol} with interval ${interval}`)

    // Get price history with the specified interval
    const priceHistory = await enhancedMarketDataService.getPriceHistory(symbol, interval)

    return NextResponse.json({
      symbol,
      interval,
      priceHistory,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Price history API error:', error)
    auditLogger.logApiCall('price-history', 'api', 'error', 0, false, error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 })
  }
}
