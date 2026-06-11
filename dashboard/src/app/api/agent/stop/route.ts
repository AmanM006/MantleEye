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

export async function POST(req: NextRequest) {
  try {
    const userWallet = req.headers.get('x-user-wallet')

    if (!userWallet) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Access Denied: Please connect your wallet to control the execution loop.' 
        }, 
        { status: 400 }
      )
    }

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
    }

    allStates[walletKey].state = 'STOPPED'
    allStates[walletKey].last_action = 'SIGINT received. Shutting down execution engines...'
    allStates[walletKey].last_action_at = new Date().toISOString()

    fs.writeFileSync(stateJsonPath, JSON.stringify(allStates, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Agent stopped successfully.',
      state: 'STOPPED'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
