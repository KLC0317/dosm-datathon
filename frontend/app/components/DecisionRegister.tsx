'use client'

import { AlertTriangle, BadgeCheck, ChevronDown, ChevronRight, ChevronUp, ClipboardList, Clock, FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../lib/i18n'

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

const STATUS_ICONS: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: '#7a857e', icon: <FileText size={13} /> },
  reviewed: { color: '#9c6114', icon: <ClipboardList size={13} /> },
  approved: { color: '#17554c', icon: <BadgeCheck size={13} /> },
  rejected: { color: '#7c331d', icon: <AlertTriangle size={13} /> },
  superseded: { color: '#7a857e', icon: <AlertTriangle size={13} /> },
}

function DecisionCard({ decision }: { decision: Decision }) {
  const { lang, translateStatus } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_ICONS[decision.approval_status] ?? STATUS_ICONS.draft

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
            {cfg.icon} {translateStatus(decision.approval_status)}
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
            <DecField label={lang === 'ms' ? 'Destinasi' : 'Destination'} value={decision.destination} />
            <DecField label={lang === 'ms' ? 'Data digunakan' : 'Data used'} value={decision.baseline_period} />
            <DecField label={lang === 'ms' ? 'Pegawai bertanggungjawab' : 'Responsible owner'} value={decision.responsible_owner} />
            <DecField label={lang === 'ms' ? 'Penyemak' : 'Reviewer'} value={decision.reviewer} />
            <DecField label={lang === 'ms' ? 'Peruntukan' : 'Budget'} value={decision.budget} />
            <DecField label={lang === 'ms' ? 'Tarikh semakan hasil' : 'When we check the result'} value={decision.outcome_review_date} />
            <DecField label={lang === 'ms' ? 'Tangkapan data' : 'Data snapshot'} value={decision.evidence_version} />
            <DecField label={lang === 'ms' ? 'Versi pemarkahan' : 'Scoring version'} value={decision.model_version} />
            <DecField label={lang === 'ms' ? 'Pelaksanaan' : 'Implementation'} value={`${decision.implementation_dates.start} → ${decision.implementation_dates.end}`} />
          </div>

          <DecSection label={lang === 'ms' ? 'Pilihan terpilih' : 'Selected option'} value={decision.selected_option} />
          <DecSection label={lang === 'ms' ? 'Rasional pemilihan' : 'Reason for selection'} value={decision.reason_for_selection} />

          <div className="decision-list-section">
            <span className="dec-label">{lang === 'ms' ? 'Apa lagi yang kami pertimbangkan' : 'What else we considered'}</span>
            <ul>{decision.options_considered.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">{lang === 'ms' ? 'Rujukan bukti' : 'Evidence references'}</span>
            <ul>{decision.evidence_references.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">{lang === 'ms' ? 'Andaian diguna pakai' : 'Assumptions'}</span>
            <ul>{decision.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>

          <div className="decision-list-section warning-list">
            <span className="dec-label"><AlertTriangle size={13} /> {lang === 'ms' ? 'Apa yang ini tidak memberitahu kita' : 'What this does not tell us'}</span>
            <ul>{decision.known_limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>

          <div className="decision-list-section">
            <span className="dec-label">{lang === 'ms' ? 'KPI pemantauan' : 'Monitoring KPIs'}</span>
            <ul>{decision.monitoring_kpis.map((k, i) => <li key={i}>{k}</li>)}</ul>
          </div>

          {decision.decision_result && <DecSection label={lang === 'ms' ? 'Hasil keputusan' : 'Decision result'} value={decision.decision_result} />}
          {decision.revision_reason && <DecSection label={lang === 'ms' ? 'Sebab semakan semula' : 'Revision reason'} value={decision.revision_reason} isWarning />}

          <div className="decision-footer">
            <span className="dec-label">{lang === 'ms' ? 'Status kelulusan' : 'Approval status'}</span>
            <div className="status-stepper">
              {(['draft', 'reviewed', 'approved'] as const).map((s, i) => {
                // indexOf returns -1 for 'rejected' and 'superseded', which lit no
                // step at all while still drawing the full approval chain.
                const position = ['draft', 'reviewed', 'approved'].indexOf(decision.approval_status)
                const reached = position >= 0 ? position >= i : i === 0
                return (
                  <div key={s} className={`stepper-step ${reached ? 'reached' : ''}`}>
                    <div className="stepper-dot" />
                    <span>{translateStatus(s)}</span>
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
  const { lang, translateStatus } = useLanguage()
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = filterStatus === 'all' ? decisions : decisions.filter((d) => d.approval_status === filterStatus)

  return (
    <div className="decision-view">
      <div className="decision-hero">
        <div>
          <p className="kicker">{lang === 'ms' ? 'REKOD KEPUTUSAN' : 'DECISION RECORD'}</p>
          <h2>
            {lang === 'ms' ? 'Perkara yang disemak,' : 'What was reviewed,'}
            <br />
            <em>{lang === 'ms' ? 'diputuskan, dan dipantau?' : 'decided, and monitored?'}</em>
          </h2>
          <p>
            {lang === 'ms'
              ? 'Contoh bagaimana keputusan akan direkodkan. Dalam pelaksanaan sebenar, rekod ini akan disimpan secara kekal, dikawal capaian, dijejak versi dan boleh diaudit sepenuhnya.'
              : 'A worked example of how decisions would be recorded. In a real deployment these would be saved permanently, access-controlled, version-tracked and fully auditable.'}
          </p>
          <div className="policy-disclaimer">
            <AlertTriangle size={14} />
            <span>
              {lang === 'ms'
                ? 'Ini adalah rekod keputusan contoh bagi tujuan demonstrasi. Sebarang cadangan janaan AI memerlukan semakan pegawai manusia sebelum direkodkan sebagai keputusan rasmi.'
                : 'These are example decision records created for demonstration. AI-generated content requires human review before entering an approved decision record.'}
            </span>
          </div>
        </div>
        <div className="policy-seal">
          <ClipboardList size={26} />
          <span>
            {lang === 'ms' ? 'Daftar' : 'Decision'}
            <br />
            <strong>{lang === 'ms' ? 'keputusan' : 'register'}</strong>
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
              {s === 'all'
                ? `${lang === 'ms' ? 'Semua' : 'All'} (${decisions.length})`
                : `${translateStatus(s)} (${decisions.filter((d) => d.approval_status === s).length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="outline-button"
          onClick={() => {
            const newDec: Decision = {
              decision_id: `DEC-2026-${String(decisions.length + 1).padStart(3, '0')}`,
              decision_question: lang === 'ms' ? 'Keputusan baru, sila sunting ruangan ini' : 'New decision, edit this field',
              destination: lang === 'ms' ? 'Pilih destinasi' : 'Select destination',
              baseline_period: 'Q1 2026',
              options_considered: [lang === 'ms' ? 'Pilihan 0: Kekalkan dasar sedia ada' : 'Option 0: Maintain current policy'],
              selected_option: lang === 'ms' ? 'Untuk ditentukan' : 'To be determined',
              reason_for_selection: lang === 'ms' ? 'Semakan bukti sedang berjalan.' : 'Evidence review in progress.',
              evidence_references: [],
              evidence_version: 'dashboard_data.json (current)',
              model_version: 'Pressure Index v1.0',
              assumptions: [],
              known_limitations: [],
              budget: lang === 'ms' ? 'Untuk ditentukan' : 'To be determined',
              responsible_owner: lang === 'ms' ? 'Untuk diagihkan' : 'To be assigned',
              reviewer: lang === 'ms' ? 'Untuk diagihkan' : 'To be assigned',
              approval_status: 'draft',
              implementation_dates: { start: 'TBD', end: 'TBD' },
              monitoring_kpis: [],
              outcome_review_date: lang === 'ms' ? 'Untuk ditentukan' : 'To be determined',
              decision_result: null,
              revision_reason: null,
              created_at: new Date().toISOString(),
            }
            setDecisions([newDec, ...decisions])
          }}
        >
          <Plus size={15} /> {lang === 'ms' ? 'Tambah keputusan' : 'Add decision'}
        </button>
      </div>

      <div className="decision-list">
        {filtered.length === 0 && (
          <div className="decision-empty">
            {lang === 'ms'
              ? 'Tiada rekod keputusan sepadan dengan tapisan yang dipilih.'
              : 'No decision records match the selected filter.'}
          </div>
        )}
        {filtered.map((d) => (
          <DecisionCard key={d.decision_id} decision={d} />
        ))}
      </div>

      <div className="decision-register-note">
        <AlertTriangle size={14} />
        <span>
          {lang === 'ms'
            ? 'Untuk pelaksanaan sebenar, keputusan perlu disimpan secara kekal, dikawal capaian dan dijejak versi, dengan jejak audit penuh. Prototaip ini hanya menyimpannya sehingga anda memuat semula halaman.'
            : 'For a real deployment, decisions would need to be stored permanently, access-controlled and version-tracked, with a full audit trail. This prototype keeps them only until you refresh the page.'}
        </span>
      </div>
    </div>
  )
}
