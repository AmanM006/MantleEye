'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Radio, Wallet, TrendingUp, Cpu, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEducationMode } from '@/context/EducationContext'
import { useWallet } from '@/context/WalletContext'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const pathname = usePathname()
  const { isEducationMode, toggleEducationMode } = useEducationMode()
  const { walletConnected, walletAddress, connecting, connectWallet, disconnectWallet } = useWallet()

  const navItems = [
    { label: 'COMMAND CENTER', path: '/dashboard', icon: LayoutDashboard },
    { label: 'ANOMALY RADAR', path: '/signals', icon: Radio },
    { label: 'SMART MONEY', path: '/wallets', icon: Wallet },
    { label: 'STRATEGY PLAN', path: '/strategy', icon: TrendingUp },
    { label: 'AGENT CONTROL', path: '/agent', icon: Cpu },
    { label: 'COMMIT AUDIT', path: '/commits', icon: ShieldCheck },
  ]

  return (
    <nav className={cn(
      "w-[245px] flex flex-col bg-[#030303] border-r border-white/5 h-full shrink-0 select-none justify-between font-khteka",
      className
    )}>
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <Link href="/" className="p-6 border-b border-white/5 flex items-center space-x-3 bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer">
          <div className="relative flex items-center justify-center w-6 h-6 rounded shrink-0 overflow-hidden">
            <img src="/images/logo.png" alt="MantleEye Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-[0.2em] text-text-primary">MANTLEYE</span>
            <span className="text-[8px] text-[#00d4a4] tracking-widest font-mono uppercase mt-0.5">ON-CHAIN QUANT</span>
          </div>
        </Link>

        {/* Links List */}
        <div className="flex flex-col py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
            const Icon = item.icon
            const idMap: Record<string, string> = {
              '/dashboard': 'nav-dashboard',
              '/signals': 'nav-signals',
              '/wallets': 'nav-wallets',
              '/strategy': 'nav-strategy',
              '/agent': 'nav-agent',
              '/commits': 'nav-commits'
            }
            const navId = idMap[item.path]
            
            return (
              <Link
                key={item.path}
                id={navId}
                href={item.path}
                className={cn(
                  "flex items-center space-x-4 px-6 py-3.5 text-[10px] font-bold tracking-[0.15em] transition-all relative group uppercase",
                  isActive
                    ? "text-[#00d4a4] bg-white/[0.02]"
                    : "text-text-primary/50 hover:text-text-primary hover:bg-white/[0.01]"
                )}
              >
                {/* Active Indicator Left Vertical Line Accent */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00d4a4] shadow-[0_0_8px_rgba(0,212,164,0.5)]" />
                )}
                
                <Icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-[#00d4a4]" : "text-text-primary/30 group-hover:text-text-primary/60"
                )} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Status Panel */}
      <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col space-y-4">
        {/* Wallet Connection Status */}
        <button
          onClick={walletConnected ? disconnectWallet : connectWallet}
          disabled={connecting}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 border text-[9px] font-bold tracking-wider transition-all",
            walletConnected
              ? "bg-[#00d4a4]/10 border-[#00d4a4] text-[#00d4a4] shadow-[0_0_8px_rgba(0,212,164,0.15)]"
              : "border-white/10 text-text-primary/60 hover:text-text-primary hover:border-white/20"
          )}
        >
          <span className="flex items-center space-x-1.5">
            <Wallet className="h-3 w-3" />
            <span>
              {connecting
                ? 'CONNECTING...'
                : walletConnected
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : 'CONNECT WALLET'}
            </span>
          </span>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            walletConnected ? "bg-[#00d4a4] animate-pulse" : "bg-white/20"
          )} />
        </button>

        <button
          onClick={toggleEducationMode}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 border text-[9px] font-bold tracking-wider transition-all",
            isEducationMode 
              ? "bg-[#00d4a4]/10 border-[#00d4a4] text-[#00d4a4] shadow-[0_0_8px_rgba(0,212,164,0.15)]"
              : "border-white/10 text-text-primary/60 hover:text-text-primary hover:border-white/20"
          )}
        >
          <span className="flex items-center space-x-1">
            <span>💡 BEGINNER GUIDE</span>
          </span>
          <span className="font-mono text-[8px] font-extrabold">
            {isEducationMode ? 'ACTIVE' : 'OFF'}
          </span>
        </button>

        {/* Telegram Alerts channel link */}
        <a
          href="https://web.telegram.org/a/#-1003831017205"
          target="_blank"
          rel="noopener noreferrer"
          title="Join the Telegram channel to receive real-time anomaly alerts from the bot."
          className="w-full flex items-center justify-between px-3 py-2 border border-[#00a2e8]/30 bg-[#00a2e8]/5 text-[#00a2e8] hover:text-[#33beff] hover:bg-[#00a2e8]/10 text-[9px] font-bold tracking-wider transition-all"
        >
          <span className="flex items-center space-x-1.5">
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.82-1.07 4.28-1.54 5.96-.2.72-.51.96-.76.98-.56.05-1-.37-1.54-.73-.85-.56-1.33-.91-2.16-1.46-.96-.64-.34-.99.21-1.56.14-.15 2.64-2.42 2.69-2.63.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.25-.02-.11.02-1.85 1.17-5.23 3.45-.5.34-.95.51-1.35.5-.44-.01-1.28-.25-1.9-.45-.77-.25-1.37-.38-1.32-.8.03-.22.38-.45 1.05-.69 4.12-1.79 6.87-2.97 8.24-3.53 3.92-1.62 4.73-1.9 5.26-1.91.12 0 .38.03.55.17.14.12.18.28.2.45-.02.09-.02.2-.04.31z" />
            </svg>
            <span>TELEGRAM ALERTS</span>
          </span>
          <span className="font-mono text-[7px] border border-[#00a2e8]/30 px-1 py-0.5 rounded bg-[#00a2e8]/10">SUBSCRIBE</span>
        </a>

        <div className="flex items-center space-x-3">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-green pulse-active" />
          <div className="flex flex-col">
            <span className="text-[9px] text-text-primary/70 font-sans font-bold tracking-[0.1em] uppercase">SYSTEM ONLINE</span>
            <span className="text-[8px] text-text-muted font-mono tracking-widest uppercase mt-0.5">INGESTION LIVE</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
