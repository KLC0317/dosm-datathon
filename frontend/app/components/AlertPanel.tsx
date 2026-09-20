'use client'

import { AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../lib/i18n'

type Alert = {
  alert_id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  state: string
  metric: string
  value: number | string
  threshold: number | string
  message: string
  recommended_action: string
  source: string
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#7c331d',
  medium: '#9c6114',
  low: '#7a857e',
}

export function AlertPanel({ alerts, onSelectState }: { alerts: Alert[]; onSelectState?: (state: string) => void }) {
  const { t, translateSeverity, lang } = useLanguage()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)

  const active = alerts.filter((a) => !dismissed[a.alert_id])
  const highCount = active.filter((a) => a.severity === 'high').length

  if (alerts.length === 0) return null

  return (
    <div className="alert-panel-wrap">
      <button
        type="button"
        className={`alert-bell-btn ${highCount > 0 ? 'has-alerts' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={`${active.length} ${t('alertsTitle')}`}
      >
        <Bell size={18} />
        {active.length > 0 && <span className="alert-count">{active.length}</span>}
      </button>

      {open && (
        <div className="alert-dropdown" role="dialog" aria-label={t('alertsTitle')}>
          <div className="alert-dropdown-header">
            <strong>{t('alertsTitle')} ({active.length})</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close alerts">
              <X size={16} />
            </button>
          </div>
          {active.length === 0 ? (
            <div className="alert-empty">
              <CheckCircle2 size={20} className="ok" />
              <span>{t('noAlerts')}</span>
            </div>
          ) : (
            <div className="alert-list">
              {active.map((alert) => (
                <div key={alert.alert_id} className={`alert-card severity-${alert.severity}`} style={{ '--alert-color': SEVERITY_COLOR[alert.severity] } as React.CSSProperties}>
                  <div className="alert-card-top">
                    <div className="alert-card-left">
                      <AlertTriangle size={14} style={{ color: SEVERITY_COLOR[alert.severity] }} />
                      <div>
                        <strong>{alert.state} — {alert.metric}</strong>
                        <span className={`severity-tag sev-${alert.severity}`}>{translateSeverity(alert.severity)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dismiss-btn"
                      onClick={() => setDismissed((prev) => ({ ...prev, [alert.alert_id]: true }))}
                      aria-label={t('dismissAlert')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-action">
                    <strong>{lang === 'ms' ? 'Disyorkan:' : 'Recommended:'}</strong> {alert.recommended_action}
                  </p>
                  <div className="alert-footer">
                    <small>{lang === 'ms' ? 'Sumber:' : 'Source:'} {alert.source}</small>
                    {alert.state !== 'National' && onSelectState && (
                      <button
                        type="button"
                        className="alert-select-btn"
                        onClick={() => { onSelectState(alert.state); setOpen(false) }}
                      >
                        {lang === 'ms' ? 'Tinjau' : 'View'} {alert.state} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="alert-footer-note">
            <AlertTriangle size={12} />
            {t('alertFootnote')}
          </div>
        </div>
      )}
    </div>
  )
}
