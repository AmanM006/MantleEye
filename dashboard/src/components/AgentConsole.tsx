'use client'

import { useEffect, useRef, useState } from 'react'
import { socketClient } from '@/lib/ws'
import { mockAgentLog, AgentLog } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function AgentConsole() {
  const [logs, setLogs] = useState<AgentLog[]>(mockAgentLog)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const unsubscribe = socketClient.subscribe('agent_actions', (data: AgentLog) => {
      setLogs((prev) => [...prev, data].slice(-100))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="flex-1 flex flex-col bg-[#050505] border-none select-none font-sans h-full">
      {/* Console Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01] shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-orange animate-pulse" />
          <span className="font-extrabold text-[10px] tracking-[0.15em] text-text-primary uppercase">MEYE.AGENT QUANT REPLAY ENGINE</span>
        </div>
        <span className="text-[8px] text-accent-orange font-mono uppercase tracking-widest bg-accent-orange/5 px-2.5 py-[2px] border border-accent-orange/10 font-bold">
          LOG LEVEL: TRACE
        </span>
      </div>

      {/* Terminal Output */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 text-text-primary/75 text-[10.5px] leading-relaxed scrollbar-none scroll-smooth bg-primary/40 font-mono"
        style={{ scrollbarWidth: 'none' }}
      >
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-2.5 group">
            <span className="text-accent-orange/40 shrink-0 font-bold">[{log.timestamp}]</span>
            <span className={cn(
              log.type === 'success' && 'text-accent-green font-bold',
              log.type === 'warn' && 'text-accent-yellow',
              log.type === 'error' && 'text-accent-red font-bold',
              log.type === 'info' && 'text-text-primary/80'
            )}>
              {log.message}
            </span>
          </div>
        ))}
        {/* Blinking terminal cursor */}
        <div className="terminal-cursor text-text-primary/45 flex items-center space-x-2.5">
          <span className="text-accent-orange/40 shrink-0 font-bold">[{mounted ? new Date().toLocaleTimeString('en-US', { hour12: false }) : '--:--:--'}]</span>
          <span>Awaiting execution criteria...</span>
        </div>
      </div>
    </div>
  )
}
