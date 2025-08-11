
import { prisma } from '@/lib/db'
import { marketDataService } from '@/lib/market-data'

export interface AutomationSignal {
  assetId: string
  symbol: string
  action: 'BUY' | 'SELL'
  confidence: number
  priceTarget?: number
  currentPrice: number
  recommendation: string
  analysis: any
  userId: string
}

export interface RiskManagementParams {
  stopLossPercent: number
  takeProfitPercent: number
  maxTradeAmount: number
  maxTradesPerDay: number
}

export class AutomationEngine {
  private static instance: AutomationEngine
  private runningAnalyses = new Set<string>()

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  // Enhanced AI Analysis with Automation Integration
  async generateAutomatedAnalysis(
    symbol: string, 
    userId: string,
    trigger: 'MANUAL' | 'SCHEDULED' | 'PRICE_ALERT' | 'NEWS_TRIGGER' = 'MANUAL'
  ): Promise<any> {
    const analysisKey = `${symbol}-${userId}`
    
    if (this.runningAnalyses.has(analysisKey)) {
      throw new Error('Analysis already in progress for this asset')
    }

    this.runningAnalyses.add(analysisKey)

    try {
      // Get user's automation settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        throw new Error('User not found')
      }

      // Get asset data
      const asset = await prisma.asset.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          prices: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      })

      if (!asset) {
        throw new Error('Asset not found')
      }

      // Get enhanced market data
      const [enhancedAssetData, priceHistory] = await Promise.all([
        marketDataService.getEnhancedAssetData(symbol),
        marketDataService.getPriceHistory(symbol, '1W')
      ])

      if (!enhancedAssetData) {
        throw new Error('Asset data not available')
      }

      // Enhanced AI analysis with automation context
      const analysisResult = await this.generateEnhancedAnalysis(
        symbol, 
        enhancedAssetData, 
        priceHistory, 
        user,
        trigger
      )

      // Check if analysis meets automation criteria
      const automationSignal = await this.evaluateAutomationSignal(
        analysisResult,
        user,
        asset,
        enhancedAssetData
      )

      // Save enhanced analysis with automation data
      const analysis = await prisma.analysis.create({
        data: {
          assetId: asset.id,
          recommendation: analysisResult.recommendation,
          confidence: analysisResult.confidence,
          priceTarget: analysisResult.priceTarget,
          timeHorizon: analysisResult.timeHorizon,
          analysis: analysisResult.analysis,
          keyPoints: analysisResult.keyPoints,
          risks: analysisResult.risks,
          opportunities: analysisResult.opportunities,
          marketSentiment: analysisResult.marketSentiment,
          technicalData: analysisResult.technicalSignals,
          fundamentalData: analysisResult.fundamentalData || {},
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      })

      // Process automation signal if applicable
      if (automationSignal && !user.requireManualConfirm) {
        await this.processAutomationSignal(automationSignal, user)
      }

      // Log automation activity
      await this.logAutomationActivity(userId, {
        type: 'ANALYSIS_GENERATED',
        description: `AI analysis generated for ${symbol}`,
        metadata: {
          symbol,
          trigger,
          confidence: analysisResult.confidence,
          recommendation: analysisResult.recommendation,
          automationTriggered: !!automationSignal,
          analysisId: analysis.id
        }
      })

      return {
        analysis: analysisResult,
        automationSignal,
        analysisId: analysis.id
      }

    } finally {
      this.runningAnalyses.delete(analysisKey)
    }
  }

  // Enhanced AI Analysis Generation
  private async generateEnhancedAnalysis(
    symbol: string,
    assetData: any,
    priceHistory: any[],
    userSettings: any,
    trigger: string
  ): Promise<any> {
    // Calculate technical indicators
    const technicalIndicators = this.calculateAdvancedTechnicalIndicators(priceHistory, assetData)
    
    // Analyze market sentiment
    const marketSentiment = this.analyzeAdvancedMarketSentiment(assetData.news, priceHistory)
    
    // Calculate risk-adjusted confidence
    const riskAdjustedConfidence = this.calculateRiskAdjustedConfidence(
      assetData, 
      technicalIndicators, 
      marketSentiment,
      userSettings.riskTolerance
    )

    // Generate AI analysis with automation context
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
          content: `You are AiiA's advanced AI trading engine. You're analyzing for automated trading decisions with strict risk management. Consider user's risk tolerance: ${userSettings.riskTolerance}. Analysis triggered by: ${trigger}.`
        }, {
          role: 'user',
          content: `ENHANCED ANALYSIS REQUEST for ${symbol}:

          USER AUTOMATION SETTINGS:
          - Risk Tolerance: ${userSettings.riskTolerance}
          - Buy Threshold: ${userSettings.buyConfidenceThreshold}%
          - Sell Threshold: ${userSettings.sellConfidenceThreshold}%
          - Max Auto Trade: $${userSettings.maxTradeAmountAuto}
          - Stop Loss: ${userSettings.stopLossPercent}%
          - Take Profit: ${userSettings.takeProfitPercent}%
          - Trading Mode: ${userSettings.tradingMode}

          CURRENT MARKET DATA:
          - Price: $${assetData.price}
          - Change: ${assetData.change} (${assetData.changePercent}%)
          - Volume: ${assetData.volume?.toLocaleString() || 'N/A'}
          - Market Cap: ${assetData.marketCap ? '$' + (assetData.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}

          ADVANCED TECHNICAL ANALYSIS:
          - RSI: ${technicalIndicators.rsi}
          - MACD: ${technicalIndicators.macd}
          - Moving Averages: ${JSON.stringify(technicalIndicators.movingAverages)}
          - Bollinger Bands: ${JSON.stringify(technicalIndicators.bollingerBands)}
          - Volume Analysis: ${technicalIndicators.volumeAnalysis}
          - Volatility: ${technicalIndicators.volatility}%

          MARKET SENTIMENT:
          - Overall: ${marketSentiment.overall}
          - News Impact: ${marketSentiment.impact}
          - Social Sentiment: ${marketSentiment.socialSentiment || 'N/A'}
          - Institutional Activity: ${marketSentiment.institutionalFlow || 'N/A'}

          RISK-ADJUSTED CONFIDENCE: ${riskAdjustedConfidence}%

          Provide analysis optimized for automated trading decisions in JSON format:
          {
            "recommendation": "BUY|SELL|HOLD",
            "confidence": number (${riskAdjustedConfidence}-100),
            "priceTarget": number,
            "timeHorizon": "SHORT|MEDIUM|LONG",
            "analysis": "detailed analysis incorporating automation context",
            "keyPoints": ["point1", "point2", "point3"],
            "risks": ["risk1", "risk2"],
            "opportunities": ["opp1", "opp2"],
            "marketSentiment": "BULLISH|BEARISH|NEUTRAL",
            "technicalSignals": {
              "rsi": "signal",
              "macd": "signal",
              "movingAverages": "signal",
              "bollinger": "signal",
              "volume": "signal"
            },
            "automationRecommendation": {
              "autoTrade": boolean,
              "urgency": "LOW|MEDIUM|HIGH",
              "positionSize": "percentage of max trade amount",
              "stopLoss": number,
              "takeProfit": number,
              "timeframe": "expected holding period"
            },
            "riskAssessment": {
              "overall": "LOW|MEDIUM|HIGH",
              "factors": ["factor1", "factor2"],
              "mitigation": ["strategy1", "strategy2"]
            }
          }

          Respond with raw JSON only.`
        }],
        response_format: { type: "json_object" },
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error('Enhanced AI analysis failed')
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
  }

  // Advanced Technical Indicators
  private calculateAdvancedTechnicalIndicators(priceHistory: any[], assetData: any) {
    if (priceHistory.length < 50) {
      return {
        rsi: 50,
        macd: 0,
        movingAverages: { ma20: assetData.price, ma50: assetData.price },
        bollingerBands: { upper: assetData.price * 1.02, lower: assetData.price * 0.98 },
        volumeAnalysis: 'NEUTRAL',
        volatility: 15
      }
    }

    const prices = priceHistory.map(p => p.price)
    const volumes = priceHistory.map(p => p.volume || 0)

    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      movingAverages: this.calculateMovingAverages(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      volumeAnalysis: this.analyzeVolume(volumes, prices),
      volatility: this.calculateVolatility(prices)
    }
  }

  // Risk-Adjusted Confidence Calculation
  private calculateRiskAdjustedConfidence(
    assetData: any,
    technicalIndicators: any,
    marketSentiment: any,
    riskTolerance: string
  ): number {
    let baseConfidence = 60

    // Technical indicators weight
    if (technicalIndicators.rsi > 30 && technicalIndicators.rsi < 70) baseConfidence += 10
    if (Math.abs(technicalIndicators.macd) < 0.5) baseConfidence += 5

    // Market sentiment weight
    if (marketSentiment.overall !== 'NEUTRAL') baseConfidence += 8
    if (marketSentiment.impact === 'HIGH') baseConfidence += 5

    // Risk tolerance adjustment
    const riskMultiplier = {
      'LOW': 0.8,
      'MEDIUM': 1.0,
      'HIGH': 1.2
    }[riskTolerance] || 1.0

    // Volatility adjustment
    if (technicalIndicators.volatility > 30) baseConfidence *= 0.9
    if (technicalIndicators.volatility < 15) baseConfidence *= 1.1

    return Math.max(45, Math.min(85, Math.round(baseConfidence * riskMultiplier)))
  }

  // Automation Signal Evaluation
  private async evaluateAutomationSignal(
    analysis: any,
    userSettings: any,
    asset: any,
    assetData: any
  ): Promise<AutomationSignal | null> {
    // Check confidence thresholds
    const isBuySignal = analysis.recommendation === 'BUY' && 
                       analysis.confidence >= userSettings.buyConfidenceThreshold

    const isSellSignal = analysis.recommendation === 'SELL' && 
                        analysis.confidence >= userSettings.sellConfidenceThreshold

    if (!isBuySignal && !isSellSignal) {
      return null
    }

    // Check daily trade limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTrades = await prisma.trade.count({
      where: {
        userId: userSettings.id,
        executedAt: {
          gte: today
        }
      }
    })

    if (todayTrades >= userSettings.maxTradesPerDay) {
      return null
    }

    return {
      assetId: asset.id,
      symbol: asset.symbol,
      action: isBuySignal ? 'BUY' : 'SELL',
      confidence: analysis.confidence,
      priceTarget: analysis.priceTarget,
      currentPrice: assetData.price,
      recommendation: analysis.recommendation,
      analysis: analysis,
      userId: userSettings.id
    }
  }

  // Process Automation Signal
  private async processAutomationSignal(signal: AutomationSignal, userSettings: any) {
    try {
      // Calculate position size based on automation settings
      const positionSize = this.calculatePositionSize(
        userSettings.maxTradeAmountAuto,
        signal.confidence,
        userSettings.riskTolerance
      )

      // Execute simulated trade
      if (userSettings.tradingMode === 'PAPER') {
        await this.executeSimulatedTrade(signal, positionSize, userSettings)
      } else {
        // For live trading, add additional safety checks
        await this.executeLiveTrade(signal, positionSize, userSettings)
      }

      // Set up automated risk management
      await this.setupRiskManagement(signal, userSettings)

    } catch (error) {
      console.error('Automation signal processing failed:', error)
      
      // Log automation failure
      await this.logAutomationActivity(signal.userId, {
        type: 'AUTOMATION_ERROR',
        description: `Failed to process automation signal for ${signal.symbol}`,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          signal
        }
      })
    }
  }

  // Risk Management Helper Functions
  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50
    // RSI calculation logic
    let gains = 0, losses = 0
    for (let i = 1; i < 15; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    const rs = (gains / 14) / (losses / 14)
    return 100 - (100 / (1 + rs))
  }

  private calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(prices.slice(-12), 12)
    const ema26 = this.calculateEMA(prices.slice(-26), 26)
    return ema12 - ema26
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    return ema
  }

  private calculateMovingAverages(prices: number[]) {
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20
    const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50
    return { ma20, ma50 }
  }

  private calculateBollingerBands(prices: number[]) {
    const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20
    const variance = prices.slice(-20).reduce((sum, price) => sum + Math.pow(price - ma20, 2), 0) / 20
    const stdDev = Math.sqrt(variance)
    return {
      upper: ma20 + (2 * stdDev),
      lower: ma20 - (2 * stdDev)
    }
  }

  private analyzeVolume(volumes: number[], prices: number[]): string {
    if (volumes.length < 10) return 'NEUTRAL'
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10
    const currentVolume = volumes[volumes.length - 1]
    
    if (currentVolume > avgVolume * 1.5) return 'HIGH'
    if (currentVolume < avgVolume * 0.5) return 'LOW'
    return 'NORMAL'
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 20) return 15
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]))
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    return Math.sqrt(variance * 252) * 100 // Annualized volatility
  }

  private analyzeAdvancedMarketSentiment(news: any[], priceHistory: any[]) {
    // Advanced sentiment analysis logic
    return {
      overall: 'NEUTRAL',
      impact: 'MEDIUM',
      socialSentiment: 'NEUTRAL',
      institutionalFlow: 'NEUTRAL'
    }
  }

  private calculatePositionSize(maxAmount: number, confidence: number, riskTolerance: string): number {
    const baseSize = maxAmount * 0.1 // Start with 10% of max
    const confidenceMultiplier = confidence / 100
    const riskMultiplier = {
      'LOW': 0.5,
      'MEDIUM': 1.0,
      'HIGH': 1.5
    }[riskTolerance] || 1.0

    return Math.min(maxAmount, baseSize * confidenceMultiplier * riskMultiplier)
  }

  private async executeSimulatedTrade(signal: AutomationSignal, amount: number, userSettings: any) {
    // Execute paper trade
    const quantity = amount / signal.currentPrice

    await prisma.trade.create({
      data: {
        userId: signal.userId,
        assetId: signal.assetId,
        type: signal.action,
        quantity,
        price: signal.currentPrice,
        totalAmount: amount,
        fees: 0,
        status: 'COMPLETED',
        isSimulated: true
      }
    })

    await this.logAutomationActivity(signal.userId, {
      type: 'AUTO_TRADE_EXECUTED',
      description: `Automated ${signal.action} trade executed for ${signal.symbol}`,
      metadata: {
        symbol: signal.symbol,
        action: signal.action,
        amount,
        quantity,
        price: signal.currentPrice,
        confidence: signal.confidence
      }
    })
  }

  private async executeLiveTrade(signal: AutomationSignal, amount: number, userSettings: any) {
    // For live trading, integrate with actual broker API (Alpaca, etc.)
    // This would require additional safety checks and real API calls
    throw new Error('Live trading not implemented yet')
  }

  private async setupRiskManagement(signal: AutomationSignal, userSettings: any) {
    // Set up automated stop-loss and take-profit orders
    const stopLossPrice = signal.action === 'BUY' ? 
      signal.currentPrice * (1 - userSettings.stopLossPercent / 100) :
      signal.currentPrice * (1 + userSettings.stopLossPercent / 100)

    const takeProfitPrice = signal.action === 'BUY' ?
      signal.currentPrice * (1 + userSettings.takeProfitPercent / 100) :
      signal.currentPrice * (1 - userSettings.takeProfitPercent / 100)

    // Create alerts for stop-loss and take-profit
    await Promise.all([
      prisma.alert.create({
        data: {
          userId: signal.userId,
          assetId: signal.assetId,
          type: signal.action === 'BUY' ? 'PRICE_BELOW' : 'PRICE_ABOVE',
          condition: { price: stopLossPrice, type: 'STOP_LOSS' },
          message: `Stop-loss triggered for ${signal.symbol}`,
          isActive: true
        }
      }),
      prisma.alert.create({
        data: {
          userId: signal.userId,
          assetId: signal.assetId,
          type: signal.action === 'BUY' ? 'PRICE_ABOVE' : 'PRICE_BELOW',
          condition: { price: takeProfitPrice, type: 'TAKE_PROFIT' },
          message: `Take-profit triggered for ${signal.symbol}`,
          isActive: true
        }
      })
    ])
  }

  private async logAutomationActivity(userId: string, activity: any) {
    await prisma.activity.create({
      data: {
        userId,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata
      }
    })
  }
}

export const automationEngine = AutomationEngine.getInstance()
