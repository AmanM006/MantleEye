import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const configJsonPath = path.join(process.cwd(), 'src', 'data', 'strategy_config.json')

const DEFAULT_CONFIG = {
  strategy_type: 'MOMENTUM',
  max_position_usd: 1000,
  stop_loss_pct: 3.5,
  take_profit_pct: 12.0,
  max_open_positions: 3,
  cooldown_seconds: 300
}

export async function GET(req: NextRequest) {
  try {
    const userWallet = req.headers.get('x-user-wallet') || req.nextUrl.searchParams.get('wallet') || 'default'
    const walletKey = userWallet.toLowerCase()

    let allConfigs: Record<string, any> = {}
    if (fs.existsSync(configJsonPath)) {
      try {
        const fileContent = fs.readFileSync(configJsonPath, 'utf8')
        if (fileContent.trim()) {
          allConfigs = JSON.parse(fileContent)
        }
      } catch (err) {
        console.error('Failed to parse strategy_config.json:', err)
      }
    }

    if (!allConfigs[walletKey]) {
      allConfigs[walletKey] = { ...DEFAULT_CONFIG }
      fs.writeFileSync(configJsonPath, JSON.stringify(allConfigs, null, 2))
    }

    return NextResponse.json(allConfigs[walletKey])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
