'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FlashNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export default function FlashNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
}: FlashNumberProps) {
  const prevValueRef = useRef<number>(value)
  const [flashClass, setFlashClass] = useState<'flash-green' | 'flash-red' | null>(null)

  useEffect(() => {
    const prevValue = prevValueRef.current
    if (value > prevValue) {
      setFlashClass('flash-green')
      const timer = setTimeout(() => setFlashClass(null), 1000)
      prevValueRef.current = value
      return () => clearTimeout(timer)
    } else if (value < prevValue) {
      setFlashClass('flash-red')
      const timer = setTimeout(() => setFlashClass(null), 1000)
      prevValueRef.current = value
      return () => clearTimeout(timer)
    }
  }, [value])

  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={cn(
      "font-mono tabular-nums transition-all duration-300 px-1 inline-block",
      flashClass === 'flash-green' && "text-accent-green bg-accent-green/10",
      flashClass === 'flash-red' && "text-accent-red bg-accent-red/10",
      className
    )}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}
