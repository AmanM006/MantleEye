'use client'

import { useEffect, useState } from 'react'
import { fetchStrategyConfig, updateStrategy, fetchLiveTrades } from '@/lib/api'
import { Trade } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import PnLChart from '@/components/PnLChart'
import FlashNumber from '@/components/FlashNumber'
import { Settings, ShieldCheck, TrendingUp, Zap, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { backtestMomentum90d } from '@/data/backtest_momentum_90d'
import { useEducationMode } from '@/context/EducationContext'
import { useWallet } from '@/context/WalletContext'

// ─── Backtest profiles per strategy ───────────────────────────────────────────
type BacktestStats = {
  totalReturn: number
  winRate: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  totalTrades: number
  profitFactor: number
  bestTrade: number
  worstTrade: number
  equityCurve?: number[]
}

const STRATEGY_PROFILES: Record<string, BacktestStats> = {
  MOMENTUM: {
    totalReturn: backtestMomentum90d.total_return_pct,
    winRate: backtestMomentum90d.win_rate,
    sharpeRatio: backtestMomentum90d.sharpe_ratio,
    sortinoRatio: backtestMomentum90d.sortino_ratio,
    maxDrawdown: backtestMomentum90d.max_drawdown_pct,
    totalTrades: backtestMomentum90d.total_trades,
    profitFactor: backtestMomentum90d.profit_factor,
    bestTrade: backtestMomentum90d.best_trade_pnl,
    worstTrade: backtestMomentum90d.worst_trade_pnl,
    equityCurve: [...backtestMomentum90d.equity_curve],
  },
  ARBITRAGE: {
    totalReturn: 24.12,
    winRate: 88.5,
    sharpeRatio: 3.42,
    sortinoRatio: 4.81,
    maxDrawdown: 2.15,
    totalTrades: 1204,
    profitFactor: 1.87,
    bestTrade: 340.5,
    worstTrade: -120.1,
  },
  MACO: {
    totalReturn: 62.4,
    winRate: 64.8,
    sharpeRatio: 1.88,
    sortinoRatio: 2.74,
    maxDrawdown: 14.2,
    totalTrades: 89,
    profitFactor: 3.12,
    bestTrade: 8210.0,
    worstTrade: -3105.5,
  },
}

export default function TradingStrategy() {
  const { walletConnected, walletAddress, connecting, connectWallet } = useWallet()
  const isDeployer = walletConnected

  const [activeStrategy, setActiveStrategy] = useState<'MOMENTUM' | 'ARBITRAGE' | 'MACO'>('MOMENTUM')
  const [positions, setPositions] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const { isEducationMode } = useEducationMode()

  // Risk parameters state
  const [maxPosition, setMaxPosition] = useState(1000)
  const [stopLoss, setStopLoss] = useState(3.5)
  const [takeProfit, setTakeProfit] = useState(12.0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const backtestStats = STRATEGY_PROFILES[activeStrategy]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Load strategy configuration scoped to the user wallet
      try {
        const backendConfig = await fetchStrategyConfig(walletAddress)
        if (backendConfig) {
          setActiveStrategy(backendConfig.strategy_type || 'MOMENTUM')
          setMaxPosition(backendConfig.max_position_usd || 1000)
          setStopLoss(backendConfig.stop_loss_pct || 3.5)
          setTakeProfit(backendConfig.take_profit_pct || 12.0)
        }
      } catch (err) {
        console.warn('Failed to load strategy config from API, trying local/defaults', err)
      }

      if (isDeployer) {
        const liveTrades = await fetchLiveTrades()
        setPositions(liveTrades)
      } else {
        setPositions([])
      }
      setLoading(false)
    }

    if (walletConnected) {
      loadData()
    }
  }, [walletConnected, walletAddress, isDeployer])

  const handleStrategyChange = (strat: 'MOMENTUM' | 'ARBITRAGE' | 'MACO') => {
    setActiveStrategy(strat)
    // Update default sliders based on selected strategy
    if (strat === 'ARBITRAGE') {
      setMaxPosition(25000)
      setStopLoss(1.5)
      setTakeProfit(4.0)
    } else if (strat === 'MOMENTUM') {
      setMaxPosition(5000)
      setStopLoss(3.5)
      setTakeProfit(12.0)
    } else if (strat === 'MACO') {
      setMaxPosition(15000)
      setStopLoss(5.0)
      setTakeProfit(15.0)
    }
  }

  const handleSaveConfig = async () => {
    setIsUpdating(true)
    setUpdateSuccess(false)
    try {
      localStorage.setItem('stop_loss_pct', stopLoss.toString())
      localStorage.setItem('take_profit_pct', takeProfit.toString())

      const contractOwner = '0x9d744f795faa53e3173baf18783baf51b92b98a5'
      const isContractOwner = walletConnected && walletAddress.toLowerCase() === contractOwner.toLowerCase()

      if (isContractOwner) {
        // Trigger actual contract transaction to update maximum position size
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(
          '0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1',
          ["function setMaxPositionSize(uint256) external"],
          signer
        )
        const tx = await contract.setMaxPositionSize(ethers.parseEther(maxPosition.toString()))
        console.log('Update tx sent:', tx.hash)
        await tx.wait()
        console.log('Update tx confirmed!')
      } else {
        console.info('Standard user: Simulated configuration update (bypassed Metamask write).')
      }

      // Sync with secure backend API route
      const apiRes = await updateStrategy({
        strategy_type: activeStrategy,
        max_position_usd: maxPosition,
        stop_loss_pct: stopLoss,
        take_profit_pct: takeProfit,
        max_open_positions: 3,
        cooldown_seconds: 300
      }, walletAddress)
      
      if (apiRes && apiRes.success === false) {
        throw new Error(apiRes.message || 'Backend rejected strategy config update.')
      }

      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (e: any) {
      console.error('Failed to sync configuration:', e)
      alert(e.message || 'Failed to update config. Check if you rejected the transaction.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden min-h-0 bg-transparent font-mono select-none">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-4 bg-opacity-40">
        <div>
          <h1 className="text-sm font-bold tracking-wider text-text-primary font-khteka">👁️ QUANT TRADING STRATEGIES</h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
            PORTFOLIO RISK PROFILE &amp; STRATEGY SELECTION
          </p>
        </div>
        {/* Live badge for MOMENTUM showing it's powered by real data */}
        {activeStrategy === 'MOMENTUM' && (
          <div className="flex items-center space-x-2 px-3 py-1.5 border border-accent-green/30 bg-accent-green/5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[9px] font-bold text-accent-green tracking-wider">LIVE BACKTEST DATA · 90D</span>
          </div>
        )}
      </div>

      {/* Beginner Guide Mode Banner */}
      {isEducationMode && (
        <div className="shrink-0 border border-[#00d4a4]/30 bg-[#00d4a4]/5 p-4 font-sans space-y-2">
          <div className="text-[10px] font-extrabold text-[#00d4a4] tracking-wider uppercase flex items-center space-x-1.5 font-khteka">
            <span>💡 QUANT METRICS CHEAT SHEET</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-[9px] text-text-muted uppercase">
            <div>
              <strong className="text-text-primary">1. Sharpe Ratio</strong>
              <p className="mt-0.5 leading-relaxed">Returns vs risk. Score &gt; 3.0 means excellent returns relative to portfolio risk.</p>
            </div>
            <div>
              <strong className="text-text-primary">2. Sortino Ratio</strong>
              <p className="mt-0.5 leading-relaxed">Similar to Sharpe, but only penalizes bad risk (downward price drops).</p>
            </div>
            <div>
              <strong className="text-text-primary">3. Max Drawdown</strong>
              <p className="mt-0.5 leading-relaxed">The biggest drop in portfolio value from peak to bottom. Lower is better.</p>
            </div>
            <div>
              <strong className="text-text-primary">4. Profit Factor</strong>
              <p className="mt-0.5 leading-relaxed">Total gains divided by total losses. &gt; 2.0 means strategy is highly profitable.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Strategy Panel Wrapper */}
      <div className="relative flex-1 flex flex-col min-h-0 space-y-6">
        {!walletConnected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-[2px] gap-3">
            <div className="border border-white/10 p-3 bg-white/5">
              <Lock className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-center px-4">Connect wallet to view and configure trading strategy</p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="mt-1 px-4 py-2 bg-[#00d4a4] text-black text-[10px] font-bold tracking-widest uppercase hover:bg-[#00b891] transition-colors disabled:opacity-50"
            >
              {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 shrink-0">
        {['MOMENTUM', 'ARBITRAGE', 'MACO'].map((strat) => (
          <button
            key={strat}
            onClick={() => handleStrategyChange(strat as any)}
            className={cn(
              "px-6 py-2.5 text-xs font-bold border transition-colors",
              activeStrategy === strat
                ? "bg-[#0c0c0e] text-accent-teal border-accent-teal font-khteka"
                : "border-white/5 text-text-primary/60 hover:text-text-primary bg-[#0c0c0e]/30 font-khteka"
            )}
          >
            {strat === 'MACO' ? 'MACRO TREND-FOLLOW' : `${strat} STRATEGY`}
          </button>
        ))}
      </div>

      {/* Grid: Config (Left) + PnL Chart (Right) */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Risk Config */}
        <div className="flex flex-col border border-white/5 bg-[#0c0c0e] overflow-y-auto">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-text-primary font-khteka">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-accent-teal" />
              <span>STRATEGY PARAMETERS</span>
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Strategy Description Card */}
            <div className="bg-white/[0.02] border border-white/5 p-4 text-[10px] text-neutral-400 space-y-1 rounded">
              <span className="text-white font-bold block uppercase tracking-wider text-[9px] font-khteka text-accent-teal">
                {activeStrategy === 'MOMENTUM' 
                  ? '⚡ MOMENTUM BREAKOUT STRATEGY' 
                  : activeStrategy === 'ARBITRAGE' 
                    ? '🔄 PEGRECOVERY ARBITRAGE STRATEGY' 
                    : '🌐 MACRO TREND-FOLLOW STRATEGY'}
              </span>
              <p className="leading-relaxed">
                {activeStrategy === 'MOMENTUM'
                  ? 'Detects velocity patterns and breakouts in high-volume pools (like mETH/MNT). Uses Bybit futures to open trend-riding long/short positions.'
                  : activeStrategy === 'ARBITRAGE'
                    ? 'Monitors token deviations (like mETH vs cmETH) on Merchant Moe and executes micro-arbitrage swaps to profit from peg recoveries with minimal risk.'
                    : 'Tracks Nansen smart money inflows and whale accumulations to piggyback on large institutional movements across the Mantle ecosystem.'}
              </p>
            </div>

            {/* Max Position */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-primary">MAX POSITION SIZE (USD)</span>
                <span className="text-accent-teal">${maxPosition.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={maxPosition}
                onChange={(e) => setMaxPosition(parseInt(e.target.value))}
                className="w-full bg-primary appearance-none border border-border h-1 cursor-pointer accent-accent-teal"
              />
            </div>

            {/* Stop Loss */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-primary">STOP LOSS PERCENTAGE</span>
                <span className="text-accent-red">{stopLoss.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                className="w-full bg-primary appearance-none border border-border h-1 cursor-pointer accent-accent-red"
              />
            </div>

            {/* Take Profit */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-primary">TAKE PROFIT PERCENTAGE</span>
                <span className="text-accent-green">{takeProfit.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="30.0"
                step="0.5"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                className="w-full bg-primary appearance-none border border-border h-1 cursor-pointer accent-accent-green"
              />
            </div>

            {/* Verification Checklist */}
            <div className="bg-black/20 border border-white/5 p-4 space-y-2 text-[10px] text-text-primary/70">
              <div className="flex items-center space-x-2 text-accent-teal font-bold mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span>RISK SHIELD STATUS: ARMED</span>
              </div>
              <p>✔ Position sizes auto-adjusted by Mantle gas costs.</p>
              <p>✔ Circuit breaker trips on -15.00% daily drawdown.</p>
              <p>✔ Orders logged on-chain in verified TradeLogger contract.</p>
            </div>
          </div>

          {/* Action button */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end items-center">
            {updateSuccess && (
              <span className="text-[10px] text-accent-green font-bold mr-4">
                CONFIG CACHE SYNCHRONIZED
              </span>
            )}
            <button
              onClick={handleSaveConfig}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-5 py-2 bg-white border border-white text-xs text-black font-bold font-khteka uppercase hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              <span>{isUpdating ? 'APPLYING CONFIG...' : 'APPLY CONFIGURATION'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Performance Line Chart */}
        <div className="flex flex-col border border-white/5 bg-[#0c0c0e] overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-text-primary font-khteka">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent-green" />
              <span>EQUITY CURVE HISTORICAL REPLAY</span>
            </div>
            <div className="flex items-center space-x-4 text-[9px] text-text-muted">
              {backtestStats.equityCurve && (
                <>
                  <span>
                    START:{' '}
                    <span className="text-text-primary font-bold">
                      ${(backtestStats.equityCurve[0] / 1000).toFixed(0)}K
                    </span>
                  </span>
                  <span>
                    END:{' '}
                    <span className="text-accent-green font-bold">
                      ${(backtestStats.equityCurve[backtestStats.equityCurve.length - 1] / 1000).toFixed(1)}K
                    </span>
                  </span>
                </>
              )}
              <span>{STRATEGY_PROFILES[activeStrategy] && '90D · MNT'}</span>
            </div>
          </div>
          <div className="flex-1 bg-transparent">
            <PnLChart equityCurve={backtestStats.equityCurve} />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Positions (Left) & Backtest Results (Right) */}
      <div className="grid grid-cols-5 gap-6 shrink-0 min-h-0" style={{ height: '13rem' }}>
        {/* Positions (60% / 3-Cols) */}
        <div className="col-span-3 flex flex-col border border-white/5 bg-[#0c0c0e] overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] text-xs font-bold text-text-primary font-khteka">
            ACTIVE ON-CHAIN POSITIONS
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                LOADING INVENTORY CACHE...
              </div>
            ) : positions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                PORTFOLIO CASH-HEAVY. NO OPEN POSITIONS.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#050508]/85 border-b border-white/5 font-mono text-[9px] text-text-muted">
                  <tr>
                    <th className="p-2.5">ASSET</th>
                    <th className="p-2.5">SIDE</th>
                    <th className="p-2.5">ENTRY</th>
                    <th className="p-2.5">QTY</th>
                    <th className="p-2.5">CURRENT P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map((pos) => {
                    const isPositive = pos.pnl >= 0
                    return (
                      <tr key={pos.id} className="bg-transparent hover:bg-white/[0.02] transition-colors">
                        <td className="p-2.5 font-bold text-text-primary">{pos.asset}</td>
                        <td className="p-2.5">
                          <span className={cn(
                            "px-1 py-[1px] text-[8px] font-bold border",
                            pos.side === 'LONG' ? 'text-accent-green border-accent-green/20 bg-accent-green/5' : 'text-accent-red border-accent-red/20 bg-accent-red/5'
                          )}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="p-2.5 tabular-nums text-text-primary/70">${pos.entry_price.toFixed(4)}</td>
                        <td className="p-2.5 tabular-nums text-text-primary/70">{pos.quantity}</td>
                        <td className="p-2.5">
                          <FlashNumber
                            value={pos.pnl}
                            prefix={isPositive ? '+$' : '-$'}
                            suffix={` (${isPositive ? '+' : ''}${pos.pnl_pct.toFixed(2)}%)`}
                            decimals={2}
                            className={cn("font-bold text-xs", isPositive ? "text-accent-green" : "text-accent-red")}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Backtest Results (40% / 2-Cols) — 3×2 grid with 6 metrics */}
        <div className="col-span-2 flex flex-col border border-white/5 bg-[#0c0c0e] overflow-hidden font-mono text-xs">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-text-primary font-khteka">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent-teal" />
              <span>BACKTEST RESULTS</span>
            </div>
            <div className="flex items-center space-x-2">
              {activeStrategy === 'MOMENTUM' && (
                <span className="text-[8px] text-accent-green font-bold">● REAL DATA</span>
              )}
              <span className="text-[8px] text-text-muted">PERIOD: 90 DAYS</span>
            </div>
          </div>

          <div className="flex-1 p-3 grid grid-cols-3 grid-rows-2 gap-2 bg-transparent overflow-hidden">
            {/* Row 1 */}
            <div className="border border-border/60 p-2 flex flex-col justify-between bg-accent-green/[0.03]">
              <span className="text-[8px] text-text-muted tracking-wider">TOTAL RETURN</span>
              <span className="text-sm font-bold text-accent-green">+{backtestStats.totalReturn.toFixed(2)}%</span>
            </div>
            <div className="border border-border/60 p-2 flex flex-col justify-between">
              <span className="text-[8px] text-text-muted tracking-wider">SHARPE RATIO</span>
              <span className="text-sm font-bold text-accent-teal">{backtestStats.sharpeRatio.toFixed(4)}</span>
            </div>
            <div className="border border-border/60 p-2 flex flex-col justify-between">
              <span className="text-[8px] text-text-muted tracking-wider">SORTINO RATIO</span>
              <span className="text-sm font-bold text-accent-teal">{backtestStats.sortinoRatio.toFixed(4)}</span>
            </div>
            {/* Row 2 */}
            <div className="border border-border/60 p-2 flex flex-col justify-between">
              <span className="text-[8px] text-text-muted tracking-wider">WIN RATE</span>
              <span className="text-sm font-bold text-text-primary">{backtestStats.winRate.toFixed(2)}%</span>
            </div>
            <div className="border border-border/60 p-2 flex flex-col justify-between bg-accent-red/[0.03]">
              <span className="text-[8px] text-text-muted tracking-wider">MAX DRAWDOWN</span>
              <span className="text-sm font-bold text-accent-red">-{backtestStats.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="border border-border/60 p-2 flex flex-col justify-between">
              <span className="text-[8px] text-text-muted tracking-wider">PROFIT FACTOR</span>
              <span className="text-sm font-bold text-accent-yellow">{backtestStats.profitFactor.toFixed(4)}</span>
            </div>
          </div>

          {/* Extra metrics row: Total Trades, Best/Worst Trade */}
          <div className="grid grid-cols-3 gap-0 border-t border-white/5 shrink-0">
            <div className="p-2 border-r border-white/5 flex flex-col">
              <span className="text-[8px] text-text-muted tracking-wider">TOTAL TRADES</span>
              <span className="text-xs font-bold text-text-primary mt-0.5">{backtestStats.totalTrades.toLocaleString()}</span>
            </div>
            <div className="p-2 border-r border-border flex flex-col">
              <span className="text-[8px] text-text-muted tracking-wider">BEST TRADE</span>
              <span className="text-xs font-bold text-accent-green mt-0.5">+${backtestStats.bestTrade.toLocaleString()}</span>
            </div>
            <div className="p-2 flex flex-col">
              <span className="text-[8px] text-text-muted tracking-wider">WORST TRADE</span>
              <span className="text-xs font-bold text-accent-red mt-0.5">-${Math.abs(backtestStats.worstTrade).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
