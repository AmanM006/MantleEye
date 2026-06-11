'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Loader2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@/context/WalletContext'
import SimulatedTxModal from './SimulatedTxModal'

interface SignalData {
  commitHash: string
  signalType: string
  confidence: number
  reasoning: string
  tradeIntent: string
  nonce: string
  timestamp: number
  commitTx: string
  revealTx: string
  onChainTx: string
  bybitOrderId: string
  nansenLabel: string
  status: string
}

export default function SignalFeed() {
  const { walletConnected, connectWallet, connecting, walletAddress } = useWallet()
  const [signals, setSignals] = useState<SignalData[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTx, setModalTx] = useState('')
  const [modalAsset, setModalAsset] = useState('')
  const [modalSide, setModalSide] = useState('')
  const [modalVenue, setModalVenue] = useState('')

  const fetchSignals = async () => {
    try {
      const headers: Record<string, string> = {}
      if (walletConnected && walletAddress) {
        headers['x-user-wallet'] = walletAddress
      }
      const res = await fetch('/api/signals', { headers })
      if (res.ok) {
        const data = await res.json()
        setSignals(data)
        setConnected(true)
      } else {
        setConnected(false)
      }
    } catch (err) {
      console.error('Error fetching signals:', err)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignals()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchSignals, 10000)
    return () => clearInterval(interval)
  }, [walletConnected, walletAddress])

  // Severity color helper
  const getSeverity = (confidence: number) => {
    if (confidence > 85) return { dot: 'bg-red-500 shadow-red-500/50', text: 'text-red-400' }
    if (confidence > 70) return { dot: 'bg-yellow-500 shadow-yellow-500/50', text: 'text-yellow-400' }
    return { dot: 'bg-green-500 shadow-green-500/50', text: 'text-green-400' }
  }

  const formatTimeAgo = (ts: number) => {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return 'Just now'
    const mins = Math.floor(diff / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(ts * 1000).toLocaleDateString()
  }

  const handleTxClick = (e: React.MouseEvent, txHash: string, asset = '', side = '', venue = '') => {
    e.preventDefault()
    setModalTx(txHash)
    setModalAsset(asset)
    setModalSide(side)
    setModalVenue(venue)
    setModalOpen(true)
  }

  const LockedOverlay = ({ label }: { label: string }) => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-[2px] gap-3">
      <div className="border border-white/10 p-3 bg-white/5">
        <Lock className="h-5 w-5 text-white/30" />
      </div>
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-center px-4">{label}</p>
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="mt-1 px-4 py-2 bg-[#00d4a4] text-black text-[10px] font-bold tracking-widest uppercase hover:bg-[#00b891] transition-colors disabled:opacity-50 font-mono"
      >
        {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
      </button>
    </div>
  )

  return (
    <div id="signal-feed-panel" className="flex-grow flex flex-col min-h-0 bg-transparent font-sans relative">
      {!walletConnected && (
        <LockedOverlay label="Connect wallet to view live anomaly feed" />
      )}

      {/* Pulse Bar header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center space-x-2.5">
          <div className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            connected && walletConnected ? "bg-[#00d4a4] animate-pulse" : "bg-red-500"
          )} />
          <span className="font-extrabold text-[10px] tracking-[0.2em] text-white">
            LIVE SIGNAL ANCHOR FEED
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {loading && <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />}
          <span className="text-[8px] font-mono text-violet-400 tracking-widest bg-violet-500/5 px-2 py-0.5 border border-violet-500/10">
            {connected && walletConnected ? 'LIVE CONNECTION' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {signals.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-neutral-500 font-mono tracking-widest">
            LISTENING FOR ON-CHAIN ANOMALIES...
          </div>
        ) : (
          signals.map((sig) => {
            const severity = getSeverity(sig.confidence)
            const isDepeg = sig.signalType === 'depeg'
            const isWhale = sig.signalType === 'whaleExit'
            const assetName = isDepeg ? 'mETH / USDY' : isWhale ? 'Concentrated Pool LP' : 'Mantle Token (MNT)'
            const venueName = isDepeg || isWhale ? 'Merchant Moe' : 'Bybit'
            
            return (
              <div 
                key={sig.commitHash} 
                className="border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-200 relative group flex flex-col justify-between"
              >
                {/* Severity left vertical line */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-[3px]",
                  sig.confidence > 85 ? "bg-red-500" : sig.confidence > 70 ? "bg-yellow-500" : "bg-green-500"
                )} />

                {/* Top header row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", severity.dot)} />
                    <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", severity.text)}>
                      {sig.signalType.toUpperCase()}
                    </span>
                    <span className="text-white/40 text-[9px] font-mono">|</span>
                    <span className="text-white/80 font-bold text-[11px] font-mono bg-white/5 px-1.5 py-0.5 rounded">
                      {sig.confidence}%
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {formatTimeAgo(sig.timestamp)}
                  </span>
                </div>

                {/* Middle details row */}
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-white text-xs font-bold font-mono tracking-wide">
                    {assetName}
                  </span>
                  {sig.nansenLabel && (
                    <span className="text-[8px] font-mono text-purple-400 bg-purple-500/5 px-1.5 py-0.5 border border-purple-500/10 uppercase">
                      {sig.nansenLabel}
                    </span>
                  )}
                </div>

                {/* Reasoning summary text */}
                <p className="text-[11px] text-neutral-400 leading-normal mb-3 font-sans">
                  {sig.reasoning}
                </p>

                {/* Execution Intent */}
                <div className="bg-white/[0.02] border border-white/5 px-3 py-2 rounded text-[10px] text-neutral-300 font-mono mb-3 uppercase flex items-center justify-between">
                  <span className="text-white/40">INTENT:</span>
                  <span className="font-extrabold text-[#00d4a4]">{sig.tradeIntent}</span>
                </div>

                {/* Explorer verify buttons */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] font-mono">
                  <div className="flex items-center space-x-1.5 text-neutral-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                    <span className="uppercase">ERC-8004 Anchor</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleTxClick(e, sig.commitTx, assetName, sig.tradeIntent, venueName)}
                      className="px-2 py-1 bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 text-violet-400 font-semibold transition-all rounded cursor-pointer"
                    >
                      COMMIT PROOF ↗
                    </button>
                    {sig.revealTx && (
                      <button
                        onClick={(e) => handleTxClick(e, sig.revealTx, assetName, sig.tradeIntent, venueName)}
                        className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/20 text-[#00d4a4] font-semibold transition-all rounded cursor-pointer"
                      >
                        REVEAL PROOF ↗
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <SimulatedTxModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        txHash={modalTx}
        asset={modalAsset}
        side={modalSide}
        venue={modalVenue}
      />
    </div>
  )
}
