
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol } = await request.json()

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Verify watchlist ownership
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!watchlist) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 })
    }

    // Find or create asset
    let asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })

    if (!asset) {
      // Create placeholder asset - will be updated when market data is fetched
      asset = await prisma.asset.create({
        data: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          type: 'STOCK' // Default, will be updated
        }
      })
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        watchlistId: params.id,
        assetId: asset.id
      }
    })

    return NextResponse.json({ watchlistItem })
  } catch (error) {
    console.error('Add to watchlist error:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Asset already in watchlist' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Verify watchlist ownership and remove item
    const deleted = await prisma.watchlistItem.deleteMany({
      where: {
        watchlist: {
          id: params.id,
          userId: session.user.id
        },
        asset: {
          symbol: symbol.toUpperCase()
        }
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove from watchlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
