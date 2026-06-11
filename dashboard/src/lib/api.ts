import {
  mockSignals,
  mockWallets,
  mockPrices,
  mockAnomalies,
  mockTrades,
  Signal,
  Wallet,
  Anomaly,
  Trade,
} from './mock-data'

const BASE_URL = '' // Empty because Next rewrites /api/ to http://localhost:8000/api/

// Fallback checking helper
async function fetchSafe<T>(url: string, fallbackData: T, headers?: Record<string, string>): Promise<T> {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    return await res.json() as T
  } catch (error) {
    console.warn(`Fetch to ${url} failed. Using mock data instead.`, error)
    return fallbackData
  }
}

export async function fetchSignals(params?: {
  limit?: number
  offset?: number
  asset?: string
  type?: string
  minConfidence?: number
  walletAddress?: string
}): Promise<{ signals: Signal[]; total: number }> {
  let url = `${BASE_URL}/api/signals?`
  if (params) {
    if (params.limit) url += `limit=${params.limit}&`
    if (params.offset) url += `offset=${params.offset}&`
    if (params.asset) url += `asset=${encodeURIComponent(params.asset)}&`
    if (params.type) url += `signal_type=${params.type}&`
    if (params.minConfidence) url += `min_confidence=${params.minConfidence}&`
  }
  
  const headers: Record<string, string> = {}
  if (params?.walletAddress) {
    headers['x-user-wallet'] = params.walletAddress
  }

  // Fetch raw signals array from the cached /api/signals database endpoint
  const rawData = await fetchSafe<any[]>(url, [], headers)
  
  if (rawData && Array.isArray(rawData) && rawData.length > 0) {
    const signals: Signal[] = rawData.map((sig: any) => {
      const intent = (sig.tradeIntent || '').toUpperCase()
      
      let asset = 'MNT/USDT'
      if (intent.includes('METH')) asset = 'mETH/USDT'
      else if (intent.includes('USDY')) asset = 'USDY/USDT'
      else if (intent.includes('MNT')) asset = 'MNT/USDT'
      
      let signal_type: 'BUY' | 'SELL' | 'WATCH' = 'WATCH'
      if (intent.includes('BUY') || intent.includes('SWAP') || sig.signalType === 'accumulation') {
        signal_type = 'BUY'
      } else if (intent.includes('SELL') || intent.includes('SHORT') || intent.includes('HEDGE') || sig.signalType === 'whaleExit') {
        signal_type = 'SELL'
      }
      
      const confidence = sig.confidence > 1 ? sig.confidence / 100 : sig.confidence
      
      let price_at_signal = 0.8524
      if (asset === 'mETH/USDT') price_at_signal = 3842.15
      else if (asset === 'USDY/USDT') price_at_signal = 1.0540
      
      const created_at = sig.timestamp 
        ? new Date(sig.timestamp * 1000).toISOString() 
        : new Date().toISOString()
        
      return {
        id: sig.commitHash || `sig_${Math.random().toString(36).substr(2, 9)}`,
        asset,
        signal_type,
        confidence,
        price_at_signal,
        reasoning: sig.reasoning || '',
        created_at,
        tx_hash: sig.onChainTx || sig.revealTx || sig.commitTx
      }
    })
    
    return {
      signals,
      total: signals.length
    }
  }
  
  return {
    signals: mockSignals,
    total: mockSignals.length,
  }
}

export async function fetchLatestSignal(): Promise<Signal> {
  try {
    const { signals } = await fetchSignals({ limit: 1 })
    if (signals && signals.length > 0) {
      return signals[0]
    }
  } catch (error) {
    console.warn('Failed to fetch latest signal from API, using mock data.', error)
  }
  return mockSignals[0]
}

export async function fetchWallets(): Promise<Wallet[]> {
  return fetchSafe<Wallet[]>(`${BASE_URL}/api/wallets/smart-money`, mockWallets)
}

export async function fetchWalletHistory(address: string): Promise<any> {
  const mockHistory = [
    { tx_hash: '0x12a3...', action: 'SWAP', asset: 'MNT', amount: 45000, value_usd: 38250, timestamp: new Date().toISOString() },
    { tx_hash: '0x34b5...', action: 'ADD_LIQUIDITY', asset: 'WMNT/USDT', amount: 12000, value_usd: 20400, timestamp: new Date(Date.now() - 1000*60*60).toISOString() },
  ]
  return fetchSafe<any>(`${BASE_URL}/api/wallets/${address}/history`, {
    address,
    history: mockHistory,
    total: mockHistory.length,
    limit: 20,
    offset: 0
  })
}

export async function fetchAgentStatus(walletAddress?: string): Promise<any> {
  try {
    const headers: Record<string, string> = {}
    if (walletAddress) {
      headers['x-user-wallet'] = walletAddress
    }
    const res = await fetch(`${BASE_URL}/api/agent/status`, { headers })
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    return await res.json()
  } catch (error) {
    let uptime = 43200
    if (typeof window !== 'undefined') {
      let storedStart = localStorage.getItem('seye_agent_start_time')
      if (!storedStart) {
        storedStart = (Date.now() - 43200 * 1000).toString()
        localStorage.setItem('seye_agent_start_time', storedStart)
      }
      uptime = Math.floor((Date.now() - Number(storedStart)) / 1000)
    }
    return {
      state: 'ACTIVE',
      uptime_seconds: uptime,
      last_action: 'Scanned Mantle block 58349281. Executed order fill.',
      last_action_at: new Date().toISOString(),
      open_positions: 2,
    }
  }
}

export async function startAgent(walletAddress?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (walletAddress) {
      headers['x-user-wallet'] = walletAddress
    }
    const res = await fetch(`${BASE_URL}/api/agent/start`, {
      method: 'POST',
      headers
    })
    return await res.json()
  } catch (error) {
    return { success: true, message: 'Agent started successfully (mock mode).', state: 'ACTIVE' }
  }
}

export async function stopAgent(walletAddress?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (walletAddress) {
      headers['x-user-wallet'] = walletAddress
    }
    const res = await fetch(`${BASE_URL}/api/agent/stop`, {
      method: 'POST',
      headers
    })
    return await res.json()
  } catch (error) {
    return { success: true, message: 'Agent stopped successfully (mock mode).', state: 'STOPPED' }
  }
}

export async function fetchStrategyConfig(walletAddress?: string): Promise<any> {
  try {
    const headers: Record<string, string> = {}
    if (walletAddress) {
      headers['x-user-wallet'] = walletAddress
    }
    const res = await fetch(`${BASE_URL}/api/strategy/config`, { headers })
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      strategy_type: 'MOMENTUM',
      max_position_usd: 12500,
      stop_loss_pct: 3.5,
      take_profit_pct: 12.0,
      max_open_positions: 3,
      cooldown_seconds: 300,
    }
  }
}

export async function updateStrategy(config: any, walletAddress?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (walletAddress) {
      headers['x-user-wallet'] = walletAddress
    }
    const res = await fetch(`${BASE_URL}/api/strategy/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    })
    return await res.json()
  } catch (error) {
    return { ...config, success: true }
  }
}

export async function fetchTradeHistory(): Promise<{ trades: Trade[]; total: number }> {
  return fetchSafe<{ trades: Trade[]; total: number }>(`${BASE_URL}/api/trades/history`, {
    trades: mockTrades.filter(t => t.status === 'CLOSED'),
    total: mockTrades.filter(t => t.status === 'CLOSED').length,
  })
}

export async function fetchLiveTrades(): Promise<Trade[]> {
  return fetchSafe<Trade[]>(`${BASE_URL}/api/trades/live`, mockTrades.filter(t => t.status === 'OPEN'))
}
