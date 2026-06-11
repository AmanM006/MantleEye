import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'STOPPED'
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const isOk = status === 'ACTIVE'
  const isError = status === 'ERROR'
  const isPaused = status === 'PAUSED'

  return (
    <div className={cn(
      "px-3 py-1 font-mono text-xs font-bold border inline-flex items-center space-x-2 select-none tracking-widest",
      isOk && "text-accent-green border-accent-green/30 bg-accent-green/10",
      isError && "text-accent-red border-accent-red/30 bg-accent-red/10",
      (isPaused || status === 'STOPPED') && "text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10",
      className
    )}>
      <span className={cn(
        "h-2 w-2",
        isOk && "pulse-active",
        isError && "pulse-error",
        (isPaused || status === 'STOPPED') && "bg-accent-yellow"
      )} />
      <span className="uppercase">{status}</span>
    </div>
  )
}
