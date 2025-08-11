
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { automationEngine } from "@/lib/automation-engine"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { trigger = 'MANUAL' } = await request.json()
    const symbol = params.symbol.toUpperCase()

    // Generate automated analysis with potential trading action
    const result = await automationEngine.generateAutomatedAnalysis(
      symbol,
      session.user.id,
      trigger
    )

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Automated analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Automated analysis failed' }, 
      { status: 500 }
    )
  }
}
