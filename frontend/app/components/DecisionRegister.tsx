'use client'

import { AlertTriangle, BadgeCheck, ChevronDown, ChevronRight, ChevronUp, ClipboardList, Clock, FileText, Plus } from 'lucide-react'
import { useState } from 'react'

export type Decision = {
  decision_id: string
  decision_question: string
  destination: string
  baseline_period: string
  options_considered: string[]
  selected_option: string
  reason_for_selection: string
  evidence_references: string[]
  evidence_version: string
  model_version: string
  assumptions: string[]
  known_limitations: string[]
  budget: string
  responsible_owner: string
  reviewer: string
  approval_status: string
  implementation_dates: { start: string; end: string }
  monitoring_kpis: string[]
  outcome_review_date: string
  decision_result: string | null
  revision_reason: string | null
  created_at: string
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: '#7a857e', icon: <FileText size={13} /> },
  reviewed: { label: 'Reviewed', color: '#9c6114', icon: <ClipboardList size={13} /> },
  approved: { label: 'Approved', color: '#17554c', icon: <BadgeCheck size={13} /> },
  rejected: { label: 'Rejected', color: '#7c331d', icon: <AlertTriangle size={13} /> },
  superseded: { label: 'Superseded', color: '#7a857e', icon: <AlertTriangle size={13} /> },
}

function DecisionCard({ decision }: { decision: Decision }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CFG[decision.approval_status] ?? STATUS_CFG.draft

  return (
    <div className={`decision-card status-${decision.approval_status}`}>
      <button
        type="button"
        className="decision-card-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="decision-header-left">
          <span className="decision-id">{decision.decision_id}</span>
          <span className="decision-dest-tag">{decision.destination}</span>
          <p className="decision-question">{decision.decision_question}</p>
        </div>
        <div className="decision-header-right">
          <span className="decision-status" style={{ color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="decision-date">
            <Clock size={12} /> {decision.created_at.slice(0, 10)}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="decision-body">
          <div className="decision-grid">
            <DecField label="Destination" value={decision.destination} />
            <DecField label="Baseline period" value={decision.baseline_period} />
            <DecField label="Responsible owner" value={decision.responsible_owner} />
            <DecField label="Reviewer" value={decision.reviewer} />
            <DecField label="Budget" value={decision.budget} />
            <DecField label="Outcome review date" value={decision.outcome_review_date} />
            <DecField label="Evidence version" value={decision.evidence_version} />
            <DecField label="Model version" value={decision.model_version} />
            <DecField label="Implementation" value={`${decision.implementation_dates.start} → ${decision.implementation_dates.end}`} />
          </div>

          <DecSection label="Selected option" value={decision.selected_option} />
          <DecSection label="Reason for selection" value={decision.reason_for_selection} />

          <div className="decision-list-section">
            <span className="dec-label">Options considered</span>
            <ul>{decision.options_considered.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">Evidence references</span>
            <ul>{decision.evidence_references.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">Assumptions</span>
            <ul>{decision.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>

          <div className="decision-list-section warning-list">
            <span className="dec-label"><AlertTriangle size={13} /> Known limitations</span>
            <ul>{decision.known_limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">Monitoring KPIs</span>
            <ul>{decision.monitoring_kpis.map((k, i) => <li key={i}>{k}</li>)}</ul>
          </div>

          {decision.decision_result && <DecSection label="Decision result" value={decision.decision_result} />}
          {decision.revision_reason && <DecSection label="Revision reason" value={decision.revision_reason} isWarning />}

          <div className="decision-footer">
            <span className="dec-label">Approval status</span>
            <div className="status-stepper">
              {(['draft', 'reviewed', 'approved'] as const).map((s, i) => {
                const reached = ['draft', 'reviewed', 'approved'].indexOf(decision.approval_status) >= i
                return (
                  <div key={s} className={`stepper-step ${reached ? 'reached' : ''}`}>
                    <div className="stepper-dot" />
                    <span>{STATUS_CFG[s].label}</span>
                    {i < 2 && <ChevronRight size={12} className="stepper-arrow" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DecField({ label, value }: { label: string; value: string }) {
  return (
    <div className="dec-field">
      <span className="dec-label">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function DecSection({ label, value, isWarning = false }: { label: string; value: string; isWarning?: boolean }) {
  return (
    <div className={`dec-section ${isWarning ? 'warning-section' : ''}`}>
      <span className="dec-label">{isWarning && <AlertTriangle size={13} />}{label}</span>
      <p>{value}</p>
    </div>
  )
}

export function DecisionRegister({ decisions: initialDecisions }: { decisions: Decision[] }) {
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = filterStatus === 'all' ? decisions : decisions.filter((d) => d.approval_status === filterStatus)

  return (
    <div className="decision-view">
      <div className="decision-hero">
        <div>
          <p className="kicker">ASSURANCE &amp; DECISION REGISTER</p>
          <h2>
            What was reviewed,
            <br />
            <em>decided, and monitored?</em>
          </h2>
          <p>
            A demonstrative decision register for the competition prototype. In operational deployment this would be
            persistent, permission-controlled, versioned, and auditable.
          </p>
          <div className="policy-disclaimer">
            <AlertTriangle size={14} />
            <span>
              These are example decision records created for demonstration. AI-generated content requires human
              review before entering an approved decision record.
            </span>
          </div>
        </div>
        <div className="policy-seal">
          <ClipboardList size={26} />
          <span>
            Decision
            <br />
            <strong>register</strong>
          </span>
        </div>
      </div>

      <div className="decision-controls panel">
        <div className="decision-filters">
          {['all', 'draft', 'reviewed', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              type="button"
              className={filterStatus === s ? 'active' : ''}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? `All (${decisions.length})` : `${STATUS_CFG[s]?.label ?? s} (${decisions.filter((d) => d.approval_status === s).length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            const newDec: Decision = {
              decision_id: `DEC-2026-${String(decisions.length + 1).padStart(3, '0')}`,
              decision_question: 'New decision — edit this field',
              destination: 'Select destination',
              baseline_period: 'Q1 2026',
              options_considered: ['Option 0: Maintain current policy'],
              selected_option: 'To be determined',
              reason_for_selection: 'Evidence review in progress.',
              evidence_references: [],
              evidence_version: 'dashboard_data.json (current)',
              model_version: 'Pressure Index v1.0',
              assumptions: [],
              known_limitations: [],
              budget: 'To be determined',
              responsible_owner: 'To be assigned',
              reviewer: 'To be assigned',
              approval_status: 'draft',
              implementation_dates: { start: '—', end: '—' },
              monitoring_kpis: [],
              outcome_review_date: '—',
              decision_result: null,
              revision_reason: null,
              created_at: new Date().toISOString(),
            }
            setDecisions([newDec, ...decisions])
          }}
        >
          <Plus size={15} /> Add decision
        </button>
      </div>

      <div className="decision-list">
        {filtered.length === 0 && (
          <div className="decision-empty">No decision records match the selected filter.</div>
        )}
        {filtered.map((d) => (
          <DecisionCard key={d.decision_id} decision={d} />
        ))}
      </div>

      <div className="decision-register-note">
        <AlertTriangle size={14} />
        <span>
          For operational deployment: decisions must be stored in a persistent, permission-controlled, versioned
          system with a full audit trail. This prototype stores decisions in-memory only.
        </span>
      </div>
    </div>
  )
}
