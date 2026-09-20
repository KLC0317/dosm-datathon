'use client'

import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react'

export type DataStatus = 'observed' | 'derived' | 'forecast' | 'assumed' | 'unavailable' | 'stale'

const STATUS_CONFIG: Record<
  DataStatus,
  { label: string; labelMs: string; color: string; icon: React.ReactNode; desc: string }
> = {
  observed: {
    label: 'Observed',
    labelMs: 'Diperhatikan',
    color: '#17554c',
    icon: <CheckCircle2 size={11} />,
    desc: 'Directly from an official DOSM publication',
  },
  derived: {
    label: 'Derived',
    labelMs: 'Diterbitkan',
    color: '#33887c',
    icon: <Info size={11} />,
    desc: 'Calculated from official DOSM inputs',
  },
  forecast: {
    label: 'Forecast',
    labelMs: 'Ramalan',
    color: '#9c6114',
    icon: <Clock size={11} />,
    desc: 'Model prediction — not an observed value',
  },
  assumed: {
    label: 'Assumed',
    labelMs: 'Anggapan',
    color: '#7c331d',
    icon: <AlertTriangle size={11} />,
    desc: 'Parameter assumption — subject to review',
  },
  unavailable: {
    label: 'Not available',
    labelMs: 'Tidak tersedia',
    color: '#7a857e',
    icon: <Info size={11} />,
    desc: 'Data not collected, comparable, or released for this metric',
  },
  stale: {
    label: 'Stale data',
    labelMs: 'Data lapuk',
    color: '#9c6114',
    icon: <AlertTriangle size={11} />,
    desc: 'Data is outside expected refresh window',
  },
}

export function DataStatusBadge({
  status,
  source,
  period,
  geography,
  lastRefresh,
  compact = false,
}: {
  status: DataStatus
  source?: string
  period?: string
  geography?: string
  lastRefresh?: string
  compact?: boolean
}) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={`data-status-badge status-${status}${compact ? ' compact' : ''}`}
      title={[cfg.desc, source && `Source: ${source}`, period && `Period: ${period}`, geography && `Geography: ${geography}`, lastRefresh && `Last refresh: ${lastRefresh}`]
        .filter(Boolean)
        .join('\n')}
      aria-label={`Data status: ${cfg.label}${source ? ` — ${source}` : ''}`}
      style={{ '--status-color': cfg.color } as React.CSSProperties}
    >
      {cfg.icon}
      {!compact && <span>{cfg.label}</span>}
    </span>
  )
}

export function UnavailableValue({ reason = 'Not available' }: { reason?: string }) {
  return (
    <span className="unavailable-value" aria-label={reason}>
      {reason}
    </span>
  )
}
