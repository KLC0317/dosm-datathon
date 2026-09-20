'use client'

import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../lib/i18n'

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

// The extract stores an ISO-8601 timestamp; showing it raw to a policy
// audience is not a date, it is a machine string.
function formatBuiltAt(value: string, lang: 'en' | 'ms') {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SourceCard({ source, quality }: { source: Source; quality?: QualityCheck }) {
  const { lang } = useLanguage()
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
            <SourceField label={lang === 'ms' ? 'Lesen data' : 'Licence'} value={source.licence} />
            <SourceField label={lang === 'ms' ? 'Tarikh penerbitan' : 'Publication date'} value={source.publication_date} />
            <SourceField label={lang === 'ms' ? 'Tarikh pengekstrakan' : 'Extraction date'} value={source.extraction_date} />
            <SourceField label={lang === 'ms' ? 'Kekerapan kemaskini' : 'Update frequency'} value={source.update_frequency} />
            <SourceField label={lang === 'ms' ? 'Liputan geografi' : 'Geographic coverage'} value={source.geographic_coverage} />
            <SourceField label={lang === 'ms' ? 'Unit ukuran' : 'Unit of measure'} value={source.unit_of_measure} />
            <SourceField label={lang === 'ms' ? 'Status semakan' : 'Revision status'} value={source.revision_status} />
            <SourceField label={lang === 'ms' ? 'Versi saluran paip' : 'Processing version'} value={source.pipeline_version} />
            <SourceField label={lang === 'ms' ? 'Penyelaras' : 'Contact'} value={source.contact} />
          </div>
          <SourceField label={lang === 'ms' ? 'Definisi operasi' : 'How this data defines its terms'} value={source.definitions} wide />
          <SourceField label={lang === 'ms' ? 'Semakan kualiti dikenakan' : 'Quality checks applied'} value={source.quality_checks} wide />
          <SourceField label={lang === 'ms' ? 'Kekangan & jurang diketahui' : 'Known gaps and limitations'} value={source.known_gaps} wide isWarning />
          <a className="source-url-link" href={source.url} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> {lang === 'ms' ? 'Buka sumber rasmi DOSM' : 'Open official source'}
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
  const { lang } = useLanguage()

  return (
    <div className="quality-panel panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{lang === 'ms' ? 'Kualiti data' : 'Data quality'}</span>
          <h2>{lang === 'ms' ? 'Pemeriksaan kesihatan sumber' : 'Source health checks'}</h2>
        </div>
        <span className={`quality-summary-badge ${staleCount > 0 ? 'has-issues' : 'all-ok'}`}>
          {healthyCount} {lang === 'ms' ? 'daripada' : 'of'} {healthyCount + staleCount}{' '}
          {lang === 'ms' ? 'set data terkini' : 'datasets up to date'}
        </span>
      </div>
      <div className="quality-table">
        <div className="quality-thead">
          <span>{lang === 'ms' ? 'Set Data' : 'Dataset'}</span>
          <span>{lang === 'ms' ? 'Medan lengkap' : 'All fields present'}</span>
          <span>{lang === 'ms' ? 'Jenis betul' : 'Correct types'}</span>
          <span>{lang === 'ms' ? 'Jumlah padan' : 'Totals match'}</span>
          <span>{lang === 'ms' ? 'Baris berulang' : 'Duplicate rows'}</span>
          <span>{lang === 'ms' ? 'Terkini' : 'Up to date'}</span>
          <span>{lang === 'ms' ? 'Disemak' : 'Last checked'}</span>
        </div>
        {checks.map((c) => (
          <div key={c.dataset_id} className={`quality-row ${c.stale ? 'stale-row' : ''}`}>
            <span title={c.name}>
              <strong>{c.dataset_id}</strong>
              <small>{c.name}</small>
            </span>
            <span>{c.required_fields_present ? <CheckCircle2 size={14} className="ok" /> : <XCircle size={14} className="fail" />}</span>
            <span>{c.types_valid ? <CheckCircle2 size={14} className="ok" /> : <XCircle size={14} className="fail" />}</span>
            <span>{c.totals_reconciled ? <CheckCircle2 size={14} className="ok" /> : '—'}</span>
            <span>{c.duplicates_detected === 0 ? '0' : <strong className="fail">{c.duplicates_detected}</strong>}</span>
            <span>{c.stale ? <AlertTriangle size={14} className="warn" /> : <CheckCircle2 size={14} className="ok" />}</span>
            <span className="refresh-date">{c.last_successful_refresh}</span>
          </div>
        ))}
      </div>
      <div className="quality-key">
        <span><CheckCircle2 size={13} className="ok" /> {lang === 'ms' ? 'lulus' : 'passed'}</span>
        <span><AlertTriangle size={13} className="warn" /> {lang === 'ms' ? 'perlu perhatian' : 'needs attention'}</span>
        <span>{lang === 'ms' ? '— tidak berkenaan' : '— not applicable'}</span>
      </div>
      {checks.filter((c) => c.stale && c.stale_note).map((c) => (
        <div key={`note-${c.dataset_id}`} className="stale-warning">
          <AlertTriangle size={14} />
          <span><strong>{c.dataset_id}:</strong> {c.stale_note}</span>
        </div>
      ))}
    </div>
  )
}

function DataDictionaryPanel({ entries }: { entries: DictEntry[] }) {
  const { lang, t } = useLanguage()
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
          <span className="eyebrow">{lang === 'ms' ? 'Kamus data' : 'Data dictionary'}</span>
          <h2>{lang === 'ms' ? 'Semua metrik ditakrifkan' : 'All metrics defined'}</h2>
        </div>
        <span className="pill">{entries.length} {lang === 'ms' ? 'metrik' : 'metrics'}</span>
      </div>
      <input
        className="dict-search"
        placeholder={t('dictSearchPlaceholder')}
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
              <span>{lang === 'ms' ? 'Geografi' : 'Geography'}: {entry.geography}</span>
              <span>{lang === 'ms' ? 'Tempoh' : 'Period'}: {entry.period}</span>
              <span>{lang === 'ms' ? 'Sumber' : 'Source'}: {entry.source_id}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="dict-empty">
            {lang === 'ms' ? 'Tiada metrik sepadan dengan carian anda.' : 'No metrics match your search.'}
          </p>
        )}
      </div>
    </div>
  )
}

export function EvidenceMethodView({ sources, dataQuality, dataDictionary, dataAsOf, generatedAt }: Props) {
  const { lang, t } = useLanguage()
  const [subTab, setSubTab] = useState<'sources' | 'quality' | 'dict' | 'formula'>('formula')

  return (
    <div className="method-view">
      <div className="method-hero">
        <div>
          <p className="kicker">{lang === 'ms' ? 'BUKTI & METODOLOGI' : 'EVIDENCE & METHOD'}</p>
          <h2>
            {lang === 'ms' ? 'Setiap isyarat mempunyai' : 'Every signal has a'}
            <br />
            <em>{lang === 'ms' ? 'sumber dan jejak audit.' : 'source and an audit trail.'}</em>
          </h2>
          <p>{t('evidenceDesc')}</p>
          <div className="method-vintage">
            <span>{lang === 'ms' ? 'Data setakat:' : 'Data current as of:'}</span> <strong>{dataAsOf}</strong>
            <span style={{ marginLeft: 16 }}>{lang === 'ms' ? 'Papan pemuka dibina:' : 'Dashboard built:'}</span>{' '}
            <strong>{formatBuiltAt(generatedAt, lang)}</strong>
          </div>
        </div>
        <div className="method-seal">
          <BookOpen size={26} />
          <span>
            {lang === 'ms' ? 'Setiap angka' : 'Every figure'}
            <br />
            <strong>{lang === 'ms' ? 'bersumber' : 'sourced'}</strong>
          </span>
        </div>
      </div>

      <div className="method-subtabs" role="tablist" aria-label="Evidence sections">
        {(['formula', 'sources', 'quality', 'dict'] as const).map((sub) => (
          <button
            key={sub}
            type="button"
            role="tab"
            aria-selected={subTab === sub}
            className={subTab === sub ? 'active' : ''}
            onClick={() => setSubTab(sub)}
          >
            {sub === 'formula'
              ? (lang === 'ms' ? 'Kontrak pemarkahan' : 'How the scores work')
              : sub === 'sources'
              ? (lang === 'ms' ? 'Daftar sumber' : 'Where the data comes from')
              : sub === 'quality'
              ? (lang === 'ms' ? 'Kualiti data' : 'Data quality')
              : (lang === 'ms' ? 'Kamus data' : 'What each term means')}
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
  const { lang } = useLanguage()

  return (
    <div className="method-grid">
      <div className="panel formula-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{lang === 'ms' ? 'Kontrak pemarkahan' : 'Scoring contract'}</span>
            <h2>{lang === 'ms' ? 'Bagaimana isyarat saringan dibina' : 'How the screening signals are built'}</h2>
          </div>
        </div>
        <div className="formula">
          <span>{lang === 'ms' ? 'Indeks Tekanan (0–100)' : 'Pressure Index (0–100)'}</span>
          <strong>
            {lang === 'ms'
              ? '50% ketumpatan pelawat + 30% kadar pertumbuhan + 20% inflasi IHP negeri'
              : '50% visitor density + 30% visitor growth rate + 20% state CPI inflation'}
          </strong>
          <small>
            {lang === 'ms'
              ? 'Setiap input diskalakan semula supaya negeri terendah antara 16 ialah 0 dan tertinggi ialah 100, kemudian ketiga-tiganya digabungkan mengikut pemberat di atas.'
              : 'Each input is rescaled so the lowest of the 16 states is 0 and the highest is 100, then the three are combined using the weights above.'}
          </small>
        </div>
        <div className="formula">
          <span>{lang === 'ms' ? 'Potensi Kemakmuran (0–100)' : 'Prosperity Potential (0–100)'}</span>
          <strong>
            {lang === 'ms'
              ? '35% ketumpatan pelawat + 30% kadar pertumbuhan + 35% bahagian yang bermalam'
              : '35% visitor density + 30% growth rate + 35% share who stay overnight'}
          </strong>
          <small>
            {lang === 'ms'
              ? 'Skor lebih tinggi bermakna lebih banyak ruang untuk menarik pelawat yang bermalam dan berbelanja lebih.'
              : 'Higher means more room to attract visitors who stay overnight and spend more.'}
          </small>
        </div>
        <div className="formula">
          <span>{lang === 'ms' ? 'Unjuran Permintaan' : 'Demand Forecasting'}</span>
          <strong>
            {lang === 'ms'
              ? 'Ensembel: Damped ETS + AutoReg, dipilih mengikut RMSE tahan 4-suku tahun'
              : 'Ensemble: Damped ETS + AutoReg, chosen by 4-quarter holdout RMSE'}
          </strong>
          <small>
            {lang === 'ms'
              ? 'Model naif bermusim dikekalkan sebagai pembanding asas. Selang ramalan: 95%. Secara ringkas: kami mencuba tiga kaedah ramalan standard, menahan empat suku terakhir untuk mengujinya, dan mengekalkan yang paling hampir.'
              : 'Seasonal naïve retained as baseline comparator. Prediction interval: 95%. In plain terms: we tried three standard forecasting methods, held back the last four quarters to test them, and kept the one that came closest.'}
          </small>
        </div>
        <div className="formula">
          <span>{lang === 'ms' ? 'Simulasi Intervensi' : 'Intervention Simulation'}</span>
          <strong>
            {lang === 'ms'
              ? 'Model andaian ringkas — kadar tindak balas tetap yang diterbitkan, dikenakan pada skor'
              : 'A simple what-if model — fixed, published response rates applied to the scores'}
          </strong>
          <small>
            {lang === 'ms'
              ? 'Bukan model kausal. Ia menunjukkan arah dan anggaran kasar sahaja.'
              : 'Not a causal model. It shows direction and rough size only.'}
          </small>
        </div>
        <div className="method-caveat">
          <AlertTriangle size={17} />
          <p>
            {lang === 'ms'
              ? 'Skor ini membandingkan 16 negeri antara satu sama lain. Ia bukan had rasmi, dan ia tidak membuktikan bahawa pelancongan menyebabkan sebarang perubahan ini.'
              : 'These scores compare the 16 states against each other. They are not official limits, and they do not prove that tourism caused any of these changes.'}
          </p>
        </div>
      </div>
      <div className="panel formula-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{lang === 'ms' ? 'Klasifikasi kuadran' : 'Quadrant classification'}</span>
            <h2>{lang === 'ms' ? 'Bagaimana postur diagihkan' : 'How postures are assigned'}</h2>
          </div>
        </div>
        <div className="quadrant-table">
          {[
            { q: lang === 'ms' ? 'Urus pertumbuhan' : 'Manage growth', rule: lang === 'ms' ? 'Tekanan 60 ke atas, manfaat tempatan 40 ke atas' : 'Pressure 60 or more, and local benefit 40 or more', color: '#7c331d' },
            { q: lang === 'ms' ? 'Kembangkan terpilih' : 'Grow selectively', rule: lang === 'ms' ? 'Tekanan bawah 60, manfaat tempatan 40 ke atas' : 'Pressure under 60, and local benefit 40 or more', color: '#17554c' },
            { q: lang === 'ms' ? 'Lindung nilai' : 'Protect value', rule: lang === 'ms' ? 'Tekanan 60 ke atas, manfaat tempatan bawah 40' : 'Pressure 60 or more, and local benefit under 40', color: '#9c6114' },
            { q: lang === 'ms' ? 'Bina kesiapsiagaan' : 'Build readiness', rule: lang === 'ms' ? 'Tekanan bawah 60, manfaat tempatan bawah 40' : 'Pressure under 60, and local benefit under 40', color: '#7a857e' },
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
            {lang === 'ms'
              ? 'Ambang batas kuadran adalah relatif kepada kumpulan 16 negeri semasa. Tiada destinasi harus dilabel selamat atau sesak semata-mata daripada satu skor komposit.'
              : 'Quadrant thresholds are relative to the current set of 16 states. No destination should be labelled solely from a composite score.'}
          </p>
        </div>
      </div>
    </div>
  )
}
