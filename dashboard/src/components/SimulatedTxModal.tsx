'use client'

import { useState } from 'react'
import { X, Copy, Check, ShieldCheck, Activity } from 'lucide-react'

interface SimulatedTxModalProps {
  isOpen: boolean
  onClose: () => void
  txHash: string
  asset?: string
  side?: string
  venue?: string
  amount?: string
}

export default function SimulatedTxModal({
  isOpen,
  onClose,
  txHash,
  asset,
  side,
  venue,
  amount
}: SimulatedTxModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate some deterministic mock metadata based on the txHash
  const isBybit = txHash.startsWith('bybit_order')
  const shortHash = txHash.slice(0, 10) + '...' + txHash.slice(-8)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div 
        className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 p-6 flex flex-col justify-between relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated accent border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-[#00d4a4] to-violet-500" />
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-[#00d4a4]" />
            <span className="text-[10px] font-extrabold tracking-widest text-white uppercase">
              {isBybit ? 'BYBIT SIMULATED ORDER' : 'ERC-8004 SIGNAL PROOF'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-4 text-[10px] text-neutral-400">
          <div className="flex flex-col space-y-1">
            <span className="text-[8px] text-neutral-500 uppercase tracking-widest">TRANSACTION HASH</span>
            <div className="flex items-center justify-between bg-[#080807] border border-white/5 p-2 text-white">
              <span className="break-all pr-2 font-mono text-[9px] text-[#00d4a4]">{txHash}</span>
              <button 
                onClick={handleCopy}
                className="text-neutral-500 hover:text-[#00d4a4] transition-colors shrink-0"
                title="Copy hash"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#00d4a4]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest">EXECUTION ENVIRONMENT</span>
              <span className="text-white font-bold uppercase">MantleEye Sandbox</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest">EXECUTION STATUS</span>
              <span className="text-[#00d4a4] font-bold uppercase flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00d4a4] animate-ping" />
                <span>SUCCESS (SIMULATED)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest">BLOCK HEIGHT</span>
              <span className="text-white font-bold">#58,349,281</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest">GAS CONSUMED</span>
              <span className="text-violet-400 font-bold">0.05 GWEI</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <div className="flex flex-col space-y-1.5">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest">TRANSACTION DETAILS</span>
              <div className="bg-[#080807] border border-white/5 p-3 rounded space-y-1.5 font-mono text-[9px]">
                {isBybit ? (
                  <>
                    <div><span className="text-neutral-500">Exchange:</span> <span className="text-white">Bybit Testnet V5</span></div>
                    <div><span className="text-neutral-500">Order ID:</span> <span className="text-[#00d4a4]">{txHash}</span></div>
                    <div><span className="text-neutral-500">Type:</span> <span className="text-white">Linear Futures Hedge</span></div>
                    <div><span className="text-neutral-500">Asset:</span> <span className="text-violet-400">MNT-USDT SHORT</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="text-neutral-500">Contract Method:</span> <span className="text-violet-400">anchorSignal()</span></div>
                    <div><span className="text-neutral-500">Anchor Registrant:</span> <span className="text-white">0x06Dd85bcCA6B85Fc19cC32Dde26A07BC18E022a1</span></div>
                    {asset && <div><span className="text-neutral-500">Asset Targeted:</span> <span className="text-white">{asset}</span></div>}
                    {side && <div><span className="text-neutral-500">Trade Intent:</span> <span className="text-white">{side}</span></div>}
                    {venue && <div><span className="text-neutral-500">Venue:</span> <span className="text-[#00d4a4]">{venue}</span></div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Indicator */}
        <div className="bg-[#00d4a4]/5 border border-[#00d4a4]/10 p-3 text-[8.5px] leading-relaxed text-[#00d4a4]/80 uppercase mt-2">
          💡 <strong>Sandbox Execution Mode:</strong> To protect users during the testing/hackathon phase, these trades are executed locally inside the sandbox. In production, these transactions anchor directly to the live verified smart contracts on Mantle Sepolia network.
        </div>

        {/* Action Button */}
        <button 
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-[9px] uppercase tracking-wider transition-colors"
        >
          DISMISS PROOF VIEW
        </button>
      </div>
    </div>
  )
}
