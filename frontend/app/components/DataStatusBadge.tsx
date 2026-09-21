'use client'

import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react'
import { useLanguage } from '../lib/i18n'

export type DataStatus = 'observed' | 'derived' | 'forecast' | 'assumed' | 'unavailable' | 'stale'

const STATUS_CONFIG: Record<
  DataStatus,
  { label: string; labelMs: string; color: string; icon: React.ReactNode; desc: string; descMs: string }
> = {
  observed: {
    label: 'Observed',
    labelMs: 'Diperhatikan',
    color: '#17554c',
    icon: <CheckCircle2 size={11} />,
    desc: 'Directly from an official DOSM publication',
    descMs: 'Terus daripada penerbitan rasmi DOSM',
  },
  derived: {
    label: 'Derived',
    labelMs: 'Diterbitkan',
    color: '#33887c',
    icon: <Info size={11} />,
    desc: 'Calculated from official DOSM inputs',
    descMs: 'Dikira daripada input rasmi DOSM',
  },
  forecast: {
    label: 'Forecast',
    labelMs: 'Ramalan',
    color: '#9c6114',
    icon: <Clock size={11} />,
    desc: 'Model prediction, not an observed value',
    descMs: 'Ramalan model, bukan nilai yang diperhatikan',
  },
  assumed: {
    label: 'Assumed',
    labelMs: 'Anggapan',
    color: '#7c331d',
    icon: <AlertTriangle size={11} />,
    desc: 'Parameter assumption, subject to review',
    descMs: 'Anggapan parameter, tertakluk kepada semakan',
  },
  unavailable: {
    label: 'Not available',
    labelMs: 'Tidak tersedia',
    color: '#7a857e',
    icon: <Info size={11} />,
    desc: 'Data not collected, comparable, or released for this metric',
    descMs: 'Data tidak dikumpul, tidak setanding, atau tidak dikeluarkan untuk metrik ini',
  },
  stale: {
    label: 'Stale data',
    labelMs: 'Data lapuk',
    color: '#9c6114',
    icon: <AlertTriangle size={11} />,
    desc: 'Data is outside expected refresh window',
    descMs: 'Data berada di luar tempoh kemaskini yang dijangka',
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
  const { lang } = useLanguage()
  const cfg = STATUS_CONFIG[status]
  const label = lang === 'ms' ? cfg.labelMs : cfg.label
  const desc = lang === 'ms' ? cfg.descMs : cfg.desc
  const fieldLabels = lang === 'ms'
    ? { source: 'Sumber', period: 'Tempoh', geography: 'Geografi', lastRefresh: 'Kemaskini terakhir' }
    : { source: 'Source', period: 'Period', geography: 'Geography', lastRefresh: 'Last refresh' }

  return (
    <span
      className={`data-status-badge status-${status}${compact ? ' compact' : ''}`}
      title={[desc, source && `${fieldLabels.source}: ${source}`, period && `${fieldLabels.period}: ${period}`, geography && `${fieldLabels.geography}: ${geography}`, lastRefresh && `${fieldLabels.lastRefresh}: ${lastRefresh}`]
        .filter(Boolean)
        .join('\n')}
      aria-label={`${lang === 'ms' ? 'Status data' : 'Data status'}: ${label}${source ? `${lang === 'ms' ? ', dari' : ', from'} ${source}` : ''}`}
      style={{ '--status-color': cfg.color } as React.CSSProperties}
    >
      {cfg.icon}
      {!compact && <span>{label}</span>}
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
