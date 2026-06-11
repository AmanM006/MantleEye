'use client'

import { useEffect, useState } from 'react'
import { mockAnomalies, Anomaly } from '@/lib/mock-data'
import { formatAddress } from '@/lib/utils'
import { ShieldAlert, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'

export default function AnomalyAlert() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(mockAnomalies)
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { isEducationMode } = useEducationMode()

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const newAnom: Anomaly = {
          id: `anom_${Math.floor(Math.random() * 1000 + 100)}`,
          severity: Math.random() > 0.5 ? 'HIGH' : 'CRITICAL',
          protocol: 'KTX Finance',
          metric: 'Large Collateral Withdrawal',
          value: '3.4M MNT',
          z_score: parseFloat((3.0 + Math.random() * 2).toFixed(1)),
          tx_hash: '0xb54410dd0c25acb03b676a0c0c29b6bc4c01bf042b58ea09419b48c666ec485d',
        }
        setAnomalies((prev) => [newAnom, ...prev].slice(0, 10))
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  const sortedAnomalies = [...anomalies].sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
  )

  return (
    <div className="flex-1 flex flex-col bg-[#050505] border-none select-none font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01] shrink-0">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-accent-red animate-pulse" />
          <span className="font-extrabold text-[10px] tracking-[0.15em] text-text-primary uppercase">ACTIVE ANOMALY MONITOR</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-red pulse-error" />
          <span className="text-[8px] text-accent-red font-mono uppercase tracking-widest font-bold">
            MODERATE THREATS
          </span>
        </div>
      </div>

      {/* Accessibility / Explanation Helper */}
      <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
        <span className="text-[8px] text-text-muted font-bold tracking-wider uppercase flex items-center space-x-1.5">
          <span>Z-SCORE DETECTOR STATUS</span>
          <button 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-text-muted hover:text-text-primary focus:outline-none"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </span>
        <span className="text-[8px] text-accent-orange font-mono tracking-widest uppercase">Z &gt; 3.0 DETECTED</span>
        
        {showTooltip && (
          <div className="absolute right-6 top-[88px] z-20 bg-[#0f0f0f] border border-white/10 p-2.5 text-[8px] text-text-muted uppercase w-[240px] leading-normal font-sans shadow-xl">
            Z-score measures standard deviations from average pool volume. Z &gt; 3.0 indicates significant, potentially manipulative activity.
          </div>
        )}
      </div>

      {/* Beginner Mode Mini Summary */}
      {isEducationMode && (
        <div className="px-4 py-2 border-b border-white/5 bg-accent-orange/[0.02] text-[8.5px] text-accent-orange font-sans uppercase font-bold tracking-wider space-y-0.5">
          <div>💡 Z-Score: Standard deviations from average size. Higher means more abnormal.</div>
          <div>💡 Critical alerts show huge actions that might rapidly swing prices.</div>
        </div>
      )}

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mounted && sortedAnomalies.map((anom) => {
          const isCritical = anom.severity === 'CRITICAL'
          const isHigh = anom.severity === 'HIGH'
          const isMedium = anom.severity === 'MEDIUM'

          let badgeColor = 'text-accent-red border-accent-red/20 bg-accent-red/5'
          if (isHigh) badgeColor = 'text-orange-500 border-orange-500/20 bg-orange-500/5'
          if (isMedium) badgeColor = 'text-accent-yellow border-accent-yellow/20 bg-accent-yellow/5'

          return (
            <div
              key={anom.id}
              className={cn(
                "border border-white/5 p-4 flex flex-col justify-between transition-colors bg-[#080808] hover:border-white/10",
                isCritical && "critical-glow"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="font-extrabold text-[10px] text-text-primary tracking-wider uppercase">
                    {anom.protocol}
                  </span>
                  <span className="text-xs text-text-primary/75 mt-1 font-sans tracking-wide">
                    {anom.metric}
                  </span>
                </div>
                
                <div className={cn(
                  "px-2 py-[1px] font-mono text-[8px] font-bold border uppercase tracking-wider",
                  badgeColor
                )}>
                  {anom.severity}
                </div>
              </div>

              {/* Data metrics */}
              <div className="flex justify-between items-center text-[9px] font-mono mb-3 bg-white/[0.01] p-2 border-l border-accent-orange/30">
                <span>VALUE: <span className="text-text-primary font-bold">{anom.value}</span></span>
                <span>Z-SCORE: <span className="text-accent-orange font-extrabold">{anom.z_score}</span></span>
              </div>

              {/* Transaction Proof */}
              <div className="flex justify-between items-center text-[9px] font-mono text-text-muted">
                <span className="tracking-wide">PROVENANCE RECORD</span>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${anom.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-accent-orange hover:underline tracking-widest font-extrabold uppercase bg-accent-orange/5 px-2 py-0.5 border border-accent-orange/10 hover:bg-accent-orange/10 hover:text-accent-lavender transition-all"
                >
                  <span>VERIFY PROOF ↗</span>
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
