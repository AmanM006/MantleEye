'use client'

import { useEffect, useRef, useState } from 'react'
import { mockWallets, Wallet } from '@/lib/mock-data'
import { formatAddress, formatCurrency } from '@/lib/utils'

export default function WalletRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredWallet, setHoveredWallet] = useState<Wallet | null>(null)
  const hoveredWalletRef = useRef<Wallet | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    
    // Scale canvas to offset high-dpi displays
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Node representation for animation
    interface AnimNode {
      wallet: Wallet
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
    }

    const nodes: AnimNode[] = mockWallets.map((w) => {
      // Radius sized by volume (log scale)
      const radius = Math.max(8, Math.min(22, Math.log10(w.total_volume) * 2.5))
      
      // Color coded by win rate
      let color = '#FFB800' // yellow
      if (w.win_rate >= 70) color = '#00FF87' // green
      if (w.win_rate < 50) color = '#FF3B5C' // red

      return {
        wallet: w,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius,
        color,
      }
    })

    let mouseX = 0
    let mouseY = 0
    let isHovering = false

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top

      // Check if mouse is over any node
      let foundHover = false
      for (const node of nodes) {
        const dist = Math.hypot(node.x - mouseX, node.y - mouseY)
        if (dist <= node.radius) {
          setHoveredWallet(node.wallet)
          hoveredWalletRef.current = node.wallet
          setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top + 15 })
          foundHover = true
          isHovering = true
          break
        }
      }
      if (!foundHover) {
        setHoveredWallet(null)
        hoveredWalletRef.current = null
        isHovering = false
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Center coordinates
      const cx = canvas.width / 2
      const cy = canvas.height / 2

      // Draw radar rings (background grid)
      ctx.strokeStyle = '#1E1E1E'
      ctx.lineWidth = 1
      for (let r = 50; r < Math.max(canvas.width, canvas.height); r += 60) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw crosshairs
      ctx.beginPath()
      ctx.moveTo(cx, 0)
      ctx.lineTo(cx, canvas.height)
      ctx.moveTo(0, cy)
      ctx.lineTo(canvas.width, cy)
      ctx.stroke()

      // Update positions and physics (attract to center + collision)
      nodes.forEach((n) => {
        // Attract to center slightly
        const dx = cx - n.x
        const dy = cy - n.y
        const distToCenter = Math.hypot(dx, dy)
        
        n.vx += (dx / distToCenter) * 0.005
        n.vy += (dy / distToCenter) * 0.005

        // Drag friction
        n.vx *= 0.98
        n.vy *= 0.98

        // Update positions
        n.x += n.vx
        n.y += n.vy

        // Keep inside boundaries
        n.x = Math.max(n.radius, Math.min(canvas.width - n.radius, n.x))
        n.y = Math.max(n.radius, Math.min(canvas.height - n.radius, n.y))
      })

      // Handle simple node overlaps/collisions
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i]
          const n2 = nodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.hypot(dx, dy)
          const minDist = n1.radius + n2.radius + 6

          if (dist < minDist) {
            const overlap = minDist - dist
            const forceX = (dx / dist) * overlap * 0.05
            const forceY = (dy / dist) * overlap * 0.05
            
            n1.vx -= forceX
            n1.vy -= forceY
            n2.vx += forceX
            n2.vy += forceY
          }
        }
      }

      // Draw connections between close nodes
      ctx.lineWidth = 0.5
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i]
          const n2 = nodes[j]
          const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y)
          
          if (dist < 110) {
            ctx.strokeStyle = `rgba(30, 30, 30, ${1 - dist / 110})`
            ctx.beginPath()
            ctx.moveTo(n1.x, n1.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const isHovered = hoveredWalletRef.current?.address === n.wallet.address

        // Outer outline glow
        if (isHovered) {
          ctx.strokeStyle = n.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Inner solid circle
        ctx.fillStyle = n.color
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fill()

        // Center dot
        ctx.fillStyle = '#080808'
        ctx.beginPath()
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Change mouse cursor if hovering
      canvas.style.cursor = isHovering ? 'pointer' : 'default'

      animationFrameId = requestAnimationFrame(draw)
    }
    
    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[300px] bg-primary border border-border flex flex-col select-none">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-elevated/40 shrink-0 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 bg-accent-teal animate-pulse" />
          <span className="font-bold tracking-wider text-text-primary">SMART MONEY WALLET CLUSTERS</span>
        </div>
        <span className="text-[9px] text-text-muted uppercase tracking-wider">
          CANVAS ENGINE
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-[#050505]" />

        {/* Floating Custom Monospace Tooltip */}
        {hoveredWallet && (
          <div
            className="absolute bg-surface border border-border p-3 pointer-events-none font-mono text-[10px] space-y-1 z-25 text-left bg-opacity-95"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="font-bold text-accent-teal">{hoveredWallet.label}</div>
            <div className="text-text-primary/50">{formatAddress(hoveredWallet.address)}</div>
            <hr className="border-border/60 my-1" />
            <div>WIN RATE: <span className="text-accent-green font-bold">{hoveredWallet.win_rate}%</span></div>
            <div>AVG RETURN: <span className="text-accent-green font-bold">+{hoveredWallet.avg_return}%</span></div>
            <div>VOLUME: <span className="text-text-primary">{formatCurrency(hoveredWallet.total_volume)}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
