'use client'

import { AlertTriangle, BadgeCheck, ChevronDown, ChevronUp, Clock, FileText, Shield, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { DataStatusBadge } from './DataStatusBadge'
import { useLanguage } from '../lib/i18n'

type PolicyOption = {
  option_id: string
  option_number: number
  label: string
  type: string
  decision_objective: string
  target_destination: string
  target_population: string
  intervention_description: string
  responsible_organisation: string
  estimated_budget: string
  implementation_period: string
  evidence_supporting: string
  evidence_gaps: string
  expected_output: string
  intended_outcome: string
  risk_mitigation: string
  monitoring_kpi: string
  review_date: string
  approval_status: string
}

type TheoryStep = {
  label: string
  icon: React.ReactNode
  color: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  baseline: <Shield size={18} />,
  demand_management: <TrendingUp size={18} />,
  capacity: <BadgeCheck size={18} />,
  community_benefit: <Users size={18} />,
  combined: <FileText size={18} />,
}

const TYPE_COLOR: Record<string, string> = {
  baseline: '#7a857e',
  demand_management: '#17554c',
  capacity: '#33887c',
  community_benefit: '#9c6114',
  combined: '#7c331d',
}

const APPROVAL_CONFIG: Record<string, { cls: string }> = {
  draft: { cls: 'status-draft' },
  reviewed: { cls: 'status-reviewed' },
  approved: { cls: 'status-approved' },
  rejected: { cls: 'status-rejected' },
}

function OptionCard({ option, isExpanded, onToggle }: { option: PolicyOption; isExpanded: boolean; onToggle: () => void }) {
  const { t, lang, translateStatus } = useLanguage()
  const acfg = APPROVAL_CONFIG[option.approval_status] ?? APPROVAL_CONFIG.draft
  const color = TYPE_COLOR[option.type] ?? '#17554c'

  return (
    <div
      className={`policy-option-card ${option.type === 'baseline' ? 'baseline-card' : ''} ${isExpanded ? 'expanded' : ''}`}
      style={{ '--option-color': color } as React.CSSProperties}
    >
      <button
        type="button"
        className="option-card-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        id={`opt-${option.option_id}`}
      >
        <div className="option-header-left">
          <span className="option-number">{lang === 'ms' ? 'Pilihan' : 'Option'} {option.option_number}</span>
          <span className="option-icon" style={{ color }}>{TYPE_ICON[option.type]}</span>
          <div>
            <strong className="option-label">{option.label}</strong>
            <p className="option-objective">{option.decision_objective}</p>
          </div>
        </div>
        <div className="option-header-right">
          <span className={`approval-badge ${acfg.cls}`}>{translateStatus(option.approval_status)}</span>
          <span className="option-budget">{option.estimated_budget}</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {isExpanded && (
        <div className="option-body" aria-labelledby={`opt-${option.option_id}`}>
          <div className="option-grid">
            <OptionField label={t('targetDest')} value={option.target_destination} />
            <OptionField label={t('targetPop')} value={option.target_population} />
            <OptionField label={t('leadAgency')} value={option.responsible_organisation} />
            <OptionField label={t('implPeriod')} value={option.implementation_period} />
            <OptionField label={t('budgetEst')} value={option.estimated_budget} />
            <OptionField label={lang === 'ms' ? 'Tarikh semakan' : 'Review date'} value={option.review_date} icon={<Clock size={13} />} />
          </div>

          <OptionSection label={lang === 'ms' ? 'Keterangan intervensi' : 'What it involves'} value={option.intervention_description} />
          <OptionSection label={t('evidenceSupport')} value={option.evidence_supporting} status="observed" />
          <OptionSection label={lang === 'ms' ? 'Jurang data / bukti' : 'What the evidence does not cover'} value={option.evidence_gaps} status="unavailable" isWarning />
          <OptionSection label={t('expectedOutput')} value={option.expected_output} />
          <OptionSection label={t('intendedOutcome')} value={option.intended_outcome} />
          <OptionSection label={t('riskMitigation')} value={option.risk_mitigation} isWarning />
          <OptionSection label={t('monitoringKpi')} value={option.monitoring_kpi} icon={<TrendingUp size={13} />} />
        </div>
      )}
    </div>
  )
}

function OptionField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="option-field">
      <span className="option-field-label">{icon}{label}</span>
      <span className="option-field-value">{value}</span>
    </div>
  )
}

function OptionSection({
  label,
  value,
  status,
  isWarning = false,
  icon,
}: {
  label: string
  value: string
  status?: 'observed' | 'unavailable'
  isWarning?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className={`option-section ${isWarning ? 'warning-section' : ''}`}>
      <div className="option-section-label">
        {isWarning && <AlertTriangle size={13} />}
        {icon}
        {label}
        {status && <DataStatusBadge status={status} compact />}
      </div>
      <p>{value}</p>
    </div>
  )
}

function TheoryOfChange({ option }: { option: PolicyOption }) {
  const { lang } = useLanguage()
  const steps: TheoryStep[] = [
    { label: lang === 'ms' ? 'Isu dikenal pasti' : 'Problem identified', icon: <AlertTriangle size={14} />, color: '#7c331d' },
    { label: option.intervention_description.split('.')[0] + '.', icon: <Shield size={14} />, color: '#9c6114' },
    { label: option.expected_output, icon: <BadgeCheck size={14} />, color: '#33887c' },
    { label: option.intended_outcome, icon: <TrendingUp size={14} />, color: '#17554c' },
    { label: lang === 'ms' ? 'Nilai tempatan jangka panjang' : 'Long-term local value', icon: <Users size={14} />, color: '#0f3f39' },
  ]
  return (
    <div className="theory-of-change">
      <div className="toc-chain">
        {steps.map((step, i) => (
          <div key={i} className="toc-step">
            <div className="toc-dot" style={{ background: step.color }}>{step.icon}</div>
            <div className="toc-text">{step.label}</div>
            {i < steps.length - 1 && (
              <div className="toc-arrow">
                <span>→</span>
                <small>{lang === 'ms' ? 'andaian' : 'if this holds'}</small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PolicyOptionsView({
  stateName,
  options,
}: {
  stateName: string
  options: PolicyOption[]
}) {
  const { lang, t } = useLanguage()
  const [expandedId, setExpandedId] = useState<string | null>(options[0]?.option_id ?? null)
  const [tocOption, setTocOption] = useState<number>(1)

  // options[1] was the previous fallback and is undefined for a short list,
  // which then crashed TheoryOfChange on intervention_description.split().
  const activeOption =
    options.find((o) => o.option_number === tocOption) ??
    options.find((o) => o.type !== 'baseline') ??
    options[0]

  return (
    <div className="policy-view">
      <div className="policy-hero">
        <div>
          <p className="kicker">{lang === 'ms' ? 'PILIHAN DASAR' : 'POLICY OPTIONS'}</p>
          <h2>
            {lang === 'ms' ? 'Pilihan intervensi sedia ada' : 'What choices are available'}
            <br />
            <em>{lang === 'ms' ? `untuk ${stateName}?` : `for ${stateName}?`}</em>
          </h2>
          <p>{t('policyOptionsDesc')}</p>
          <div className="policy-disclaimer">
            <AlertTriangle size={14} />
            <span>{t('policyDisclaimer')}</span>
          </div>
        </div>
        <div className="policy-seal">
          <Shield size={26} />
          <span>
            {lang === 'ms' ? 'Berasaskan' : 'Based on'}
            <br />
            <strong>{lang === 'ms' ? 'bukti DOSM' : 'DOSM data'}</strong>
          </span>
        </div>
      </div>

      <div className="policy-options-list">
        {options.map((opt) => (
          <OptionCard
            key={opt.option_id}
            option={opt}
            isExpanded={expandedId === opt.option_id}
            onToggle={() => setExpandedId(expandedId === opt.option_id ? null : opt.option_id)}
          />
        ))}
      </div>

      {/* Theory of Change for selected non-baseline option */}
      <div className="toc-section panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t('tocTitle')}</span>
            <h2>{lang === 'ms' ? 'Daripada Masalah ke Kemakmuran' : 'From problem to result'}</h2>
          </div>
          <div className="toc-option-selector">
            {options.filter((o) => o.type !== 'baseline').map((o) => (
              <button
                key={o.option_number}
                type="button"
                className={tocOption === o.option_number ? 'active' : ''}
                onClick={() => setTocOption(o.option_number)}
              >
                {lang === 'ms' ? 'Pilihan' : 'Option'} {o.option_number}
              </button>
            ))}
          </div>
        </div>
        {activeOption && <TheoryOfChange option={activeOption} />}
        <p className="toc-caveat">
          {lang === 'ms'
            ? 'Setiap anak panah mewakili andaian. Andaian wajar disemak dan disokong oleh bukti data sebelum keputusan diluluskan secara rasmi.'
            : 'Each arrow is a step we are assuming will hold. Check each one against evidence before approving anything.'}
        </p>
      </div>
    </div>
  )
}
