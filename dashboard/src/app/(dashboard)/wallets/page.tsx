'use client'

import { useEffect, useState } from 'react'
import { fetchWallets, fetchWalletHistory } from '@/lib/api'
import { Wallet } from '@/lib/mock-data'
import { formatAddress, formatCurrency, formatTimestamp } from '@/lib/utils'
import WalletRadar from '@/components/WalletRadar'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'
import { useWallet } from '@/context/WalletContext'
import { ChevronDown, ChevronUp, ExternalLink, Activity, Lock } from 'lucide-react'

export default function SmartMoneyTracker() {
  const { walletConnected, walletAddress, connecting, connectWallet } = useWallet()
  const isDeployer = walletConnected

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null)
  const [walletTxHistory, setWalletTxHistory] = useState<{ [address: string]: any[] }>({})
  const [loadingHistory, setLoadingHistory] = useState(false)
  const { isEducationMode } = useEducationMode()

  useEffect(() => {
    async function loadData() {
      if (!walletConnected || !isDeployer) {
        setWallets([])
        setLoading(false)
        return
      }
      setLoading(true)
      const data = await fetchWallets()
      setWallets(data)
      setLoading(false)
    }
    loadData()
  }, [walletConnected, isDeployer])

  const handleWalletClick = async (address: string) => {
    if (expandedAddress === address) {
      setExpandedAddress(null)
      return
    }

    setExpandedAddress(address)

    // Load tx history for selected wallet if not already loaded
    if (!walletTxHistory[address]) {
      setLoadingHistory(true)
      try {
        const data = await fetchWalletHistory(address)
        setWalletTxHistory((prev) => ({ ...prev, [address]: data.history }))
      } catch (err) {
        console.error('Failed to load wallet tx history', err)
      } finally {
        setLoadingHistory(false)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden min-h-0 bg-transparent font-mono select-none text-white font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-4">
        <div>
          <h1 className="text-sm font-bold tracking-wider text-text-primary font-khteka">👁️ SMART MONEY MONITOR</h1>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
            TRACKING LARGE PROTOCOL WHALES & LP PROVIDERS ON MANTLE
          </p>
        </div>
      </div>

      {/* Beginner Guide Mode Banner */}
      {isEducationMode && (
        <div className="shrink-0 border border-[#00d4a4]/30 bg-[#00d4a4]/5 p-4 font-sans space-y-2">
          <div className="text-[10px] font-extrabold text-[#00d4a4] tracking-wider uppercase flex items-center space-x-1.5 font-khteka">
            <span>💡 SMART MONEY MONITOR GUIDE</span>
          </div>
          <div className="text-[10px] text-neutral-400 leading-relaxed uppercase">
            <p>Monitors known, high-performing on-chain wallet clusters. These wallets are flagged by statistical historical returns and Nansen labels.</p>
            <p className="mt-1">
              • <strong className="text-white">TRACKED WHALE REGISTRY</strong>: Expanded rows detail recent swaps and liquidity provider events on Merchant Moe and Agni Finance. <br />
              • <strong className="text-white">RADAR VISUALIZATION</strong>: The 2D cluster radar maps active wallets. Radius size represents transaction volume. Hover on a node to view its coordinates and profile.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Wallets Panel Wrapper */}
      <div className="relative flex-1 flex space-x-6 min-h-0">
        {!walletConnected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-[2px] gap-3">
            <div className="border border-white/10 p-3 bg-white/5">
              <Lock className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-center px-4">Connect wallet to view smart money movements</p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="mt-1 px-4 py-2 bg-[#00d4a4] text-black text-[10px] font-bold tracking-widest uppercase hover:bg-[#00b891] transition-colors disabled:opacity-50"
            >
              {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          </div>
        )}

        {/* Left Column: Wallet Table (60%) */}
        <div className="w-[60%] flex flex-col border border-white/5 bg-[#0c0c0e] overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-text-primary">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-accent-teal animate-pulse" />
              <span>TRACKED WHALE REGISTRY</span>
            </div>
            <span className="text-[9px] text-text-muted">COUNT: {wallets.length} WALLETS</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                FETCHING ON-CHAIN ALIGNMENT...
              </div>
            ) : wallets.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                {walletConnected && !isDeployer 
                  ? "WHALE REGISTRY UNAUTHORIZED FOR THIS WALLET ADDRESS" 
                  : "NO TRACKED WHALES IN REGISTRY"}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {wallets.map((wallet) => {
                  const isExpanded = expandedAddress === wallet.address
                  
                  // Color code by win rate
                  let winRateColor = 'text-accent-yellow'
                  if (wallet.win_rate >= 70) winRateColor = 'text-accent-green'
                  if (wallet.win_rate < 50) winRateColor = 'text-accent-red'

                  return (
                    <div key={wallet.address} className="flex flex-col bg-transparent hover:bg-white/[0.02] transition-colors">
                      {/* Summary Row */}
                      <div
                        onClick={() => handleWalletClick(wallet.address)}
                        className="flex items-center justify-between p-4 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-text-primary">{wallet.label}</span>
                          <span className="text-[10px] text-text-muted mt-0.5">{formatAddress(wallet.address)}</span>
                        </div>

                        <div className="flex items-center space-x-8 text-right font-mono text-[11px]">
                          <div>
                            <div className="text-[9px] text-text-muted mb-0.5">WIN RATE</div>
                            <span className={cn("font-bold", winRateColor)}>{wallet.win_rate}%</span>
                          </div>
                          <div>
                            <div className="text-[9px] text-text-muted mb-0.5">AVG RETURN</div>
                            <span className="text-accent-green font-bold">+{wallet.avg_return}%</span>
                          </div>
                          <div>
                            <div className="text-[9px] text-text-muted mb-0.5">VOLUME</div>
                            <span className="text-text-primary font-bold">{formatCurrency(wallet.total_volume)}</span>
                          </div>
                          <div className="text-text-muted hover:text-text-primary transition-colors">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Details History Row */}
                      {isExpanded && (
                        <div className="bg-[#050508]/80 border-t border-b border-white/5 p-4 font-mono text-[11px] space-y-2">
                          <div className="flex justify-between items-center text-[9px] text-text-muted uppercase tracking-wider mb-2">
                            <span>WHALE WALLET TRADE HISTORY</span>
                            <span>MANTLE EXPLORER</span>
                          </div>

                          {loadingHistory ? (
                            <div className="text-center text-text-muted py-2">FETCHING BLOCK TXNS...</div>
                          ) : !walletTxHistory[wallet.address] || walletTxHistory[wallet.address].length === 0 ? (
                            <div className="text-center text-text-muted py-2">NO RECENT TRANSACTIONS FOUND</div>
                          ) : (
                            <div className="space-y-1.5">
                              {walletTxHistory[wallet.address].map((tx, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-[#07070b]/60 border border-white/5 p-2">
                                  <div className="flex items-center space-x-2">
                                    <span className={cn(
                                      "px-1.5 py-[1px] text-[8px] font-bold border uppercase",
                                      tx.action === 'SWAP' ? 'text-accent-teal border-accent-teal/30 bg-accent-teal/10' : 'text-accent-green border-accent-green/30 bg-accent-green/10'
                                    )}>
                                      {tx.action}
                                    </span>
                                    <span className="font-bold text-text-primary">{tx.amount} {tx.asset}</span>
                                    <span className="text-[10px] text-text-muted">({formatCurrency(tx.value_usd)})</span>
                                  </div>

                                  <div className="flex items-center space-x-4">
                                    <span className="text-[10px] text-text-muted">{formatTimestamp(tx.timestamp)}</span>
                                    <a
                                      href={`https://sepolia.mantlescan.xyz/tx/${tx.tx_hash}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center space-x-1 text-accent-teal hover:underline"
                                    >
                                      <span>{formatAddress(tx.tx_hash)}</span>
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: WalletRadar (40%) */}
        <div className="w-[40%] flex flex-col h-full">
          <WalletRadar />
        </div>
      </div>
    </div>
  )
}
