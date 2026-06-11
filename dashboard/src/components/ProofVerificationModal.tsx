'use client'

import { useState } from 'react'
import { ShieldCheck, X, Cpu, Key, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ProofVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  signal: SignalData | null
}

const SIGNAL_MAP: Record<string, number> = {
  'depeg': 0,
  'whaleexit': 1,
  'accumulation': 2,
  'divergence': 3
}

export default function ProofVerificationModal({ isOpen, onClose, signal }: ProofVerificationModalProps) {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [computedHash, setComputedHash] = useState('')
  const [packedBytes, setPackedBytes] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || !signal) return null

  const handleVerify = async () => {
    setVerifying(true)
    setError('')
    setVerified(false)
    
    // Simulate slight lag to make it feel like an active calculation
    setTimeout(async () => {
      try {
        const { ethers } = await import('ethers')
        
        const signalKey = signal.signalType.toLowerCase()
        const signalTypeInt = SIGNAL_MAP[signalKey] !== undefined ? SIGNAL_MAP[signalKey] : 3
        const nonceVal = BigInt(signal.nonce)
        const confidenceVal = BigInt(signal.confidence)

        // 1. Pack the values matching Solidity's abi.encodePacked
        const packed = ethers.solidityPacked(
          ['string', 'string', 'uint256', 'uint8', 'uint256'],
          [signal.reasoning, signal.tradeIntent, nonceVal, signalTypeInt, confidenceVal]
        )
        setPackedBytes(packed)

        // 2. Compute the Keccak256 hash
        const hash = ethers.solidityPackedKeccak256(
          ['string', 'string', 'uint256', 'uint8', 'uint256'],
          [signal.reasoning, signal.tradeIntent, nonceVal, signalTypeInt, confidenceVal]
        )
        setComputedHash(hash)

        // 3. Compare with on-chain commit hash
        if (hash.toLowerCase() === signal.commitHash.toLowerCase()) {
          setVerified(true)
        } else {
          setError('Hash mismatch! The generated hash does not match the on-chain commit hash.')
        }
      } catch (err: any) {
        console.error(err)
        setError(`Verification failed: ${err.message || err}`)
      } finally {
        setVerifying(false)
      }
    }, 800)
  }

  const signalKey = signal.signalType.toLowerCase()
  const mappedInt = SIGNAL_MAP[signalKey] !== undefined ? SIGNAL_MAP[signalKey] : 3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]/85 backdrop-blur-[6px] p-4 font-mono select-none">
      <div 
        className="w-full max-w-2xl bg-[#0c0c0e] border border-white/10 p-6 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(124,58,237,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-violet-500/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-violet-500/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-violet-500/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-violet-500/50" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 pb-4 border-b border-white/5 mb-6">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white">
            Independent Client-Side Hash Verifier
          </h3>
        </div>

        {/* Info Box */}
        <p className="text-[10px] text-neutral-400 leading-relaxed uppercase mb-6 bg-white/[0.01] p-3 border border-white/5">
          This panel recalculates the Keccak256 hash of the revealed AI decision parameters locally in your browser and compares it with the hash committed on-chain. This mathematically proves the agent locked in its decision logic before execution.
        </p>

        {/* Parameters Grid */}
        <div className="space-y-4 text-[10px]">
          <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
            <span className="text-neutral-500 uppercase">Input Parameter</span>
            <span className="text-neutral-500 uppercase">Solidity Type</span>
            <span className="text-neutral-500 uppercase">Revealed Value</span>
          </div>

          {/* Reasoning */}
          <div className="grid grid-cols-3 gap-2 py-1 items-baseline">
            <span className="text-violet-400 font-bold">1. reasoning</span>
            <span className="text-neutral-500 font-mono">string</span>
            <span className="text-white break-words pr-2 leading-relaxed font-sans text-[11px]">{signal.reasoning}</span>
          </div>

          {/* Trade Intent */}
          <div className="grid grid-cols-3 gap-2 py-1 items-baseline">
            <span className="text-violet-400 font-bold">2. tradeIntent</span>
            <span className="text-neutral-500 font-mono">string</span>
            <span className="text-[#00d4a4] font-bold break-all pr-2 uppercase">{signal.tradeIntent}</span>
          </div>

          {/* Nonce */}
          <div className="grid grid-cols-3 gap-2 py-1 items-baseline">
            <span className="text-violet-400 font-bold">3. nonce</span>
            <span className="text-neutral-500 font-mono">uint256</span>
            <span className="text-white font-mono break-all">{signal.nonce}</span>
          </div>

          {/* Signal Type */}
          <div className="grid grid-cols-3 gap-2 py-1 items-baseline">
            <span className="text-violet-400 font-bold">4. signalType</span>
            <span className="text-neutral-500 font-mono">uint8</span>
            <span className="text-white font-mono font-bold">
              {mappedInt} <span className="text-neutral-500 text-[8px] font-normal">({signal.signalType.toUpperCase()})</span>
            </span>
          </div>

          {/* Confidence */}
          <div className="grid grid-cols-3 gap-2 py-1 items-baseline">
            <span className="text-violet-400 font-bold">5. confidence</span>
            <span className="text-neutral-500 font-mono">uint256</span>
            <span className="text-white font-mono font-bold">{signal.confidence}</span>
          </div>
        </div>

        {/* Hashes Section */}
        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
          {/* Target On-Chain Hash */}
          <div className="flex flex-col space-y-1">
            <span className="text-[8px] text-neutral-500 uppercase tracking-wider">TARGET ON-CHAIN COMMIT HASH</span>
            <div className="flex items-center space-x-2 bg-black px-3 py-2 border border-white/5 font-mono text-[10px] text-violet-400 break-all select-all font-bold">
              <Key className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span>{signal.commitHash}</span>
            </div>
          </div>

          {/* Verifying Spinner or Computed Output */}
          {verifying ? (
            <div className="flex items-center justify-center py-6 space-x-2 text-[10px] text-violet-400 animate-pulse uppercase">
              <Cpu className="h-4 w-4 animate-spin text-violet-400" />
              <span>RUNNING CRYPTOGRAPHIC HASH CALCULATIONS...</span>
            </div>
          ) : (
            <>
              {/* Packed bytes */}
              {packedBytes && (
                <div className="flex flex-col space-y-1">
                  <span className="text-[8px] text-neutral-500 uppercase tracking-wider">PACKED SOLIDITY BYTES (abi.encodePacked)</span>
                  <div className="bg-black/60 px-3 py-2 border border-white/5 font-mono text-[8px] text-neutral-400 max-h-16 overflow-y-auto break-all scrollbar-thin">
                    {packedBytes}
                  </div>
                </div>
              )}

              {/* Computed Hash */}
              {computedHash && (
                <div className="flex flex-col space-y-1">
                  <span className="text-[8px] text-neutral-500 uppercase tracking-wider">COMPUTED CLIENT-SIDE HASH</span>
                  <div className={cn(
                    "flex items-center space-x-2 px-3 py-2 border font-mono text-[10px] break-all select-all font-bold",
                    verified ? "bg-[#00d4a4]/5 border-[#00d4a4]/20 text-[#00d4a4]" : "bg-red-500/5 border-red-500/20 text-red-400"
                  )}>
                    <Cpu className="h-3.5 w-3.5 shrink-0" />
                    <span>{computedHash}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Success Banner */}
          {verified && !verifying && (
            <div className="bg-[#00d4a4]/10 border border-[#00d4a4]/30 px-4 py-3 text-center rounded text-xs text-[#00d4a4] uppercase font-bold tracking-widest animate-fade-in shadow-[0_0_15px_rgba(0,212,164,0.1)]">
              ✅ Cryptographic Proof Verified: Match Found!
            </div>
          )}

          {/* Error Banner */}
          {error && !verifying && (
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-center rounded text-xs text-red-400 uppercase font-bold tracking-widest">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Action Button */}
        {!verified && !verifying && (
          <button
            onClick={handleVerify}
            className="mt-6 w-full py-2.5 bg-violet-600 text-white hover:bg-violet-500 transition-colors text-[10px] font-bold tracking-widest uppercase border border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
          >
            RUN CLIENT-SIDE CRYPTOGRAPHIC HASHER
          </button>
        )}
      </div>
    </div>
  )
}
