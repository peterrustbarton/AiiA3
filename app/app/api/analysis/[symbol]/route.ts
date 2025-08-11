
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { marketDataService, type AssetData, type NewsItem, type EnhancedAssetData } from "@/lib/market-data"

// Technical analysis helper functions
function calculateTechnicalIndicators(
  priceHistory: Array<{ timestamp: Date; price: number }>, 
  assetData: EnhancedAssetData
) {
  if (priceHistory.length < 20) {
    return {
      rsi: 50,
      ma20: assetData.price,
      priceVsMA20: 0,
      volatility: 15,
      trend: 'NEUTRAL',
      support: assetData.price * 0.95,
      resistance: assetData.price * 1.05
    }
  }

  const prices = priceHistory.map(p => p.price)
  const recent20 = prices.slice(-20)
  
  // Calculate 20-day moving average
  const ma20 = recent20.reduce((sum, price) => sum + price, 0) / recent20.length
  
  // Calculate RSI
  const rsi = calculateRSI(prices.slice(-14))
  
  // Calculate volatility (standard deviation)
  const mean = recent20.reduce((sum, price) => sum + price, 0) / recent20.length
  const variance = recent20.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recent20.length
  const volatility = Math.sqrt(variance) / mean * 100
  
  // Determine trend
  const trend = prices[prices.length - 1] > ma20 ? 
    (prices[prices.length - 5] > prices[prices.length - 10] ? 'BULLISH' : 'NEUTRAL') : 'BEARISH'
  
  // Support and resistance levels
  const recentMax = Math.max(...recent20)
  const recentMin = Math.min(...recent20)
  
  return {
    rsi: Math.round(rsi),
    ma20: Math.round(ma20 * 100) / 100,
    priceVsMA20: Math.round(((assetData.price - ma20) / ma20) * 100 * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    trend,
    support: Math.round(recentMin * 100) / 100,
    resistance: Math.round(recentMax * 100) / 100
  }
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))
  
  return rsi
}

function analyzeNewsSentiment(news: NewsItem[]) {
  if (news.length === 0) {
    return {
      overall: 'NEUTRAL',
      positive: 0,
      negative: 0,
      neutral: 0,
      impact: 'LOW',
      recentDevelopments: 'No recent news available'
    }
  }
  
  const sentimentCounts = news.reduce((acc, item) => {
    acc[item.sentiment || 'neutral']++
    return acc
  }, { positive: 0, negative: 0, neutral: 0 })
  
  let overall = 'NEUTRAL'
  if (sentimentCounts.positive > sentimentCounts.negative) {
    overall = 'POSITIVE'
  } else if (sentimentCounts.negative > sentimentCounts.positive) {
    overall = 'NEGATIVE'
  }
  
  const impact = news.length > 5 ? 'HIGH' : news.length > 2 ? 'MEDIUM' : 'LOW'
  const recentDevelopments = news.slice(0, 2).map(n => n.title).join('; ')
  
  return {
    overall,
    positive: sentimentCounts.positive,
    negative: sentimentCounts.negative,
    neutral: sentimentCounts.neutral,
    impact,
    recentDevelopments
  }
}

function calculateConfidenceScore(
  assetData: EnhancedAssetData, 
  technicalIndicators: any, 
  newsSentiment: any
): number {
  let baseScore = 60 // Start with 60% base confidence
  
  // Data availability bonus
  if (assetData.volume && assetData.volume > 0) baseScore += 5
  if (assetData.marketCap && assetData.marketCap > 0) baseScore += 5
  if (assetData.pe) baseScore += 5
  if (assetData.sector) baseScore += 5
  
  // News availability and sentiment
  if (assetData.news.length > 0) {
    baseScore += Math.min(assetData.news.length * 2, 10) // Up to 10 points for news
    if (newsSentiment.overall !== 'NEUTRAL') baseScore += 3
  }
  
  // Technical indicators confidence
  if (technicalIndicators.rsi > 30 && technicalIndicators.rsi < 70) baseScore += 5 // Neutral RSI is more reliable
  if (Math.abs(technicalIndicators.priceVsMA20) < 10) baseScore += 3 // Near moving average
  
  // Volatility adjustment (lower volatility = higher confidence)
  if (technicalIndicators.volatility < 20) baseScore += 5
  else if (technicalIndicators.volatility > 40) baseScore -= 5
  
  // Analyst ratings boost
  if (assetData.analystRatings && assetData.analystRatings.length > 0) {
    baseScore += Math.min(assetData.analystRatings.length * 3, 10)
  }
  
  // Cap between 45 and 85 for realistic confidence ranges
  return Math.max(45, Math.min(85, Math.round(baseScore)))
}

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase()

    // Get asset from database
    const asset = await prisma.asset.findUnique({
      where: { symbol },
      include: {
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check for recent analysis (within last hour)
    const recentAnalysis = await prisma.analysis.findFirst({
      where: {
        assetId: asset.id,
        generatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      },
      orderBy: { generatedAt: 'desc' }
    })

    if (recentAnalysis) {
      return NextResponse.json({ analysis: recentAnalysis })
    }

    // Get enhanced market data for comprehensive analysis
    const [enhancedAssetData, priceHistory] = await Promise.all([
      marketDataService.getEnhancedAssetData(symbol),
      marketDataService.getPriceHistory(symbol, '1W')
    ])

    if (!enhancedAssetData) {
      return NextResponse.json({ error: 'Asset data not available' }, { status: 404 })
    }

    // Calculate additional technical indicators
    const technicalIndicators = calculateTechnicalIndicators(priceHistory, enhancedAssetData)
    
    // Analyze news sentiment
    const newsSentiment = analyzeNewsSentiment(enhancedAssetData.news)
    
    // Calculate confidence score based on multiple factors
    const confidenceScore = calculateConfidenceScore(enhancedAssetData, technicalIndicators, newsSentiment)

    // Generate AI analysis using comprehensive data
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'system',
          content: `You are AiiA, an expert financial analyst providing investment recommendations. Analyze the provided data comprehensively and respond with accurate JSON only.`
        }, {
          role: 'user',
          content: `Analyze ${enhancedAssetData.name} (${symbol}) for investment decision using this comprehensive data:

          CURRENT METRICS:
          - Price: $${enhancedAssetData.price}
          - Change: ${enhancedAssetData.change} (${enhancedAssetData.changePercent}%)
          - Volume: ${enhancedAssetData.volume?.toLocaleString() || 'N/A'}
          - Market Cap: ${enhancedAssetData.marketCap ? '$' + (enhancedAssetData.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}
          - Type: ${enhancedAssetData.type}
          - Exchange: ${enhancedAssetData.exchange || 'N/A'}
          - Sector: ${enhancedAssetData.sector || 'N/A'}
          - P/E Ratio: ${enhancedAssetData.pe || 'N/A'}
          - 52-Week High: $${enhancedAssetData.week52High || 'N/A'}
          - 52-Week Low: $${enhancedAssetData.week52Low || 'N/A'}

          TECHNICAL ANALYSIS:
          - RSI: ${technicalIndicators.rsi}
          - Moving Average (20d): $${technicalIndicators.ma20}
          - Price vs MA20: ${technicalIndicators.priceVsMA20}%
          - Volatility: ${technicalIndicators.volatility}%
          - Trend: ${technicalIndicators.trend}

          NEWS SENTIMENT ANALYSIS:
          - Overall Sentiment: ${newsSentiment.overall}
          - Positive Articles: ${newsSentiment.positive}
          - Negative Articles: ${newsSentiment.negative}
          - Recent Headlines: ${enhancedAssetData.news.slice(0, 3).map(n => n.title).join('; ')}

          ANALYST RATINGS:
          ${enhancedAssetData.analystRatings?.map(r => `- ${r.rating}: ${r.recommendation} (Target: $${r.targetPrice || 'N/A'})`).join('\n') || 'N/A'}

          BASE CONFIDENCE SCORE: ${confidenceScore}%

          Provide analysis in JSON format with:
          {
            "recommendation": "BUY|SELL|HOLD",
            "confidence": ${confidenceScore}-100 (adjust based on analysis quality),
            "priceTarget": number,
            "timeHorizon": "SHORT|MEDIUM|LONG",
            "analysis": "detailed 200-300 word analysis incorporating all data points",
            "keyPoints": ["specific point1", "specific point2", "specific point3"],
            "risks": ["specific risk1", "specific risk2"],
            "opportunities": ["specific opportunity1", "specific opportunity2"],
            "marketSentiment": "BULLISH|BEARISH|NEUTRAL",
            "technicalSignals": {
              "rsi": "${technicalIndicators.rsi > 70 ? 'Overbought' : technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}",
              "trend": "${technicalIndicators.trend}",
              "support": ${technicalIndicators.support},
              "resistance": ${technicalIndicators.resistance}
            },
            "newsFactors": {
              "sentiment": "${newsSentiment.overall}",
              "impact": "${newsSentiment.impact}",
              "recentDevelopments": "${newsSentiment.recentDevelopments}"
            }
          }
          
          Respond with raw JSON only.`
        }],
        response_format: { type: "json_object" },
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      throw new Error('AI analysis failed')
    }

    const analysisResult = await response.json()
    const analysisData = JSON.parse(analysisResult.choices[0].message.content)

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        assetId: asset.id,
        recommendation: analysisData.recommendation,
        confidence: analysisData.confidence,
        priceTarget: analysisData.priceTarget,
        timeHorizon: analysisData.timeHorizon,
        analysis: analysisData.analysis,
        keyPoints: analysisData.keyPoints,
        risks: analysisData.risks,
        opportunities: analysisData.opportunities,
        marketSentiment: analysisData.marketSentiment,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // Expires in 1 hour
      }
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'Analysis generation failed' }, { status: 500 })
  }
}
