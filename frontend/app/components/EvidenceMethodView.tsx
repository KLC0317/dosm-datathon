'use client'

import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, XCircle } from 'lucide-react'
import { useState } from 'react'

type Source = {
  dataset_id: string
  name: string
  owner: string
  official_status: string
  url: string
  licence: string
  publication_date: string
  extraction_date: string
  reference_period: string
  update_frequency: string
  geographic_coverage: string
  unit_of_measure: string
  definitions: string
  revision_status: string
  pipeline_version: string
  quality_checks: string
  known_gaps: string
  contact: string
}

type QualityCheck = {
  dataset_id: string
  name: string
  required_fields_present: boolean
  types_valid: boolean
  dates_valid: boolean
  duplicates_detected: number
  totals_reconciled: boolean
  out_of_bounds_flagged: number
  missingness_pct: number
  last_successful_refresh: string
  stale: boolean
  stale_note: string | null
  status: string
}

type DictEntry = {
  metric_id: string
  name: string
  definition: string
  unit: string
  geography: string
  period: string
  source_id: string
  data_type: string
}

type Props = {
  sources: Source[]
  dataQuality?: { checks: QualityCheck[]; sources_healthy: number; sources_stale: number }
  dataDictionary?: DictEntry[]
  dataAsOf: string
  generatedAt: string
}

function SourceCard({ source, quality }: { source: Source; quality?: QualityCheck }) {
  const [open, setOpen] = useState(false)
  const isStale = quality?.stale ?? false

  return (
    <div className={`source-card ${isStale ? 'source-stale' : ''}`}>
      <button
        type="button"
        className="source-card-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="source-header-left">
          <span className="source-badge">{source.dataset_id}</span>
          <div>
            <strong>{source.name}</strong>
            <small>{source.owner} · {source.official_status}</small>
          </div>
        </div>
        <div className="source-header-right">
          {quality && (
            <span className={`quality-dot ${quality.status}`} title={`Data quality: ${quality.status}`}>
              {quality.status === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            </span>
          )}
          <span className="source-period">{source.reference_period}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="source-card-body">
          {isStale && quality?.stale_note && (
            <div className="stale-warning">
              <AlertTriangle size={14} />
              <span>{quality.stale_note}</span>
            </div>
          )}
          <div className="source-detail-grid">
            <SourceField label="Licence" value={source.licence} />
            <SourceField label="Publication date" value={source.publication_date} />
            <SourceField label="Extraction date" value={source.extraction_date} />
            <SourceField label="Update frequency" value={source.update_frequency} />
            <SourceField label="Geographic coverage" value={source.geographic_coverage} />
            <SourceField label="Unit of measure" value={source.unit_of_measure} />
            <SourceField label="Revision status" value={source.revision_status} />
            <SourceField label="Pipeline version" value={source.pipeline_version} />
            <SourceField label="Contact" value={source.contact} />
          </div>
          <SourceField label="Definitions" value={source.definitions} wide />
          <SourceField label="Quality checks applied" value={source.quality_checks} wide />
          <SourceField label="Known gaps and limitations" value={source.known_gaps} wide isWarning />
          <a className="source-url-link" href={source.url} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Open official source
          </a>
        </div>
      )}
    </div>
  )
}

function SourceField({
  label,
  value,
  wide = false,
  isWarning = false,
}: {
  label: string
  value: string
  wide?: boolean
  isWarning?: boolean
}) {
  return (
    <div className={`source-detail-field ${wide ? 'wide' : ''} ${isWarning ? 'warning-field' : ''}`}>
      <span className="detail-label">{isWarning && <AlertTriangle size={11} />}{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

function QualityPanel({ checks, healthyCount, staleCount }: { checks: QualityCheck[]; healthyCount: number; staleCount: number }) {
  return (
    <div className="quality-panel panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Data quality</span>
          <h2>Source health checks</h2>
        </div>
        <span className={`quality-summary-badge ${staleCount > 0 ? 'has-issues' : 'all-ok'}`}>
          {healthyCount}/{healthyCount + staleCount} sources healthy
          {staleCount > 0 && ` · ${staleCount} stale`}
        </span>
      </div>
      <div className="quality-table">
        <div className="quality-thead">
          <span>Dataset</span>
          <span>Fields</span>
          <span>Types</span>
          <span>Totals</span>
          <span>Duplicates</span>
          <span>Stale</span>
          <span>Last refresh</span>
        </div>
        {checks.map((c) => (
          <div key={c.dataset_id} className={`quality-row ${c.stale ? 'stale-row' : ''}`}>
            <span title={c.name}>{c.dataset_id}</span>
            <span>{c.required_fields_present ? <CheckCircle2 size={14} className="ok" /> : <XCircle size={14} className="fail" />}</span>
            <span>{c.types_valid ? <CheckCircle2 size={14} className="ok" /> : <XCircle size={14} className="fail" />}</span>
            <span>{c.totals_reconciled ? <CheckCircle2 size={14} className="ok" /> : '—'}</span>
            <span>{c.duplicates_detected === 0 ? '0' : <strong className="fail">{c.duplicates_detected}</strong>}</span>
            <span>{c.stale ? <AlertTriangle size={14} className="warn" /> : <CheckCircle2 size={14} className="ok" />}</span>
            <span className="refresh-date">{c.last_successful_refresh}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataDictionaryPanel({ entries }: { entries: DictEntry[] }) {
  const [search, setSearch] = useState('')
  const filtered = entries.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.definition.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="dict-panel panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Data dictionary</span>
          <h2>All metrics defined</h2>
        </div>
        <span className="pill">{entries.length} metrics</span>
      </div>
      <input
        className="dict-search"
        placeholder="Search metrics…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search data dictionary"
      />
      <div className="dict-list">
        {filtered.map((entry) => (
          <div key={entry.metric_id} className="dict-entry">
            <div className="dict-entry-header">
              <strong>{entry.name}</strong>
              <span className={`dict-type type-${entry.data_type}`}>{entry.data_type}</span>
              <span className="dict-unit">{entry.unit}</span>
            </div>
            <p>{entry.definition}</p>
            <div className="dict-meta">
              <span>Geography: {entry.geography}</span>
              <span>Period: {entry.period}</span>
              <span>Source: {entry.source_id}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="dict-empty">No metrics match your search.</p>}
      </div>
    </div>
  )
}

export function EvidenceMethodView({ sources, dataQuality, dataDictionary, dataAsOf, generatedAt }: Props) {
  const [subTab, setSubTab] = useState<'sources' | 'quality' | 'dict' | 'formula'>('formula')

  return (
    <div className="method-view">
      <div className="method-hero">
        <div>
          <p className="kicker">EVIDENCE &amp; METHOD</p>
          <h2>
            Every signal has a<br />
            <em>source and an audit trail.</em>
          </h2>
          <p>
            Designed for public-sector review: inspect raw inputs, verify transformation logic, and export
            transparent reasoning behind any recommended action.
          </p>
          <div className="method-vintage">
            <span>Data vintage:</span> <strong>{dataAsOf}</strong>
            <span style={{ marginLeft: 16 }}>Generated:</span> <strong>{generatedAt}</strong>
          </div>
        </div>
        <div className="method-seal">
          <BookOpen size={26} />
          <span>
            Source
            <br />
            <strong>audited</strong>
          </span>
        </div>
      </div>

      <div className="method-subtabs" role="tablist" aria-label="Evidence sections">
        {(['formula', 'sources', 'quality', 'dict'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={subTab === t}
            className={subTab === t ? 'active' : ''}
            onClick={() => setSubTab(t)}
          >
            {t === 'formula' ? 'Scoring contract' : t === 'sources' ? 'Source register' : t === 'quality' ? 'Data quality' : 'Data dictionary'}
          </button>
        ))}
      </div>

      {subTab === 'formula' && <FormulaPanel />}
      {subTab === 'sources' && (
        <div className="source-list">
          {sources.map((src) => {
            const q = dataQuality?.checks.find((c) => c.dataset_id === src.dataset_id)
            return <SourceCard key={src.dataset_id} source={src} quality={q} />
          })}
        </div>
      )}
      {subTab === 'quality' && dataQuality && (
        <QualityPanel checks={dataQuality.checks} healthyCount={dataQuality.sources_healthy} staleCount={dataQuality.sources_stale} />
      )}
      {subTab === 'dict' && dataDictionary && <DataDictionaryPanel entries={dataDictionary} />}
    </div>
  )
}

function FormulaPanel() {
  return (
    <div className="method-grid">
      <div className="panel formula-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Scoring contract</span>
            <h2>How the screening signals are built</h2>
          </div>
        </div>
        <div className="formula">
          <span>Pressure Index (0–100)</span>
          <strong>50% visitor density + 30% visitor growth velocity + 20% state CPI inflation</strong>
          <small>All inputs min-max normalised across 16 states. Higher = greater demand pressure against local capacity.</small>
        </div>
        <div className="formula">
          <span>Prosperity Potential (0–100)</span>
          <strong>35% visitor density + 30% growth velocity + 35% overnight tourist mix</strong>
          <small>Higher = greater opportunity for high-value overnight tourism capture.</small>
        </div>
        <div className="formula">
          <span>Demand Forecasting</span>
          <strong>Ensemble: Damped ETS + AutoReg, chosen by 4-quarter holdout RMSE</strong>
          <small>Seasonal naïve retained as baseline comparator. Prediction interval: 95%.</small>
        </div>
        <div className="formula">
          <span>Intervention Simulation</span>
          <strong>Directional scenario model — transparent elasticities applied to index scores</strong>
          <small>Not a causal econometric model. Labelled as a directional scenario estimate.</small>
        </div>
        <div className="method-caveat">
          <AlertTriangle size={17} />
          <p>
            Relative screening indices only. A high score is an evidence-backed reason to investigate and
            safeguard, not an official carrying-capacity barrier or a causal impact estimate.
          </p>
        </div>
        <div className="method-caveat" style={{ borderColor: '#7c331d' }}>
          <AlertTriangle size={17} />
          <p>
            A demand forecast estimates future visitor demand. It does not estimate the causal effect of a policy
            intervention.
          </p>
        </div>
      </div>
      <div className="panel formula-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Quadrant classification</span>
            <h2>How postures are assigned</h2>
          </div>
        </div>
        <div className="quadrant-table">
          {[
            { q: 'Manage growth', rule: 'Pressure ≥ 60 AND Prosperity ≥ 40', color: '#7c331d' },
            { q: 'Grow selectively', rule: 'Pressure < 60 AND Prosperity ≥ 40', color: '#17554c' },
            { q: 'Protect value', rule: 'Pressure ≥ 60 AND Prosperity < 40', color: '#9c6114' },
            { q: 'Build readiness', rule: 'Pressure < 60 AND Prosperity < 40', color: '#7a857e' },
          ].map((row) => (
            <div key={row.q} className="quadrant-row">
              <span className="quadrant-dot" style={{ background: row.color }} />
              <strong>{row.q}</strong>
              <span>{row.rule}</span>
            </div>
          ))}
        </div>
        <div className="method-caveat">
          <AlertTriangle size={17} />
          <p>
            Quadrant thresholds are relative to the current set of 16 states. No destination should be labelled
            "safe," "high potential," or "overloaded" solely from a composite score.
          </p>
        </div>
      </div>
    </div>
  )
}
