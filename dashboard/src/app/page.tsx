'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Activity,
  Workflow,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { backtestMomentum90d } from '@/data/backtest_momentum_90d'
import PnLChart from '@/components/PnLChart'
import { cn } from '@/lib/utils'
import { useLenis } from 'lenis/react'
import LenisProvider from '@/components/LenisProvider'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeService, setActiveService] = useState<number>(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [playgroundState, setPlaygroundState] = useState<'idle' | 'scanning' | 'anchoring' | 'success'>('idle')
  const [playgroundLogs, setPlaygroundLogs] = useState<string[]>([])
  const [showHeader, setShowHeader] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const activeIdx = hoveredIdx !== null ? hoveredIdx : activeService

  const containerRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    setMounted(true)
    // Set body data attr for shader
    document.body.setAttribute('data-active-design', '3')
    return () => document.body.removeAttribute('data-active-design')
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsAtTop(currentScrollY < 50)
      if (currentScrollY < 50) {
        setShowHeader(true)
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setShowHeader(false)
      } else {
        // Scrolling up - show header
        setShowHeader(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const runPlaygroundTest = () => {
    if (playgroundState !== 'idle') return
    setPlaygroundState('scanning')
    setPlaygroundLogs(['[0.0s] Bootstrapping real-time scanner...', '[0.8s] Scanning Merchant Moe (USDC/MNT) reserves...'])
    setTimeout(() => {
      setPlaygroundLogs(prev => [...prev, '[1.8s] WHALE DETECTED: 120,000 MNT buy order mapped.', '[2.2s] Z-Score deviation: Z = 4.25 (CRITICAL).'])
      setPlaygroundState('anchoring')
    }, 1500)
    setTimeout(() => {
      setPlaygroundLogs(prev => [...prev, '[3.2s] Prompting AI reasoning module...', '[3.8s] Alpha signal generated. Type: BUY MNT.', '[4.2s] Invoking SignalAnchor.anchorSignal()...', '[4.9s] Inscribing metadata hash to chain...'])
    }, 3000)
    setTimeout(() => {
      setPlaygroundLogs(prev => [...prev, '[5.6s] ON-CHAIN TX CONFIRMED!', '[5.8s] Tx Hash: 0x5f1b9e5a4fb9d672f115a4d15b33d777683e5c07'])
      setPlaygroundState('success')
    }, 5500)
  }

  const resetPlayground = () => {
    setPlaygroundState('idle')
    setPlaygroundLogs([])
  }

  const scrollToSection = (id: string) => {
    if (lenis) {
      lenis.scrollTo(id, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    } else {
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const CAPABILITIES = [
    {
      name: 'AI Quant Strategy',
      img: '/images/cap_quant_new.png'
    },
    {
      name: 'Real-Time Z-Score Scanning',
      img: '/images/cap_zscore_new.png'
    },
    {
      name: 'On-Chain Signal Anchoring',
      img: '/images/cap_anchoring_new.png'
    },
    {
      name: 'Smart Contract Provenance',
      img: '/images/cap_provenance_new.png'
    },
    {
      name: 'Automated CL MM Pools',
      img: '/images/cap_clmm_new.png'
    },
    {
      name: 'Backtest Replay Auditing',
      img: '/images/cap_backtest_new.png'
    }
  ]

  const FAQS = [
    {
      q: 'How does the dual-layer AI agent work?',
      a: 'Our ingestion layer monitors reserves, volume spikes, and smart money positions in real-time across Merchant Moe and Agni Finance. The AI reasoning layer then evaluates statistical z-score data, filters false signals, and structures optimal entry rates.',
    },
    {
      q: 'Which networks and AMMs do you support?',
      a: 'MantleEye is native to Mantle Network and Mantle Sepolia Testnet. We monitor Merchant Moe, Agni Finance, and all major liquidity pools on these networks.',
    },
    {
      q: 'What is SignalAnchor and how does on-chain provenance work?',
      a: 'SignalAnchor is our core smart contract that inscribes AI-generated trade signals immutably on-chain. Every decision made by the AI is timestamped and hash-verified on Mantle, creating an auditable trail of every alpha signal.',
    },
    {
      q: 'Can I audit the backtest results independently?',
      a: 'Yes. Every backtest replay is anchored on-chain via TradeLogger. You can independently verify the 90-day momentum strategy results by querying the Mantle Sepolia contract directly.',
    },
  ]

  const PROTOCOLS = [
    { name: 'Agni Finance', icon: Activity },
    { name: 'Merchant Moe', icon: Workflow },
    { name: 'Mantle Network', icon: Cpu },
    { name: 'mETH Protocol', icon: ShieldCheck },
    { name: 'B2B Quant Desks', icon: TrendingUp },
    { name: 'DeFi Operators', icon: Zap },
  ]

  return (
    <LenisProvider>
    <div className="relative min-h-screen w-full font-sans select-none" style={{ background: 'transparent' }}>
      <div ref={containerRef} className="w-full relative z-10">

        {/* ============================================================ */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================ */}
        <section
          id="section-1"
          className="h-screen w-full relative flex flex-col overflow-hidden select-none border-b border-white/5"
          style={{ background: 'transparent' }}
        >
          {/* NAV */}
          <div className={cn(
            "w-full flex items-center justify-between px-8 md:px-12 py-4 fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
            isAtTop ? "bg-transparent border-transparent" : "bg-[#000000]/60 backdrop-blur-md border-b border-white/5",
            showHeader ? "translate-y-0" : "-translate-y-full"
          )}>
            <Link href="/" className="flex items-center space-x-2.5 text-white font-sans text-[13px] font-extrabold tracking-[0.2em] uppercase hover:opacity-80 transition-opacity">
              <span>MantleEye</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1 text-[11px] text-white/70">
              <button onClick={() => scrollToSection('#about')} className="navbar-link-custom focus:outline-none">About</button>
              <button onClick={() => scrollToSection('#works')} className="navbar-link-custom focus:outline-none">Strategies</button>
              <button onClick={() => scrollToSection('#services')} className="navbar-link-custom focus:outline-none">Services</button>
              <button onClick={() => scrollToSection('#faqs')} className="navbar-link-custom focus:outline-none">FAQs</button>
            </div>
            <div className="navbar_cta_contain flex items-center gap-3">
              <Link
                href="/dashboard"
                className="g_btn_main w-inline-block"
              >
                <div className="g_btn_text_contain">
                  <div className="g_btn_text u-text-style-small u-text-trim-off">LAUNCH CONSOLE</div>
                </div>
                <div className="g_btn_aside_wrap">
                  <div className="g_btn_aside_bg"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" className="g_btn_svg">
                    <path d="M8.90954 9.09046L9 3L2.90954 3.09046L2.90213 4.32367L6.86437 4.25391L2.55914 8.55914L3.44086 9.44086L7.74609 5.13563L7.68708 9.10862L8.90954 9.09046Z" fill="currentColor" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" className="g_btn_svg is-absolute">
                    <path d="M8.90954 9.09046L9 3L2.90954 3.09046L2.90213 4.32367L6.86437 4.25391L2.55914 8.55914L3.44086 9.44086L7.74609 5.13563L7.68708 9.10862L8.90954 9.09046Z" fill="currentColor" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* HERO BODY — absolutely centered with slight upward offset */}
          <div className="absolute inset-0 flex flex-col justify-between py-24 px-8 items-center text-center z-10">
            <div className="my-auto -translate-y-8 flex flex-col items-center justify-center text-center max-w-2xl px-8 z-10 select-text">

              {/* Globe SVG */}
              <svg className="w-[57px] h-[25px] text-white/90 mb-6 opacity-85" viewBox="0 0 57 25" fill="none" stroke="currentColor" strokeWidth="0.7125">
                <path d="M28.5 0.356445C36.3328 0.356445 43.407 1.74332 48.5098 3.97168C51.0617 5.08613 53.1051 6.40434 54.5049 7.84961C55.9028 9.29309 56.6436 10.846 56.6436 12.4463C56.6435 14.0465 55.9028 15.5995 54.5049 17.043C53.1051 18.4882 51.0617 19.8065 48.5098 20.9209C43.407 23.1492 36.3327 24.5361 28.5 24.5361C20.6673 24.5361 13.593 23.1492 8.49023 20.9209C5.93831 19.8065 3.8949 18.4882 2.49512 17.043C1.09715 15.5995 0.356472 14.0465 0.356445 12.4463C0.356445 10.846 1.09718 9.29309 2.49512 7.84961C3.8949 6.40434 5.93831 5.08613 8.49023 3.97168C13.593 1.74332 20.6672 0.356445 28.5 0.356445Z" />
                <path d="M56.6436 12.5C56.6436 12.6467 56.5489 12.8582 56.2031 13.125C55.8642 13.3865 55.3422 13.6542 54.6357 13.918C53.2265 14.444 51.1665 14.9243 48.5967 15.3301C43.4627 16.1407 36.3572 16.6436 28.5 16.6436C20.6428 16.6436 13.5373 16.1407 8.40332 15.3301C5.83351 14.9243 3.77352 14.444 2.36426 13.918C1.65778 13.6542 1.13579 13.3865 0.796875 13.125C0.451055 12.8582 0.356445 12.6467 0.356445 12.5C0.356446 12.3533 0.451056 12.1418 0.796875 11.875C1.13579 11.6135 1.65778 11.3458 2.36426 11.082C3.77352 10.5559 5.83351 10.0757 8.40332 9.66992C13.5373 8.85931 20.6428 8.35644 28.5 8.35644C36.3572 8.35644 43.4627 8.85931 48.5967 9.66992C51.1665 10.0757 53.2265 10.556 54.6357 11.082C55.3422 11.3458 55.8642 11.6135 56.2031 11.875C56.5489 12.1418 56.6436 12.3533 56.6436 12.5Z" />
                <path d="M28.5 0.356445C33.816 0.356645 38.2451 5.69623 38.2451 12.4463C38.2451 19.1963 33.816 24.5359 28.5 24.5361C23.1839 24.5361 18.7549 19.1964 18.7549 12.4463C18.7549 5.6961 23.1839 0.356445 28.5 0.356445Z" />
                <path d="M28.501 0.356445C33.1152 0.356517 37.2782 1.72972 40.2793 3.93262C43.2806 6.13571 45.0996 9.14997 45.0996 12.4463C45.0996 15.7426 43.2806 18.7569 40.2793 20.96C37.2783 23.1628 33.1151 24.5361 28.501 24.5361C23.8867 24.5361 19.7228 23.1629 16.7217 20.96C13.7204 18.7569 11.9014 15.7425 11.9014 12.4463C11.9014 9.15004 13.7205 6.1357 16.7217 3.93262C19.7228 1.72966 23.8867 0.356445 28.501 0.356445Z" />
                <path d="M28.501 0.356445C35.0302 0.356505 40.9237 1.74032 45.1719 3.96094C49.4372 6.19053 51.9541 9.2087 51.9541 12.4463C51.9541 15.6838 49.4372 18.7021 45.1719 20.9316C40.9237 23.1522 35.0302 24.5361 28.501 24.5361C21.9716 24.5361 16.0774 23.1523 11.8291 20.9316C7.56383 18.7021 5.04692 15.6838 5.04688 12.4463C5.04688 9.20872 7.56383 6.19053 11.8291 3.96094C16.0774 1.74026 21.9716 0.356445 28.501 0.356445Z" />
              </svg>

              <h1 className="text-[20px] md:text-[24px] font-khteka font-medium text-white tracking-[-0.015em] leading-[1.3] max-w-2xl mx-auto">
                We build change-making AI quant <br className="hidden md:inline" />
                agents that track smart money and anchor <br className="hidden md:inline" />
                trade execution on Mantle.
              </h1>

              <p className="mt-5 text-[12px] md:text-[13px] text-white/95 leading-[1.6] font-sans font-normal max-w-md mx-auto">
                For established, yield-focused B2B quant desks <br className="hidden md:inline" />
                and DeFi operators whose execution speed demands <br className="hidden md:inline" />
                absolute provenance and anomaly tracking.
              </p>
            </div>

            {/* Huge background title */}
            <div className="w-full absolute bottom-0 left-0 right-0 text-center pointer-events-none select-none flex items-end justify-center z-0">
              <h2 className="text-[17vw] font-khteka font-bold text-white/4 leading-[0.7] tracking-tighter uppercase select-none">
                MantleEye
              </h2>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: ABOUT / STATS                                      */}
        {/* ============================================================ */}
        <section
          id="about"
          className="w-full select-text"
          style={{ backgroundColor: '#080807', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Stats row */}
          <div className="w-full grid grid-cols-3 border-b border-white/5">
            {[
              { num: '367+', label: 'Total Trades Verified On-Chain' },
              { num: '3.20+', label: 'Audited Sharpe Ratio Replay' },
              { num: '246', label: 'Winning Trades Anchored' },
            ].map((s, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center justify-center py-10 md:py-16 text-center',
                  i < 2 ? 'border-r border-white/5' : ''
                )}
              >
                <div className="font-khteka text-[36px] md:text-[52px] text-white font-medium leading-none tracking-tight">
                  {s.num}
                </div>
                <p className="text-[9px] md:text-[10px] text-white/40 tracking-[0.12em] uppercase mt-2 max-w-[120px] font-sans leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="max-w-6xl mx-auto px-8 md:px-12 py-16 md:py-24">
            <div className="max-w-3xl">
              <h2 className="font-khteka font-medium text-[22px] md:text-[34px] text-white tracking-tight leading-[1.2]">
                Dual-layer autonomous intelligence monitoring smart-money movements and anchoring execution parameters onto Mantle Network.
              </h2>
              <p className="text-white/55 text-[13px] md:text-[14px] font-sans leading-relaxed mt-6 max-w-2xl">
                We bridge the gap between AI reasoning layers and provable execution. By constantly parsing volume reserves, z-score deviations, and liquidity pools across Merchant Moe and Agni Finance, our agents anchor decisions immutably on-chain.
              </p>
            </div>

            {/* Protocol grid */}
            <div className="mt-16 pt-10 border-t border-white/5">
              <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-mono mb-8">
                // Protocols &amp; Partners We Monitor
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {PROTOCOLS.map((p, i) => {
                  const Icon = p.icon
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center p-5 border border-white/[0.06] hover:border-white/20 bg-white/[0.015] hover:bg-white/[0.04] transition-all duration-300 cursor-default"
                      style={{ minHeight: 100 }}
                    >
                      <Icon className="h-5 w-5 text-white/40 mb-3" />
                      <div className="text-[9px] text-white/60 tracking-wider text-center uppercase font-mono">{p.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: STRATEGY PROFILES / PNL CHART (LIGHT THEME)       */}
        {/* ============================================================ */}
        <section
          id="works"
          className="w-full select-text"
          style={{ backgroundColor: '#f5f4f1', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#080807' }}
        >
          {/* Header */}
          <div className="border-b border-black/10 px-8 md:px-12 py-10">
            <div className="flex items-center justify-between">
              <h2 className="font-khteka font-medium text-[8vw] md:text-[4.5vw] text-[#080807] tracking-[-0.03em] uppercase leading-none">
                Strategy Profiles
              </h2>
              <div className="hidden md:flex items-center space-x-2 text-[10px] text-black/40 font-mono uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-black/40 rounded-full" />
                <span>AI Quant Performance</span>
              </div>
            </div>
          </div>

          {/* Strategy list + chart */}
          <div className="px-8 md:px-12 py-12 md:py-16 flex flex-col gap-12">

            {/* Strategy items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-black/8 pb-12">
              {[
                {
                  label: 'Agni Finance Arbitrage',
                  desc: 'Tracking smart money movements and front-running volume anomalies across concentrated pools.',
                  tag: 'LIVE',
                },
                {
                  label: 'Momentum Z-Score Scan',
                  desc: 'Statistical deviation analysis across Merchant Moe pairs. Z > 3.5 triggers an AI signal prompt.',
                  tag: 'ACTIVE',
                },
                {
                  label: 'Whale Follow Strategy',
                  desc: 'Monitors smart money address lists and mirrors high-confidence position entries on Mantle.',
                  tag: 'BETA',
                },
              ].map((s, i) => (
                <div key={i} className="flex flex-col justify-between py-4 border-l-2 border-black/10 pl-5 hover:border-black/40 transition-colors">
                  <div>
                    <div className="text-[9px] font-mono text-black/40 tracking-[0.15em] uppercase mb-2">{s.tag}</div>
                    <h3 className="font-khteka font-medium text-[17px] text-[#080807] leading-snug mb-2">{s.label}</h3>
                    <p className="text-black/60 text-[12px] font-sans leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* PnL Chart */}
            <div className="w-full border border-black/10 bg-white p-6 shadow-sm flex flex-col justify-between" style={{ height: 420 }}>
              <div className="flex justify-between items-center pb-4 border-b border-black/6">
                <div className="font-khteka font-medium text-[14px] text-[#080807] tracking-tight uppercase">
                  90-Day Real Backtest Replay Summary
                </div>
                <div className="text-[9px] font-mono text-black/40 tracking-widest uppercase">Momentum Strategy · Mantle Sepolia</div>
              </div>
              <div className="flex-1 min-h-0 relative py-4">
                <PnLChart equityCurve={[...backtestMomentum90d.equity_curve]} />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
{/* SECTION 5: SERVICES                                          */}
{/* ============================================================ */}
{/* ============================================================ */}
{/* SECTION 5: SERVICES                                          */}
{/* ============================================================ */}
<section
  id="services"
  className="w-full min-h-screen select-text relative flex items-center justify-center py-20 lg:py-0 overflow-hidden"
  style={{ backgroundColor: '#080807', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
>
  <div className="w-full max-w-none px-8 md:px-12 lg:px-16 flex flex-col justify-center h-full">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-16 items-start lg:pt-32">

      {/* Left: Product Architecture Description */}
      <div className="lg:col-span-3 flex flex-col justify-start text-left sticky top-32 z-20">
        <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-mono mb-6 mt-1">
          (Core Execution Architecture)
        </div>
        <h2 className="font-khteka font-medium text-[24px] md:text-[32px] text-white leading-[1.2] tracking-tight mb-4">
          Autonomous agents built for speed and provenance.
        </h2>
        <p className="text-white/55 text-[13px] md:text-[14px] font-sans leading-relaxed">
          MantleEye coordinates complex multi-agent execution flows. We translate real-time pool metrics into verifiable, on-chain proof-of-alphas, completely eliminating audit ambiguity for B2B quant desks.
        </p>
      </div>

      {/* Right: service list & hover preview image */}
      <div className="lg:col-span-9 relative w-full">
        
        <div className="w-full pb-40 relative">
          <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-mono mb-6 mt-1">
            // Capabilities
          </div>
          
          <div className="flex flex-col relative w-full">
            {CAPABILITIES.map((service, idx) => {
              const isActive = (hoveredIdx !== null ? hoveredIdx : activeService) === idx
              
              return (
                // THE ROW: Made relative so the image can anchor perfectly to its center
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setActiveService(idx)}
                  className="py-1 lg:py-2 flex items-center cursor-default relative w-full group"
                >
                  
                  {/* 1. THE IMAGE (Background layer of the row) */}
                  {/* Anchored to top-1/2 and -translate-y-1/2 so its dead center aligns with the text center */}
                  <div
                    className={cn(
                      "absolute -right-8 lg:-right-20 xl:-right-9 top-1/2 -translate-y-1/2 w-[350px] lg:w-[200px] aspect-[3/4] pointer-events-none transition-all duration-500 ease-out z-40",
                      isActive
                        ? "opacity-100 scale-100 shadow-2xl shadow-black/80"
                        : "opacity-0 scale-95" 
                    )}
                  >
                    {service.img && (
                      <img
                        src={service.img}
                        alt={service.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                      <span className="text-[10px] font-mono text-blue-400 tracking-widest uppercase mb-2">MantleEye Spec</span>
                      <h4 className="font-khteka text-[16px] text-white font-medium leading-tight tracking-wide">{service.name}</h4>
                    </div>
                  </div>

                  {/* 2. THE TEXT (Foreground layer with mix-blend-difference) */}
                  {/* mix-blend-difference creates the exact inversion effect from your red arrow */}
                  <div className="flex items-end justify-between gap-4 w-full relative z-10 mix-blend-difference pointer-events-none">
                    <h3 className={cn(
                      "font-khteka font-medium text-[40px] md:text-[50px] lg:text-[75px] xl:text-[85px] leading-[0.9] tracking-tight whitespace-nowrap transition-colors duration-300",
                      // Using solid colors instead of opacity so the blend mode works cleanly
                      isActive ? "text-white" : "text-neutral-600" 
                    )}>
                      {service.name}
                    </h3>
                    <span className={cn(
                      "text-[10px] font-mono tracking-widest shrink-0 pb-2 lg:pr-[300px] transition-colors duration-300",
                      isActive ? "text-white" : "text-neutral-700"
                    )}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Invisible overlay to catch your mouse hover smoothly */}
                  <div className="absolute inset-0 z-20" />
                </div>
              )
            })}
          </div>
          
        </div>
      </div>
    </div>
  </div>
</section>

        {/* ============================================================ */}
        {/* SECTION 6: PROCESS PIPELINE                                   */}
        {/* ============================================================ */}
        {/* ============================================================ */}
{/* SECTION 6: STRATEGY PIPELINE                                 */}
{/* ============================================================ */}
<section
  id="process"
  className="w-full select-text bg-[#080807]"
>
  {/* Section Header */}
  <div className="w-full px-8 md:px-12 lg:px-16 py-12 border-b border-white/5">
    <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-mono">
      // Strategy Execution Pipeline
    </div>
  </div>

  {/* Pipeline Rows */}
  <div className="flex flex-col w-full">
    {[
      {
        step: '01',
        title: 'We scan liquidity events',
        desc: 'We monitor pool reserves, transaction flows, and smart-money address listings across Merchant Moe and Agni Finance in real-time.',
        imgSrc: '/images/step_liquidity.png',
      },
      {
        step: '02',
        title: 'We compile AI reasoning',
        desc: 'Claude strategic reasoner evaluates statistical z-score data spikes, filters false signals, and structures optimal entry rates.',
        imgSrc: '/images/step_ai_reasoning.png',
      },
      {
        step: '03',
        title: 'We anchor proof & execute',
        desc: 'Alpha parameters are securely inscribed on-chain via the SignalAnchor smart contract, authorizing real-time settlement log verification.',
        imgSrc: '/images/step_execution.png',
      },
    ].map((step, i) => (
      // The Row: Full width 50/50 split with bottom border
      <div
        key={i}
        className="grid grid-cols-1 md:grid-cols-2 w-full border-b border-white/5"
      >
        
        {/* LEFT COLUMN: Text Block */}
        <div className="flex flex-row p-8 md:p-16 lg:p-24 xl:p-32 gap-8 md:gap-16 items-start h-full">
          
          {/* Step Marker: Aligned to the left corner like the reference */}
          <div className="flex items-center gap-2 font-mono text-[9px] text-white tracking-[0.2em] mt-2 flex-shrink-0">
            <span>STEP</span>
            <div className="w-3 h-px bg-white/30" />
            <span className="border border-white/20 px-1 py-0.5">{step.step}</span>
          </div>
          
          {/* Title & Description: Beside the step marker */}
          <div className="flex flex-col max-w-[380px]">
            <h3 className="font-khteka font-medium text-[24px] md:text-[28px] text-white mb-6 leading-tight">
              {step.title}
            </h3>
            <p className="text-white/50 text-[14px] font-sans leading-relaxed">
              {step.desc}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Image touching edges */}
        <div className="w-full h-[300px] md:h-auto relative overflow-hidden group border-l border-white/5">
          <img
            src={step.imgSrc}
            alt={step.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
          />
        </div>
        
      </div>
    ))}
  </div>
</section>

        {/* ============================================================ */}
        {/* SECTION 7: FAQS + PLAYGROUND                                  */}
        {/* ============================================================ */}
        <section
          id="faqs"
          className="w-full select-text"
          style={{ backgroundColor: '#080807', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-6xl mx-auto px-8 md:px-12 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* FAQ column */}
              <div className="lg:col-span-6">
                <h2 className="font-khteka font-medium text-[24px] md:text-[32px] text-white tracking-tight leading-snug mb-10">
                  We've heard every concern.<br />
                  Here's what you really need to know.
                </h2>
                <div className="flex flex-col">
                  {FAQS.map((faq, idx) => {
                    const isActive = activeFaq === idx
                    return (
                      <div key={idx} className="border-b border-white/[0.07] py-5">
                        <button
                          onClick={() => setActiveFaq(isActive ? null : idx)}
                          className="w-full flex items-start justify-between text-left gap-4"
                        >
                          <h3 className="text-white/90 text-[14px] font-medium leading-snug">{faq.q}</h3>
                          <span className="text-white/40 text-[18px] leading-none flex-shrink-0 mt-0.5">
                            {isActive ? '−' : '+'}
                          </span>
                        </button>
                        <div
                          className="overflow-hidden transition-all duration-300"
                          style={{ maxHeight: isActive ? 300 : 0 }}
                        >
                          <p className="pt-4 text-white/55 text-[13px] font-sans leading-relaxed border-l border-white/[0.06] pl-4">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Playground column */}
              <div className="lg:col-span-5 lg:col-start-8 flex items-start lg:items-center">
                <div
                  className="w-full border border-white/10 bg-black/50 backdrop-blur-md p-5 flex flex-col font-sans text-left"
                  style={{ minHeight: 400 }}
                >
                  <div className="flex justify-between items-center pb-3 border-b border-white/[0.07]">
                    <span className="text-[9px] text-white tracking-[0.15em] font-extrabold uppercase flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${playgroundState !== 'idle' ? 'bg-yellow-400 animate-pulse' : 'bg-white/30'}`} />
                      On-Chain Playground
                    </span>
                    <span className="text-[8px] text-white/30 uppercase font-mono tracking-widest">STATE: {playgroundState}</span>
                  </div>
                  <div className="flex-1 my-4 bg-black/60 border border-white/[0.06] p-4 font-mono text-[9px] text-white/70 overflow-y-auto" style={{ minHeight: 200 }}>
                    {playgroundLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/30 gap-2">
                        <p className="uppercase text-[9px] tracking-[0.15em] font-bold">Ready to simulate?</p>
                        <p className="text-[8px] text-white/20">Click below to run a live on-chain test</p>
                      </div>
                    ) : (
                      playgroundLogs.map((log, i) => <div key={i} className="mb-1">{log}</div>)
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={runPlaygroundTest}
                      disabled={playgroundState !== 'idle'}
                      className="flex-1 py-3.5 bg-white text-black font-extrabold text-[9px] tracking-[0.15em] uppercase hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {playgroundState === 'idle' ? 'Initiate On-Chain Test Run' : 'Executing…'}
                    </button>
                    {playgroundState === 'success' && (
                      <button
                        onClick={resetPlayground}
                        className="px-4 py-3.5 border border-white/20 text-white/60 font-mono text-[9px] uppercase tracking-widest hover:border-white/50 hover:text-white transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8: CTA (matching reference design)                    */}
        {/* ============================================================ */}
        <section
          className="w-full select-text overflow-hidden"
          style={{ backgroundColor: '#000', color: '#fff' }}
        >
          <div className="max-w-6xl mx-auto px-8 md:px-12 py-24 md:py-36">
            {/* Giant display heading */}
            <div className="mb-12">
              <div className="overflow-hidden">
                <h2
                  className="font-khteka font-medium text-white leading-[0.9] tracking-[-0.03em]"
                  style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
                >
                  Ready to anchor
                </h2>
              </div>
              <div className="overflow-hidden mt-1">
                <h2
                  className="font-khteka font-medium text-white leading-[0.9] tracking-[-0.03em]"
                  style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
                >
                  absolute provenance?
                </h2>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-16">
              <Link
                href="/dashboard"
                className="g_btn_main w-inline-block"
                style={{ height: 52, paddingLeft: 28, paddingRight: 6 }}
              >
                <div className="g_btn_text_contain">
                  <div className="g_btn_text u-text-style-small u-text-trim-off" style={{ fontSize: 11, letterSpacing: '0.12em' }}>
                    Launch Command Center
                  </div>
                </div>
                <div className="g_btn_aside_wrap" style={{ width: 40, height: 40 }}>
                  <div className="g_btn_aside_bg"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" className="g_btn_svg">
                    <path d="M8.90954 9.09046L9 3L2.90954 3.09046L2.90213 4.32367L6.86437 4.25391L2.55914 8.55914L3.44086 9.44086L7.74609 5.13563L7.68708 9.10862L8.90954 9.09046Z" fill="currentColor" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" className="g_btn_svg is-absolute">
                    <path d="M8.90954 9.09046L9 3L2.90954 3.09046L2.90213 4.32367L6.86437 4.25391L2.55914 8.55914L3.44086 9.44086L7.74609 5.13563L7.68708 9.10862L8.90954 9.09046Z" fill="currentColor" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FOOTER                                                         */}
        {/* ============================================================ */}
        <footer
          className="w-full select-none"
          style={{ backgroundColor: '#080807', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-6xl mx-auto px-8 md:px-12">
            {/* Top footer row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-white/[0.06]">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="font-khteka font-medium text-white text-[16px] tracking-[0.1em] uppercase mb-3">MantleEye</div>
                <p className="text-white/35 text-[11px] font-sans leading-relaxed max-w-[180px]">
                  AI quant agents tracking smart money on Mantle Network.
                </p>
              </div>
              {/* Nav links */}
              <div>
                <div className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-mono mb-4">Product</div>
                <div className="flex flex-col gap-2 items-start">
                  <Link href="/dashboard" className="text-white/50 hover:text-white text-[12px] font-sans transition-colors">Dashboard</Link>
                  <button onClick={() => scrollToSection('#works')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">Strategies</button>
                  <button onClick={() => scrollToSection('#works')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">Analytics</button>
                  <button onClick={() => scrollToSection('#services')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">SignalAnchor</button>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-mono mb-4">Info</div>
                <div className="flex flex-col gap-2 items-start">
                  <button onClick={() => scrollToSection('#about')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">About</button>
                  <button onClick={() => scrollToSection('#process')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">Process</button>
                  <button onClick={() => scrollToSection('#faqs')} className="text-white/50 hover:text-white text-[12px] font-sans transition-colors text-left focus:outline-none">FAQs</button>
                  <Link href="/dashboard" className="text-white/50 hover:text-white text-[12px] font-sans transition-colors">Contact</Link>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-mono mb-4">Network</div>
                <div className="flex flex-col gap-2">
                  {['Mantle Mainnet', 'Mantle Sepolia', 'Merchant Moe', 'Agni Finance'].map(l => (
                    <span key={l} className="text-white/35 text-[12px] font-sans">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 py-6 text-[9px] text-white/20 font-mono">
              <span>MANTLEYE © 2026 · BUILT FOR TURING TEST HACKATHON</span>
              <span>MANTLE NETWORK · AI QUANT INFRASTRUCTURE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
    </LenisProvider>
  )
}
