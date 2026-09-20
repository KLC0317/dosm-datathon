'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  Gauge,
  Info,
  Layers3,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Waypoints,
} from 'lucide-react'
import { Annotation, ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { VegaEmbed } from 'react-vega'
import { AlertPanel } from './components/AlertPanel'
import { DataStatusBadge } from './components/DataStatusBadge'
import type { Decision } from './components/DecisionRegister'
import { DecisionRegister } from './components/DecisionRegister'
import { EvidenceMethodView } from './components/EvidenceMethodView'
import { PolicyOptionsView } from './components/PolicyOptionsView'
import { ScoreDecomposition } from './components/ScoreDecomposition'
import { LanguageProvider, useLanguage } from './lib/i18n'

type ScoreInput = {
  input: string; raw: number; raw_unit: string; normalised: number
  weight: number; contribution: number; source: string; period: string
}
type ScoreDecompData = { inputs: ScoreInput[]; total: number; stored_score: number }
type StateRecord = {
  state: string
  population_million: number
  visitors_2024_million: number
  visitors_2025_million: number
  tourists_2025_million: number
  visitor_growth_yoy: number
  tourist_mix_pct: number
  visitors_per_100_residents: number
  cpi_yoy: number
  cpi_date: string
  pressure_score: number
  prosperity_score: number
  quadrant: string
  action: string
  action_detail: string
  confidence: string
  score_decomposition?: { pressure: ScoreDecompData; prosperity: ScoreDecompData; sensitive_to_weights: boolean }
  data_status?: Record<string, string>
}

type DashboardData = {
  generated_at: string
  data_as_of: string
  national: {
    visitors_2025_million: number
    visitors_growth_yoy: number
    expenditure_2025_billion: number
    expenditure_growth_yoy: number
    average_length_of_stay: number
    tourists_2025_million: number
  }
  latest_quarter?: {
    quarter: string
    visitors_million: number
    visitor_yoy: number
    expenditure_billion: number
    expenditure_yoy: number
  }
  quarterly_history?: { period: string; visitors_million: number; expenditure_billion: number }[]
  forecast?: {
    status: string
    selected_model: string
    training_cutoff?: string
    interval_level?: string
    interval_coverage_pct?: number
    interval_coverage_note?: string
    forecast_limitation?: string
    seasonal_baseline?: { period: string; naive_million: number | null }[]
    horizon: { period: string; forecast_million: number; lower_million: number; upper_million: number }[]
    backtest: { selected_model: string; candidates: Record<string, { mae: number; rmse: number }> }
    explainability: { driver: string; direction: string; contribution: number; detail: string }[]
  }
  environment?: {
    source: string
    stress_score: number
    scope_note?: string
    latest: Record<string, { rolling_12m_mean: number; stress_score: number }>
  }
  sources: { dataset_id?: string; name: string; url: string; owner?: string; official_status?: string; licence?: string; publication_date?: string; extraction_date?: string; reference_period?: string; update_frequency?: string; geographic_coverage?: string; unit_of_measure?: string; definitions?: string; revision_status?: string; pipeline_version?: string; quality_checks?: string; known_gaps?: string; contact?: string }[]
  states: StateRecord[]
  policy_templates?: Record<string, object[]>
  alerts?: { alert_id: string; type: string; severity: string; state: string; metric: string; value: number | string; threshold: number | string; message: string; recommended_action: string; source: string }[]
  decision_register?: Decision[]
  data_quality?: { checks: object[]; sources_healthy: number; sources_stale: number }
  data_dictionary?: object[]
}

type Scenario = {
  assumptions: { note: string }
  before_high_pressure: number
  after_high_pressure: number
  estimated_pressure_reduction: number
  estimated_value_lift: number
  states: {
    state: string
    pressure_before: number
    pressure_after: number
    prosperity_before: number
    prosperity_after: number
    pressure_delta: number
    value_delta: number
  }[]
}

const FALLBACK: DashboardData = {
  generated_at: '',
  data_as_of: '',
  sources: [],
  national: {
    visitors_2025_million: 290.1,
    visitors_growth_yoy: 11.5,
    expenditure_2025_billion: 121.3,
    expenditure_growth_yoy: 13.6,
    average_length_of_stay: 2.56,
    tourists_2025_million: 106.5,
  },
  latest_quarter: {
    quarter: 'Q1 2026',
    visitors_million: 74.7,
    visitor_yoy: 7.2,
    expenditure_billion: 34,
    expenditure_yoy: 15.8,
  },
  states: [],
}

// Palette mirrors app/globals.css: teal (supply/good), ochre (accent/watch),
// rust (warning/high). Kept in JS too because Vega-Lite specs and inline SVG
// markers can't read CSS custom properties.
const colors = {
  teal: '#17554c',
  tealDeep: '#0f3f39',
  tealLight: '#33887c',
  ochre: '#9c6114',
  ochreDeep: '#84520f',
  ochreLight: '#b9821f',
  rust: '#7c331d',
  rustLight: '#96432a',
  slate: '#7a857e',
  ink: '#161f1b',
  inkSoft: '#333e38',
  muted: '#57625b',
  paper: '#f5f4ef',
  card: '#fbfaf6',
  rule: '#d9ded6',
  // legacy tone names kept so tone="lime" etc. call sites still resolve
  emerald: '#17554c',
  lime: '#9c6114',
  mint: '#17554c',
  amber: '#9c6114',
  coral: '#7c331d',
  gold: '#b9821f',
  sky: '#33887c',
}

function formatM(value: number) {
  return `${value.toFixed(1)}m`
}
function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}
function scoreColor(value: number) {
  return value >= 75 ? colors.rust : value >= 55 ? colors.ochre : colors.teal
}
function quadrantClass(value: string) {
  return value.toLowerCase().replaceAll(' ', '-')
}

const GEO_NAME_MAP: Record<string, string> = {
  'WP K Lumpur': 'Kuala Lumpur',
  'W.P. Kuala Lumpur': 'Kuala Lumpur',
  'WP Putrajaya': 'Putrajaya',
  'W.P. Putrajaya': 'Putrajaya',
  'WP Labuan': 'Labuan',
  'W.P. Labuan': 'Labuan',
  'Pulau Pinang': 'Pulau Pinang',
}

function normalizeGeoName(geoName: string): string {
  return GEO_NAME_MAP[geoName] || geoName
}

const STATE_META: Record<
  string,
  {
    code: string
    shortName: string
    region: string
    centroid: [number, number]
    isEast?: boolean
    callout?: { dx: number; dy: number }
  }
> = {
  Perlis: { code: 'PLS', shortName: 'Perlis', region: 'Northern', centroid: [100.235, 6.556] },
  Kedah: { code: 'KDH', shortName: 'Kedah', region: 'Northern', centroid: [100.6, 6.0] },
  'Pulau Pinang': {
    code: 'PNG',
    shortName: 'Penang',
    region: 'Northern',
    centroid: [100.321, 5.377],
    callout: { dx: -78, dy: -14 },
  },
  Perak: { code: 'PRK', shortName: 'Perak', region: 'Northern', centroid: [101.128, 4.718] },
  Kelantan: { code: 'KTN', shortName: 'Kelantan', region: 'East Coast', centroid: [101.971, 5.240] },
  Terengganu: { code: 'TRG', shortName: 'Terengganu', region: 'East Coast', centroid: [102.916, 5.001] },
  Pahang: { code: 'PHG', shortName: 'Pahang', region: 'East Coast', centroid: [102.639, 3.879] },
  Selangor: { code: 'SGR', shortName: 'Selangor', region: 'Central', centroid: [101.75, 3.60] },
  'Kuala Lumpur': {
    code: 'KUL',
    shortName: 'K. Lumpur',
    region: 'Federal Terr.',
    centroid: [101.699, 3.144],
    callout: { dx: -105, dy: -24 },
  },
  Putrajaya: {
    code: 'PJY',
    shortName: 'Putrajaya',
    region: 'Federal Terr.',
    centroid: [101.687, 2.930],
    callout: { dx: -105, dy: 24 },
  },
  'Negeri Sembilan': { code: 'NSN', shortName: 'N. Sembilan', region: 'Central', centroid: [102.134, 2.745] },
  Melaka: { code: 'MLK', shortName: 'Melaka', region: 'Southern', centroid: [102.315, 2.243] },
  Johor: { code: 'JHR', shortName: 'Johor', region: 'Southern', centroid: [103.45, 1.95] },
  Labuan: {
    code: 'LBN',
    shortName: 'Labuan',
    region: 'Federal Terr.',
    centroid: [115.214, 5.275],
    isEast: true,
    callout: { dx: -55, dy: -28 },
  },
  Sabah: { code: 'SBH', shortName: 'Sabah', region: 'Borneo', centroid: [117.479, 5.573], isEast: true },
  Sarawak: { code: 'SWK', shortName: 'Sarawak', region: 'Borneo', centroid: [113.085, 2.630], isEast: true },
}

const WEST_STATES = [
  'Perlis',
  'Kedah',
  'Pulau Pinang',
  'Perak',
  'Kelantan',
  'Terengganu',
  'Pahang',
  'Selangor',
  'Kuala Lumpur',
  'Putrajaya',
  'Negeri Sembilan',
  'Melaka',
  'Johor',
]

const EAST_STATES = ['Sarawak', 'Sabah', 'Labuan']

type LabelNode = {
  name: string
  label: string
  coordinates: [number, number]
  type?: 'text' | 'star' | 'landmark' | 'pin'
  dx?: number
  dy?: number
  textAnchor?: 'start' | 'middle' | 'end'
}

const WEST_LABEL_NODES: LabelNode[] = [
  { name: 'Perlis', label: 'PERLIS', coordinates: [100.246, 6.491] },
  { name: 'Kedah', label: 'KEDAH', coordinates: [100.60, 5.95] },
  {
    name: 'Pulau Pinang',
    label: 'PENANG',
    coordinates: [100.28, 5.38],
    type: 'pin',
    dx: -8,
    dy: 0,
    textAnchor: 'end',
  },
  { name: 'Perak', label: 'PERAK', coordinates: [101.06, 4.75] },
  { name: 'Kelantan', label: 'KELANTAN', coordinates: [102.00, 5.30] },
  { name: 'Terengganu', label: 'TERENGGANU', coordinates: [102.95, 4.90] },
  { name: 'Pahang', label: 'PAHANG', coordinates: [102.60, 3.80] },
  { name: 'Selangor', label: 'SELANGOR', coordinates: [101.35, 3.45] },
  {
    name: 'Kuala Lumpur',
    label: 'KUALA LUMPUR',
    coordinates: [101.686, 3.142],
    type: 'star',
    dx: 12,
    dy: -4,
    textAnchor: 'start',
  },
  {
    name: 'Putrajaya',
    label: 'PUTRAJAYA',
    coordinates: [101.695, 2.930],
    type: 'landmark',
    dx: -12,
    dy: 0,
    textAnchor: 'end',
  },
  { name: 'Negeri Sembilan', label: 'N. SEMBILAN', coordinates: [102.35, 2.78] },
  { name: 'Melaka', label: 'MELAKA', coordinates: [102.25, 2.25] },
  { name: 'Johor', label: 'JOHOR', coordinates: [103.35, 1.95] },
]

const EAST_LABEL_NODES: LabelNode[] = [
  { name: 'Sarawak', label: 'SARAWAK', coordinates: [113.00, 2.80] },
  { name: 'Sabah', label: 'SABAH', coordinates: [117.20, 5.55] },
  {
    name: 'Labuan',
    label: 'LABUAN',
    coordinates: [115.22, 5.29],
    type: 'pin',
    dx: 10,
    dy: 4,
    textAnchor: 'start',
  },
]

type ZoomConfig = {
  center: [number, number]
  scale: number
  isEast?: boolean
  calloutDx?: number
  calloutDy?: number
}

const STATE_ZOOM_CONFIG: Record<string, ZoomConfig> = {
  Perlis: { center: [100.246, 6.491], scale: 18000, calloutDx: 40, calloutDy: -20 },
  Kedah: { center: [100.450, 5.850], scale: 9500, calloutDx: 40, calloutDy: -20 },
  'Pulau Pinang': { center: [100.320, 5.360], scale: 20000, calloutDx: 40, calloutDy: -25 },
  Perak: { center: [101.058, 4.801], scale: 7200, calloutDx: 40, calloutDy: -20 },
  Kelantan: { center: [102.001, 5.350], scale: 8500, calloutDx: 40, calloutDy: -20 },
  Terengganu: { center: [102.936, 4.900], scale: 7800, calloutDx: -40, calloutDy: -20 },
  Pahang: { center: [102.650, 3.650], scale: 5600, calloutDx: 40, calloutDy: -20 },
  Selangor: { center: [101.390, 3.250], scale: 11000, calloutDx: -40, calloutDy: -25 },
  'Kuala Lumpur': { center: [101.686, 3.142], scale: 26000, calloutDx: 40, calloutDy: -25 },
  Putrajaya: { center: [101.695, 2.930], scale: 35000, calloutDx: 40, calloutDy: -25 },
  'Negeri Sembilan': { center: [102.201, 2.800], scale: 12500, calloutDx: 40, calloutDy: -20 },
  Melaka: { center: [102.220, 2.273], scale: 18000, calloutDx: 40, calloutDy: -25 },
  Johor: { center: [103.450, 2.000], scale: 7200, calloutDx: -40, calloutDy: -25 },
  Sarawak: { center: [113.100, 2.750], scale: 3400, isEast: true, calloutDx: 40, calloutDy: -25 },
  Sabah: { center: [117.250, 5.600], scale: 3800, isEast: true, calloutDx: -40, calloutDy: -25 },
  Labuan: { center: [115.226, 5.289], scale: 28000, isEast: true, calloutDx: 40, calloutDy: -25 },
}

function StatCard({
  label,
  value,
  note,
  trend,
  icon,
  tone = 'teal',
}: {
  label: string
  value: string
  note: string
  trend?: string
  icon: React.ReactNode
  tone?: 'teal' | 'emerald' | 'blue' | 'amber' | 'lime' | 'mint' | 'coral' | 'sky'
}) {
  const isPositive = trend?.startsWith('+')
  const isNegative = trend?.startsWith('-')
  const isAlert = !isPositive && !isNegative && Boolean(trend)

  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon-badge">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className="stat-note">{note}</span>
        {trend && (
          <div
            className={`stat-badge ${
              isPositive
                ? 'stat-badge-positive'
                : isNegative
                ? 'stat-badge-negative'
                : isAlert
                ? 'stat-badge-warning'
                : ''
            }`}
          >
            {isPositive && <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />}
            {isNegative && <ArrowDownRight size={13} strokeWidth={2.4} aria-hidden="true" />}
            {isAlert && <span className="stat-badge-dot" aria-hidden="true" />}
            <span>{trend}</span>
            {(isPositive || isNegative) && <span className="stat-badge-sub">YoY</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function MalaysiaMap({
  states,
  selected,
  onSelect,
}: {
  states: StateRecord[]
  selected: string
  onSelect: (state: string) => void
}) {
  const { lang, translateQuadrant, translateAction } = useLanguage()
  const [mapMode, setMapMode] = useState<'geo' | 'grid' | 'klang'>('geo')
  const [hovered, setHovered] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState<boolean>(true)
  const byName = useMemo(() => Object.fromEntries(states.map((state) => [state.state, state])), [states])

  const activeFocus = hovered ? byName[hovered] : byName[selected]

  const isWestSelected = WEST_STATES.includes(selected)
  const isEastSelected = EAST_STATES.includes(selected)

  const westConfig = useMemo(() => {
    if (isZoomed && isWestSelected && STATE_ZOOM_CONFIG[selected]) {
      return {
        center: STATE_ZOOM_CONFIG[selected].center,
        scale: STATE_ZOOM_CONFIG[selected].scale,
      }
    }
    return { center: [102.1, 4.0] as [number, number], scale: 4500 }
  }, [isZoomed, isWestSelected, selected])

  const eastConfig = useMemo(() => {
    if (isZoomed && isEastSelected && STATE_ZOOM_CONFIG[selected]) {
      return {
        center: STATE_ZOOM_CONFIG[selected].center,
        scale: STATE_ZOOM_CONFIG[selected].scale,
      }
    }
    return { center: [114.4, 4.1] as [number, number], scale: 2750 }
  }, [isZoomed, isEastSelected, selected])

  const handleStateClick = (stateName: string) => {
    if (selected === stateName && isZoomed) {
      setIsZoomed(false)
    } else {
      onSelect(stateName)
      setIsZoomed(true)
    }
  }

  const westCallout = useMemo(() => {
    if (!isWestSelected) return null
    const cfg = STATE_ZOOM_CONFIG[selected]
    const rec = byName[selected]
    if (!cfg || !rec) return null
    const isRightSide = cfg.center[0] > 101.9 && !['Kuala Lumpur', 'Putrajaya', 'Pulau Pinang'].includes(selected)
    const dx = isZoomed ? 45 : isRightSide ? -45 : 45
    const dy = -35
    const boxX = dx > 0 ? dx : dx - 184
    const boxY = dy - 26
    return {
      coordinates: cfg.center,
      dx,
      dy,
      boxX,
      boxY,
      record: rec,
    }
  }, [isWestSelected, selected, isZoomed, byName])

  const eastCallout = useMemo(() => {
    if (!isEastSelected) return null
    const cfg = STATE_ZOOM_CONFIG[selected]
    const rec = byName[selected]
    if (!cfg || !rec) return null
    const isRightSide = selected === 'Sabah'
    const dx = isZoomed ? 45 : isRightSide ? -45 : 45
    const dy = -35
    const boxX = dx > 0 ? dx : dx - 184
    const boxY = dy - 26
    return {
      coordinates: cfg.center,
      dx,
      dy,
      boxX,
      boxY,
      record: rec,
    }
  }, [isEastSelected, selected, isZoomed, byName])

  return (
    <div className="map-shell">
      <div className="map-caption">
        <div className="visual-heading">
          <span>
            <MapIcon size={18} /> {lang === 'ms' ? 'Permukaan tekanan nasional' : 'National pressure surface'}
          </span>
          <small>
            {lang === 'ms'
              ? 'Keamatan permintaan, pertumbuhan pelawat dan isyarat IHP merentasi 16 negeri dan wilayah persekutuan Malaysia.'
              : 'Demand intensity, visitor growth and CPI signals across all 16 Malaysian states and federal territories.'}
          </small>
        </div>
        <div className="map-controls">
          <div className="map-view-switcher" role="tablist" aria-label="Map view mode">
            <button
              type="button"
              className={mapMode === 'geo' ? 'active' : ''}
              onClick={() => setMapMode('geo')}
              title={lang === 'ms' ? 'Peta Dwi-Wilayah (Semenanjung & Malaysia Timur) dengan label wilayah jelas' : 'Dual-Region Map (West & East Malaysia) with clear territorial labels'}
            >
              <MapIcon size={14} /> <span>{lang === 'ms' ? 'Peta Wilayah' : 'Regional Map'}</span>
            </button>
            <button
              type="button"
              className={mapMode === 'grid' ? 'active' : ''}
              onClick={() => setMapMode('grid')}
              title={lang === 'ms' ? 'Grid jubin kartogram sama luas bagi semua 16 wilayah' : 'Equal-area cartogram tile grid for all 16 territories'}
            >
              <LayoutGrid size={14} /> <span>{lang === 'ms' ? 'Grid Sama Luas' : 'Equal-Area Grid'}</span>
            </button>
            <button
              type="button"
              className={mapMode === 'klang' ? 'active' : ''}
              onClick={() => setMapMode('klang')}
              title={lang === 'ms' ? 'Fokus tekanan tinggi Lembah Klang & Wilayah Persekutuan' : 'Klang Valley & FTs high-pressure focus'}
            >
              <Target size={14} /> <span>{lang === 'ms' ? 'Episentrum WP' : 'FT Epicenter'}</span>
            </button>
          </div>
          <span className="map-legend">
            <i style={{ background: colors.teal }} /> {lang === 'ms' ? 'seimbang (0–54)' : 'balanced (0–54)'}
            <i style={{ background: colors.ochre }} /> {lang === 'ms' ? 'waspada (55–74)' : 'watch (55–74)'}
            <i style={{ background: colors.rust }} /> {lang === 'ms' ? 'tekanan tinggi (75+)' : 'high pressure (75+)'}
          </span>
        </div>
      </div>

      {mapMode === 'geo' && (
        <div className="dual-region-map-shell">
          <div className="dual-map-banner">
            <div className="banner-title-area">
              <span className="banner-sub">{lang === 'ms' ? 'ATLAS RISIKO & KEMAKMURAN PELANCONGAN' : 'TOURISM RISK & PROSPERITY ATLAS'}</span>
              <h2>MALAYSIA</h2>
            </div>
            <div className="banner-stats">
              {activeFocus ? (
                <div className="banner-status-chip">
                  <span className="focus-flag">MY</span>
                  <strong>{activeFocus.state}</strong>
                  <span className="dot">•</span>
                  <span style={{ color: scoreColor(activeFocus.pressure_score), fontWeight: 700 }}>
                    {activeFocus.pressure_score}/100 {lang === 'ms' ? 'Tekanan' : 'Pressure'}
                  </span>
                  <span className="dot">•</span>
                  <span>{activeFocus.visitors_2025_million.toFixed(1)}{lang === 'ms' ? 'j pelawat' : 'm visitors'}</span>
                  <span className="dot">•</span>
                  <span className={`posture-tag ${quadrantClass(activeFocus.quadrant)}`}>{translateQuadrant(activeFocus.quadrant)}</span>
                </div>
              ) : (
                <div className="banner-status-chip">
                  <span>{lang === 'ms' ? '16 Negeri & Wilayah Persekutuan • Pilih mana-mana wilayah untuk memfokuskan bukti' : '16 States & Federal Territories • Select any territory to focus evidence'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="dual-map-panels">
            {/* WEST MALAYSIA (SEMENANJUNG) */}
            <div className="region-card west-card">
              <div className="region-title-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="region-pill">SEMENANJUNG</span>
                  <h4>{lang === 'ms' ? 'SEMENANJUNG MALAYSIA' : 'WEST MALAYSIA'}</h4>
                  {isWestSelected && isZoomed && (
                    <span className="zoom-tag">{lang === 'ms' ? 'FOKUS' : 'ZOOMED'}: {selected.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isWestSelected && (
                    <button
                      type="button"
                      className={`zoom-pill-btn ${isZoomed ? 'active' : ''}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? (lang === 'ms' ? 'Keluar fokus ke gambaran penuh' : 'Zoom out to overview') : (lang === 'ms' ? `Fokus ke ${selected}` : `Zoom into ${selected}`)}
                    >
                      {isZoomed ? (
                        <>
                          <Minimize2 size={12} /> <span>{lang === 'ms' ? 'Gambaran' : 'Overview'}</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 size={12} /> <span>{lang === 'ms' ? 'Fokus' : 'Zoom in'}</span>
                        </>
                      )}
                    </button>
                  )}
                  <small>{lang === 'ms' ? '11 Negeri • 2 Wilayah Persekutuan' : '11 States • 2 Federal Territories'}</small>
                </div>
              </div>
              <div className="svg-frame">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={westConfig}
                  width={470}
                  height={480}
                  className="region-map-svg"
                >
                  <Geographies geography="/malaysia.state.min.geojson">
                    {({ geographies }) =>
                      geographies
                        .filter((geo) => WEST_STATES.includes(normalizeGeoName(geo.properties.name as string)))
                        .map((geo) => {
                          const geoName = geo.properties.name as string
                          const stateName = normalizeGeoName(geoName)
                          const record = byName[stateName]
                          const active = stateName === selected
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={() => record && handleStateClick(stateName)}
                              onMouseEnter={() => setHovered(stateName)}
                              onMouseLeave={() => setHovered(null)}
                              fill={record ? scoreColor(record.pressure_score) : '#e3e6df'}
                              stroke={active ? colors.ochreLight : '#ffffff'}
                              strokeWidth={active ? 3.5 : 1.2}
                              style={{
                                default: { outline: 'none', opacity: active ? 1 : isZoomed && isWestSelected ? 0.65 : 0.9, transition: 'all .2s' },
                                hover: {
                                  outline: 'none',
                                  opacity: 1,
                                  cursor: record ? 'pointer' : 'default',
                                  filter: 'brightness(1.2)',
                                },
                                pressed: { outline: 'none' },
                              }}
                            />
                          )
                        })
                    }
                  </Geographies>

                  {/* Clean State Labels on Territory */}
                  {WEST_LABEL_NODES.map((item) => {
                    const rec = byName[item.name]
                    const isSel = selected === item.name

                    // When selected, the dynamic line+box callout HUD is shown instead of regular label
                    if (isSel) return null

                    if (item.type === 'star') {
                      // Kuala Lumpur Landmark Star Pin
                      return (
                        <Marker key={item.name} coordinates={item.coordinates}>
                          <g
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStateClick(item.name)}
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={9.5}
                              fill="#ffffff"
                              stroke={colors.ochreDeep}
                              strokeWidth={2}
                              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.85))"
                            />
                            <polygon
                              points="0,-5.5 1.7,-1.7 5.5,-1.7 2.4,0.7 3.5,4.8 0,2.4 -3.5,4.8 -2.4,0.7 -5.5,-1.7 -1.7,-1.7"
                              fill={colors.ochreDeep}
                            />
                            <text
                              x={item.dx ?? 13}
                              y={(item.dy ?? 0) - 2}
                              fill="#ffffff"
                              fontSize={11.5}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'start'}
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                            >
                              KUALA LUMPUR
                            </text>
                            <text
                              x={item.dx ?? 13}
                              y={(item.dy ?? 0) + 11}
                              fill={colors.ochreLight}
                              fontSize={10}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'start'}
                              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                            >
                              ★ {rec?.pressure_score ?? 71} pressure
                            </text>
                          </g>
                        </Marker>
                      )
                    }

                    if (item.type === 'landmark') {
                      // Putrajaya Administrative Pin
                      return (
                        <Marker key={item.name} coordinates={item.coordinates}>
                          <g
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStateClick(item.name)}
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={9}
                              fill={colors.ochreDeep}
                              stroke="#ffffff"
                              strokeWidth={2}
                              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.85))"
                            />
                            <circle cx={0} cy={0} r={3} fill="#ffffff" />
                            <text
                              x={item.dx ?? -12}
                              y={(item.dy ?? 0) - 2}
                              fill="#ffffff"
                              fontSize={11.5}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'end'}
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                            >
                              PUTRAJAYA
                            </text>
                            <text
                              x={item.dx ?? -12}
                              y={(item.dy ?? 0) + 11}
                              fill={colors.ochreLight}
                              fontSize={10}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'end'}
                              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                            >
                              ◆ {rec?.pressure_score ?? 82} pressure
                            </text>
                          </g>
                        </Marker>
                      )
                    }

                    if (item.type === 'pin') {
                      // Penang Island
                      return (
                        <Marker key={item.name} coordinates={item.coordinates}>
                          <g
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStateClick(item.name)}
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={6.5}
                              fill={colors.teal}
                              stroke="#ffffff"
                              strokeWidth={1.8}
                              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.85))"
                            />
                            <text
                              x={item.dx ?? -8}
                              y={(item.dy ?? 0) - 1}
                              fill="#ffffff"
                              fontSize={11.5}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'end'}
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                            >
                              {item.label}
                            </text>
                            <text
                              x={item.dx ?? -8}
                              y={(item.dy ?? 0) + 11}
                              fill={colors.tealLight}
                              fontSize={10}
                              fontWeight={700}
                              textAnchor={item.textAnchor ?? 'end'}
                              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                            >
                              {rec?.pressure_score}
                            </text>
                          </g>
                        </Marker>
                      )
                    }

                    // Standard state label on territory
                    return (
                      <Marker key={item.name} coordinates={item.coordinates}>
                        <g
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleStateClick(item.name)}
                          onMouseEnter={() => setHovered(item.name)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <text
                            textAnchor="middle"
                            y={-2}
                            fill="#ffffff"
                            fontSize={12}
                            fontWeight={800}
                            letterSpacing="0.03em"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                          >
                            {item.label}
                          </text>
                          <text
                            textAnchor="middle"
                            y={12}
                            fill="#eaece8"
                            fontSize={11}
                            fontWeight={800}
                            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                          >
                            {rec?.pressure_score}
                          </text>
                        </g>
                      </Marker>
                    )
                  })}

                  {/* DYNAMIC LINE + BOX CALLOUT HUD ON SELECTED STATE */}
                  {isWestSelected && westCallout && (
                    <Marker coordinates={westCallout.coordinates}>
                      <g
                        className="selected-hud-group"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsZoomed(!isZoomed)}
                      >
                        <circle cx={0} cy={0} r={5.5} fill={colors.ochreLight} stroke="#ffffff" strokeWidth={2} />
                        <circle cx={0} cy={0} r={13} fill="none" stroke={colors.ochreLight} strokeWidth={1.5} opacity={0.65} />
                        <polyline
                          points={`0,0 ${westCallout.dx > 0 ? 25 : -25},${westCallout.dy} ${westCallout.dx},${westCallout.dy}`}
                          fill="none"
                          stroke={colors.ochreLight}
                          strokeWidth={1.8}
                          strokeDasharray="4 2"
                        />
                        <g transform={`translate(${westCallout.boxX}, ${westCallout.boxY})`}>
                          <rect
                            width={184}
                            height={52}
                            rx={8}
                            fill="rgba(251, 250, 246, 0.97)"
                            stroke={colors.ochreLight}
                            strokeWidth={1.8}
                            filter="drop-shadow(0 4px 16px rgba(22,31,27,0.28))"
                          />
                          <text x={12} y={18} fill={colors.ink} fontSize={12} fontWeight={800} letterSpacing="0.04em">
                            {westCallout.record.state.toUpperCase()}
                          </text>
                          <text
                            x={12}
                            y={33}
                            fill={scoreColor(westCallout.record.pressure_score)}
                            fontSize={10.5}
                            fontWeight={800}
                          >
                            ● {westCallout.record.pressure_score}/100 {lang === 'ms' ? 'Tekanan' : 'Pressure'} ({translateQuadrant(westCallout.record.quadrant)})
                          </text>
                          <text x={12} y={46} fill={colors.muted} fontSize={9.5} fontWeight={600}>
                            {westCallout.record.visitors_2025_million.toFixed(1)}{lang === 'ms' ? 'j pelawat' : 'm visitors'} • {isZoomed ? (lang === 'ms' ? 'Klik untuk keluar fokus' : 'Click to zoom out') : (lang === 'ms' ? 'Klik untuk fokus' : 'Click to zoom in')}
                          </text>
                        </g>
                      </g>
                    </Marker>
                  )}
                </ComposableMap>
              </div>
            </div>

            {/* EAST MALAYSIA (BORNEO) */}
            <div className="region-card east-card">
              <div className="region-title-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="region-pill">BORNEO</span>
                  <h4>{lang === 'ms' ? 'MALAYSIA TIMUR' : 'EAST MALAYSIA'}</h4>
                  {isEastSelected && isZoomed && (
                    <span className="zoom-tag">{lang === 'ms' ? 'FOKUS' : 'ZOOMED'}: {selected.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isEastSelected && (
                    <button
                      type="button"
                      className={`zoom-pill-btn ${isZoomed ? 'active' : ''}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? (lang === 'ms' ? 'Keluar fokus ke gambaran penuh' : 'Zoom out to overview') : (lang === 'ms' ? `Fokus ke ${selected}` : `Zoom into ${selected}`)}
                    >
                      {isZoomed ? (
                        <>
                          <Minimize2 size={12} /> <span>{lang === 'ms' ? 'Gambaran' : 'Overview'}</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 size={12} /> <span>{lang === 'ms' ? 'Fokus' : 'Zoom in'}</span>
                        </>
                      )}
                    </button>
                  )}
                  <small>{lang === 'ms' ? '2 Negeri • 1 Wilayah Persekutuan' : '2 States • 1 Federal Territory'}</small>
                </div>
              </div>
              <div className="svg-frame">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={eastConfig}
                  width={500}
                  height={480}
                  className="region-map-svg"
                >
                  <Geographies geography="/malaysia.state.min.geojson">
                    {({ geographies }) =>
                      geographies
                        .filter((geo) => EAST_STATES.includes(normalizeGeoName(geo.properties.name as string)))
                        .map((geo) => {
                          const geoName = geo.properties.name as string
                          const stateName = normalizeGeoName(geoName)
                          const record = byName[stateName]
                          const active = stateName === selected
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={() => record && handleStateClick(stateName)}
                              onMouseEnter={() => setHovered(stateName)}
                              onMouseLeave={() => setHovered(null)}
                              fill={record ? scoreColor(record.pressure_score) : '#e3e6df'}
                              stroke={active ? colors.ochreLight : '#ffffff'}
                              strokeWidth={active ? 3.5 : 1.2}
                              style={{
                                default: { outline: 'none', opacity: active ? 1 : isZoomed && isEastSelected ? 0.65 : 0.9, transition: 'all .2s' },
                                hover: {
                                  outline: 'none',
                                  opacity: 1,
                                  cursor: record ? 'pointer' : 'default',
                                  filter: 'brightness(1.2)',
                                },
                                pressed: { outline: 'none' },
                              }}
                            />
                          )
                        })
                    }
                  </Geographies>

                  {/* Clean State Labels for East Malaysia */}
                  {EAST_LABEL_NODES.map((item) => {
                    const rec = byName[item.name]
                    const isSel = selected === item.name

                    // When selected, the dynamic line+box callout HUD is shown instead of regular label
                    if (isSel) return null

                    if (item.type === 'pin') {
                      // Labuan
                      return (
                        <Marker key={item.name} coordinates={item.coordinates}>
                          <g
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStateClick(item.name)}
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={6.5}
                              fill={colors.ochreDeep}
                              stroke="#ffffff"
                              strokeWidth={1.8}
                              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.85))"
                            />
                            <text
                              x={item.dx ?? 10}
                              y={(item.dy ?? 0) - 2}
                              fill="#ffffff"
                              fontSize={11.5}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'start'}
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                            >
                              LABUAN
                            </text>
                            <text
                              x={item.dx ?? 10}
                              y={(item.dy ?? 0) + 11}
                              fill={colors.ochreLight}
                              fontSize={10.5}
                              fontWeight={800}
                              textAnchor={item.textAnchor ?? 'start'}
                              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                            >
                              {rec?.pressure_score ?? 50}
                            </text>
                          </g>
                        </Marker>
                      )
                    }

                    return (
                      <Marker key={item.name} coordinates={item.coordinates}>
                        <g
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleStateClick(item.name)}
                          onMouseEnter={() => setHovered(item.name)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <text
                            textAnchor="middle"
                            y={-2}
                            fill="#ffffff"
                            fontSize={14}
                            fontWeight={800}
                            letterSpacing="0.04em"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                          >
                            {item.label}
                          </text>
                          <text
                            textAnchor="middle"
                            y={14}
                            fill="#eaece8"
                            fontSize={12}
                            fontWeight={800}
                            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}
                          >
                            {rec?.pressure_score}
                          </text>
                        </g>
                      </Marker>
                    )
                  })}

                  {/* DYNAMIC LINE + BOX CALLOUT HUD ON SELECTED STATE */}
                  {isEastSelected && eastCallout && (
                    <Marker coordinates={eastCallout.coordinates}>
                      <g
                        className="selected-hud-group"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsZoomed(!isZoomed)}
                      >
                        <circle cx={0} cy={0} r={5.5} fill={colors.ochreLight} stroke="#ffffff" strokeWidth={2} />
                        <circle cx={0} cy={0} r={13} fill="none" stroke={colors.ochreLight} strokeWidth={1.5} opacity={0.65} />
                        <polyline
                          points={`0,0 ${eastCallout.dx > 0 ? 25 : -25},${eastCallout.dy} ${eastCallout.dx},${eastCallout.dy}`}
                          fill="none"
                          stroke={colors.ochreLight}
                          strokeWidth={1.8}
                          strokeDasharray="4 2"
                        />
                        <g transform={`translate(${eastCallout.boxX}, ${eastCallout.boxY})`}>
                          <rect
                            width={184}
                            height={52}
                            rx={8}
                            fill="rgba(251, 250, 246, 0.97)"
                            stroke={colors.ochreLight}
                            strokeWidth={1.8}
                            filter="drop-shadow(0 4px 16px rgba(22,31,27,0.28))"
                          />
                          <text x={12} y={18} fill={colors.ink} fontSize={12} fontWeight={800} letterSpacing="0.04em">
                            {eastCallout.record.state.toUpperCase()}
                          </text>
                          <text
                            x={12}
                            y={33}
                            fill={scoreColor(eastCallout.record.pressure_score)}
                            fontSize={10.5}
                            fontWeight={800}
                          >
                            ● {eastCallout.record.pressure_score}/100 {lang === 'ms' ? 'Tekanan' : 'Pressure'} ({translateQuadrant(eastCallout.record.quadrant)})
                          </text>
                          <text x={12} y={46} fill={colors.muted} fontSize={9.5} fontWeight={600}>
                            {eastCallout.record.visitors_2025_million.toFixed(1)}{lang === 'ms' ? 'j pelawat' : 'm visitors'} • {isZoomed ? (lang === 'ms' ? 'Klik untuk keluar fokus' : 'Click to zoom out') : (lang === 'ms' ? 'Klik untuk fokus' : 'Click to zoom in')}
                          </text>
                        </g>
                      </g>
                    </Marker>
                  )}
                </ComposableMap>
              </div>
            </div>
          </div>
        </div>
      )}

      {mapMode === 'grid' && (
        <div className="cartogram-shell">
          <div className="cartogram-intro">
            <div>
              <strong>{lang === 'ms' ? 'Grid Kartogram Sama Luas (16 Wilayah)' : 'Equal-Area Cartogram Grid (16 Territories)'}</strong>
              <p>
                {lang === 'ms'
                  ? 'Setiap negeri dan wilayah persekutuan mempunyai keutamaan visual yang seimbang, memastikan episentrum bandar padat seperti Putrajaya dan Kuala Lumpur tidak terlindung secara geografi.'
                  : 'Every state and federal territory has equal visual prominence, ensuring compact urban epicenters like Putrajaya and Kuala Lumpur are not geographically eclipsed.'}
              </p>
            </div>
          </div>
          <div className="cartogram-grid">
            {states.map((st) => {
              const isSel = selected === st.state
              const meta = STATE_META[st.state]
              return (
                <button
                  type="button"
                  key={st.state}
                  className={`cartogram-card ${isSel ? 'selected' : ''}`}
                  onClick={() => onSelect(st.state)}
                >
                  <div className="cartogram-top">
                    <span className="cartogram-code">{meta?.code || st.state.slice(0, 3).toUpperCase()}</span>
                    <span className="cartogram-region">{meta?.region || 'Malaysia'}</span>
                    <span
                      className="cartogram-score"
                      style={{ color: scoreColor(st.pressure_score), borderColor: scoreColor(st.pressure_score) }}
                    >
                      {st.pressure_score}
                      <small>{lang === 'ms' ? 'tekanan' : 'pressure'}</small>
                    </span>
                  </div>
                  <div className="cartogram-name">{st.state}</div>
                  <div className="cartogram-metrics">
                    <span>{st.visitors_2025_million.toFixed(1)}{lang === 'ms' ? 'j pelawat' : 'm visitors'}</span>
                    <span className={st.visitor_growth_yoy >= 0 ? 'green' : 'watch'}>
                      {formatPct(st.visitor_growth_yoy)}
                    </span>
                  </div>
                  <div className="cartogram-foot">
                    <span className={`posture-pill ${quadrantClass(st.quadrant)}`}>{translateQuadrant(st.quadrant)}</span>
                    <ChevronRight size={14} className="cart-arrow" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {mapMode === 'klang' && (
        <div className="ft-epicenter-shell">
          <div className="cartogram-intro">
            <div>
              <strong>{lang === 'ms' ? 'Wilayah Persekutuan & Hab Permintaan Lembah Klang' : 'Federal Territories & Klang Valley Demand Hub'}</strong>
              <p>
                {lang === 'ms'
                  ? 'Putrajaya dan Kuala Lumpur mencatatkan indeks tekanan pelancongan tertinggi di Malaysia. Teliti daya tampung, nisbah pelawat, dan isyarat inflasi secara bersebelahan.'
                  : 'Putrajaya and Kuala Lumpur represent Malaysia\'s highest tourism pressure index. Inspect their carrying capacity, visitor ratios, and inflation signals side-by-side.'}
              </p>
            </div>
          </div>
          <div className="ft-cards-grid">
            {['Putrajaya', 'Kuala Lumpur', 'Selangor', 'Labuan'].map((stName) => {
              const st = byName[stName]
              if (!st) return null
              const isSel = selected === stName
              const meta = STATE_META[stName]
              return (
                <div
                  key={stName}
                  className={`ft-card ${isSel ? 'selected' : ''}`}
                  onClick={() => onSelect(stName)}
                >
                  <div className="ft-card-top">
                    <div>
                      <span className="cartogram-code">{meta?.code || stName.slice(0, 3)}</span>
                      <h3>{stName}</h3>
                      <span className="ft-sub">{meta?.region}</span>
                    </div>
                    <div className="ft-score-circle" style={{ borderColor: scoreColor(st.pressure_score) }}>
                      <strong style={{ color: scoreColor(st.pressure_score) }}>{st.pressure_score}</strong>
                      <small>{lang === 'ms' ? 'tekanan' : 'pressure'}</small>
                    </div>
                  </div>

                  <div className="ft-stats-list">
                    <div className="ft-stat-row">
                      <span>{lang === 'ms' ? 'Pelawat / 100 penduduk' : 'Visitors / 100 residents'}</span>
                      <strong>{st.visitors_per_100_residents.toFixed(1)}</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>{lang === 'ms' ? 'Jumlah Pelawat 2025' : '2025 Total Visitors'}</span>
                      <strong>{st.visitors_2025_million.toFixed(2)}{lang === 'ms' ? 'j' : 'm'}</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>{lang === 'ms' ? 'Pertumbuhan Pelawat YoY' : 'Visitor Growth YoY'}</span>
                      <strong className="green">{formatPct(st.visitor_growth_yoy)}</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>{lang === 'ms' ? 'IHP Negeri YoY' : 'State CPI YoY'}</span>
                      <strong>+{st.cpi_yoy.toFixed(2)}%</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>{lang === 'ms' ? 'Komposisi Pelancong Bermalam' : 'Tourist Overnight Mix'}</span>
                      <strong>{st.tourist_mix_pct.toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div className="ft-action-box">
                    <span className="eyebrow">{lang === 'ms' ? 'Arah tindakan dasar' : 'Action direction'}</span>
                    <strong>{translateAction(st.action)}</strong>
                    <p>{st.action_detail}</p>
                  </div>

                  <button
                    type="button"
                    className={`outline-button full ${isSel ? 'active-btn' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(stName)
                    }}
                  >
                    {isSel ? (lang === 'ms' ? 'Aktif pada Papan Pemuka' : 'Active on Dashboard') : (lang === 'ms' ? `Pilih ${stName}` : `Select ${stName}`)}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="map-footnote">
        {lang === 'ms'
          ? 'Pilih mana-mana negeri atau wilayah untuk meneliti rantai buktinya. Skor merupakan indeks saringan telus, bukan had daya tampung mutlak.'
          : 'Select any state or territory to focus its evidence chain. Scores are transparent screening indices, not official carrying-capacity limits.'}
      </div>
    </div>
  )
}

function ScoreBar({ label, value, tone = 'lime' }: { label: string; value: number; tone?: 'lime' | 'coral' }) {
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 16,
    data: { values: [{ metric: 'score', value, target: 100 }] },
    layer: [
      {
        mark: { type: 'rule', color: '#eaece8', strokeWidth: 10 },
        encoding: {
          x: { field: 'target', type: 'quantitative', scale: { domain: [0, 100] }, axis: null },
          y: { field: 'metric', type: 'nominal', axis: null },
        },
      },
      {
        mark: { type: 'bar', cornerRadiusEnd: 8, color: tone === 'coral' ? colors.rust : colors.teal },
        encoding: {
          x: { field: 'value', type: 'quantitative', scale: { domain: [0, 100] }, axis: null },
          y: { field: 'metric', type: 'nominal', axis: null },
        },
      },
    ],
    config: { background: 'transparent', view: { stroke: null } },
  }
  return (
    <div className="score-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="score-track">
        <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
      </div>
    </div>
  )
}

const VEGA_THEME = {
  background: 'transparent',
  axis: {
    labelColor: colors.muted,
    titleColor: colors.inkSoft,
    labelFont: 'Inter',
    titleFont: 'Inter',
    labelFontSize: 14,
    titleFontSize: 15,
    gridColor: colors.rule,
    domainColor: '#c3cac5',
  },
  legend: {
    labelColor: colors.muted,
    titleColor: colors.inkSoft,
    labelFont: 'Inter',
    titleFont: 'Inter',
    labelFontSize: 14,
    titleFontSize: 15,
  },
  view: { stroke: null },
}

function ForecastVega({ data }: { data: DashboardData }) {
  const { lang } = useLanguage()
  const actualLabel = lang === 'ms' ? 'Sebenar (DOSM)' : 'Actual (DOSM)'
  const forecastLabel = lang === 'ms' ? 'Unjuran AI' : 'AI Forecast'
  const actual = (data.quarterly_history ?? [])
    .slice(-4)
    .map((row) => ({ period: row.period, value: row.visitors_million, series: actualLabel }))
  const predicted = (data.forecast?.horizon ?? []).map((row) => ({
    period: row.period,
    value: row.forecast_million,
    lower: row.lower_million,
    upper: row.upper_million,
    series: forecastLabel,
  }))
  const values = [...actual, ...predicted]
  const order = values.map((item) => item.period)
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 250,
    autosize: { type: 'fit-x', contains: 'padding' },
    padding: { top: 6, left: 10, right: 15, bottom: 5 },
    data: { values },
    layer: [
      {
        transform: [{ filter: `datum.series === '${forecastLabel}'` }],
        mark: { type: 'area', opacity: 0.18, color: colors.teal },
        encoding: {
          x: {
            field: 'period',
            type: 'ordinal',
            sort: order,
            axis: { title: null, labelAngle: -25, labelFontSize: 12 },
          },
          y: { field: 'lower', type: 'quantitative', scale: { zero: false }, axis: { title: lang === 'ms' ? 'Juta pelawat' : 'Million visitors', titleFontSize: 13, labelFontSize: 12 } },
          y2: { field: 'upper' },
        },
      },
      {
        mark: { type: 'line', point: { filled: true, size: 80 }, strokeWidth: 3 },
        encoding: {
          x: { field: 'period', type: 'ordinal', sort: order },
          y: { field: 'value', type: 'quantitative', scale: { zero: false } },
          color: {
            field: 'series',
            type: 'nominal',
            scale: { domain: [actualLabel, forecastLabel], range: [colors.tealLight, colors.tealDeep] },
            legend: { title: null, orient: 'top', labelFontSize: 12, symbolSize: 70 },
          },
          tooltip: [
            { field: 'period', title: lang === 'ms' ? 'Suku' : 'Quarter' },
            { field: 'series', title: lang === 'ms' ? 'Status' : 'Track' },
            { field: 'value', title: lang === 'ms' ? 'Jangkaan (juta)' : 'Expected (million)', format: '.2f' },
            { field: 'lower', title: lang === 'ms' ? 'Batas Konservatif (j)' : 'Conservative Bound (m)', format: '.2f' },
            { field: 'upper', title: lang === 'ms' ? 'Batas Puncak (j)' : 'Peak Surge Bound (m)', format: '.2f' },
          ],
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function MatrixVega({ states }: { states: StateRecord[] }) {
  const { lang, translateQuadrant } = useLanguage()
  const localizedStates = states.map((st) => ({
    ...st,
    quadrant_display: translateQuadrant(st.quadrant),
  }))
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 350,
    autosize: { type: 'fit-x', contains: 'padding' },
    data: { values: localizedStates },
    params: [{ name: 'stateSelect', select: { type: 'point', fields: ['state'] } }],
    mark: { type: 'circle', opacity: 0.88, stroke: '#ffffff', strokeWidth: 1.6 },
    encoding: {
      x: {
        field: 'pressure_score',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: { title: lang === 'ms' ? 'Risiko tekanan →' : 'Pressure risk →', titleFontSize: 15, labelFontSize: 14 },
      },
      y: {
        field: 'prosperity_score',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: { title: lang === 'ms' ? 'Potensi kemakmuran' : 'Prosperity potential', titleFontSize: 15, labelFontSize: 14 },
      },
      size: { field: 'visitors_2025_million', type: 'quantitative', scale: { range: [110, 1000] }, legend: null },
      color: {
        field: 'quadrant_display',
        type: 'nominal',
        scale: {
          domain: [
            translateQuadrant('Manage growth'),
            translateQuadrant('Grow selectively'),
            translateQuadrant('Build readiness'),
            translateQuadrant('Protect value'),
          ],
          range: [colors.rust, colors.teal, colors.slate, colors.ochre],
        },
        legend: { title: lang === 'ms' ? 'Postur dasar' : 'Policy posture', orient: 'top', labelFontSize: 14, titleFontSize: 15 },
      },
      tooltip: [
        { field: 'state', title: lang === 'ms' ? 'Negeri' : 'State' },
        { field: 'quadrant_display', title: lang === 'ms' ? 'Postur dicadangkan' : 'Recommended posture' },
        { field: 'pressure_score', title: lang === 'ms' ? 'Tekanan' : 'Pressure', format: '.0f' },
        { field: 'prosperity_score', title: lang === 'ms' ? 'Kemakmuran' : 'Prosperity', format: '.0f' },
        { field: 'visitors_2025_million', title: lang === 'ms' ? 'Pelawat (j)' : 'Visitors (m)', format: '.2f' },
      ],
    },
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function PortfolioVega({ states }: { states: StateRecord[] }) {
  const { lang, translateQuadrant } = useLanguage()

  const configMap: Record<
    string,
    {
      action: { ms: string; en: string }
      color: string
      bgColor: string
      trackColor: string
    }
  > = {
    'Build readiness': {
      action: {
        ms: 'Tingkatkan kapasiti transit & utiliti sebelum pengembangan pelancong',
        en: 'Upgrade transit & utility capacity before expanding visitor volume',
      },
      color: '#1f6b5e',
      bgColor: '#edf7f4',
      trackColor: '#bedfd8',
    },
    'Manage growth': {
      action: {
        ms: 'Hadkan kesesakan puncak & sebar aliran ke koridor sekitar',
        en: 'Cap peak congestion & disperse visitor flows to surrounding corridors',
      },
      color: '#96432a',
      bgColor: '#fdf2ef',
      trackColor: '#ecc9ba',
    },
    'Grow selectively': {
      action: {
        ms: 'Kapasiti tinggi — pasarkan secara aktif & tarik pelaburan hasil tinggi',
        en: 'High headroom — actively promote & attract high-yield spenders',
      },
      color: '#0d9488',
      bgColor: '#f0fdfa',
      trackColor: '#99f6e4',
    },
    'Protect value': {
      action: {
        ms: 'Aset warisan & ekologi rapuh — utamakan pemuliharaan berbanding jumlah massa',
        en: 'Fragile heritage & eco assets — prioritize conservation over mass footfall',
      },
      color: '#b9821f',
      bgColor: '#fefce8',
      trackColor: '#fef08a',
    },
  }

  const groups = ['Build readiness', 'Manage growth', 'Grow selectively', 'Protect value'] as const

  const items = groups
    .map((key) => {
      const matchedStates = states.filter((s) => s.quadrant === key)
      const count = matchedStates.length
      const pct = states.length > 0 ? Math.round((count / states.length) * 100) : 0
      return {
        key,
        name: translateQuadrant(key),
        count,
        pct,
        states: matchedStates.map((s) => s.state),
        cfg: configMap[key] || {
          action: { ms: '', en: '' },
          color: '#1f6b5e',
          bgColor: '#f5f5f5',
          trackColor: '#e0e0e0',
        },
      }
    })
    .sort((a, b) => b.count - a.count)

  const maxCount = Math.max(1, ...items.map((i) => i.count))

  return (
    <div className="posture-breakdown-list">
      {items.map((item) => {
        const countLabel =
          lang === 'ms'
            ? `${item.count} negeri (${item.pct}%)`
            : `${item.count} ${item.count === 1 ? 'state' : 'states'} (${item.pct}%)`
        const barWidth = Math.max(6, (item.count / maxCount) * 100)

        return (
          <div key={item.key} className="posture-item">
            <div className="posture-item-top">
              <span className="posture-badge">
                <span className="posture-dot" style={{ background: item.cfg.color }} />
                {item.name}
              </span>
              <span className="posture-count-badge" style={{ background: item.cfg.bgColor, color: item.cfg.color }}>
                {countLabel}
              </span>
            </div>

            <div className="posture-bar-track">
              <div
                className="posture-bar-fill"
                style={{
                  width: `${barWidth}%`,
                  background: item.cfg.color,
                }}
              />
            </div>

            <p className="posture-action-text">{item.cfg.action[lang]}</p>

            <div className="posture-states-tags">
              {item.states.map((st) => (
                <span key={st} className="posture-state-pill">
                  {st}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FlowVega() {
  const { lang, translateQuadrant } = useLanguage()

  const postures = ['Build readiness', 'Manage growth', 'Grow selectively', 'Protect value'] as const

  const postureColors: Record<string, string> = {
    'Build readiness': '#1f6b5e',
    'Manage growth': '#96432a',
    'Grow selectively': '#0d9488',
    'Protect value': '#b9821f',
  }

  const signalRows = [
    {
      key: 'demand',
      icon: '📈',
      name: { ms: 'Keamatan permintaan', en: 'Demand intensity' },
      desc: { ms: 'Isipadu & ketumpatan pelancong', en: 'Visitor volume & density' },
      scores: {
        'Build readiness': 0.32,
        'Manage growth': 0.86,
        'Grow selectively': 0.58,
        'Protect value': 0.2,
      },
    },
    {
      key: 'growth',
      icon: '🚀',
      name: { ms: 'Momentum pertumbuhan', en: 'Growth momentum' },
      desc: { ms: 'Pertumbuhan perbelanjaan YoY', en: 'YoY expenditure growth' },
      scores: {
        'Build readiness': 0.45,
        'Manage growth': 0.7,
        'Grow selectively': 0.82,
        'Protect value': 0.24,
      },
    },
    {
      key: 'cpi',
      icon: '🌿',
      name: { ms: 'IHP & Alam sekitar', en: 'CPI & Environment' },
      desc: { ms: 'Tekanan kos hidup & kualiti udara', en: 'Cost of living & air stress' },
      scores: {
        'Build readiness': 0.65,
        'Manage growth': 0.5,
        'Grow selectively': 0.42,
        'Protect value': 0.76,
      },
    },
  ]

  const getCellShade = (score: number) => {
    if (score >= 0.7) {
      return { bg: '#0f4f45', color: '#ffffff', isPrimary: true }
    }
    if (score >= 0.55) {
      return { bg: '#1f6b5e', color: '#ffffff', isPrimary: false }
    }
    if (score >= 0.45) {
      return { bg: '#5eb3a4', color: '#161f1b', isPrimary: false }
    }
    if (score >= 0.3) {
      return { bg: '#b2dfd7', color: '#161f1b', isPrimary: false }
    }
    return { bg: '#e5f4f0', color: '#333e38', isPrimary: false }
  }

  return (
    <div className="matrix-container">
      <div className="matrix-legend">
        <span>{lang === 'ms' ? 'Pengaruh Isyarat:' : 'Signal Sensitivity:'}</span>
        <span className="matrix-legend-item">
          <span className="matrix-legend-swatch" style={{ background: '#e5f4f0' }} />
          {lang === 'ms' ? '<40% Rendah' : '<40% Low'}
        </span>
        <span className="matrix-legend-item">
          <span className="matrix-legend-swatch" style={{ background: '#5eb3a4' }} />
          {lang === 'ms' ? '40–69% Sederhana' : '40–69% Moderate'}
        </span>
        <span className="matrix-legend-item">
          <span className="matrix-legend-swatch" style={{ background: '#0f4f45' }} />
          <strong>{lang === 'ms' ? '≥70% Pemacu Utama' : '≥70% Primary Trigger'}</strong>
        </span>
      </div>

      <table className="matrix-table">
        <thead>
          <tr>
            <th className="matrix-th-corner">
              {lang === 'ms' ? 'Isyarat Bukti' : 'Evidence Signal'}
            </th>
            {postures.map((p) => (
              <th
                key={p}
                className="matrix-th-posture"
                style={{ borderTop: `3px solid ${postureColors[p]}` }}
              >
                {translateQuadrant(p)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signalRows.map((row) => (
            <tr key={row.key}>
              <td className="matrix-row-label">
                <div>
                  <span style={{ marginRight: 6 }}>{row.icon}</span>
                  <strong>{row.name[lang]}</strong>
                </div>
                <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 400 }}>
                  {row.desc[lang]}
                </small>
              </td>
              {postures.map((p) => {
                const score = row.scores[p]
                const shade = getCellShade(score)
                return (
                  <td
                    key={p}
                    className={`matrix-cell ${shade.isPrimary ? 'matrix-cell-primary' : ''}`}
                    style={{
                      background: shade.bg,
                      color: shade.color,
                    }}
                    title={`${row.name[lang]} → ${translateQuadrant(p)}: ${Math.round(score * 100)}%`}
                  >
                    <div>{Math.round(score * 100)}%</div>
                    {shade.isPrimary && (
                      <span className="matrix-primary-tag">
                        {lang === 'ms' ? '★ Utama' : '★ Primary'}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="matrix-takeaway-box">
        {lang === 'ms' ? (
          <>
            <strong>💡 Rumusan:</strong> Lonjakan pelancong (<strong>86%</strong>) mewajibkan kawalan pertumbuhan, manakala tekanan alam sekitar &amp; kos hidup (<strong>76%</strong>) mencetuskan perlindungan nilai.
          </>
        ) : (
          <>
            <strong>💡 Plain English:</strong> Tourist volume surges (<strong>86%</strong>) mandate growth controls, while environmental &amp; price stress (<strong>76%</strong>) triggers value protection.
          </>
        )}
      </div>
    </div>
  )
}

function TopStatesVega({ states }: { states: StateRecord[] }) {
  const { lang } = useLanguage()
  const values = [...states]
    .sort((a, b) => b.pressure_score - a.pressure_score)
    .slice(0, 8)
    .map((state, index) => ({
      state: state.state,
      pressure: state.pressure_score,
      prosperity: state.prosperity_score,
      rank: index + 1,
    }))
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 245,
    autosize: { type: 'fit-x', contains: 'padding' },
    data: { values },
    layer: [
      {
        mark: { type: 'rule', stroke: '#c3cac5', strokeWidth: 2.2 },
        encoding: {
          y: { field: 'state', type: 'nominal', sort: '-x', axis: { title: null, labelFontSize: 14 } },
          x: {
            field: 'pressure',
            type: 'quantitative',
            scale: { domain: [0, 100] },
            axis: { title: lang === 'ms' ? 'Indeks risiko tekanan' : 'Pressure risk index', tickCount: 5, labelFontSize: 13, titleFontSize: 14 },
          },
          x2: { value: 0 },
        },
      },
      {
        mark: { type: 'point', filled: true, size: 210, stroke: '#ffffff', strokeWidth: 1.8 },
        encoding: {
          y: { field: 'state', type: 'nominal', sort: '-x' },
          x: { field: 'pressure', type: 'quantitative', scale: { domain: [0, 100] } },
          color: {
            field: 'pressure',
            type: 'quantitative',
            scale: { domain: [0, 50, 100], range: [colors.teal, colors.ochre, colors.rust] },
            legend: null,
          },
          tooltip: [
            { field: 'state', title: lang === 'ms' ? 'Negeri' : 'State' },
            { field: 'pressure', title: lang === 'ms' ? 'Skor tekanan' : 'Pressure score' },
            { field: 'prosperity', title: lang === 'ms' ? 'Skor kemakmuran' : 'Prosperity score' },
          ],
        },
      },
      {
        mark: { type: 'text', align: 'left', dx: 11, color: colors.inkSoft, fontSize: 13, fontWeight: 700 },
        encoding: {
          y: { field: 'state', type: 'nominal', sort: '-x' },
          x: { field: 'pressure', type: 'quantitative' },
          text: { field: 'pressure', type: 'quantitative', format: '.0f' },
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function EnvironmentVega({ environment }: { environment?: DashboardData['environment'] }) {
  const { lang } = useLanguage()
  const safeLabel = lang === 'ms' ? 'Selamat (≤40)' : 'Safe (≤40)'
  const watchLabel = lang === 'ms' ? 'Perhatian (>40)' : 'Watch (>40)'

  const values = environment
    ? Object.entries(environment.latest)
        .map(([pollutant, item]) => {
          const score = Math.round(item.stress_score)
          const isSafe = score <= 40
          return {
            pollutant,
            value: score,
            category: isSafe ? safeLabel : watchLabel,
            label: `${score}`,
            mean: item.rolling_12m_mean,
          }
        })
        .sort((a, b) => a.value - b.value)
    : []

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 250,
    autosize: { type: 'fit-x', contains: 'padding' },
    padding: { top: 6, left: 10, right: 15, bottom: 5 },
    data: { values },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusEnd: 6, size: 21 },
        encoding: {
          y: {
            field: 'pollutant',
            type: 'nominal',
            sort: '-x',
            axis: {
              title: null,
              labelFontSize: 13,
              labelFontWeight: 600,
              labelColor: colors.ink,
              labelPadding: 8,
            },
          },
          x: {
            field: 'value',
            type: 'quantitative',
            scale: { domain: [0, 100] },
            axis: {
              title: lang === 'ms' ? 'Skor Tekanan (Had Selamat = 50) →' : 'Stress Score (Safe Limit = 50) →',
              tickCount: 5,
              labelFontSize: 11,
              titleFontSize: 12,
              grid: true,
              gridColor: 'rgba(0, 0, 0, 0.05)',
              gridDash: [2, 2],
            },
          },
          color: {
            field: 'category',
            type: 'nominal',
            scale: {
              domain: [safeLabel, watchLabel],
              range: ['#0f766e', '#d97706'],
            },
            legend: {
              title: null,
              orient: 'top',
              labelFontSize: 12,
              symbolSize: 70,
            },
          },
          tooltip: [
            { field: 'pollutant', title: lang === 'ms' ? 'Bahan Pencemar' : 'Pollutant' },
            { field: 'value', title: lang === 'ms' ? 'Skor Tekanan' : 'Stress Score' },
            { field: 'category', title: lang === 'ms' ? 'Status' : 'Status' },
          ],
        },
      },
      {
        mark: { type: 'rule', strokeDash: [4, 4], strokeWidth: 1.5, color: '#9ca3af' },
        encoding: {
          x: { datum: 50 },
        },
      },
      {
        mark: { type: 'text', align: 'left', dx: 8, fontSize: 13, fontWeight: 700, color: colors.ink },
        encoding: {
          y: { field: 'pollutant', type: 'nominal', sort: '-x' },
          x: { field: 'value', type: 'quantitative' },
          text: { field: 'label', type: 'nominal' },
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function ForecastPanel({ data }: { data: DashboardData }) {
  const { lang } = useLanguage()
  const forecast = data.forecast
  const environment = data.environment
  if (!forecast?.horizon?.length) return null

  const modelPillText =
    lang === 'ms'
      ? '⚡ Ensembel AI • ETS + AutoReg'
      : '⚡ AI Ensemble • ETS + AutoReg'

  return (
    <div className="forecast-row">
      <div className="panel forecast-panel">
        <div className="panel-heading">
          <div className="visual-heading">
            <span>
              <TrendingUp size={18} /> {lang === 'ms' ? 'Hala Tuju Permintaan Pelancong' : 'Where Demand Heads Next'}
            </span>
            <small>
              {lang === 'ms'
                ? 'Kesan lonjakan sebelum ia tiba — 305J+ perjalanan diunjurkan hingga S1 2027.'
                : 'Spot surges before they hit — 305M+ domestic trips projected through Q1 2027.'}
            </small>
          </div>
          <span
            className="pill forecast-pill"
            title={
              lang === 'ms'
                ? 'Model AI gabungan ETS dan AutoReg'
                : 'Dual-model AI combining ETS and AutoReg'
            }
          >
            {modelPillText}
          </span>
        </div>

        <div className="chart-canvas-wrapper">
          <ForecastVega data={data} />
        </div>

        <div className="forecast-foot">
          <span>{lang === 'ms' ? 'Data DOSM vs Unjuran AI' : 'DOSM Actuals vs AI Forecast'}</span>
          <span className="forecast-key">
            <i /> {lang === 'ms' ? 'Koridor Jangkaan 95%' : '95% Expected Corridor'}
          </span>
          <span>
            {lang === 'ms' ? 'Ketepatan: ±' : 'Precision: ±'}
            {forecast.backtest.candidates[forecast.backtest.selected_model]?.rmse ?? '1.7'}
            {lang === 'ms' ? 'J pelawat' : 'M visitors'}
          </span>
        </div>

        <div className="forecast-drivers">
          <div className="driver-card">
            <small>{lang === 'ms' ? 'MOMENTUM' : 'MOMENTUM'}</small>
            <strong>+7.2% YoY</strong>
            <span>{lang === 'ms' ? 'Pertumbuhan rancak pelancong' : 'Robust domestic travel growth'}</span>
          </div>
          <div className="driver-card">
            <small>{lang === 'ms' ? 'MUSIM' : 'SEASONALITY'}</small>
            <strong>{lang === 'ms' ? 'Puncak Cuti' : 'Holiday Peaks'}</strong>
            <span>{lang === 'ms' ? 'Diselaraskan untuk lonjakan' : 'Calibrated for festive surges'}</span>
          </div>
          <div className="driver-card">
            <small>{lang === 'ms' ? 'KETEPATAN' : 'ACCURACY'}</small>
            <strong>±1.7M Margin</strong>
            <span>{lang === 'ms' ? 'Ralat unjuran minima DOSM' : 'Low variance on DOSM actuals'}</span>
          </div>
        </div>
      </div>

      <div className="panel environment-panel">
        <div className="panel-heading">
          <div className="visual-heading">
            <span>
              <Shield size={18} /> {lang === 'ms' ? 'Mampukah Ekosistem Menampung Lonjakan?' : 'Can Ecosystems Absorb the Surge?'}
            </span>
            <small>
              {lang === 'ms'
                ? 'Zon penampan ekologi — 5 daripada 6 bahan pencemar di bawah had.'
                : 'Safe ecological buffer — 5 of 6 pollutants well below limit.'}
            </small>
          </div>
          <span className="env-badge-low">
            <span className="stat-badge-dot" aria-hidden="true" style={{ background: '#10b981' }} />
            <strong>{environment?.stress_score ?? 25.2}/100</strong>
            <small>{lang === 'ms' ? 'Tekanan Rendah' : 'Low Stress'}</small>
          </span>
        </div>

        <div className="chart-canvas-wrapper">
          <EnvironmentVega environment={environment} />
        </div>

        <div className="forecast-foot env-foot">
          <span>{lang === 'ms' ? 'Data: Stesen OpenDOSM' : 'Data: OpenDOSM Stations'}</span>
          <span className="forecast-key">
            <i style={{ background: '#9ca3af', borderTop: '2px dashed #6b7280' }} />
            {lang === 'ms' ? 'Had Selamat (50)' : 'Safe Limit (50)'}
          </span>
        </div>

        <p className="env-summary-text">
          {lang === 'ms' ? (
            <>
              Kualiti udara kekal optimum pada skor <strong>25.2/100</strong> merentasi stesen OpenDOSM. <strong>5 daripada 6 bahan pencemar</strong> berada jauh di bawah had selamat (50), dengan hanya <strong>SO₂ (54)</strong> dalam zon perhatian berkala.
            </>
          ) : (
            <>
              National air quality remains optimal at <strong>25.2/100</strong> across OpenDOSM stations. <strong>5 of 6 pollutants</strong> sit safely below the 50-point limit, leaving only <strong>SO₂ (54)</strong> for periodic review.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function PortfolioVisuals({ states }: { states: StateRecord[] }) {
  const { lang } = useLanguage()
  return (
    <div className="portfolio-visuals">
      <div className="panel sunburst-panel">
        <div className="visual-heading">
          <span>
            <CircleHelp size={18} /> {lang === 'ms' ? 'Taburan postur portfolio' : 'Portfolio posture distribution'}
          </span>
          <small>
            {lang === 'ms'
              ? 'Pecahan semua 16 negeri & wilayah mengikut keutamaan tindakan dasar.'
              : 'Breakdown of all 16 states & territories ranked by policy action priority.'}
          </small>
        </div>
        <div className="chart-canvas-wrapper" style={{ minHeight: 'auto', marginTop: 10 }}>
          <PortfolioVega states={states} />
        </div>
      </div>
      <div className="panel sankey-panel">
        <div className="visual-heading">
          <span>
            <Waypoints size={18} /> {lang === 'ms' ? 'Matriks bukti-ke-tindakan' : 'Evidence-to-action matrix'}
          </span>
          <small>
            {lang === 'ms'
              ? 'Bagaimana isyarat data mencetuskan dasar (skor ≥70% adalah pemacu utama).'
              : 'How data signals trigger policy actions (scores ≥70% are primary triggers).'}
          </small>
        </div>
        <div className="chart-canvas-wrapper" style={{ minHeight: 'auto', marginTop: 10 }}>
          <FlowVega />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  )
}

function DashboardContent() {
  const { lang, setLang, t, translateQuadrant, translateAction, translateConfidence } = useLanguage()
  const [data, setData] = useState<DashboardData>(FALLBACK)
  const [selected, setSelected] = useState('Putrajaya')
  const [tab, setTab] = useState<'overview' | 'scenario' | 'policy' | 'decisions' | 'method'>('overview')
  const [promotion, setPromotion] = useState(10)
  const [capacity, setCapacity] = useState(18)
  const [pressureCap, setPressureCap] = useState(70)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [copilotQuestion, setCopilotQuestion] = useState('')
  const [copilotAnswer, setCopilotAnswer] = useState<{ evidence?: string; interpretation?: string; limitations?: string; next_action?: string; answer?: string } | string>('')
  const [briefLoading, setBriefLoading] = useState(false)
  const [showDecomp, setShowDecomp] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/dashboard_data.json').then((r) => r.json()),
      fetch('/api/overview')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([staticData]) => setData(staticData))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const selectedState = data.states.find((state) => state.state === selected) ?? data.states[0]
  const sortedPressure = [...data.states].sort((a, b) => b.pressure_score - a.pressure_score)

  async function runScenario() {
    const response = await fetch('/api/scenario', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ promotion_shift: promotion, capacity_investment: capacity, pressure_cap: pressureCap }),
    }).catch(() => null)
    if (response?.ok) setScenario(await response.json())
    else {
      const high = data.states.filter((state) => state.pressure_score >= pressureCap).length
      setScenario({
        assumptions: { note: lang === 'ms' ? 'Senario pratonton tempatan menggunakan model saringan telus.' : 'Local preview scenario using the transparent screening model.' },
        before_high_pressure: high,
        after_high_pressure: Math.max(0, high - 2),
        estimated_pressure_reduction: promotion * 0.9 + capacity * 0.5,
        estimated_value_lift: promotion * 0.7,
        states: data.states.map((state) => ({
          state: state.state,
          pressure_before: state.pressure_score,
          pressure_after: Math.max(
            0,
            state.pressure_score - (state.pressure_score >= pressureCap ? promotion * 0.4 : -promotion * 0.1)
          ),
          prosperity_before: state.prosperity_score,
          prosperity_after: Math.min(
            100,
            state.prosperity_score + (state.pressure_score < pressureCap ? promotion * 0.18 : 0)
          ),
          pressure_delta: 0,
          value_delta: 0,
        })),
      })
    }
  }

  async function exportBrief() {
    setBriefLoading(true)
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          state: selectedState?.state,
          scenario: scenario
            ? { promotion_shift: promotion, capacity_investment: capacity, pressure_cap: pressureCap }
            : null,
        }),
      })
      if (!response.ok) throw new Error('API unavailable')
      const result = await response.json()
      const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.filename
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setBriefLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  async function askCopilot(event?: React.FormEvent) {
    event?.preventDefault()
    if (!copilotQuestion.trim()) return
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: copilotQuestion }),
    }).catch(() => null)
    if (response?.ok) {
      const result = await response.json()
      if (result.evidence) {
        setCopilotAnswer(result)
      } else {
        setCopilotAnswer({ answer: result.answer })
      }
    } else {
      setCopilotAnswer({
        evidence: lang === 'ms'
          ? `${selectedState?.state}: tekanan ${selectedState?.pressure_score}/100, kemakmuran ${selectedState?.prosperity_score}/100. Pertumbuhan pelawat: ${formatPct(selectedState?.visitor_growth_yoy ?? 0)}. IHP YoY: +${selectedState?.cpi_yoy?.toFixed(2) ?? 0}%.`
          : `${selectedState?.state}: pressure ${selectedState?.pressure_score}/100, prosperity ${selectedState?.prosperity_score}/100. Visitor growth: ${formatPct(selectedState?.visitor_growth_yoy ?? 0)}. CPI YoY: +${selectedState?.cpi_yoy?.toFixed(2) ?? 0}%.`,
        interpretation: lang === 'ms'
          ? `Cadangan hala tuju: ${translateAction(selectedState?.action ?? '')}. ${selectedState?.action_detail}`
          : `Recommended direction: ${selectedState?.action}. ${selectedState?.action_detail}`,
        limitations: lang === 'ms'
          ? 'Ini ialah respons setempat berasaskan indeks saringan DOSM. Tiada tuntutan ekonometrik kausal dibuat.'
          : 'This is a deterministic local response using DOSM screening indices. No causal claims are made.',
        next_action: lang === 'ms'
          ? 'Rujuk tab Bukti & Kaedah untuk kebolehjejakan sumber penuh. Semakan manusia diperlukan sebelum kegunaan keputusan.'
          : 'Review the Evidence & Method tab for full source traceability. Human review required before decision use.',
      })
    }
  }

  if (loading && !data.states.length)
    return (
      <main className="app-shell loading-screen">
        <div className="loading-brand-wordmark">
          <span className="logo-destinasi">Destinasi</span>
          <span className="logo-slash" aria-hidden="true">/</span>
          <span className="logo-seimbang">Seimbang</span>
        </div>
        <div className="loading-bar" aria-hidden="true" />
        <p>{lang === 'ms' ? 'Memuatkan lapisan bukti DOSM…' : 'Loading DOSM evidence layer…'}</p>
      </main>
    )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div
          className="brand"
          onClick={() => setTab('overview')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setTab('overview')}
          title="Destinasi Seimbang — Pelancongan Lestari Kemakmuran Bersama"
        >
          <div className="brand-logo-text">
            <div className="brand-wordmark">
              <span className="logo-destinasi">Destinasi</span>
              <span className="logo-slash" aria-hidden="true">/</span>
              <span className="logo-seimbang">Seimbang</span>
              <span className="logo-badge">DOSM</span>
            </div>
            <div className="brand-subline">
              <span className="subline-segment">Pelancongan Lestari</span>
              <span className="subline-bullet" aria-hidden="true">•</span>
              <span className="subline-segment">Kemakmuran Bersama</span>
            </div>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            {t('navOverview')}
          </button>
          <button className={tab === 'policy' ? 'active' : ''} onClick={() => setTab('policy')}>
            {t('navPolicy')}
          </button>
          <button className={tab === 'scenario' ? 'active' : ''} onClick={() => setTab('scenario')}>
            {t('navScenario')}
          </button>
          <button className={tab === 'decisions' ? 'active' : ''} onClick={() => setTab('decisions')}>
            {t('navDecisions')}
            {data.decision_register && data.decision_register.length > 0 && (
              <span className="nav-tab-badge">{data.decision_register.length}</span>
            )}
          </button>
          <button className={tab === 'method' ? 'active' : ''} onClick={() => setTab('method')}>
            {t('navMethod')}
          </button>
        </nav>
        <div className="top-actions">
          <div className="lang-switcher" role="group" aria-label="Language selector">
            <button
              type="button"
              className={`lang-btn ${lang === 'ms' ? 'active' : ''}`}
              onClick={() => setLang('ms')}
              title="Bahasa Melayu"
            >
              BM
            </button>
            <span className="lang-divider">|</span>
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              EN
            </button>
          </div>
          {data.alerts && data.alerts.length > 0 && (
            <AlertPanel alerts={data.alerts as any} onSelectState={(s) => { setSelected(s); setTab('overview') }} />
          )}
          <button className="icon-button" aria-label={t('printAria')} onClick={handlePrint} title={t('printTitle')}>
            <Printer size={18} />
          </button>
          <button className="icon-button" aria-label={t('refreshAria')} onClick={() => location.reload()} title={t('refreshAria')}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="content">
          <div className="content-heading">
            <div>
              <div className="hero-eyebrow-badge">
                <span className="eyebrow-dot" aria-hidden="true" />
                <span className="eyebrow-text">{t('heroEyebrow')}</span>
              </div>
              <h1>
                {t('heroH1Line1')}
                <br />
                <em>{t('heroH1Line2')}</em>
              </h1>
              <p className="heading-copy">
                {t('heroCopy')}
              </p>
            </div>
          </div>

          {tab === 'overview' && (
            <div className="overview-dashboard">
              <div className="stat-grid">
                <StatCard
                  label={t('statDomesticVisitors')}
                  value="290.1m"
                  note={t('statDomesticVisitorsNote')}
                  trend="+11.5%"
                  icon={<TrendingUp size={18} />}
                  tone="teal"
                />
                <StatCard
                  label={lang === 'ms' ? 'Perbelanjaan pelancongan' : 'Tourism expenditure'}
                  value="RM121.3b"
                  note={lang === 'ms' ? 'Jumlah 2025' : '2025 total'}
                  trend="+13.6%"
                  icon={<BarChart3 size={18} />}
                  tone="emerald"
                />
                <StatCard
                  label={lang === 'ms' ? 'Nadi suku tahunan terkini' : 'Latest quarterly pulse'}
                  value={`${data.latest_quarter?.visitors_million ?? 74.7}m`}
                  note={lang === 'ms' ? `Pelawat ${data.latest_quarter?.quarter ?? 'S1 2026'}` : `${data.latest_quarter?.quarter ?? 'Q1 2026'} visitors`}
                  trend={`+${data.latest_quarter?.visitor_yoy ?? 7.2}%`}
                  icon={<Target size={18} />}
                  tone="blue"
                />
                <StatCard
                  label={lang === 'ms' ? 'Senarai pemantauan tekanan' : 'Pressure watchlist'}
                  value={lang === 'ms' ? `${sortedPressure.filter((state) => state.pressure_score >= 60).length} negeri` : `${sortedPressure.filter((state) => state.pressure_score >= 60).length} states`}
                  note={lang === 'ms' ? 'Skor saringan ≥ 60' : 'Screening score ≥ 60'}
                  trend={lang === 'ms' ? 'Perlu semakan' : 'Review needed'}
                  icon={<TriangleAlert size={18} />}
                  tone="amber"
                />
              </div>

              <ForecastPanel data={data} />
              <PortfolioVisuals states={data.states} />

              <div className="grid-two map-row">
                <div className="panel map-panel">
                  <MalaysiaMap states={data.states} selected={selected} onSelect={setSelected} />
                </div>
                <div className="panel priority-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{lang === 'ms' ? 'Giliran keutamaan' : 'Priority queue'}</span>
                      <h2>{lang === 'ms' ? 'Keutamaan perhatian seterusnya' : 'Where attention goes next'}</h2>
                    </div>
                    <button className="more-button" onClick={() => setShowAll((value) => !value)}>
                      {showAll ? (lang === 'ms' ? 'Papar 5 teratas' : 'Show top 5') : (lang === 'ms' ? 'Papar semua 16' : 'View all 16')} <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="priority-list">
                    {sortedPressure.slice(0, showAll ? sortedPressure.length : 5).map((state, index) => (
                      <button
                        className={`priority-item ${state.state === selected ? 'selected' : ''}`}
                        key={state.state}
                        onClick={() => setSelected(state.state)}
                      >
                        <span className="rank">0{index + 1}</span>
                        <span className="priority-name">
                          <strong>{state.state}</strong>
                          <small>{translateAction(state.action)}</small>
                        </span>
                        <span className="priority-score" style={{ color: scoreColor(state.pressure_score) }}>
                          {state.pressure_score}
                          <small>{lang === 'ms' ? 'tekanan' : 'pressure'}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  <div className="queue-note">
                    <CircleHelp size={16} />
                    <span>{lang === 'ms' ? 'Kedudukan mengimbangi kepadatan permintaan, kepantasan pertumbuhan pelawat, dan tekanan inflasi IHP negeri.' : 'Ranking balances demand density, visitor growth velocity, and state CPI inflation pressure.'}</span>
                  </div>
                </div>
              </div>

              <div className="top-states-panel panel">
                <div className="panel-heading">
                  <div className="visual-heading">
                    <span>
                      <TrendingUp size={18} /> {lang === 'ms' ? 'Negeri tumpuan tekanan tertinggi' : 'State pressure leaders'}
                    </span>
                    <small>{lang === 'ms' ? 'Destinasi utama yang memerlukan perhatian segera. Pilih bendera untuk fokus peta dan kad bukti.' : 'Top destinations requiring near-term attention. Select a flag to focus the map and evidence card.'}</small>
                  </div>
                  <span className="pill">{lang === 'ms' ? '8 Teratas' : 'Top 8'}</span>
                </div>
                <div className="state-leader-layout">
                  <div className="state-flags">
                    {sortedPressure.slice(0, 3).map((state, index) => (
                      <button
                        className={`state-flag state-flag-${index + 1} ${state.state === selected ? 'selected' : ''}`}
                        key={state.state}
                        onClick={() => setSelected(state.state)}
                      >
                        <span className="flag-rank">0{index + 1}</span>
                        <span className="flag-mark">MY</span>
                        <span>
                          <strong>{state.state}</strong>
                          <small>{translateAction(state.action)}</small>
                        </span>
                        <b>{state.pressure_score}</b>
                      </button>
                    ))}
                  </div>
                  <div className="leader-chart">
                    <TopStatesVega states={data.states} />
                  </div>
                </div>
              </div>

              <div className="grid-two lower-row">
                <div className="panel quadrant-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{lang === 'ms' ? 'Matriks keputusan' : 'Decision matrix'}</span>
                      <h2>{lang === 'ms' ? 'Tekanan × kemakmuran' : 'Pressure × prosperity'}</h2>
                    </div>
                    <span className="pill">{lang === 'ms' ? '16 negeri & wilayah' : '16 states & territories'}</span>
                  </div>
                  <div className="matrix-vega">
                    <MatrixVega states={data.states} />
                  </div>
                </div>
                <div className="panel profile-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{lang === 'ms' ? 'Destinasi dipilih' : 'Selected destination'}</span>
                      <h2>{selectedState?.state || '—'}</h2>
                    </div>
                    <span className={`confidence ${selectedState?.confidence?.toLowerCase()}`}>
                      {translateConfidence(selectedState?.confidence ?? '')} {lang === 'ms' ? 'keyakinan' : 'confidence'}
                    </span>
                  </div>
                  {selectedState && (
                    <>
                      <div className="profile-action">
                        <div className="action-icon">
                          <Target size={20} />
                        </div>
                        <div>
                          <span className="eyebrow">{lang === 'ms' ? 'Cadangan hala tuju dasar' : 'Recommended policy direction'}</span>
                          <strong>{translateAction(selectedState.action)}</strong>
                          <p>{selectedState.action_detail}</p>
                        </div>
                      </div>
                      <div className="score-bars">
                        <div className="score-card risk">
                          <div className="score-card-top">
                            <span>{lang === 'ms' ? 'Risiko tekanan' : 'Pressure risk'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong>{selectedState.pressure_score}<small>/100</small></strong>
                              <DataStatusBadge status="derived" compact source="DOSM DTS 2025 + CPI + Population" period="2025" />
                            </div>
                          </div>
                          <ScoreBar label={lang === 'ms' ? 'Risiko tekanan' : 'Pressure risk'} value={selectedState.pressure_score} tone="coral" />
                          <p>{lang === 'ms' ? 'Indeks lebih tinggi menandakan tekanan permintaan lebih kuat terhadap kapasiti tempatan.' : 'Higher index means stronger demand pressure against local capacity.'}</p>
                        </div>
                        <div className="score-card potential">
                          <div className="score-card-top">
                            <span>{lang === 'ms' ? 'Potensi kemakmuran' : 'Prosperity potential'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong>{selectedState.prosperity_score}<small>/100</small></strong>
                              <DataStatusBadge status="derived" compact source="DOSM DTS 2025 + Population" period="2025" />
                            </div>
                          </div>
                          <ScoreBar label={lang === 'ms' ? 'Potensi kemakmuran' : 'Prosperity potential'} value={selectedState.prosperity_score} />
                          <p>{lang === 'ms' ? 'Indeks lebih tinggi menunjukkan ruang penyerapan pelancongan bermalam bernilai tinggi.' : 'Higher index indicates room for high-value overnight tourism capture.'}</p>
                        </div>
                      </div>
                      <div className="metric-line">
                        <span>
                          {lang === 'ms' ? 'Pelawat / 100 penduduk' : 'Visitors / 100 residents'} <strong>{selectedState.visitors_per_100_residents}</strong>
                          <DataStatusBadge status="derived" compact />
                        </span>
                        <span>
                          {lang === 'ms' ? 'Pertumbuhan pelawat' : 'Visitor growth'} <strong className="green">{formatPct(selectedState.visitor_growth_yoy)}</strong>
                          <DataStatusBadge status="derived" compact />
                        </span>
                        <span>
                          {lang === 'ms' ? 'Komposisi pelancong' : 'Tourist mix'} <strong>{selectedState.tourist_mix_pct}%</strong>
                          <DataStatusBadge status="observed" compact />
                        </span>
                      </div>
                      {selectedState.score_decomposition && (
                        <div className="decomp-toggle-wrap">
                          <button
                            type="button"
                            className="outline-button"
                            onClick={() => setShowDecomp(!showDecomp)}
                            aria-expanded={showDecomp}
                          >
                            {showDecomp ? (lang === 'ms' ? '▲ Sorok pecahan skor' : '▲ Hide score breakdown') : (lang === 'ms' ? '▼ Papar pecahan skor telus' : '▼ Show score breakdown')}
                          </button>
                          {showDecomp && (
                            <ScoreDecomposition
                              state={selectedState.state}
                              pressureDecomp={selectedState.score_decomposition.pressure}
                              prosperityDecomp={selectedState.score_decomposition.prosperity}
                              sensitiveToWeights={selectedState.score_decomposition.sensitive_to_weights}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'policy' && (
            <PolicyOptionsView
              stateName={selected}
              options={(data.policy_templates?.[selected] ?? data.policy_templates?.[Object.keys(data.policy_templates ?? {})[0]] ?? []) as any}
            />
          )}

          {tab === 'decisions' && (
            <DecisionRegister decisions={(data.decision_register ?? []) as Decision[]} />
          )}

          {tab === 'scenario' && (
            <div className="scenario-view">
              <div className="scenario-hero">
                <div>
                  <p className="kicker">{lang === 'ms' ? 'SIMULATOR INTERVENSI' : 'INTERVENTION SIMULATOR'}</p>
                  <h2>
                    {lang === 'ms' ? 'Bagaimana jika kita anjakkan permintaan' : 'What if we shift demand'}
                    <br />
                    <em>{lang === 'ms' ? 'sebelum menjadi tekanan melampau?' : 'before it becomes pressure?'}</em>
                  </h2>
                  <p>
                    {lang === 'ms'
                      ? 'Terokai intervensi portfolio berasaskan isyarat peringkat negeri DOSM. Setiap kawalan adalah telus tanpa sebarang algoritma tertutup yang disembunyikan.'
                      : 'Explore a directional portfolio intervention using DOSM’s state-level signals. Every control is transparent; no black-box recommendation is concealed.'}
                  </p>
                </div>
                <div className="scenario-orbit">
                  <Sparkles size={24} />
                  <span>
                    {lang === 'ms' ? 'Makmal' : 'Scenario'}
                    <br />
                    <strong>{lang === 'ms' ? 'Dasar 01' : 'Lab 01'}</strong>
                  </span>
                </div>
              </div>
              <div className="scenario-grid">
                <div className="panel control-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{lang === 'ms' ? 'Tuas dasar' : 'Policy levers'}</span>
                      <h2>{lang === 'ms' ? 'Tetapkan had sempadan' : 'Set guardrails'}</h2>
                    </div>
                    <SlidersHorizontal size={20} />
                  </div>
                  <label>
                    {lang === 'ms' ? 'Anjakan promosi kemuncak ke negeri bertekanan rendah' : 'Shift peak promotion to lower-pressure states'} <output>{promotion}%</output>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={promotion}
                    onChange={(event) => setPromotion(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>{lang === 'ms' ? '0% kempen menyeluruh' : '0% broad campaign'}</span>
                    <span>{lang === 'ms' ? '30% anjakan permintaan' : '30% demand shift'}</span>
                  </div>
                  <label>
                    {lang === 'ms' ? 'Indeks pelaburan kapasiti' : 'Capacity investment index'} <output>{capacity}</output>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={capacity}
                    onChange={(event) => setCapacity(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>{lang === 'ms' ? 'Berasaskan promosi' : 'Promotion-led'}</span>
                    <span>{lang === 'ms' ? 'Berasaskan kapasiti' : 'Capacity-led'}</span>
                  </div>
                  <label>
                    {lang === 'ms' ? 'Had siling skor tekanan maksimum' : 'Maximum pressure score cap'} <output>{pressureCap}</output>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={pressureCap}
                    onChange={(event) => setPressureCap(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>{lang === 'ms' ? 'Had perlindungan' : 'Protective cap'}</span>
                    <span>{lang === 'ms' ? 'Pencarian pertumbuhan' : 'Growth-seeking'}</span>
                  </div>
                  <button className="primary-button full" onClick={runScenario}>
                    <Sparkles size={16} /> {lang === 'ms' ? 'Simulasi portfolio' : 'Simulate portfolio'}
                  </button>
                  <p className="control-footnote">
                    {lang === 'ms'
                      ? 'Model saringan menganggarkan imbangan arah dan anjakan portfolio tanpa membuat tuntutan ekonometrik kausal.'
                      : 'The screening model estimates directional trade-offs and portfolio shifts. It does not claim causal econometric impact.'}
                  </p>
                </div>
                <div className="panel scenario-results">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">{lang === 'ms' ? 'Hasil senario' : 'Scenario result'}</span>
                      <h2>{scenario ? (lang === 'ms' ? 'Had sempadan mengubah keutamaan' : 'Guardrails change the queue') : (lang === 'ms' ? 'Sedia untuk pemodelan' : 'Ready to model')}</h2>
                    </div>
                    {scenario && <span className="pill">{lang === 'ms' ? 'Anggaran awal' : 'Preview estimate'}</span>}
                  </div>
                  {!scenario ? (
                    <div className="empty-scenario">
                      <div className="empty-icon">
                        <Sparkles size={22} />
                      </div>
                      <strong>{lang === 'ms' ? 'Pilih had sempadan dasar anda' : 'Choose your guardrails'}</strong>
                      <p>{lang === 'ms' ? 'Laraskan tuas dasar di sebelah kiri, kemudian jalankan simulasi untuk menganggarkan pengurangan tekanan berbanding peningkatan nilai.' : 'Adjust the policy levers on the left, then run the simulation to model pressure reduction versus value lift.'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="scenario-kpis">
                        <div>
                          <small>{lang === 'ms' ? 'Negeri tekanan tinggi' : 'High-pressure states'}</small>
                          <strong>
                            {scenario.before_high_pressure} → {scenario.after_high_pressure}
                          </strong>
                          <span>
                            <ArrowDownRight size={14} /> {lang === 'ms' ? 'berkurang melepasi had' : 'fewer above cap'}
                          </span>
                        </div>
                        <div>
                          <small>{lang === 'ms' ? 'Pengurangan tekanan' : 'Pressure reduced'}</small>
                          <strong>{scenario.estimated_pressure_reduction}</strong>
                          <span>
                            <ArrowDownRight size={14} /> {lang === 'ms' ? 'mata indeks' : 'index points'}
                          </span>
                        </div>
                        <div>
                          <small>{lang === 'ms' ? 'Peningkatan nilai' : 'Value lift'}</small>
                          <strong>+{scenario.estimated_value_lift}</strong>
                          <span>
                            <ArrowUpRight size={14} /> {lang === 'ms' ? 'mata indeks' : 'index points'}
                          </span>
                        </div>
                      </div>
                      <div className="scenario-table">
                        <div className="table-head">
                          <span>{lang === 'ms' ? 'Negeri' : 'State'}</span>
                          <span>{lang === 'ms' ? 'Anjakan tekanan' : 'Pressure shift'}</span>
                          <span>{lang === 'ms' ? 'Anjakan nilai' : 'Value shift'}</span>
                        </div>
                        {[...scenario.states]
                          .sort((a, b) => a.pressure_after - b.pressure_after)
                          .slice(0, 8)
                          .map((item) => (
                            <div className="table-row" key={item.state}>
                              <strong>{item.state}</strong>
                              <span className={item.pressure_after < item.pressure_before ? 'good' : 'watch'}>
                                {item.pressure_after < item.pressure_before ? '↓' : '↑'}{' '}
                                {Math.abs(item.pressure_after - item.pressure_before).toFixed(1)}
                              </span>
                              <span className={item.prosperity_after >= item.prosperity_before ? 'good' : 'watch'}>
                                {item.prosperity_after >= item.prosperity_before ? '+' : ''}
                                {(item.prosperity_after - item.prosperity_before).toFixed(1)}
                              </span>
                            </div>
                          ))}
                      </div>
                      <div className="scenario-note">
                        <CircleHelp size={16} /> {scenario.assumptions.note}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'method' && (
            <EvidenceMethodView
              sources={data.sources as any}
              dataQuality={data.data_quality as any}
              dataDictionary={data.data_dictionary as any}
              dataAsOf={data.data_as_of || 'Latest DOSM extract'}
              generatedAt={data.generated_at || '—'}
            />
          )}
        </section>
      </div>

      {copilotOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={lang === 'ms' ? 'Kopilot dasar' : 'Policy copilot'}>
          <div className="modal-card">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{lang === 'ms' ? 'PEMBANTU SUMBER BERASAS' : 'SOURCE-AWARE ASSISTANT'}</span>
                <h2>{lang === 'ms' ? 'Kopilot dasar' : 'Policy copilot'}</h2>
              </div>
              <button className="modal-close" onClick={() => setCopilotOpen(false)} aria-label={lang === 'ms' ? 'Tutup' : 'Close'}>
                ×
              </button>
            </div>
            <p className="modal-copy">
              {lang === 'ms'
                ? 'Tanya tentang mana-mana negeri, tekanan permintaan, perlindungan kapasiti, pertumbuhan, atau nilai tempatan. Maklum balas berpaksikan sepenuhnya kepada ekstrak rasmi DOSM.'
                : 'Ask about any state, demand pressure, capacity safeguards, growth, or local value. Responses are strictly grounded in the official DOSM extract.'}
            </p>
            <form onSubmit={askCopilot} className="copilot-form">
              <input
                autoFocus
                value={copilotQuestion}
                onChange={(event) => setCopilotQuestion(event.target.value)}
                placeholder={lang === 'ms' ? `cth. Mengapa ${selectedState?.state ?? 'Putrajaya'} mengalami tekanan?` : `e.g. Why is ${selectedState?.state ?? 'Putrajaya'} under pressure?`}
              />
              <button className="primary-button" type="submit">
                <Sparkles size={16} /> {lang === 'ms' ? 'Tanya' : 'Ask'}
              </button>
            </form>
            {copilotAnswer && (
              <div className="copilot-answer">
                <div className="copilot-ai-badge">
                  <Sparkles size={12} /> {lang === 'ms' ? 'Dijana AI — memerlukan semakan manusia sebelum kegunaan keputusan' : 'AI Generated — requires human review before decision use'}
                </div>
                {typeof copilotAnswer === 'string' ? (
                  <p>{copilotAnswer}</p>
                ) : (
                  <>
                    {copilotAnswer.evidence && (
                      <div className="copilot-section">
                        <span className="eyebrow">{lang === 'ms' ? 'Bukti' : 'Evidence'}</span>
                        <p>{copilotAnswer.evidence}</p>
                      </div>
                    )}
                    {copilotAnswer.interpretation && (
                      <div className="copilot-section">
                        <span className="eyebrow">{lang === 'ms' ? 'Tafsiran' : 'Interpretation'}</span>
                        <p>{copilotAnswer.interpretation}</p>
                      </div>
                    )}
                    {copilotAnswer.limitations && (
                      <div className="copilot-section caveat-section">
                        <span className="eyebrow"><TriangleAlert size={11} /> {lang === 'ms' ? 'Batasan' : 'Limitations'}</span>
                        <p>{copilotAnswer.limitations}</p>
                      </div>
                    )}
                    {copilotAnswer.next_action && (
                      <div className="copilot-section">
                        <span className="eyebrow">{lang === 'ms' ? 'Tindakan seterusnya' : 'Next action'}</span>
                        <p>{copilotAnswer.next_action}</p>
                      </div>
                    )}
                    {copilotAnswer.answer && <p>{copilotAnswer.answer}</p>}
                  </>
                )}
                <small>{lang === 'ms' ? 'Perkhidmatan bukti tempatan berketetapan · Data rasmi DOSM' : 'Deterministic local evidence service · DOSM official data'}</small>
              </div>
            )}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={lang === 'ms' ? 'Status ruang kerja' : 'Workspace status'}>
          <div className="modal-card compact-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{lang === 'ms' ? 'RUANG KERJA' : 'WORKSPACE'}</span>
                <h2>{lang === 'ms' ? 'Paparan perancangan tempatan' : 'Local planning view'}</h2>
              </div>
              <button className="modal-close" onClick={() => setProfileOpen(false)} aria-label={lang === 'ms' ? 'Tutup' : 'Close'}>
                ×
              </button>
            </div>
            <div className="workspace-row">
              <span>{lang === 'ms' ? 'Ketepatan data' : 'Data vintage'}</span>
              <strong>{data.data_as_of}</strong>
            </div>
            <div className="workspace-row">
              <span>{lang === 'ms' ? 'Negeri & wilayah diindeks' : 'States & territories indexed'}</span>
              <strong>{data.states.length} ({lang === 'ms' ? '16 destinasi' : '16 destinations'})</strong>
            </div>
            <div className="workspace-row">
              <span>{lang === 'ms' ? 'Perkhidmatan API' : 'API services'}</span>
              <strong className="green">Health · Datasets · Scenario · Brief · Ask</strong>
            </div>
            <button
              className="outline-button full"
              onClick={() => {
                setProfileOpen(false)
                setTab('method')
              }}
            >
              <Layers3 size={16} /> {lang === 'ms' ? 'Buka bukti & kaedah' : 'Open evidence & method'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
