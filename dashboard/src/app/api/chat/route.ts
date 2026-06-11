import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'

function getGeminiApiKey() {
  let key = process.env.GEMINI_API_KEY
  if (!key || key === 'your_key') {
    try {
      const rootEnvPath = path.join(process.cwd(), '..', '.env')
      if (fs.existsSync(rootEnvPath)) {
        const envContent = fs.readFileSync(rootEnvPath, 'utf8')
        const lines = envContent.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const index = trimmed.indexOf('=')
          if (index !== -1) {
            const k = trimmed.substring(0, index).trim()
            const v = trimmed.substring(index + 1).trim()
            if (k === 'GEMINI_API_KEY') key = v
          }
        }
      }
    } catch (e) {
      console.error('Failed to read root .env file:', e)
    }
  }
  
  if (key) {
    key = key.replace(/['"]/g, '').trim()
  }
  return key
}

export async function POST(req: NextRequest) {
  try {
    const { message, signal } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const geminiKey = getGeminiApiKey()
    if (!geminiKey) {
      return NextResponse.json({ 
        response: "Sentinel AI is running in offline sandbox mode. Gemini API Key is missing or unconfigured." 
      })
    }

    // Build context-aware prompt
    const signalContext = signal 
      ? `You are discussing this specific anomaly signal:
         - Type: ${signal.signalType}
         - Confidence: ${signal.confidence}%
         - Reasoning: ${signal.reasoning}
         - Trade Intent: ${signal.tradeIntent}
         - Nonce: ${signal.nonce}
         - Commit Hash: ${signal.commitHash}
         - Commit Transaction: ${signal.commitTx || 'N/A'}
         - Reveal Transaction: ${signal.revealTx || 'N/A'}`
      : `No specific signal is selected yet.`

    const systemInstruction = `You are SENTINEL AI, the autonomous quantitative trading sentinel behind MantleEye.
You monitor the Mantle blockchain 24/7, tracking smart money anomalies and executing CEX/DEX arbitrage/hedges (swaps on Merchant Moe, hedges on Bybit).
Your tone is highly analytical, professional, concise, and technical (like a quant trading terminal assistant).
Explain your reasoning, confidence ratings, and actions using DeFi concepts, z-scores, peg deviations, and contract logic.
Keep your answers relatively short (under 3-4 sentences if possible) and focus strictly on quantitative or cryptographic facts.
Always align with the context provided below.

Context:
${signalContext}`

    const prompt = `User query: "${message}"`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      systemInstruction: {
        parts: [{
          text: systemInstruction
        }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Gemini API error: ${response.status} - ${errText}`)
      return NextResponse.json({ 
        response: "I apologize, but my core neural reasoning pipeline is currently overloaded. (Gemini API returned an error)." 
      })
    }

    const respJson = await response.json()
    const responseText = respJson.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I evaluated the on-chain pool parameters but could not generate a reasoning output."

    return NextResponse.json({ response: responseText.trim() })
  } catch (error: any) {
    console.error('Chat API route failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
