import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const stateJsonPath = path.join(process.cwd(), 'src', 'data', 'agent_state.json')

const DEFAULT_STATE = {
  state: 'ACTIVE',
  started_at: new Date(Date.now() - 43200 * 1000).toISOString(), // 12 hours ago
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
        started_at: new Date(Date.now() - 43200 * 1000).toISOString(),
        last_action_at: new Date().toISOString() 
      }
      fs.writeFileSync(stateJsonPath, JSON.stringify(allStates, null, 2))
    } else if (!allStates[walletKey].started_at) {
      // Migrate old state file structure
      allStates[walletKey].started_at = new Date(Date.now() - (allStates[walletKey].uptime_seconds || 43200) * 1000).toISOString()
      delete allStates[walletKey].uptime_seconds
      fs.writeFileSync(stateJsonPath, JSON.stringify(allStates, null, 2))
    }

    // Dynamic uptime calculation
    const startedAtMs = new Date(allStates[walletKey].started_at).getTime()
    const uptime_seconds = Math.floor((Date.now() - startedAtMs) / 1000)

    return NextResponse.json({
      ...allStates[walletKey],
      uptime_seconds
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
