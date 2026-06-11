'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { mockEquityCurve } from '@/lib/mock-data'

interface PnLChartProps {
  data?: { date: string; value: number }[]
  equityCurve?: number[]
}

function buildChartData(equityCurve: number[]): { date: string; value: number }[] {
  return equityCurve.map((value, index) => ({
    date: `D${index + 1}`,
    value: Math.round(value * 100) / 100,
  }))
}

export default function PnLChart({ data, equityCurve }: PnLChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Recharts does not work well with server rendering, defer until mounted
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[220px] bg-primary flex items-center justify-center font-mono text-xs text-text-muted">
        LOADING FINANCIAL CACHE...
      </div>
    )
  }

  // Priority: equityCurve prop (raw numbers) → data prop → mockEquityCurve
  const chartData = equityCurve
    ? buildChartData(equityCurve)
    : data ?? mockEquityCurve

  const initialValue = chartData[0]?.value ?? 100000
  const finalValue = chartData[chartData.length - 1]?.value ?? 100000
  const isPositive = finalValue >= initialValue

  const strokeColor = isPositive ? '#ff5005' : '#FF3B5C'
  const gradientId = isPositive ? 'colorValueOrange' : 'colorValueRed'
  const gradientColorStart = isPositive ? '#ff5005' : '#FF3B5C'
  const gradientColorEnd = isPositive ? '#d0bce1' : '#FF3B5C'

  return (
    <div className="w-full h-full min-h-[220px] bg-primary select-none p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColorStart} stopOpacity={0.25}/>
              <stop offset="95%" stopColor={gradientColorEnd} stopOpacity={0.0}/>
            </linearGradient>
          </defs>

          <ReferenceLine
            y={initialValue}
            stroke="#333333"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            interval={Math.floor(chartData.length / 8)}
            tick={{ fill: '#555555', fontSize: 9, fontFamily: 'monospace' }}
          />
          <YAxis
            domain={['dataMin - 2000', 'dataMax + 2000']}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
            tick={{ fill: '#555555', fontSize: 9, fontFamily: 'monospace' }}
            orientation="right"
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F0F0F',
              borderColor: '#1E1E1E',
              borderRadius: 0,
              fontFamily: 'monospace',
              fontSize: 11
            }}
            labelStyle={{ color: '#555555', fontWeight: 'bold' }}
            itemStyle={{ color: strokeColor }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Portfolio Value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor, stroke: 'transparent' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
