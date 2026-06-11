export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const signalsJsonPath = path.join(process.cwd(), 'src', 'data', 'signals.json')
const stateJsonPath = path.join(process.cwd(), 'src', 'data', 'agent_state.json')

function getTelegramCredentials() {
  let token = process.env.TELEGRAM_BOT_TOKEN
  let chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
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
            const key = trimmed.substring(0, index).trim()
            const val = trimmed.substring(index + 1).trim()
            if (key === 'TELEGRAM_BOT_TOKEN') token = val
            if (key === 'TELEGRAM_CHAT_ID') chatId = val
          }
        }
      }
    } catch (e) {
      console.error('Failed to read root .env file:', e)
    }
  }

  return { token, chatId }
}

async function sendTelegramAlert(token: string, chatId: string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`Telegram API error: ${res.status} - ${errText}`)
    }
  } catch (e) {
    console.error('Failed to send Telegram notification:', e)
  }
}

function formatSignalAlert(sig: any) {
  const labelText = sig.nansenLabel ? `\n<b>Nansen Label:</b> ${sig.nansenLabel}` : ''
  const explorerLink = `https://sepolia.mantlescan.xyz/tx/${sig.commitTx}`
  const asset = sig.tradeIntent.includes('mETH') ? 'mETH' : sig.tradeIntent.includes('USDY') ? 'USDY' : 'MNT'
  return `🔴 <b>MANTLEYE ALERT</b>\n` +
         `<b>Signal:</b> ${sig.signalType.toUpperCase()}\n` +
         `<b>Asset:</b> ${asset}\n` +
         `<b>Confidence:</b> ${sig.confidence}%\n` +
         `<b>Action:</b> ${sig.tradeIntent}${labelText}\n` +
         `<b>Commit Proof:</b> <a href="${explorerLink}">Mantle Explorer</a>\n` +
         `<b>PnL Impact:</b> +0.0%`
}

function formatExecutionAlert(sig: any) {
  const onChainLink = sig.onChainTx ? `https://sepolia.mantlescan.xyz/tx/${sig.onChainTx}` : 'N/A'
  const revealLink = sig.revealTx ? `https://sepolia.mantlescan.xyz/tx/${sig.revealTx}` : 'N/A'
  const onChainAnchor = sig.onChainTx ? `<a href="${onChainLink}">Explorer Link</a>` : 'N/A'
  const revealAnchor = sig.revealTx ? `<a href="${revealLink}">Reveal Tx Link</a>` : 'N/A'
  return `✅ <b>MANTLEYE EXECUTED</b>\n` +
         `<b>On-Chain:</b> ${onChainAnchor}\n` +
         `<b>Bybit Hedge:</b> ${sig.bybitOrderId || 'N/A'}\n` +
         `<b>Reveal Proof:</b> ${revealAnchor}`
}

async function triggerTelegramAlert(sig: any) {
  const { token, chatId } = getTelegramCredentials()
  if (token && chatId) {
    await sendTelegramAlert(token, chatId, formatSignalAlert(sig))
    await new Promise(resolve => setTimeout(resolve, 1000))
    await sendTelegramAlert(token, chatId, formatExecutionAlert(sig))
  } else {
    console.warn('Telegram token or chat ID is missing. Alert not sent.')
  }
}

export async function GET(req: NextRequest) {
  try {
    const userWallet = req.headers.get('x-user-wallet') || req.nextUrl.searchParams.get('wallet') || 'default'
    const walletKey = userWallet.toLowerCase()

    let cachedSignals = []
    
    // Read from the local JSON database (Next.js Route Cache / local write layer)
    if (fs.existsSync(signalsJsonPath)) {
      try {
        const fileContent = fs.readFileSync(signalsJsonPath, 'utf8')
        if (fileContent.trim()) {
          cachedSignals = JSON.parse(fileContent)
        }
      } catch (err) {
        console.error('Failed to parse signals.json:', err)
      }
    }
    
    // Seed default signals if empty
    if (cachedSignals.length === 0) {
      cachedSignals = [
        {
          commitHash: "0xbd3b53642628afcc661d45e9d3def096010c4ae45a63ed389f0226bf66a72584",
          signalType: "depeg",
          confidence: 91,
          reasoning: "mETH/cmETH peg deviation detected at 0.58%. Executing arbitrage rebalance.",
          tradeIntent: "SWAP mETH FOR cmETH ON MERCHANT MOE",
          nonce: "12345",
          timestamp: Math.floor(Date.now() / 1000) - 300,
          commitTx: "0xe1747ebb95b19b51ef1ebb90e940ac761fd60e39c9d5d5123864fe80f025fbfd",
          revealTx: "0x8f7868e5160c319d967583e0acd8abe614ab76da4880b67f3d7b20785f9dd9b3",
          onChainTx: "0xd1f8f80a77a130cff02a6e1fe19155acc73f138783709c155999e2d34dfbe55b",
          bybitOrderId: "bybit_order_12345",
          nansenLabel: "Nansen: Tier-1 Fund (Signer)",
          status: "revealed"
        },
        {
          commitHash: "0x0d8d055e12848ce8e0631a27e2471a1721e0809e7be705cd13131510ebc54247",
          signalType: "whaleExit",
          confidence: 85,
          reasoning: "Merchant Moe concentrated pool large withdrawal detected. Whale exit from USDC/MNT.",
          tradeIntent: "SHORT HEDGE MNTUSDT BYBIT",
          nonce: "67890",
          timestamp: Math.floor(Date.now() / 1000) - 900,
          commitTx: "0x2e6de9b5a3ec4a0076fff3cc11a7a8f6177996e1d373636ef86a0fba2c649d0b",
          revealTx: "0x9ab48d511acd528326dc305dddbe2841c951765b586db2bd46e37d79568bcdee",
          onChainTx: "0x76626c14c79f7dd1ec75e4f47048c47548bb078216298a50fd48c469cc8687e2",
          bybitOrderId: "bybit_order_67890",
          nansenLabel: "Nansen: Smart Money LP",
          status: "revealed"
        },
        {
          commitHash: "0x05519bbcd5f1e1d558ebeca3b5e531e1cb630f8b3e8b5a3566fdcec3f8c19880",
          signalType: "accumulation",
          confidence: 88,
          reasoning: "USDY Ondo RWA depeg deviation detected at 0.35%. Accumulating USDY on-chain.",
          tradeIntent: "BUY USDY ON MERCHANT MOE",
          nonce: "55555",
          timestamp: Math.floor(Date.now() / 1000) - 1800,
          commitTx: "0x3395f59116bf644b9ebe0a4a21e868de5d5e10e907246801a7abf6180f1c5be3",
          revealTx: "0x64a16125e6454dbc7b47a042b21376ececbba8766a8a16d491196c7aa054eb5b",
          onChainTx: "0xmockdex2...",
          bybitOrderId: "bybit_order_55555",
          nansenLabel: "Nansen: Active Whale",
          status: "revealed"
        }
      ]
      fs.writeFileSync(signalsJsonPath, JSON.stringify(cachedSignals, null, 2))
    }

    // Check if the user's agent is ACTIVE, and inject dynamic simulation signals
    let finalSignals = [...cachedSignals]
    if (fs.existsSync(stateJsonPath)) {
      try {
        const stateContent = fs.readFileSync(stateJsonPath, 'utf8')
        if (stateContent.trim()) {
          const allStates = JSON.parse(stateContent)
          const userState = allStates[walletKey]
          if (userState && userState.state === 'ACTIVE') {
            const activationTime = new Date(userState.last_action_at).getTime()
            const elapsed = Math.floor((Date.now() - activationTime) / 1000)
            
            const dynamicSignals = []
            const newNotifiedNonces: string[] = []
            const notifiedNonces = userState.notified_signals || []
            
            if (elapsed >= 30) {
              const sig = {
                commitHash: "0xaa17d308f6089d43a9392603508d64c09b29aa1bf7f897748a773828b9cb83303",
                signalType: "accumulation",
                confidence: 92,
                reasoning: "Merchant Moe mETH pool volume surge detected. Smart money accumulating.",
                tradeIntent: "BUY mETH ON MERCHANT MOE",
                nonce: "77771",
                timestamp: Math.floor(activationTime / 1000) + 30,
                commitTx: "0x3395f59116bf644b9ebe0a4a21e868de5d5e10e907246801a7abf6180f1c5be3",
                revealTx: "0x64a16125e6454dbc7b47a042b21376ececbba8766a8a16d491196c7aa054eb5b",
                onChainTx: "0x17d308f60893d43a9392603508d64c09b29aa1bf7f897748a773828b9cb83303",
                bybitOrderId: "bybit_order_77771",
                nansenLabel: "Nansen: Smart Money Inflow",
                status: "revealed"
              }
              dynamicSignals.push(sig)
              if (!notifiedNonces.includes(sig.nonce)) {
                newNotifiedNonces.push(sig.nonce)
                triggerTelegramAlert(sig)
              }
            }
            if (elapsed >= 60) {
              const sig = {
                commitHash: "0xbb2550d60c4ff8f40ff3fc598c1c9efab42083eaa6c4b861b00517d77b7ec63000",
                signalType: "depeg",
                confidence: 88,
                reasoning: "USDY/USDC deviation detected at 0.45%. Triggering arbitrage rebalance.",
                tradeIntent: "SWAP USDC FOR USDY ON MERCHANT MOE",
                nonce: "77772",
                timestamp: Math.floor(activationTime / 1000) + 60,
                commitTx: "0x2e6de9b5a3ec4a0076fff3cc11a7a8f6177996e1d373636ef86a0fba2c649d0b",
                revealTx: "0x9ab48d511acd528326dc305dddbe2841c951765b586db2bd46e37d79568bcdee",
                onChainTx: "0x2550d60c4ff8f40ff3fc598c1c9efab42083eaa6c4b861b00517d77b7ec63000",
                bybitOrderId: "bybit_order_77772",
                nansenLabel: "Nansen: Arbitrageur",
                status: "revealed"
              }
              dynamicSignals.push(sig)
              if (!notifiedNonces.includes(sig.nonce)) {
                newNotifiedNonces.push(sig.nonce)
                triggerTelegramAlert(sig)
              }
            }
            if (elapsed >= 90) {
              const sig = {
                commitHash: "0xcc3b53642628afcc661d45e9d3def096010c4ae45a63ed389f0226bf66a72584",
                signalType: "whaleExit",
                confidence: 94,
                reasoning: "Large concentrated liquidity exit of 450,000 MNT detected. Initializing short hedge.",
                tradeIntent: "SHORT HEDGE MNTUSDT BYBIT",
                nonce: "77773",
                timestamp: Math.floor(activationTime / 1000) + 90,
                commitTx: "0xe1747ebb95b19b51ef1ebb90e940ac761fd60e39c9d5d5123864fe80f025fbfd",
                revealTx: "0x8f7868e5160c319d967583e0acd8abe614ab76da4880b67f3d7b20785f9dd9b3",
                onChainTx: "0xmockdex3...",
                bybitOrderId: "bybit_order_77773",
                nansenLabel: "Nansen: Active Whale",
                status: "revealed"
              }
              dynamicSignals.push(sig)
              if (!notifiedNonces.includes(sig.nonce)) {
                newNotifiedNonces.push(sig.nonce)
                triggerTelegramAlert(sig)
              }
            }

            if (newNotifiedNonces.length > 0) {
              userState.notified_signals = [...notifiedNonces, ...newNotifiedNonces]
              fs.writeFileSync(stateJsonPath, JSON.stringify(allStates, null, 2))
            }
            
            // Prepend new active signals to the signals list
            finalSignals = [...dynamicSignals, ...cachedSignals]
          }
        }
      } catch (e) {
        console.error('Error computing dynamic signals:', e)
      }
    }

    // Safety check: Convert BigInt type properties to strings
    const sanitizedSignals = finalSignals.map((sig: any) => {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(sig)) {
        if (typeof value === 'bigint') {
          sanitized[key] = value.toString()
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = JSON.parse(
            JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v)
          )
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    })

    return NextResponse.json(sanitizedSignals)
  } catch (error: any) {
    console.error('Signals API route failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
