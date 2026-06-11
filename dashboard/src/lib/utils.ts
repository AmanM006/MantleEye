import { clsx, type ClassValue } from 'clsx'
// Let's implement formatTimestamp manually or without external packages to keep package size lean and simple!

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatAddress(address: string): string {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatTimestamp(ts: number | string | Date): string {
  try {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffSecs < 60) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch (error) {
    return 'unknown'
  }
}

export function getSignalColor(type: string): { text: string; bg: string; border: string } {
  switch (type.toUpperCase()) {
    case 'BUY':
      return {
        text: 'text-accent-green',
        bg: 'bg-accent-green/10',
        border: 'border-accent-green/30',
      }
    case 'SELL':
      return {
        text: 'text-accent-red',
        bg: 'bg-accent-red/10',
        border: 'border-accent-red/30',
      }
    default:
      return {
        text: 'text-accent-yellow',
        bg: 'bg-accent-yellow/10',
        border: 'border-accent-yellow/30',
      }
  }
}
