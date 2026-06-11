import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const stateJsonPath = path.join(process.cwd(), 'src', 'data', 'agent_state.json')

const DEFAULT_STATE = {
  state: 'ACTIVE',
  uptime_seconds: 43200,
  last_action: 'Scanned Mantle block 58349281. Executed order fill.',
  last_action_at: new Date().toISOString(),
  open_positions: 2
}

export async function GET(req: NextRequest) {
  try {
    const userWallet = req.headers.get('x-user-wallet') || req.nextUrl.searchParams.get('wallet') || 'default'
    const walletKey = userWallet.toLowerCase()

    let allStates: Record<string, any> = {}
    if (fs.existsSync(stateJsonPath)) {
      try {
        const fileContent = fs.readFileSync(stateJsonPath, 'utf8')
        if (fileContent.trim()) {
          allStates = JSON.parse(fileContent)
        }
      } catch (err) {
        console.error('Failed to parse agent_state.json:', err)
      }
    }

    if (!allStates[walletKey]) {
      allStates[walletKey] = { 
        ...DEFAULT_STATE, 
        last_action_at: new Date().toISOString() 
      }
      fs.writeFileSync(stateJsonPath, JSON.stringify(allStates, null, 2))
    }

    return NextResponse.json(allStates[walletKey])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
