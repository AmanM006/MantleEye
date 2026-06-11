'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'

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

import { useWallet } from '@/context/WalletContext'
import { ShieldCheck, ArrowRight, ExternalLink, Lock } from 'lucide-react'
import ProofVerificationModal from '@/components/ProofVerificationModal'

export default function CommitAuditLog() {
  const { walletConnected, walletAddress, connecting, connectWallet } = useWallet()
  const isDeployer = walletConnected

  const [signals, setSignals] = useState<SignalData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVerifySignal, setSelectedVerifySignal] = useState<SignalData | null>(null)
  const { isEducationMode } = useEducationMode()

  useEffect(() => {
    const fetchSignals = async () => {
      if (!walletConnected || !isDeployer) {
        setSignals([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        if (walletAddress) {
          headers['x-user-wallet'] = walletAddress
        }
        const res = await fetch('/api/signals', { headers })
        if (res.ok) {
          const data = await res.json()
          setSignals(data)
        }
      } catch (err) {
        console.error('Error fetching signals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSignals()
  }, [walletConnected, isDeployer, walletAddress])

  const formatTimestamp = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('en-US', {
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden min-h-0 bg-transparent text-white select-none font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-5 rounded-lg">
        <div>
          <h1 className="text-sm font-extrabold tracking-[0.2em] text-white flex items-center space-x-2.5 uppercase font-khteka">
            <ShieldCheck className="h-4 w-4 text-violet-400" />
            <span>COMMIT-REVEAL AUDIT MODULE</span>
          </h1>
          <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-[0.15em] font-semibold">
            SECURE REASONING CRYPTOGRAPHIC VERIFIABILITY LOG
          </p>
        </div>
        <div className="text-right font-mono text-[9px] text-violet-400 tracking-widest bg-violet-500/5 px-2.5 py-1 border border-violet-500/10 uppercase font-bold">
          PROOF VERIFICATION SYSTEM ACTIVE
        </div>
      </div>

      {/* Beginner Guide Mode Banner */}
      {isEducationMode && (
        <div className="shrink-0 border border-[#00d4a4]/30 bg-[#00d4a4]/5 p-4 font-sans space-y-2">
          <div className="text-[10px] font-extrabold text-[#00d4a4] tracking-wider uppercase flex items-center space-x-1.5 font-khteka">
            <span>💡 CRYPTOGRAPHIC AUDIT LOG GUIDE</span>
          </div>
          <div className="text-[10px] text-neutral-400 leading-relaxed uppercase">
            <p>Every autonomous action taken by the sentinel is audited cryptographically on-chain. This ensures absolute trust and eliminates any possibility of trading discretion retrospectively.</p>
            <p className="mt-1">
              • <strong className="text-white">COMMIT TIMESTAMP</strong>: The time the agent locked its decision reasoning hash on the blockchain. <br />
              • <strong className="text-white">REVEAL TIMESTAMP</strong>: The time the agent revealed the raw text values to match the pre-committed hash.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Commits Panel Wrapper */}
      <div className="relative flex-1 flex flex-col min-h-0 space-y-6">
        {!walletConnected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-[2px] gap-3">
            <div className="border border-white/10 p-3 bg-white/5">
              <Lock className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest text-center px-4">Connect wallet to view reasoning audit logs</p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="mt-1 px-4 py-2 bg-[#00d4a4] text-black text-[10px] font-bold tracking-widest uppercase hover:bg-[#00b891] transition-colors disabled:opacity-50"
            >
              {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          </div>
        )}

        {/* Intro Banner */}
        <div className="border border-violet-500/10 bg-violet-500/[0.02] backdrop-blur-md p-5 rounded-lg flex items-start space-x-4">
          <ShieldCheck className="h-6 w-6 text-violet-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">How Cryptographic Commit-Reveal Prevents Frontrunning</h2>
            <p className="text-[11px] text-neutral-400 leading-relaxed max-w-4xl uppercase">
              To guarantee transparency, MANTLEYE registers a Keccak256 hash of its reasoning, intent, and confidence values on the Mantle blockchain BEFORE executing any trade. After execution is confirmed on-chain, the agent reveals the original parameters. Judges and users can independently re-hash the revealed inputs to confirm they match the pre-committed hash, proving that the agent did not adjust its decisions after seeing the market outcome.
            </p>
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="flex-grow border border-white/5 bg-[#0c0c0e] rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex-grow overflow-auto">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-neutral-500 font-mono tracking-widest uppercase">
                RETRIEVING AUDIT ARCHIVES...
              </div>
            ) : signals.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-neutral-500 font-mono tracking-widest uppercase">
                {walletConnected && !isDeployer
                  ? "Audit log registry unauthorized for this wallet address"
                  : "NO AUDITED COMMITS LOCATED"}
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead className="bg-[#050508]/85 border-b border-white/5 sticky top-0 text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="p-4">COMMIT TIMESTAMP</th>
                    <th className="p-4">REVEAL TIMESTAMP</th>
                    <th className="p-4">SIGNAL TYPE</th>
                    <th className="p-4">CONFIDENCE</th>
                    <th className="p-4">COMMIT HASH</th>
                    <th className="p-4 w-[30%]">REASONING (REVEALED)</th>
                    <th className="p-4 text-center">VERIFICATION</th>
                    <th className="p-4 text-right">PROOF PROVENANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {signals.map((sig) => {
                    const isVerified = sig.status === 'revealed'
                    return (
                      <tr key={sig.commitHash} className="hover:bg-white/[0.01]">
                        {/* Commit time */}
                        <td className="p-4 text-neutral-400 tabular-nums">
                          {formatTimestamp(sig.timestamp - 2)}
                        </td>
                        {/* Reveal time */}
                        <td className="p-4 text-neutral-400 tabular-nums">
                          {sig.revealTx ? formatTimestamp(sig.timestamp) : 'PENDING'}
                        </td>
                        {/* Signal Type */}
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                            sig.signalType === 'depeg' && 'bg-red-500/10 text-red-400 border border-red-500/20',
                            sig.signalType === 'whaleExit' && 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
                            sig.signalType === 'accumulation' && 'bg-[#00d4a4]/10 text-[#00d4a4] border border-[#00d4a4]/20',
                            sig.signalType === 'divergence' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          )}>
                            {sig.signalType}
                          </span>
                        </td>
                        {/* Confidence */}
                        <td className="p-4 font-bold text-white">
                          {sig.confidence}%
                        </td>
                        {/* Commit Hash */}
                        <td className="p-4 text-violet-400 hover:text-violet-300">
                          {sig.commitHash.slice(0, 8)}...{sig.commitHash.slice(-8)}
                        </td>
                        {/* Reasoning */}
                        <td className="p-4 text-neutral-400 leading-normal font-sans text-xs">
                          {sig.reasoning}
                          <div className="text-[9px] font-mono text-[#00d4a4] mt-1 uppercase">
                            INTENT: {sig.tradeIntent} | NONCE: {sig.nonce}
                          </div>
                        </td>
                        {/* Verification */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedVerifySignal(sig)}
                            className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/20 text-violet-300 text-[9px] font-bold tracking-widest uppercase transition-all rounded cursor-pointer"
                          >
                            Verify Proof
                          </button>
                        </td>

                        {/* Proof links */}
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end space-y-1 text-[9px]">
                            <a
                              href={`https://sepolia.mantlescan.xyz/tx/${sig.commitTx}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-violet-400 hover:underline"
                            >
                              <span>COMMIT TX</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                            {sig.revealTx && (
                              <a
                                href={`https://sepolia.mantlescan.xyz/tx/${sig.revealTx}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[#00d4a4] hover:underline"
                              >
                                <span>REVEAL TX</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <ProofVerificationModal
        isOpen={!!selectedVerifySignal}
        onClose={() => setSelectedVerifySignal(null)}
        signal={selectedVerifySignal}
      />
    </div>
  )
}
