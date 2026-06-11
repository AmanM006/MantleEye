'use client'

import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'

interface ProtocolMetric {
  name: string
  delta: number
  volume_24h: string
  active_users: number
}

const INITIAL_PROTOCOLS: ProtocolMetric[] = [
  { name: 'Merchant Moe', delta: 42.15, volume_24h: '4.8M', active_users: 1240 },
  { name: 'Agni Finance', delta: 18.40, volume_24h: '3.1M', active_users: 820 },
  { name: 'Fluxion', delta: -8.90, volume_24h: '940K', active_users: 210 },
  { name: 'Treehouse', delta: 54.20, volume_24h: '1.2M', active_users: 340 },
  { name: 'Lendle', delta: 12.10, volume_24h: '2.5M', active_users: 580 },
  { name: 'INIT Capital', delta: -14.60, volume_24h: '1.8M', active_users: 410 },
  { name: 'Aurelius', delta: 5.40, volume_24h: '620K', active_users: 150 },
  { name: 'Stratum', delta: 29.80, volume_24h: '1.1M', active_users: 290 },
  { name: 'KTX Finance', delta: -4.30, volume_24h: '3.6M', active_users: 730 },
]

export default function OnChainHeatmap() {
  const [protocols, setProtocols] = useState<ProtocolMetric[]>(INITIAL_PROTOCOLS)
  const [showTooltip, setShowTooltip] = useState(false)
  const { isEducationMode } = useEducationMode()

  useEffect(() => {
    const interval = setInterval(() => {
      setProtocols((prev) =>
        prev.map((p) => {
          const shift = (Math.random() - 0.5) * 3
          return {
            ...p,
            delta: parseFloat((p.delta + shift).toFixed(2)),
            active_users: Math.max(10, p.active_users + Math.floor((Math.random() - 0.5) * 10)),
          }
        })
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-[#050505] border-none select-none font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01] shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-teal animate-pulse" />
          <span className="font-extrabold text-[10px] tracking-[0.15em] text-text-primary uppercase">MANTLE PROTOCOL RADAR</span>
          <div className="relative">
            <button 
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-text-muted hover:text-text-primary focus:outline-none"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
            {showTooltip && (
              <div className="absolute left-4 top-[-26px] z-20 bg-[#0f0f0f] border border-white/10 p-2 text-[8px] text-text-muted uppercase w-[230px] leading-normal font-sans shadow-xl">
                Heatmap tracking relative 24h volume delta of major Mantle DeFi protocols.
              </div>
            )}
          </div>
        </div>
        <span className="text-[8px] text-text-muted font-mono uppercase tracking-widest bg-white/[0.02] px-2 py-[2px] border border-white/5">
          VOLUME DELTAS
        </span>
      </div>

      {/* Beginner Mode Mini Summary */}
      {isEducationMode && (
        <div className="px-4 py-2 border-b border-white/5 bg-accent-teal/[0.01] text-[8.5px] text-accent-teal font-sans uppercase font-bold tracking-wider space-y-0.5">
          <div>💡 Volume Delta: Measures changes in trading activity (24h shifts).</div>
          <div>💡 Spikes (+15% or more) indicate intense whale swap activity.</div>
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 p-4 grid grid-cols-3 gap-3 min-h-0 overflow-y-auto">
        {protocols.map((p) => {
          const isPositive = p.delta >= 0
          const absDelta = Math.abs(p.delta)
          
          let tileBg = 'bg-white/[0.01] border-white/5 hover:border-white/10'
          let isSpike = false

          if (isPositive) {
            if (absDelta > 30) {
              tileBg = 'bg-accent-green/[0.04] border-accent-green/20 hover:border-accent-green/45'
              isSpike = true
            } else if (absDelta > 15) {
              tileBg = 'bg-accent-green/[0.02] border-accent-green/10 hover:border-accent-green/25'
            } else {
              tileBg = 'bg-white/[0.01] border-white/5 hover:border-accent-green/15'
            }
          } else {
            if (absDelta > 10) {
              tileBg = 'bg-accent-red/[0.04] border-accent-red/20 hover:border-accent-red/45'
              isSpike = true
            } else {
              tileBg = 'bg-white/[0.01] border-white/5 hover:border-accent-red/15'
            }
          }

          return (
            <div
              key={p.name}
              className={cn(
                "border p-3 flex flex-col justify-between transition-all duration-300",
                tileBg,
                isSpike && "shadow-[0_0_12px_rgba(0,255,135,0.02)]"
              )}
            >
              <div>
                <div className="text-[9px] text-text-muted font-bold tracking-[0.1em] uppercase mb-1">
                  {p.name}
                </div>
                <div className={cn(
                  "text-base font-extrabold tabular-nums tracking-wider leading-none mb-1 font-mono",
                  isPositive ? "text-accent-green" : "text-accent-red"
                )}>
                  {isPositive ? '+' : ''}{p.delta.toFixed(2)}%
                </div>
              </div>

              <div className="flex justify-between items-center text-[8px] font-mono text-text-muted pt-2 border-t border-white/5">
                <span>VOL: <span className="text-text-primary/60 font-bold">{p.volume_24h}</span></span>
                <span>USR: <span className="text-text-primary/60 font-bold">{p.active_users}</span></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
