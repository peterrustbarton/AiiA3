
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

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            asset: {
              include: {
                prices: {
                  orderBy: { timestamp: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Convert BigInt values to strings for JSON serialization
    const serializedWatchlists = watchlists.map(watchlist => ({
      ...watchlist,
      items: watchlist.items.map(item => ({
        ...item,
        asset: {
          ...item.asset,
          prices: item.asset.prices.map(price => ({
            ...price,
            volume: price.volume ? price.volume.toString() : null
          }))
        }
      }))
    }))

    return NextResponse.json({ watchlists: serializedWatchlists })
  } catch (error) {
    console.error('Watchlist fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Watchlist name is required' }, { status: 400 })
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        name
      }
    })

    return NextResponse.json({ watchlist })
  } catch (error) {
    console.error('Watchlist create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
