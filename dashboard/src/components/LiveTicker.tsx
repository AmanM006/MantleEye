'use client'

import { useEffect, useState } from 'react'
import { socketClient } from '@/lib/ws'
import { mockPrices, PriceTick } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function LiveTicker() {
  const [prices, setPrices] = useState<PriceTick[]>(mockPrices)
  const [lastUpdated, setLastUpdated] = useState<{ [symbol: string]: 'up' | 'down' | null }>({})

  useEffect(() => {
    const unsubscribe = socketClient.subscribe('prices', (data: PriceTick) => {
      setPrices((prev) => {
        const index = prev.findIndex((p) => p.symbol === data.symbol)
        if (index === -1) return prev

        const prevPrice = prev[index].price
        const direction = data.price > prevPrice ? 'up' : data.price < prevPrice ? 'down' : null
        
        if (direction) {
          setLastUpdated((last) => ({ ...last, [data.symbol]: direction }))
          setTimeout(() => {
            setLastUpdated((last) => ({ ...last, [data.symbol]: null }))
          }, 1000)
        }

        const next = [...prev]
        next[index] = data
        return next
      })
    })

    return () => unsubscribe()
  }, [])

  // Duplicate items for seamless infinite scroll
  const tickerItems = [...prices, ...prices]

  return (
    <div className="w-full h-7 bg-[#080807] border-b border-white/5 flex items-center overflow-hidden font-mono text-[10px] tracking-wider shrink-0 select-none">
      <div className="bg-[#030303] border-r border-white/5 h-full px-4 flex items-center text-accent-teal font-bold z-10 select-none shrink-0">
        SYS.MARKET FEED
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center">
        <div className="scrolling-ticker flex items-center py-1">
          {tickerItems.map((item, idx) => {
            const isUp = item.change_24h >= 0
            const flashStatus = lastUpdated[item.symbol]

            return (
              <div
                key={`${item.symbol}-${idx}`}
                className={cn(
                  "flex items-center space-x-2 px-6 border-r border-border/30 h-4 shrink-0 transition-colors duration-300",
                  flashStatus === 'up' && "bg-accent-green/20 text-accent-green",
                  flashStatus === 'down' && "bg-accent-red/20 text-accent-red"
                )}
              >
                <span className="text-text-primary/40">{item.symbol}</span>
                <span className="font-bold tabular-nums text-text-primary">
                  {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className={cn(
                  "text-[9px] tabular-nums font-bold",
                  isUp ? "text-accent-green" : "text-accent-red"
                )}>
                  {isUp ? '▲' : '▼'} {Math.abs(item.change_24h).toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
