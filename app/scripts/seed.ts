
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: hashedPassword,
      role: 'ADMIN',
      disclaimerAccepted: true
    }
  })

  console.log(`👤 Created test user: ${testUser.email}`)

  // Create default portfolio
  const existingPortfolio = await prisma.portfolio.findFirst({
    where: {
      userId: testUser.id,
      name: 'Main Portfolio'
    }
  })

  const portfolio = existingPortfolio || await prisma.portfolio.create({
    data: {
      userId: testUser.id,
      name: 'Main Portfolio',
      type: 'SIMULATED',
      balance: 100000
    }
  })

  console.log(`💼 Created portfolio: ${portfolio.name}`)

  // Create default watchlist
  const existingWatchlist = await prisma.watchlist.findFirst({
    where: {
      userId: testUser.id,
      name: 'My Watchlist'
    }
  })

  const watchlist = existingWatchlist || await prisma.watchlist.create({
    data: {
      userId: testUser.id,
      name: 'My Watchlist',
      isDefault: true
    }
  })

  console.log(`⭐ Created watchlist: ${watchlist.name}`)

  // Create sample assets
  const sampleAssets = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      description: 'Technology company specializing in consumer electronics'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      description: 'Multinational technology company'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      description: 'Electric vehicle and clean energy company'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'CRYPTO',
      description: 'The first and largest cryptocurrency by market cap'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      type: 'CRYPTO',
      description: 'Blockchain platform with smart contract functionality'
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      type: 'STOCK',
      exchange: 'NASDAQ',
      description: 'Multinational technology company and semiconductor company'
    }
  ]

  for (const assetData of sampleAssets) {
    const asset = await prisma.asset.upsert({
      where: { symbol: assetData.symbol },
      update: {},
      create: assetData
    })

    // Add sample price data
    await prisma.assetPrice.create({
      data: {
        assetId: asset.id,
        price: Math.random() * 1000 + 50, // Random price between 50-1050
        open: Math.random() * 1000 + 50,
        high: Math.random() * 1000 + 100,
        low: Math.random() * 1000 + 25,
        volume: BigInt(Math.floor(Math.random() * 10000000)),
        change: (Math.random() - 0.5) * 20, // Random change between -10 to +10
        changePercent: (Math.random() - 0.5) * 10, // Random percent between -5% to +5%
        marketCap: Math.random() * 1000000000000 // Random market cap
      }
    })

    console.log(`📈 Created asset: ${asset.symbol}`)
  }

  // Add some assets to watchlist
  const assets = await prisma.asset.findMany({ take: 3 })
  for (const asset of assets) {
    const existingItem = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_assetId: {
          watchlistId: watchlist.id,
          assetId: asset.id
        }
      }
    })

    if (!existingItem) {
      await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          assetId: asset.id
        }
      })
    }
  }

  console.log(`✅ Added ${assets.length} assets to watchlist`)

  // Create sample trades
  const tradingAssets = await prisma.asset.findMany({ take: 2 })
  for (const asset of tradingAssets) {
    const price = Math.random() * 500 + 50
    const quantity = Math.floor(Math.random() * 10) + 1

    await prisma.trade.create({
      data: {
        userId: testUser.id,
        portfolioId: portfolio.id,
        assetId: asset.id,
        type: 'BUY',
        quantity,
        price,
        totalAmount: price * quantity,
        fees: price * quantity * 0.001,
        isSimulated: true
      }
    })

    // Create portfolio item
    const existingPortfolioItem = await prisma.portfolioItem.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId: portfolio.id,
          assetId: asset.id
        }
      }
    })

    if (!existingPortfolioItem) {
      await prisma.portfolioItem.create({
        data: {
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity,
          avgPrice: price,
          totalCost: price * quantity
        }
      })
    }

    console.log(`💰 Created trade: BUY ${quantity} ${asset.symbol} at $${price.toFixed(2)}`)
  }

  // Create sample alerts
  const alertAsset = await prisma.asset.findFirst()
  if (alertAsset) {
    await prisma.alert.create({
      data: {
        userId: testUser.id,
        assetId: alertAsset.id,
        type: 'PRICE_ABOVE',
        condition: { targetPrice: 200 },
        message: `Alert when ${alertAsset.symbol} reaches $200`
      }
    })

    console.log(`🔔 Created price alert for ${alertAsset.symbol}`)
  }

  // Create activity log entries
  await prisma.activity.create({
    data: {
      userId: testUser.id,
      type: 'LOGIN',
      description: 'User logged in',
      metadata: { timestamp: new Date().toISOString() }
    }
  })

  console.log('📊 Created activity log entries')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
