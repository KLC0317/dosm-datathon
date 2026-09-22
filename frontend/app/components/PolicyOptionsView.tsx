'use client'

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Info,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
          <div className="option-title-group">
            <strong className="option-label">{option.label}</strong>
            <p className="option-objective">{option.decision_objective}</p>
          </div>
        </div>
        <div className="option-header-right">
          <div className="option-col-status">
            <span className={`approval-badge ${acfg.cls}`}>{translateStatus(option.approval_status)}</span>
          </div>
          <div className="option-col-budget">
            <span className="option-budget-label">{lang === 'ms' ? 'Anggaran' : 'Budget'}</span>
            <span className="option-budget">{option.estimated_budget}</span>
          </div>
          <div className="option-col-chevron">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
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

          <div className="option-sections-container">
            <OptionSection
              label={lang === 'ms' ? 'Apa yang terlibat' : 'What it involves'}
              value={option.intervention_description}
              fullWidth
            />
            <div className="option-sections-grid">
              <OptionSection
                label={t('evidenceSupport')}
                value={option.evidence_supporting}
                status="observed"
                variant="observed"
              />
              <OptionSection
                label={lang === 'ms' ? 'Apa yang tidak dilitupi oleh bukti' : 'What the evidence does not cover'}
                value={option.evidence_gaps}
                status="unavailable"
                variant="warning"
              />
              <OptionSection
                label={t('expectedOutput')}
                value={option.expected_output}
              />
              <OptionSection
                label={t('intendedOutcome')}
                value={option.intended_outcome}
              />
              <OptionSection
                label={t('riskMitigation')}
                value={option.risk_mitigation}
                variant="warning"
              />
              <OptionSection
                label={t('monitoringKpi')}
                value={option.monitoring_kpi}
                icon={<TrendingUp size={13} />}
                variant="teal"
              />
            </div>
          </div>
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
  variant,
  icon,
  fullWidth = false,
}: {
  label: string
  value: string
  status?: 'observed' | 'unavailable'
  variant?: 'default' | 'warning' | 'observed' | 'teal'
  icon?: React.ReactNode
  fullWidth?: boolean
}) {
  const variantClass = variant ? `variant-${variant}` : ''
  return (
    <div className={`option-section-card ${variantClass} ${fullWidth ? 'full-width' : ''}`}>
      <div className="option-section-header">
        <div className="section-label-group">
          {variant === 'warning' && <AlertTriangle size={13} className="section-alert-icon" />}
          {icon}
          <span className="section-label-text">{label}</span>
        </div>
        {status && <DataStatusBadge status={status} compact />}
      </div>
      <p className="section-content-text">{value}</p>
    </div>
  )
}

type TheoryStage = {
  num: string
  phase: string
  title: string
  desc: string
  icon: React.ReactNode
  color: string
}

function TheoryOfChange({ option }: { option: PolicyOption }) {
  const { lang } = useLanguage()
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const steps: TheoryStage[] = [
    {
      num: '01',
      phase: lang === 'ms' ? 'ISU / MASALAH' : 'PROBLEM IDENTIFIED',
      title: lang === 'ms' ? 'Tekanan Dikesan' : 'Pressure Detected',
      desc:
        lang === 'ms'
          ? 'Tekanan pelancongan melebihi daya tampung atau ketidakseimbangan perbelanjaan dikesan daripada data DOSM.'
          : 'Tourism pressure exceeding carrying capacity or expenditure imbalance identified from DOSM signals.',
      icon: <AlertTriangle size={16} />,
      color: '#96432a',
    },
    {
      num: '02',
      phase: lang === 'ms' ? 'INTERVENSI' : 'POLICY INTERVENTION',
      title: lang === 'ms' ? 'Tindakan Digerakkan' : 'Intervention Deployed',
      desc: option.intervention_description.split('.')[0] + '.',
      icon: <Shield size={16} />,
      color: '#9c6114',
    },
    {
      num: '03',
      phase: lang === 'ms' ? 'OUTPUT LANGSUNG' : 'DIRECT OUTPUT',
      title: lang === 'ms' ? 'Kapasiti Tersedia' : 'Delivered Output',
      desc: option.expected_output,
      icon: <BadgeCheck size={16} />,
      color: '#1f6b5e',
    },
    {
      num: '04',
      phase: lang === 'ms' ? 'HASIL SASARAN' : 'INTENDED OUTCOME',
      title: lang === 'ms' ? 'Anjakan Aliran' : 'Value & Flow Shift',
      desc: option.intended_outcome,
      icon: <TrendingUp size={16} />,
      color: '#17554c',
    },
    {
      num: '05',
      phase: lang === 'ms' ? 'IMPAK KEKAL' : 'LONG-TERM IMPACT',
      title: lang === 'ms' ? 'Kemakmuran Lestari' : 'Shared Prosperity',
      desc:
        lang === 'ms'
          ? 'Destinasi seimbang: hasil pelancongan tinggi, kos sara hidup komuniti stabil, dan daya tahan terpelihara.'
          : 'Balanced destination: higher yield per visitor, stable local living costs, and resilient destination ecosystem.',
      icon: <Users size={16} />,
      color: '#0b2e29',
    },
  ]

  return (
    <div className="theory-of-change-pipeline" key={option.option_id}>
      <div className="pipeline-track-container">
        <div className="pipeline-chain">
          {steps.map((step, i) => {
            const isHovered = activeStep === i
            return (
              <Fragment key={i}>
                <div
                  className={`pipeline-stage-card ${isHovered ? 'focused' : ''}`}
                  style={{ '--stage-color': step.color, animationDelay: `${i * 90}ms` } as React.CSSProperties}
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <div className="stage-card-top">
                    <span className="stage-num-badge">{step.num}</span>
                    <span className="stage-phase-tag">{step.phase}</span>
                  </div>

                  <div className="stage-icon-orb">
                    <span className="orb-icon">{step.icon}</span>
                    <span className="orb-halo" aria-hidden="true" />
                  </div>

                  <h4 className="stage-title">{step.title}</h4>
                  <p className="stage-description">{step.desc}</p>
                </div>

                {i < steps.length - 1 && (
                  <div className="pipeline-connector-box" aria-hidden="true">
                    <div className="connector-wire">
                      <div className="connector-wire-glow" />
                      <div className="connector-pulse-particle" style={{ animationDelay: `${i * 450}ms` }} />
                    </div>
                    <div className="connector-logic-badge">
                      <span className="logic-dot" />
                      <span className="logic-text">{lang === 'ms' ? 'jika berkesan' : 'if holds'}</span>
                      <ArrowRight size={11} className="logic-arrow" />
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const BORNEO_STATES = ['Sabah', 'Sarawak', 'Labuan']

function StateDropdown({
  currentState,
  states,
  stateRecords,
  onSelectState,
}: {
  currentState: string
  states: string[]
  stateRecords?: Array<{ state: string; quadrant?: string; pressure_score?: number; prosperity_score?: number }>
  onSelectState: (state: string) => void
}) {
  const { lang, translateQuadrant } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<'all' | 'peninsular' | 'borneo'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const recordMap = useMemo(() => {
    const map: Record<string, { quadrant?: string; pressure_score?: number; prosperity_score?: number }> = {}
    if (stateRecords) {
      for (const r of stateRecords) {
        map[r.state] = r
      }
    }
    return map
  }, [stateRecords])

  const currentRecord = recordMap[currentState]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const filteredStates = useMemo(() => {
    return states.filter((st) => {
      if (regionFilter === 'peninsular' && BORNEO_STATES.includes(st)) return false
      if (regionFilter === 'borneo' && !BORNEO_STATES.includes(st)) return false

      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchName = st.toLowerCase().includes(q)
        const quadrantText = recordMap[st]?.quadrant?.toLowerCase() || ''
        const matchQuadrant = quadrantText.includes(q)
        return matchName || matchQuadrant
      }
      return true
    })
  }, [states, regionFilter, search, recordMap])

  return (
    <div className="policy-state-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`policy-state-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="policy-state-select-btn"
      >
        <span className="trigger-pin-icon" aria-hidden="true">
          <MapPin size={18} />
        </span>
        <span className="trigger-state-name">{currentState}</span>
        {currentRecord?.quadrant && (
          <span className="trigger-quadrant-badge">
            {translateQuadrant(currentRecord.quadrant)}
          </span>
        )}
        <ChevronDown size={18} className={`trigger-chevron ${isOpen ? 'rotated' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="policy-dropdown-popover" role="listbox" aria-labelledby="policy-state-select-btn">
          <div className="dropdown-search-wrapper">
            <Search size={14} className="dropdown-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ms' ? 'Cari negeri atau postur...' : 'Search state or posture...'}
              className="dropdown-search-input"
              aria-label={lang === 'ms' ? 'Cari negeri' : 'Search state'}
            />
            {search && (
              <button
                type="button"
                className="dropdown-search-clear"
                onClick={() => setSearch('')}
                aria-label={lang === 'ms' ? 'Kosongkan carian' : 'Clear search'}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="dropdown-region-filter">
            <button
              type="button"
              className={`region-chip ${regionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRegionFilter('all')}
            >
              {lang === 'ms' ? 'Semua' : 'All'} ({states.length})
            </button>
            <button
              type="button"
              className={`region-chip ${regionFilter === 'peninsular' ? 'active' : ''}`}
              onClick={() => setRegionFilter('peninsular')}
            >
              {lang === 'ms' ? 'Semenanjung' : 'Peninsular'} ({states.filter((s) => !BORNEO_STATES.includes(s)).length})
            </button>
            <button
              type="button"
              className={`region-chip ${regionFilter === 'borneo' ? 'active' : ''}`}
              onClick={() => setRegionFilter('borneo')}
            >
              Sabah & Sarawak ({states.filter((s) => BORNEO_STATES.includes(s)).length})
            </button>
          </div>

          <div className="dropdown-items-list">
            {filteredStates.length === 0 ? (
              <div className="dropdown-empty">
                {lang === 'ms' ? 'Tiada negeri sepadan dengan carian' : 'No state matches your search'}
              </div>
            ) : (
              filteredStates.map((st) => {
                const isSelected = st === currentState
                const rec = recordMap[st]
                return (
                  <button
                    key={st}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`dropdown-state-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectState(st)
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div className="item-left">
                      <span className="item-pin">
                        <MapPin size={14} />
                      </span>
                      <span className="item-name">{st}</span>
                    </div>

                    <div className="item-right">
                      {rec?.quadrant && (
                        <span className="item-quadrant-tag">
                          {translateQuadrant(rec.quadrant)}
                        </span>
                      )}
                      {isSelected && (
                        <span className="item-check-icon" aria-hidden="true">
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function PolicyOptionsView({
  stateName,
  options,
  states,
  stateRecords,
  onSelectState,
}: {
  stateName: string
  options: PolicyOption[]
  states: string[]
  stateRecords?: Array<{ state: string; quadrant?: string; pressure_score?: number; prosperity_score?: number }>
  onSelectState: (state: string) => void
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
        <div className="policy-hero-main">
          <div className="policy-eyebrow-row">
            <span className="policy-eyebrow-badge">
              <Shield size={13} className="eyebrow-shield-icon" />
              <span>{lang === 'ms' ? 'KERANGKA KEPUTUSAN DASAR' : 'POLICY DECISION FRAMEWORK'}</span>
            </span>
            <span className="policy-options-count-badge">
              <FileText size={12} />
              <span>{options.length} {lang === 'ms' ? 'Pilihan Dirangka' : 'Formulated Options'}</span>
            </span>
          </div>

          <div className="policy-title-container">
            <h1 className="policy-hero-h1">
              <span className="policy-hero-lead">
                {lang === 'ms' ? 'Pilihan Dasar & Pelan Tindakan' : 'Strategic Policy Options & Action Plan'}
              </span>
              <span className="policy-hero-subline">
                <span className="policy-for-text">{lang === 'ms' ? 'untuk' : 'for'}</span>
                <StateDropdown
                  currentState={stateName}
                  states={states}
                  stateRecords={stateRecords}
                  onSelectState={onSelectState}
                />
              </span>
            </h1>
          </div>

          <p className="policy-hero-desc">{t('policyOptionsDesc')}</p>

          <div className="policy-disclaimer">
            <AlertTriangle size={15} />
            <span>{t('policyDisclaimer')}</span>
          </div>
        </div>

        <div className="policy-seal">
          <div className="policy-seal-icon">
            <Shield size={26} />
          </div>
          <div className="policy-seal-body">
            <span className="seal-kicker">{lang === 'ms' ? 'SUMBER BERASAS' : 'GROUNDED IN'}</span>
            <strong className="seal-title">{lang === 'ms' ? 'Bukti Rasmi DOSM' : 'Official DOSM Data'}</strong>
          </div>
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
        <div className="toc-header-container">
          <div className="toc-heading-left">
            <div className="toc-eyebrow-badge">
              <Sparkles size={13} className="toc-sparkle-icon" />
              <span>{lang === 'ms' ? 'Bagaimana ia berfungsi' : 'How it works'}</span>
            </div>
            <h2 className="toc-main-title">
              {lang === 'ms' ? 'Bagaimana Ia Berfungsi: Tindakan kepada Hasil' : 'How It Works: From Action to Result'}
            </h2>
            <p className="toc-main-desc">
              {lang === 'ms'
                ? 'Aliran langkah demi langkah yang menunjukkan bagaimana tindakan dasar yang dipilih beralih daripada menangani tekanan kepada hasil mampan.'
                : 'Step-by-step pathway showing how the chosen policy intervention transitions from addressing pressure into sustainable results.'}
            </p>
          </div>

          <div className="toc-option-selector-container">
            <span className="toc-selector-label">{lang === 'ms' ? 'Pilih Pilihan Dasar:' : 'Select Policy Option:'}</span>
            <div className="toc-option-selector">
              {options.filter((o) => o.type !== 'baseline').map((o) => {
                const isSelected = tocOption === o.option_number
                return (
                  <button
                    key={o.option_number}
                    type="button"
                    className={`toc-tab-button ${isSelected ? 'active' : ''}`}
                    onClick={() => setTocOption(o.option_number)}
                  >
                    <span className="toc-tab-number">{lang === 'ms' ? 'Pilihan' : 'Option'} {o.option_number}</span>
                    <span className="toc-tab-label">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {activeOption && <TheoryOfChange option={activeOption} />}

        <div className="toc-footer-caveat">
          <div className="caveat-icon-wrap">
            <Info size={16} />
          </div>
          <div className="caveat-text-wrap">
            <strong>{lang === 'ms' ? 'Audit Andaian Pelaksanaan' : 'Implementation Assumption Audit'}:</strong>{' '}
            <span>
              {lang === 'ms'
                ? 'Setiap penyambung rantaian mewakili andaian logik pelaksanaan dasar. Pegawai perancang hendaklah menyemak data bukti DOSM pada setiap peringkat sebelum kelulusan belanjawan.'
                : 'Each connector represents an implementation transition assumption. Planning officers must audit supporting DOSM signals at each stage before authorizing budget execution.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
