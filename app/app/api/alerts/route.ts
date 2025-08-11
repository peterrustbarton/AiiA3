
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

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      include: {
        asset: {
          include: {
            prices: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Serialize BigInt values for JSON response
    const serializedAlerts = alerts.map(alert => ({
      ...alert,
      asset: {
        ...alert.asset,
        prices: alert.asset.prices.map(price => ({
          ...price,
          volume: price.volume ? price.volume.toString() : null
        }))
      }
    }))

    return NextResponse.json({ alerts: serializedAlerts })
  } catch (error) {
    console.error('Alerts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol, type, condition, message } = await request.json()

    if (!symbol || !type || !condition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })

    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          type: 'STOCK' // Default
        }
      })
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        assetId: asset.id,
        type,
        condition,
        message
      }
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Alert creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const deleted = await prisma.alert.deleteMany({
      where: {
        id: alertId,
        userId: session.user.id
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alert deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
