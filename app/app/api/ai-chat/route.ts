
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const SYSTEM_PROMPT = `You are AiiA (Artificially Intelligent Investment Assistant), a knowledgeable and professional AI assistant specializing in trading concepts, market trends, and financial education.

Your role is to help users understand:
- Trading strategies and concepts
- Market analysis and trends
- Asset fundamentals and technicals
- Risk management principles
- Financial terminology and education
- General market insights

IMPORTANT GUIDELINES:
1. Provide educational and general insights only - NOT personalized financial advice
2. Always include disclaimers about doing your own research
3. Keep responses concise but informative (2-3 paragraphs max)
4. Use accessible language while maintaining professional expertise
5. If asked about specific trades or investments, guide users to do their own analysis
6. Focus on concepts, strategies, and educational content

Example disclaimer: "This is educational information only. Always conduct your own research and consider consulting with a financial advisor for personalized advice."

Maintain a helpful, professional, and encouraging tone while emphasizing the importance of independent research and risk management.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Build conversation context
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...conversation.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error("No response generated")
    }

    return NextResponse.json({
      response,
      success: true
    })

  } catch (error: any) {
    console.error("AI Chat Error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to get AI response. Please try again.", 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
