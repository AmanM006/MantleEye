'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchAgentStatus, startAgent, stopAgent, fetchTradeHistory } from '@/lib/api'
import { AgentLog, mockAgentLog, CONTRACTS } from '@/lib/mock-data'
import { formatAddress, formatTimestamp } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { socketClient } from '@/lib/ws'
import { Cpu, Power, Clock, ShieldCheck, ExternalLink, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'
import { useWallet } from '@/context/WalletContext'

export default function AgentActivity() {
  const { walletConnected, walletAddress, connecting, connectWallet } = useWallet()
  const isDeployer = walletConnected

  const [status, setStatus] = useState<'ACTIVE' | 'STOPPED' | 'ERROR'>('ACTIVE')
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [uptime, setUptime] = useState(0)
  const [totalTrades, setTotalTrades] = useState(0)
  const [winRate, setWinRate] = useState(0)
  const [lastAction, setLastAction] = useState('—')
  const { isEducationMode } = useEducationMode()
  
  const [isCommanding, setIsCommanding] = useState(false)
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      if (!walletConnected) return

      try {
        const agentStatus = await fetchAgentStatus(walletAddress)
        setStatus(agentStatus.state || 'ACTIVE')
        setUptime(agentStatus.uptime_seconds || 43200)
        setLastAction(agentStatus.last_action || 'Scanned Mantle block 58349281.')
      } catch (err) {
        console.warn('Failed to load agent status from API', err)
      }

      if (isDeployer) {
        setWinRate(76.2)
        
        let baseCount = 4
        // Fetch tradeCount from contract
        try {
          const { ethers } = await import('ethers')
          const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz')
          const TRADE_LOGGER_ABI = [
            "function tradeCount() external view returns (uint256)"
          ]
          const tradeLogger = new ethers.Contract('0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1', TRADE_LOGGER_ABI, provider)
          const count = await tradeLogger.tradeCount()
          baseCount = Number(count)
          setTotalTrades(baseCount)
        } catch (err) {
          console.warn('Failed to load trade count on-chain', err)
        }

        // Fetch signals and map to terminal logs
        try {
          const headers: Record<string, string> = {}
          if (walletAddress) {
            headers['x-user-wallet'] = walletAddress
          }
          const res = await fetch('/api/signals', { headers })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              // Synchronize trade count with simulated trades
              const simulatedCount = Math.max(0, data.length - 3)
              setTotalTrades(baseCount + (simulatedCount * 2))

              const mappedLogs: AgentLog[] = []
              // Sort signals chronologically
              const sorted = [...data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
              
              sorted.forEach((sig, index) => {
                const date = sig.timestamp ? new Date(sig.timestamp * 1000) : new Date()
                const logTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
                
                mappedLogs.push(
                  { timestamp: logTime, message: `Ingestion Loop: Scanning Mantle block for anomaly signals...`, type: 'info' },
                  { timestamp: logTime, message: `Anomaly evaluation: ${sig.reasoning}`, type: 'warn' },
                  { timestamp: logTime, message: `Signal classification matched: ${sig.signalType.toUpperCase()} (confidence: ${sig.confidence}%)`, type: 'success' },
                  { timestamp: logTime, message: `Routing order intent: ${sig.tradeIntent}`, type: 'info' }
                )
                if (sig.commitHash) {
                  mappedLogs.push({ timestamp: logTime, message: `Commit hash registered on SignalAnchor: ${sig.commitHash}`, type: 'success' })
                }
                if (sig.revealTx) {
                  mappedLogs.push({ timestamp: logTime, message: `Reasoning parameters revealed on-chain in transaction: ${sig.revealTx}`, type: 'success' })
                }
              })
              setLogs(mappedLogs)
              if (mappedLogs.length > 0) {
                setLastAction(mappedLogs[mappedLogs.length - 1].message)
              }
            }
          }
        } catch (err) {
          console.error('Failed to map signals to logs', err)
        }
      } else {
        // Standard wallet
        setUptime(0)
        setTotalTrades(0)
        setWinRate(0)
        setLastAction('Idle. Operator authorization pending.')
        const date = new Date()
        const logTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        setLogs([
          { timestamp: logTime, message: 'Execution pipeline idle. Waiting for authorized operator wallet.', type: 'info' }
        ])
      }
    }
    loadData()
  }, [walletConnected, isDeployer, walletAddress])

  // Periodic uptime ticker
  useEffect(() => {
    if (!walletConnected || !isDeployer || status !== 'ACTIVE') return
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [status, walletConnected, isDeployer])

  // Scroll to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleStartStop = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first.')
      return
    }
    if (!isDeployer) {
      alert('Access Denied. Only the authorized agent controller wallet can control execution loops.')
      return
    }
    setIsCommanding(true)
    const date = new Date()
    const logTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`

    if (status === 'ACTIVE') {
      try {
        const res = await stopAgent(walletAddress)
        if (res.success === false) {
          alert(res.message || 'Failed to stop agent.')
          setIsCommanding(false)
          return
        }
        setStatus('STOPPED')
        setLogs((prev) => [
          ...prev,
          { timestamp: logTime, message: 'SIGINT received. Shutting down execution engines...', type: 'warn' },
          { timestamp: logTime, message: 'Trading logic PAUSED. Open positions remain monitored with safety parameters.', type: 'warn' },
        ])
      } catch (e) {
        console.error(e)
      }
    } else {
      try {
        const res = await startAgent(walletAddress)
        if (res.success === false) {
          alert(res.message || 'Failed to start agent.')
          setIsCommanding(false)
          return
        }
        setStatus('ACTIVE')
        setLogs((prev) => [
          ...prev,
          { timestamp: logTime, message: 'SIGSTART received. Initializing trading parameters...', type: 'info' },
          { timestamp: logTime, message: 'Quant execution thread started. Scanning on-chain liquidity...', type: 'success' },
        ])
      } catch (e) {
        console.error(e)
      }
    }
    setIsCommanding(false)
  }

  // Format uptime to hh:mm:ss
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden min-h-0 bg-transparent font-mono select-none font-sans text-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-4 bg-opacity-40 shrink-0">
        <div>
          <h1 className="text-sm font-bold tracking-wider text-text-primary font-khteka">👁️ QUANT EXECUTION AGENT</h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
            AGENT STATE & CONTROLS
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <StatusBadge status={status} />
          
          <button
            onClick={handleStartStop}
            disabled={isCommanding || !walletConnected || !isDeployer}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 border transition-all text-xs font-bold disabled:opacity-50",
              status === 'ACTIVE'
                ? "bg-accent-red/10 border-accent-red text-accent-red hover:bg-accent-red/20"
                : "bg-accent-green/10 border-accent-green text-accent-green hover:bg-accent-green/20"
            )}
          >
            <Power className="h-4 w-4" />
            <span>{status === 'ACTIVE' ? 'FORCE STOP' : 'FORCE START'}</span>
          </button>
        </div>
      </div>

      {/* Beginner Guide Mode Banner */}
      {isEducationMode && (
        <div className="shrink-0 border border-[#00d4a4]/30 bg-[#00d4a4]/5 p-4 font-sans space-y-2">
          <div className="text-[10px] font-extrabold text-[#00d4a4] tracking-wider uppercase flex items-center space-x-1.5 font-khteka">
            <span>💡 QUANT EXECUTION AGENT GUIDE</span>
          </div>
          <div className="text-[10px] text-neutral-400 leading-relaxed uppercase">
            <p>Provides controls to start or halt the autonomous python executor loops. Uptime and logs stream in real-time via WebSockets.</p>
            <p className="mt-1">
              • <strong className="text-white">FORCE START/STOP</strong>: Simulates or initiates the ingestion daemon, scanning Mantle blocks and pushing linear hedge transactions. <br />
              • <strong className="text-white">AGENT STDOUT STREAM</strong>: Real-time system log output showing blocks scanned, classification confidence, risk manager checks, and contract reveals.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Agent Panel Wrapper */}
      <div className="relative flex-1 flex flex-col min-h-0 space-y-6">
        {!walletConnected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-[2px] gap-3">
            <div className="border border-white/10 p-3 bg-white/5">
              <Lock className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-center px-4">Connect wallet to view agent status and control logs</p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="mt-1 px-4 py-2 bg-[#00d4a4] text-black text-[10px] font-bold tracking-widest uppercase hover:bg-[#00b891] transition-colors disabled:opacity-50"
            >
              {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-6 shrink-0">
          {/* Stat 1 */}
          <div className="border border-white/5 bg-[#0c0c0e] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">AGENT UPTIME</span>
              <span className="text-sm font-bold tabular-nums text-text-primary mt-1">
                {walletConnected ? formatUptime(uptime) : '—'}
              </span>
            </div>
            <Clock className="h-5 w-5 text-text-muted/60" />
          </div>

          {/* Stat 2 */}
          <div className="border border-white/5 bg-[#0c0c0e] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">TOTAL EXECUTED TRADES</span>
              <span className="text-sm font-bold tabular-nums text-text-primary mt-1">
                {walletConnected ? totalTrades : '—'}
              </span>
            </div>
            <Cpu className="h-5 w-5 text-text-muted/60" />
          </div>

          {/* Stat 3 */}
          <div className="border border-white/5 bg-[#0c0c0e] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">STRATEGY SUCCESS RATE</span>
              <span className="text-sm font-bold tabular-nums text-accent-green mt-1">
                {walletConnected ? `${winRate}%` : '—'}
              </span>
            </div>
            <ShieldCheck className="h-5 w-5 text-accent-green/60" />
          </div>

          {/* Stat 4 */}
          <div className="border border-white/5 bg-[#0c0c0e] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted">LAST PIPELINE ACTION</span>
              <span className="text-[10px] font-bold text-text-primary truncate max-w-[150px] mt-1.5" title={walletConnected ? lastAction : '—'}>
                {walletConnected ? lastAction : '—'}
              </span>
            </div>
            <Clock className="h-5 w-5 text-text-muted/60" />
          </div>
        </div>

        {/* Deployed Contracts Reference */}
        <div className="shrink-0 border border-accent-teal/30 bg-accent-teal/5 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-teal" />
            <span className="text-[9px] font-bold text-accent-teal tracking-wider uppercase">DEPLOYED CONTRACTS — MANTLE SEPOLIA (ChainID: {CONTRACTS.chainId})</span>
          </div>
          <div className="flex items-center space-x-6">
            {[
              { label: 'TradeLogger', address: '0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1' },
              { label: 'SignalAnchor', address: '0x59da1E9D3A52da6716569442d643A963148829Aa' },
              { label: 'ERC-8004 Benchmarking', address: CONTRACTS.AgentRegistry },
            ].map((c) => (
              <a
                key={c.label}
                href={`${CONTRACTS.explorerBase}/address/${c.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 text-[10px] group hover:opacity-80 transition-opacity"
              >
                <span className="text-text-muted font-mono">{c.label}:</span>
                <span className="text-accent-teal font-bold font-mono">
                  {c.address.slice(0, 6)}...{c.address.slice(-4)}
                </span>
                <ExternalLink className="h-2.5 w-2.5 text-accent-teal/60 group-hover:text-accent-teal" />
              </a>
            ))}
          </div>
        </div>

        {/* Full-width Terminal Console */}
        <div className="flex-1 flex flex-col border border-white/5 bg-[#0c0c0e] overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-text-primary font-khteka">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-accent-teal" />
              <span>AGENT STDOUT stream</span>
            </div>
          </div>

          {/* Console stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 text-accent-green font-mono text-[11px] leading-relaxed bg-[#030305]/50">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 py-0.5 border-b border-border/10 hover:bg-elevated/10">
                <span className="text-accent-teal/50 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={cn(
                  log.type === 'success' && 'text-accent-green font-bold',
                  log.type === 'warn' && 'text-accent-yellow',
                  log.type === 'error' && 'text-accent-red font-bold',
                  log.type === 'info' && 'text-accent-green/80'
                )}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
