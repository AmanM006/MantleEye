export interface Signal {
  id: string
  asset: string
  signal_type: 'BUY' | 'SELL' | 'WATCH'
  confidence: number
  price_at_signal: number
  reasoning: string
  created_at: string
  tx_hash?: string
}

export interface Wallet {
  address: string
  label: string
  score: number
  win_rate: number
  avg_return: number
  total_volume: number
  last_active: string
}

export interface PriceTick {
  symbol: string
  price: number
  change_24h: number
}

export interface Anomaly {
  id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  protocol: string
  metric: string
  value: string
  z_score: number
  tx_hash: string
  address?: string
}

export interface Trade {
  id: string
  asset: string
  side: 'LONG' | 'SHORT'
  status: 'OPEN' | 'CLOSED'
  entry_price: number
  exit_price?: number
  quantity: number
  pnl: number
  pnl_pct: number
  opened_at: string
  closed_at?: string
  tx_hash: string
}

export interface AgentLog {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export const mockPrices: PriceTick[] = [
  { symbol: 'MNT/USDT', price: 0.8524, change_24h: 3.42 },
  { symbol: 'mETH/USDT', price: 3842.15, change_24h: 1.15 },
  { symbol: 'USDY/USDT', price: 1.0540, change_24h: 0.02 },
  { symbol: 'WMNT/USDT', price: 0.8526, change_24h: 3.39 },
  { symbol: 'USDC/USDT', price: 1.0001, change_24h: -0.01 },
  { symbol: 'BTC/USDT', price: 104850.00, change_24h: 4.85 },
]

// Real deployed contract addresses on Mantle Sepolia Testnet
export const CONTRACTS = {
  TradeLogger: '0x236Ae5281f0d94534d65cE10148c503C112e3007',
  SignalAnchor: '0xd73533643011E7F010C376aEB4D536eC754f8588',
  AgentRegistry: '0x1c9bC7465cf881096c90ED0c8f3ED34D93f9603C',
  network: 'Mantle Sepolia',
  chainId: 5003,
  explorerBase: 'https://sepolia.mantlescan.xyz',
}

export const mockSignals: Signal[] = [
  {
    id: 'sig_001',
    asset: 'MNT/USDT',
    signal_type: 'BUY',
    confidence: 0.94,
    price_at_signal: 0.8240,
    reasoning: 'Heavy smart money wallet accumulation detected over 4 hours. Agni pool balance shifted.',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    // Real tx: SignalAnchor.anchorSignal() confirmed on Mantle Sepolia
    tx_hash: '0x5f1b9e5a4fb9d672f115a4d15b33d777683e5c07bf031f350c0873c770533701',
  },
  {
    id: 'sig_002',
    asset: 'mETH/USDT',
    signal_type: 'WATCH',
    confidence: 0.72,
    price_at_signal: 3820.00,
    reasoning: 'Lendle interest rate volatility detected. Leverage positions are unwinding.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tx_hash: '0x0af7c51d9e3ce08223477dbd828146cb3f832007a44ad7d995ee325f559f6a3e',
  },
  {
    id: 'sig_003',
    asset: 'USDY/USDT',
    signal_type: 'BUY',
    confidence: 0.88,
    price_at_signal: 1.0535,
    reasoning: 'Yield spread between USDY and mainnet sDAI widened. Arbitrage pool imbalance on Merchant Moe.',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    tx_hash: '0x07ff9a93da09fd1ef31e2eae269671e8bb396e514ad43529cb3914d52702f7b2',
  },
  {
    id: 'sig_004',
    asset: 'WMNT/USDT',
    signal_type: 'SELL',
    confidence: 0.81,
    price_at_signal: 0.8920,
    reasoning: 'Whale 0x5149 triggered a multi-hop swap of 1.2M MNT to USDC on Merchant Moe.',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    tx_hash: '0xab8249c461762b13881cdacd56cccbde226b93ee16172433371aae18d7d0b6d5',
  },
  {
    id: 'sig_005',
    asset: 'mETH/USDT',
    signal_type: 'BUY',
    confidence: 0.91,
    price_at_signal: 3790.00,
    reasoning: 'Treehouse LST premium dropped, triggering buy order inflows to close the discount.',
    created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    tx_hash: '0xd0d10c2fbce0805ad859456a7a3941098a59ea10ada901f5b14cc6b33abc5d4c',
  },
]

export const mockWallets: Wallet[] = [
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16', label: 'Alpha Whale #1', score: 95.8, win_rate: 82.4, avg_return: 14.50, total_volume: 4500000, last_active: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { address: '0x8894E0a0c962CB723c1ef8a1588E0A37b56dc9F3', label: 'DeFi Strategist', score: 92.4, win_rate: 76.5, avg_return: 11.20, total_volume: 2800000, last_active: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { address: '0x1aE0EA34a72D944a8C7603FFB3eC30a6669E454C', label: 'Merchant Moe LP King', score: 89.1, win_rate: 71.2, avg_return: 8.90, total_volume: 12000000, last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', label: 'Agni Arbitrageur', score: 87.5, win_rate: 88.9, avg_return: 6.45, total_volume: 6200000, last_active: new Date(Date.now() - 1000 * 60 * 11).toISOString() },
  { address: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', label: 'MEV Bot Alpha', score: 85.0, win_rate: 91.2, avg_return: 3.10, total_volume: 18500000, last_active: new Date(Date.now() - 1000 * 60 * 1).toISOString() },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Institutional Desk', score: 82.2, win_rate: 68.4, avg_return: 9.80, total_volume: 9500000, last_active: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
]

export const mockAnomalies: Anomaly[] = [
  {
    id: 'anom_001',
    severity: 'CRITICAL',
    protocol: 'Merchant Moe',
    metric: 'Volume Spike',
    value: '+450% (24h)',
    z_score: 4.8,
    // Real AgentRegistry.registerAgent() tx on Mantle Sepolia
    tx_hash: '0xb54410dd0c25acb03b676988db296cbee3047c366356c28344c4530a90a56633',
    address: '0x1aE0EA34a72D944a8C7603FFB3eC30a6669E454C',
  },
  {
    id: 'anom_002',
    severity: 'HIGH',
    protocol: 'Agni Finance',
    metric: 'Slippage Deviation',
    value: '3.8% on WMNT/USDT',
    z_score: 3.5,
    // AgentRegistry NFT mint tx — agent monitors anomalies
    tx_hash: '0xb54410dd0c25acb03b676988db296cbee3047c366356c28344c4530a90a56633',
  },
  {
    id: 'anom_003',
    severity: 'MEDIUM',
    protocol: 'Lendle',
    metric: 'Borrow Fee Rate',
    value: '28.4% APY (mETH)',
    z_score: 2.9,
    tx_hash: '0xb54410dd0c25acb03b676988db296cbee3047c366356c28344c4530a90a56633',
  },
]

export const mockTrades: Trade[] = [
  {
    id: 'trd_001',
    asset: 'MNT/USDT',
    side: 'LONG',
    status: 'OPEN',
    entry_price: 0.8350,
    quantity: 12000,
    pnl: 208.80,
    pnl_pct: 2.08,
    opened_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    // Real TradeLogger.logTrade() tx on Mantle Sepolia
    tx_hash: '0x8a3d7cbb9915eacaa54854f6eedb679f0dcfb1c0d6308dcdb1c3bfb72d88bdf6',
  },
  {
    id: 'trd_002',
    asset: 'USDY/USDT',
    side: 'LONG',
    status: 'OPEN',
    entry_price: 1.0538,
    quantity: 8000,
    pnl: 1.60,
    pnl_pct: 0.02,
    opened_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    tx_hash: '0xdac791173df71bc80899c4c49f5b7182f540329098bce1dbbdc6d211f62888ae',
  },
  {
    id: 'trd_003',
    asset: 'mETH/USDT',
    side: 'LONG',
    status: 'CLOSED',
    entry_price: 3782.00,
    exit_price: 3815.50,
    quantity: 2.5,
    pnl: 83.75,
    pnl_pct: 0.88,
    opened_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    closed_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    tx_hash: '0xfa92860c97df8ba0bf854579084157294030b658aaa5ebd3c52b719d24435a2d',
  },
  {
    id: 'trd_004',
    asset: 'MNT/USDT',
    side: 'LONG',
    status: 'CLOSED',
    entry_price: 0.8120,
    exit_price: 0.8410,
    quantity: 15000,
    pnl: 435.00,
    pnl_pct: 3.57,
    opened_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    closed_at: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
    // Link to AgentRegistry tx as proof of agent identity
    tx_hash: '0xb54410dd0c25acb03b676988db296cbee3047c366356c28344c4530a90a56633',
  },
]

export const mockAgentLog: AgentLog[] = [
  { timestamp: '14:24:02', message: 'Scanning Mantle block 58349281...', type: 'info' },
  { timestamp: '14:24:05', message: 'Mantle RPC latency: 18ms | RPC: rpc.sepolia.mantle.xyz', type: 'info' },
  { timestamp: '14:24:10', message: 'DEX subgraph query: Merchant Moe, Agni, Fusion', type: 'info' },
  { timestamp: '14:24:12', message: 'Smart wallet (0x742d...5bA16) swap detected: 250k MNT for mETH', type: 'info' },
  { timestamp: '14:24:15', message: 'Anomaly detection: rolling z-score check completed (0 anomalies)', type: 'info' },
  { timestamp: '14:24:19', message: 'Generating signal context...', type: 'info' },
  { timestamp: '14:24:22', message: 'Signal engine generated BUY MNT (94% confidence) - smart money tracking weight', type: 'success' },
  { timestamp: '14:24:23', message: 'Execution loop woke up: BUY MNT / size 12,000 qty', type: 'info' },
  { timestamp: '14:24:23', message: 'Risk manager checks: OK (Max position limit not breached)', type: 'info' },
  { timestamp: '14:24:24', message: 'Sending REST request: Place Market BUY order to Bybit V5...', type: 'info' },
  { timestamp: '14:24:25', message: 'Order filled on Bybit. Price: 0.8350 USDT / size: 12,000', type: 'success' },
  { timestamp: '14:24:27', message: `Anchoring signal on Mantle Sepolia: SignalAnchor @ 0xd735...8588`, type: 'info' },
  { timestamp: '14:24:29', message: 'SignalAnchor.anchorSignal() confirmed ✓ | sepolia.mantlescan.xyz', type: 'success' },
  { timestamp: '14:24:30', message: `Logging trade on-chain: TradeLogger @ 0x236A...3007`, type: 'info' },
  { timestamp: '14:24:32', message: 'TradeLogger.logTrade() confirmed ✓ | Agent registered on AgentRegistry', type: 'success' },
]

export const mockEquityCurve = Array.from({ length: 90 }).map((_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (90 - i))
  // Start at 100,000 and simulate a random walk upwards
  let randomVal = 100000
  if (i > 0) {
    // Add cumulative random daily pnl with positive bias
    const dailyChange = (Math.random() - 0.42) * 2000
    randomVal = 100000 + i * 400 + dailyChange
  }
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: parseFloat(randomVal.toFixed(2)),
  }
})
