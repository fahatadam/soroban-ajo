'use client'

import React from 'react'
import { Group } from '@/types'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'

interface ComparisonChartProps {
  groups: Group[]
}

const COLORS = ['#818cf8', '#f472b6', '#34d399']

function normalize(val: number, min: number, max: number) {
  if (max === min) return 50
  return Math.round(((val - min) / (max - min)) * 100)
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ groups }) => {
  if (groups.length < 2) return null

  const metrics = [
    { key: 'contributionAmount' as keyof Group, label: 'Contribution' },
    { key: 'currentMembers' as keyof Group, label: 'Members' },
    { key: 'totalContributions' as keyof Group, label: 'Total Saved' },
    { key: 'cycleLength' as keyof Group, label: 'Cycle' },
    { key: 'maxMembers' as keyof Group, label: 'Capacity' },
  ]

  const data = metrics.map(({ key, label }) => {
    const vals = groups.map(g => Number(g[key]))
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const entry: Record<string, string | number> = { metric: label }
    groups.forEach((g, i) => {
      entry[`group${i}`] = normalize(Number(g[key]), min, max)
    })
    return entry
  })

  return (
    <div className="rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-5">
      <h3 className="text-white font-semibold mb-4 text-sm">Visual Comparison</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          />
          <Legend formatter={(value) => {
            const idx = parseInt(value.replace('group', ''))
            return <span style={{ color: COLORS[idx] }}>{groups[idx]?.name}</span>
          }} />
          {groups.map((_, i) => (
            <Radar
              key={i}
              name={`group${i}`}
              dataKey={`group${i}`}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
