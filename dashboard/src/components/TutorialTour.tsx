'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'

interface TourStep {
  title: string
  content: string
  targetId?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface TutorialTourProps {
  isOpen: boolean
  onClose: () => void
}

export default function TutorialTour({ isOpen, onClose }: TutorialTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  const lastHighlightedElRef = useRef<HTMLElement | null>(null)
  const originalStylesRef = useRef<{ position: string; zIndex: string; pointerEvents: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const steps: TourStep[] = [
    {
      title: 'SYSTEM INDUCTION PROTOCOL',
      content: 'Welcome to the MantleEye Command Center. This interactive tutorial will guide you through configuring your strategy, starting the execution agent, and tracking anomaly signals. Let\'s set up your terminal.',
    },
    {
      title: 'CONNECT WALLET (STEP 1)',
      content: 'Start by connecting your Web3 wallet. Connecting authorizes your local session, unlocks your equity curve, enables live trade logs, and lets you query the Sentinel AI.',
      targetId: 'connect-wallet-btn',
      position: 'bottom',
    },
    {
      title: 'CONFIGURE STRATEGY (STEP 2)',
      content: 'Navigate to the STRATEGY PLAN page. Choose default strategies (Momentum, Arbitrage, Macro) and fine-tune threshold values like Z-Scores and slippage tolerance before committing them.',
      targetId: 'nav-strategy',
      position: 'right',
    },
    {
      title: 'START EXECUTION AGENT (STEP 3)',
      content: 'Go to the AGENT CONTROL page. Standard wallets can inspect live executor actions. Operators can click Force Start/Stop to control the autonomous loops on the Sepolia Testnet.',
      targetId: 'nav-agent',
      position: 'right',
    },
    {
      title: 'ANOMALY RADAR (STEP 4)',
      content: 'The LIVE SIGNAL ANCHOR FEED displays real-time signals committed to the blockchain. Every signal creates an immutable, cryptographically committed audit trail on-chain.',
      targetId: 'signal-feed-panel',
      position: 'right',
    },
    {
      title: 'SENTINEL AI CHAT (STEP 5)',
      content: 'Use the AI Sentinel Chat sandbox to query committed reasoning behind any signal. Interrogate confidence scores, volume deviations, or linear hedging logic.',
      targetId: 'chat-sandbox-panel',
      position: 'left',
    }
  ]

  useEffect(() => {
    if (!isOpen) return
    
    const updateCoords = () => {
      const step = steps[currentStep]
      if (!step || !step.targetId) {
        setCoords(null)
        return
      }
      const el = document.getElementById(step.targetId)
      if (el) {
        const rect = el.getBoundingClientRect()
        // If element is not displayed, fallback to center modal
        if (rect.width === 0 || rect.height === 0) {
          setCoords(null)
          return
        }
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
      } else {
        setCoords(null)
      }
    }

    updateCoords()
    
    // Set a small timeout to make sure elements are fully loaded/rendered
    const timeout = setTimeout(updateCoords, 100)

    window.addEventListener('resize', updateCoords, true)
    window.addEventListener('scroll', updateCoords, true)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', updateCoords, true)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [currentStep, isOpen])

  // Temporarily elevate z-index of highlighted elements to unblur them
  useEffect(() => {
    // Clean up previous element styles
    if (lastHighlightedElRef.current && originalStylesRef.current) {
      const el = lastHighlightedElRef.current
      const orig = originalStylesRef.current
      el.style.position = orig.position
      el.style.zIndex = orig.zIndex
      el.style.pointerEvents = orig.pointerEvents
      el.classList.remove('tour-highlighted-el')
      
      lastHighlightedElRef.current = null
      originalStylesRef.current = null
    }

    if (!isOpen) return

    const step = steps[currentStep]
    if (step && step.targetId) {
      const el = document.getElementById(step.targetId)
      if (el) {
        // Save original styles
        originalStylesRef.current = {
          position: el.style.position,
          zIndex: el.style.zIndex,
          pointerEvents: el.style.pointerEvents
        }

        const computedStyle = window.getComputedStyle(el)
        if (computedStyle.position === 'static') {
          el.style.position = 'relative'
        }
        el.style.zIndex = '9995'
        el.style.pointerEvents = 'auto'
        el.classList.add('tour-highlighted-el')
        lastHighlightedElRef.current = el
      }
    }
    
    // Clean up when component unmounts
    return () => {
      if (lastHighlightedElRef.current && originalStylesRef.current) {
        const el = lastHighlightedElRef.current
        const orig = originalStylesRef.current
        el.style.position = orig.position
        el.style.zIndex = orig.zIndex
        el.style.pointerEvents = orig.pointerEvents
        el.classList.remove('tour-highlighted-el')
      }
    }
  }, [currentStep, isOpen])

  if (!isOpen || !mounted) return null

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      localStorage.setItem('seye_tour_completed', 'true')
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('seye_tour_completed', 'true')
    onClose()
  }

  const step = steps[currentStep]

  // Calculate tooltip placement
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  }

  if (coords) {
    const tooltipWidth = 320
    const tooltipHeight = 160
    let top = 0
    let left = 0

    if (step.position === 'bottom') {
      top = coords.top + coords.height + 12
      left = coords.left + coords.width / 2 - tooltipWidth / 2
    } else if (step.position === 'right') {
      top = coords.top + coords.height / 2 - tooltipHeight / 2
      left = coords.left + coords.width + 12
    } else if (step.position === 'left') {
      top = coords.top + coords.height / 2 - tooltipHeight / 2
      left = coords.left - tooltipWidth - 12
    } else {
      // default top
      top = coords.top - tooltipHeight - 12
      left = coords.left + coords.width / 2 - tooltipWidth / 2
    }

    // Keep within bounds of the viewport
    if (left < 16) left = 16
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16
    }
    if (top < 16) top = 16
    if (top + tooltipHeight > window.innerHeight - 16) {
      top = window.innerHeight - tooltipHeight - 16
    }

    tooltipStyle = {
      ...tooltipStyle,
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  } else {
    // Center of screen if no target coords
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '360px',
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-[1.5px] font-mono select-none pointer-events-auto">
      {/* Target Highlight Box (Spotlight effect) */}
      {coords && (
        <div 
          className="fixed border-2 border-[#00d4a4] bg-[#00d4a4]/5 shadow-[0_0_15px_rgba(0,212,164,0.3)] transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: `${coords.top - 4}px`,
            left: `${coords.left - 4}px`,
            width: `${coords.width + 8}px`,
            height: `${coords.height + 8}px`,
            borderRadius: '4px',
            zIndex: 9998,
          }}
        />
      )}

      {/* Floating Card */}
      <div 
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-[#0c0c0e] border border-white/10 p-5 shadow-2xl relative transition-all duration-300 flex flex-col justify-between"
      >
        {/* Top Glowing bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00d4a4]" />
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-[10px] font-extrabold tracking-widest text-[#00d4a4] uppercase">
            {step.title}
          </span>
          <button 
            onClick={handleSkip}
            className="text-neutral-500 hover:text-white transition-colors"
            title="Exit Tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <p className="py-4 text-[10px] leading-relaxed text-neutral-300 uppercase">
          {step.content}
        </p>

        {/* Footer Controls */}
        <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[9px]">
          <span className="text-neutral-500 uppercase">
            Step {currentStep + 1} of {steps.length}
          </span>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button 
                onClick={handleBack}
                className="flex items-center space-x-1 px-2.5 py-1.5 border border-white/10 hover:border-white/30 text-white uppercase transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back</span>
              </button>
            )}
            
            <button 
              onClick={handleNext}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00d4a4] text-black font-bold uppercase transition-all hover:bg-[#00b891]"
            >
              <span>{currentStep === steps.length - 1 ? 'FINISH' : 'NEXT'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
