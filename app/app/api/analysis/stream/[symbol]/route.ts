
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { marketDataService } from "@/lib/market-data"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase()

    // Get asset from database
    const asset = await prisma.asset.findUnique({
      where: { symbol }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Get market data for analysis
    const assetData = await marketDataService.getAssetDetails(symbol)
    if (!assetData) {
      return NextResponse.json({ error: 'Asset data not available' }, { status: 404 })
    }

    // Create streaming response
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'user',
          content: `Provide a comprehensive investment analysis for ${assetData.name} (${symbol}).
          
          Current Market Data:
          - Price: $${assetData.price}
          - Change: ${assetData.change} (${assetData.changePercent}%)
          - Volume: ${assetData.volume?.toLocaleString() || 'N/A'}
          - Market Cap: $${assetData.marketCap?.toLocaleString() || 'N/A'}
          - Type: ${assetData.type}
          - Exchange: ${assetData.exchange || 'N/A'}
          
          Please provide:
          1. Overall investment recommendation (BUY/SELL/HOLD)
          2. Confidence level (0-100%)
          3. Price target and timeframe
          4. Key strengths and opportunities
          5. Main risks and concerns
          6. Technical and fundamental analysis
          7. Market sentiment assessment
          
          Format your response as a comprehensive analysis report.`
        }],
        stream: true,
        max_tokens: 3000
      })
    })

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        try {
          while (true) {
            const { done, value } = await reader?.read() || { done: true, value: undefined }
            if (done) break

            const chunk = decoder.decode(value)
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Streaming analysis error:', error)
    return NextResponse.json({ error: 'Analysis generation failed' }, { status: 500 })
  }
}
