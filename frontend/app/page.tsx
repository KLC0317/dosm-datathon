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

function MiniTrend({ positive = true }: { positive?: boolean }) {
  const values = (positive ? [5, 10, 9, 13, 12, 18, 22] : [22, 20, 21, 17, 18, 10, 5]).map((value, index) => ({
    index,
    value,
  }))
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 90,
    height: 30,
    data: { values },
    mark: { type: 'line', stroke: positive ? colors.teal : colors.rust, strokeWidth: 2.8, point: { filled: true, size: 28 } },
    encoding: {
      x: { field: 'index', type: 'quantitative', axis: null },
      y: { field: 'value', type: 'quantitative', axis: null, scale: { zero: false } },
    },
    config: { background: 'transparent', view: { stroke: null } },
  }
  return (
    <VegaEmbed
      className="mini-trend"
      spec={spec as any}
      options={{ actions: false, renderer: 'svg' }}
      aria-label={positive ? 'rising trend' : 'falling trend'}
    />
  )
}

function StatCard({
  label,
  value,
  note,
  trend,
  icon,
  tone = 'lime',
}: {
  label: string
  value: string
  note: string
  trend?: string
  icon: React.ReactNode
  tone?: 'lime' | 'mint' | 'coral' | 'sky'
}) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="eyebrow">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span>{note}</span>
        {trend && <span className="trend-inline">{trend}</span>}
        <MiniTrend positive={!trend?.includes('-')} />
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
            <MapIcon size={18} /> National pressure surface
          </span>
          <small>
            Demand intensity, visitor growth and CPI signals across all 16 Malaysian states and federal territories.
          </small>
        </div>
        <div className="map-controls">
          <div className="map-view-switcher" role="tablist" aria-label="Map view mode">
            <button
              type="button"
              className={mapMode === 'geo' ? 'active' : ''}
              onClick={() => setMapMode('geo')}
              title="Dual-Region Map (West & East Malaysia) with clear territorial labels"
            >
              <MapIcon size={14} /> <span>Regional Map</span>
            </button>
            <button
              type="button"
              className={mapMode === 'grid' ? 'active' : ''}
              onClick={() => setMapMode('grid')}
              title="Equal-area cartogram tile grid for all 16 territories"
            >
              <LayoutGrid size={14} /> <span>Equal-Area Grid</span>
            </button>
            <button
              type="button"
              className={mapMode === 'klang' ? 'active' : ''}
              onClick={() => setMapMode('klang')}
              title="Klang Valley & FTs high-pressure focus"
            >
              <Target size={14} /> <span>FT Epicenter</span>
            </button>
          </div>
          <span className="map-legend">
            <i style={{ background: colors.teal }} /> balanced (0–54)
            <i style={{ background: colors.ochre }} /> watch (55–74)
            <i style={{ background: colors.rust }} /> high pressure (75+)
          </span>
        </div>
      </div>

      {mapMode === 'geo' && (
        <div className="dual-region-map-shell">
          <div className="dual-map-banner">
            <div className="banner-title-area">
              <span className="banner-sub">TOURISM RISK & PROSPERITY ATLAS</span>
              <h2>MALAYSIA</h2>
            </div>
            <div className="banner-stats">
              {activeFocus ? (
                <div className="banner-status-chip">
                  <span className="focus-flag">MY</span>
                  <strong>{activeFocus.state}</strong>
                  <span className="dot">•</span>
                  <span style={{ color: scoreColor(activeFocus.pressure_score), fontWeight: 700 }}>
                    {activeFocus.pressure_score}/100 Pressure
                  </span>
                  <span className="dot">•</span>
                  <span>{activeFocus.visitors_2025_million.toFixed(1)}m visitors</span>
                  <span className="dot">•</span>
                  <span className={`posture-tag ${quadrantClass(activeFocus.quadrant)}`}>{activeFocus.quadrant}</span>
                </div>
              ) : (
                <div className="banner-status-chip">
                  <span>16 States & Federal Territories • Select any territory to focus evidence</span>
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
                  <h4>WEST MALAYSIA</h4>
                  {isWestSelected && isZoomed && (
                    <span className="zoom-tag">ZOOMED: {selected.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isWestSelected && (
                    <button
                      type="button"
                      className={`zoom-pill-btn ${isZoomed ? 'active' : ''}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? 'Zoom out to overview' : `Zoom into ${selected}`}
                    >
                      {isZoomed ? (
                        <>
                          <Minimize2 size={12} /> <span>Overview</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 size={12} /> <span>Zoom in</span>
                        </>
                      )}
                    </button>
                  )}
                  <small>11 States • 2 Federal Territories</small>
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
                            ● {westCallout.record.pressure_score}/100 Pressure ({westCallout.record.quadrant})
                          </text>
                          <text x={12} y={46} fill={colors.muted} fontSize={9.5} fontWeight={600}>
                            {westCallout.record.visitors_2025_million.toFixed(1)}m visitors • {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
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
                  <h4>EAST MALAYSIA</h4>
                  {isEastSelected && isZoomed && (
                    <span className="zoom-tag">ZOOMED: {selected.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isEastSelected && (
                    <button
                      type="button"
                      className={`zoom-pill-btn ${isZoomed ? 'active' : ''}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                      title={isZoomed ? 'Zoom out to overview' : `Zoom into ${selected}`}
                    >
                      {isZoomed ? (
                        <>
                          <Minimize2 size={12} /> <span>Overview</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 size={12} /> <span>Zoom in</span>
                        </>
                      )}
                    </button>
                  )}
                  <small>2 States • 1 Federal Territory</small>
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
                            ● {eastCallout.record.pressure_score}/100 Pressure ({eastCallout.record.quadrant})
                          </text>
                          <text x={12} y={46} fill={colors.muted} fontSize={9.5} fontWeight={600}>
                            {eastCallout.record.visitors_2025_million.toFixed(1)}m visitors • {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
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
              <strong>Equal-Area Cartogram Grid (16 Territories)</strong>
              <p>
                Every state and federal territory has equal visual prominence, ensuring compact urban epicenters like
                Putrajaya and Kuala Lumpur are not geographically eclipsed.
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
                      <small>pressure</small>
                    </span>
                  </div>
                  <div className="cartogram-name">{st.state}</div>
                  <div className="cartogram-metrics">
                    <span>{st.visitors_2025_million.toFixed(1)}m visitors</span>
                    <span className={st.visitor_growth_yoy >= 0 ? 'green' : 'watch'}>
                      {formatPct(st.visitor_growth_yoy)}
                    </span>
                  </div>
                  <div className="cartogram-foot">
                    <span className={`posture-pill ${quadrantClass(st.quadrant)}`}>{st.quadrant}</span>
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
              <strong>Federal Territories & Klang Valley Demand Hub</strong>
              <p>
                Putrajaya and Kuala Lumpur represent Malaysia's highest tourism pressure index. Inspect their carrying
                capacity, visitor ratios, and inflation signals side-by-side.
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
                      <small>pressure</small>
                    </div>
                  </div>

                  <div className="ft-stats-list">
                    <div className="ft-stat-row">
                      <span>Visitors / 100 residents</span>
                      <strong>{st.visitors_per_100_residents.toFixed(1)}</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>2025 Total Visitors</span>
                      <strong>{st.visitors_2025_million.toFixed(2)}m</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>Visitor Growth YoY</span>
                      <strong className="green">{formatPct(st.visitor_growth_yoy)}</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>State CPI YoY</span>
                      <strong>+{st.cpi_yoy.toFixed(2)}%</strong>
                    </div>
                    <div className="ft-stat-row">
                      <span>Tourist Overnight Mix</span>
                      <strong>{st.tourist_mix_pct.toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div className="ft-action-box">
                    <span className="eyebrow">Action direction</span>
                    <strong>{st.action}</strong>
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
                    {isSel ? 'Active on Dashboard' : `Select ${stName}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="map-footnote">
        Select any state or territory to focus its evidence chain. Scores are transparent screening indices, not official
        carrying-capacity limits.
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
  const actual = (data.quarterly_history ?? [])
    .slice(-4)
    .map((row) => ({ period: row.period, value: row.visitors_million, series: 'Actual' }))
  const predicted = (data.forecast?.horizon ?? []).map((row) => ({
    period: row.period,
    value: row.forecast_million,
    lower: row.lower_million,
    upper: row.upper_million,
    series: 'Forecast',
  }))
  const values = [...actual, ...predicted]
  const order = values.map((item) => item.period)
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 270,
    data: { values },
    layer: [
      {
        transform: [{ filter: "datum.series === 'Forecast'" }],
        mark: { type: 'area', opacity: 0.18, color: colors.teal },
        encoding: {
          x: {
            field: 'period',
            type: 'ordinal',
            sort: order,
            axis: { title: null, labelAngle: -25, labelFontSize: 14 },
          },
          y: { field: 'lower', type: 'quantitative', scale: { zero: false }, axis: { title: 'Million visitors', titleFontSize: 15, labelFontSize: 14 } },
          y2: { field: 'upper' },
        },
      },
      {
        mark: { type: 'line', point: { filled: true, size: 90 }, strokeWidth: 3.2 },
        encoding: {
          x: { field: 'period', type: 'ordinal', sort: order },
          y: { field: 'value', type: 'quantitative', scale: { zero: false } },
          color: {
            field: 'series',
            type: 'nominal',
            scale: { domain: ['Actual', 'Forecast'], range: [colors.tealLight, colors.tealDeep] },
            legend: { title: null, orient: 'top', labelFontSize: 14 },
          },
          tooltip: [
            { field: 'period', title: 'Quarter' },
            { field: 'series', title: 'Series' },
            { field: 'value', title: 'Visitors (m)', format: '.2f' },
            { field: 'lower', title: 'Lower (m)', format: '.2f' },
            { field: 'upper', title: 'Upper (m)', format: '.2f' },
          ],
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function MatrixVega({ states }: { states: StateRecord[] }) {
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 350,
    data: { values: states },
    params: [{ name: 'stateSelect', select: { type: 'point', fields: ['state'] } }],
    mark: { type: 'circle', opacity: 0.88, stroke: '#ffffff', strokeWidth: 1.6 },
    encoding: {
      x: {
        field: 'pressure_score',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: { title: 'Pressure risk →', titleFontSize: 15, labelFontSize: 14 },
      },
      y: {
        field: 'prosperity_score',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: { title: 'Prosperity potential', titleFontSize: 15, labelFontSize: 14 },
      },
      size: { field: 'visitors_2025_million', type: 'quantitative', scale: { range: [110, 1000] }, legend: null },
      color: {
        field: 'quadrant',
        type: 'nominal',
        scale: {
          domain: ['Manage growth', 'Grow selectively', 'Build readiness', 'Protect value'],
          range: [colors.rust, colors.teal, colors.slate, colors.ochre],
        },
        legend: { title: 'Policy posture', orient: 'top', labelFontSize: 14, titleFontSize: 15 },
      },
      tooltip: [
        { field: 'state', title: 'State' },
        { field: 'quadrant', title: 'Recommended posture' },
        { field: 'pressure_score', title: 'Pressure', format: '.0f' },
        { field: 'prosperity_score', title: 'Prosperity', format: '.0f' },
        { field: 'visitors_2025_million', title: 'Visitors (m)', format: '.2f' },
      ],
    },
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function PortfolioVega({ states }: { states: StateRecord[] }) {
  const values = ['Manage growth', 'Grow selectively', 'Build readiness', 'Protect value'].map((group) => ({
    group,
    states: states.filter((state) => state.quadrant === group).length,
    label: `${states.filter((state) => state.quadrant === group).length} states`,
  }))
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 225,
    data: { values },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusEnd: 6, size: 30 },
        encoding: {
          y: { field: 'group', type: 'nominal', sort: '-x', axis: { title: null, labelFontSize: 14 } },
          x: {
            field: 'states',
            type: 'quantitative',
            scale: { domain: [0, Math.max(5, ...values.map((item) => item.states))] },
            axis: { title: 'States', tickCount: 4, labelFontSize: 13, titleFontSize: 14 },
          },
          color: {
            field: 'group',
            type: 'nominal',
            scale: {
              domain: ['Manage growth', 'Grow selectively', 'Build readiness', 'Protect value'],
              range: [colors.rust, colors.teal, colors.slate, colors.ochre],
            },
            legend: null,
          },
          tooltip: [{ field: 'group', title: 'Policy posture' }, { field: 'states', title: 'States' }],
        },
      },
      {
        mark: { type: 'text', align: 'left', dx: 8, fontSize: 14, fontWeight: 700, color: colors.inkSoft },
        encoding: {
          y: { field: 'group', type: 'nominal', sort: '-x' },
          x: { field: 'states', type: 'quantitative' },
          text: { field: 'label' },
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function FlowVega() {
  const values = [
    { signal: 'Demand intensity', posture: 'Manage growth', score: 0.86 },
    { signal: 'Demand intensity', posture: 'Grow selectively', score: 0.58 },
    { signal: 'Demand intensity', posture: 'Build readiness', score: 0.32 },
    { signal: 'Demand intensity', posture: 'Protect value', score: 0.2 },
    { signal: 'Growth momentum', posture: 'Manage growth', score: 0.7 },
    { signal: 'Growth momentum', posture: 'Grow selectively', score: 0.82 },
    { signal: 'Growth momentum', posture: 'Build readiness', score: 0.45 },
    { signal: 'Growth momentum', posture: 'Protect value', score: 0.24 },
    { signal: 'CPI / environment', posture: 'Manage growth', score: 0.5 },
    { signal: 'CPI / environment', posture: 'Grow selectively', score: 0.42 },
    { signal: 'CPI / environment', posture: 'Build readiness', score: 0.65 },
    { signal: 'CPI / environment', posture: 'Protect value', score: 0.76 },
  ]
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 245,
    data: { values },
    layer: [
      {
        mark: { type: 'rect', cornerRadius: 5, stroke: colors.card, strokeWidth: 4 },
        encoding: {
          x: {
            field: 'posture',
            type: 'nominal',
            sort: ['Manage growth', 'Grow selectively', 'Build readiness', 'Protect value'],
            axis: { title: null, labelAngle: -18, labelFontSize: 13 },
          },
          y: {
            field: 'signal',
            type: 'nominal',
            sort: ['Demand intensity', 'Growth momentum', 'CPI / environment'],
            axis: { title: null, labelFontSize: 13 },
          },
          color: {
            field: 'score',
            type: 'quantitative',
            scale: { domain: [0, 1], range: [colors.teal, colors.ochre] },
            legend: { title: 'Signal weight', orient: 'top', format: '.0%', labelFontSize: 13, titleFontSize: 14 },
          },
          tooltip: [
            { field: 'signal', title: 'Evidence signal' },
            { field: 'posture', title: 'Policy posture' },
            { field: 'score', title: 'Weight', format: '.0%' },
          ],
        },
      },
      {
        mark: { type: 'text', fontSize: 14, fontWeight: 700, color: colors.inkSoft },
        encoding: {
          x: {
            field: 'posture',
            type: 'nominal',
            sort: ['Manage growth', 'Grow selectively', 'Build readiness', 'Protect value'],
          },
          y: { field: 'signal', type: 'nominal', sort: ['Demand intensity', 'Growth momentum', 'CPI / environment'] },
          text: { field: 'score', type: 'quantitative', format: '.0%' },
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function TopStatesVega({ states }: { states: StateRecord[] }) {
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
            axis: { title: 'Pressure risk index', tickCount: 5, labelFontSize: 13, titleFontSize: 14 },
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
            { field: 'state', title: 'State' },
            { field: 'pressure', title: 'Pressure score' },
            { field: 'prosperity', title: 'Prosperity score' },
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
  const values = environment
    ? Object.entries(environment.latest).map(([pollutant, item]) => ({
        pollutant,
        value: item.stress_score,
        mean: item.rolling_12m_mean,
      }))
    : []
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 175,
    data: { values },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusEnd: 5, size: 24 },
        encoding: {
          y: { field: 'pollutant', type: 'nominal', axis: { title: null, labelFontSize: 13 } },
          x: {
            field: 'value',
            type: 'quantitative',
            scale: { domain: [0, 100] },
            axis: { title: 'Stress index', tickCount: 4, labelFontSize: 13, titleFontSize: 14 },
          },
          color: {
            field: 'value',
            type: 'quantitative',
            scale: { domain: [0, 50, 100], range: [colors.teal, colors.ochre, colors.rust] },
            legend: null,
          },
          tooltip: [
            { field: 'pollutant', title: 'Pollutant' },
            { field: 'value', title: 'Stress score' },
            { field: 'mean', title: '12m mean', format: '.3f' },
          ],
        },
      },
      {
        mark: { type: 'text', align: 'left', dx: 8, color: colors.inkSoft, fontSize: 13, fontWeight: 700 },
        encoding: {
          y: { field: 'pollutant', type: 'nominal' },
          x: { field: 'value', type: 'quantitative' },
          text: { field: 'value', type: 'quantitative', format: '.0f' },
        },
      },
    ],
    config: VEGA_THEME,
  }
  return <VegaEmbed spec={spec as any} options={{ actions: false, renderer: 'svg' }} />
}

function ForecastPanel({ data }: { data: DashboardData }) {
  const forecast = data.forecast
  const environment = data.environment
  if (!forecast?.horizon?.length) return null

  return (
    <div className="forecast-row">
      <div className="panel forecast-panel">
        <div className="panel-heading">
          <div className="visual-heading">
            <span>
              <TrendingUp size={18} /> Visitor demand forecast
            </span>
            <small>Expected domestic visitors for the next four quarters. Shaded range shows 95% model uncertainty.</small>
          </div>
          <span className="pill">{forecast.selected_model}</span>
        </div>
        <ForecastVega data={data} />
        <div className="forecast-foot">
          <span>Actual historical quarters vs rolling holdout forecast</span>
          <span className="forecast-key">
            <i /> 4Q Horizon + 95% uncertainty band
          </span>
          <span>Holdout RMSE: {forecast.backtest.candidates[forecast.backtest.selected_model]?.rmse ?? '?'}m</span>
        </div>
        <div className="forecast-drivers">
          {forecast.explainability.map((driver) => (
            <span key={driver.driver}>
              <strong>{driver.driver}</strong> {driver.detail}
            </span>
          ))}
        </div>
      </div>
      <div className="panel environment-panel">
        <div className="panel-heading">
          <div className="visual-heading">
            <span>
              <TriangleAlert size={18} /> Environmental context
            </span>
            <small>OpenDOSM air-quality stress index alongside tourism demand.</small>
          </div>
          <span className="confidence medium">{environment?.stress_score ?? 0}/100</span>
        </div>
        <p className="environment-copy">
          Official monthly air pollutant concentrations track ambient stress. Planners can audit whether destination
          surges arrive alongside ecological or local carrying burden.
        </p>
        <div className="environment-chart">
          <EnvironmentVega environment={environment} />
        </div>
        {environment &&
          Object.entries(environment.latest)
            .slice(0, 4)
            .map(([name, value]) => (
              <div className="environment-line" key={name}>
                <span>{name}</span>
                <strong>{value.rolling_12m_mean}</strong>
                <small>{value.stress_score.toFixed(0)} stress</small>
              </div>
            ))}
        <small className="environment-note">
          National benchmark context: official monthly catalogue does not publish continuous state-level monitoring stations.
        </small>
      </div>
    </div>
  )
}

function PortfolioVisuals({ states }: { states: StateRecord[] }) {
  return (
    <div className="portfolio-visuals">
      <div className="panel sunburst-panel">
        <div className="visual-heading">
          <span>
            <CircleHelp size={18} /> Portfolio posture distribution
          </span>
          <small>Breakdown of all 16 states and territories across the 4 policy allocation quadrants.</small>
        </div>
        <div className="vega-portfolio">
          <PortfolioVega states={states} />
        </div>
      </div>
      <div className="panel sankey-panel">
        <div className="visual-heading">
          <span>
            <Waypoints size={18} /> Evidence-to-action matrix
          </span>
          <small>Inspect how empirical evidence signals map to strategic destination postures.</small>
        </div>
        <FlowVega />
      </div>
    </div>
  )
}

export default function Home() {
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
  const [darkMode, setDarkMode] = useState(true)
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
        assumptions: { note: 'Local preview scenario using the transparent screening model.' },
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
        evidence: `${selectedState?.state}: pressure ${selectedState?.pressure_score}/100, prosperity ${selectedState?.prosperity_score}/100. Visitor growth: ${formatPct(selectedState?.visitor_growth_yoy ?? 0)}. CPI YoY: +${selectedState?.cpi_yoy?.toFixed(2) ?? 0}%.`,
        interpretation: `Recommended direction: ${selectedState?.action}. ${selectedState?.action_detail}`,
        limitations: 'This is a deterministic local response using DOSM screening indices. No causal claims are made.',
        next_action: 'Review the Evidence & Method tab for full source traceability. Human review required before decision use.',
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
        <p>Loading DOSM evidence layer…</p>
      </main>
    )

  return (
    <main className={`app-shell ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="topbar">
        <div
          className="brand"
          onClick={() => setTab('overview')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setTab('overview')}
          title="Destinasi Seimbang — Return to Command Centre"
        >
          <div className="brand-logo-text">
            <div className="brand-wordmark">
              <span className="logo-destinasi">Destinasi</span>
              <span className="logo-slash" aria-hidden="true">/</span>
              <span className="logo-seimbang">Seimbang</span>
              <span className="logo-badge">DOSM</span>
            </div>
            <div className="brand-subline">
              <span>Tourism pressure</span>
              <span className="subline-arrow">→</span>
              <span>prosperity intelligence</span>
            </div>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary navigation">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            Command centre
          </button>
          <button className={tab === 'policy' ? 'active' : ''} onClick={() => setTab('policy')}>
            Policy options
          </button>
          <button className={tab === 'scenario' ? 'active' : ''} onClick={() => setTab('scenario')}>
            What-if lab
          </button>
          <button className={tab === 'decisions' ? 'active' : ''} onClick={() => setTab('decisions')}>
            Decision log
            {data.decision_register && data.decision_register.length > 0 && (
              <span className="nav-tab-badge">{data.decision_register.length}</span>
            )}
          </button>
          <button className={tab === 'method' ? 'active' : ''} onClick={() => setTab('method')}>
            Evidence &amp; method
          </button>
        </nav>
        <div className="top-actions">
          {data.alerts && data.alerts.length > 0 && (
            <AlertPanel alerts={data.alerts as any} onSelectState={(s) => { setSelected(s); setTab('overview') }} />
          )}
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((value) => !value)}
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            <span className={darkMode ? 'active' : ''}>Dark</span>
            <span className={!darkMode ? 'active' : ''}>Light</span>
          </button>
          <button className="icon-button" aria-label="Print / export PDF" onClick={handlePrint} title="Print / Save as PDF">
            <Printer size={18} />
          </button>
          <button className="icon-button" aria-label="Refresh data" onClick={() => location.reload()}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="content">
          <div className="content-heading">
            <div>
              <h1>
                Make the next ringgit
                <br />
                <em>work harder.</em>
              </h1>
              <p className="heading-copy">
                A public-sector policy workspace for deciding where Malaysian tourism can absorb growth, where it requires
                safeguards, and what intervention creates the most local prosperity.
              </p>
            </div>
          </div>

          {tab === 'overview' && (
            <div className="overview-dashboard">
              <div className="stat-grid">
                <StatCard
                  label="Domestic visitors"
                  value="290.1m"
                  note="2025 total"
                  trend="+11.5%"
                  icon={<TrendingUp size={18} />}
                  tone="lime"
                />
                <StatCard
                  label="Tourism expenditure"
                  value="RM121.3b"
                  note="2025 total"
                  trend="+13.6%"
                  icon={<BarChart3 size={18} />}
                  tone="mint"
                />
                <StatCard
                  label="Latest quarterly pulse"
                  value={`${data.latest_quarter?.visitors_million ?? 74.7}m`}
                  note={`${data.latest_quarter?.quarter ?? 'Q1 2026'} visitors`}
                  trend={`+${data.latest_quarter?.visitor_yoy ?? 7.2}%`}
                  icon={<Target size={18} />}
                  tone="sky"
                />
                <StatCard
                  label="Pressure watchlist"
                  value={`${sortedPressure.filter((state) => state.pressure_score >= 60).length} states`}
                  note="Screening signal"
                  trend="review"
                  icon={<TriangleAlert size={18} />}
                  tone="coral"
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
                      <span className="eyebrow">Priority queue</span>
                      <h2>Where attention goes next</h2>
                    </div>
                    <button className="more-button" onClick={() => setShowAll((value) => !value)}>
                      {showAll ? 'Show top 5' : 'View all 16'} <ChevronRight size={15} />
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
                          <small>{state.action}</small>
                        </span>
                        <span className="priority-score" style={{ color: scoreColor(state.pressure_score) }}>
                          {state.pressure_score}
                          <small>pressure</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  <div className="queue-note">
                    <CircleHelp size={16} />
                    <span>Ranking balances demand density, visitor growth velocity, and state CPI inflation pressure.</span>
                  </div>
                </div>
              </div>

              <div className="top-states-panel panel">
                <div className="panel-heading">
                  <div className="visual-heading">
                    <span>
                      <TrendingUp size={18} /> State pressure leaders
                    </span>
                    <small>Top destinations requiring near-term attention. Select a flag to focus the map and evidence card.</small>
                  </div>
                  <span className="pill">Top 8</span>
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
                          <small>{state.action}</small>
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
                      <span className="eyebrow">Decision matrix</span>
                      <h2>Pressure × prosperity</h2>
                    </div>
                    <span className="pill">16 states & territories</span>
                  </div>
                  <div className="matrix-vega">
                    <MatrixVega states={data.states} />
                  </div>
                </div>
                <div className="panel profile-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">Selected destination</span>
                      <h2>{selectedState?.state || '—'}</h2>
                    </div>
                    <span className={`confidence ${selectedState?.confidence?.toLowerCase()}`}>
                      {selectedState?.confidence} confidence
                    </span>
                  </div>
                  {selectedState && (
                    <>
                      <div className="profile-action">
                        <div className="action-icon">
                          <Target size={20} />
                        </div>
                        <div>
                          <span className="eyebrow">Recommended policy direction</span>
                          <strong>{selectedState.action}</strong>
                          <p>{selectedState.action_detail}</p>
                        </div>
                      </div>
                      <div className="score-bars">
                        <div className="score-card risk">
                          <div className="score-card-top">
                            <span>Pressure risk</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong>{selectedState.pressure_score}<small>/100</small></strong>
                              <DataStatusBadge status="derived" compact source="DOSM DTS 2025 + CPI + Population" period="2025" />
                            </div>
                          </div>
                          <ScoreBar label="Pressure risk" value={selectedState.pressure_score} tone="coral" />
                          <p>Higher index means stronger demand pressure against local capacity.</p>
                        </div>
                        <div className="score-card potential">
                          <div className="score-card-top">
                            <span>Prosperity potential</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong>{selectedState.prosperity_score}<small>/100</small></strong>
                              <DataStatusBadge status="derived" compact source="DOSM DTS 2025 + Population" period="2025" />
                            </div>
                          </div>
                          <ScoreBar label="Prosperity potential" value={selectedState.prosperity_score} />
                          <p>Higher index indicates room for high-value overnight tourism capture.</p>
                        </div>
                      </div>
                      <div className="metric-line">
                        <span>
                          Visitors / 100 residents <strong>{selectedState.visitors_per_100_residents}</strong>
                          <DataStatusBadge status="derived" compact />
                        </span>
                        <span>
                          Visitor growth <strong className="green">{formatPct(selectedState.visitor_growth_yoy)}</strong>
                          <DataStatusBadge status="derived" compact />
                        </span>
                        <span>
                          Tourist mix <strong>{selectedState.tourist_mix_pct}%</strong>
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
                            {showDecomp ? '▲ Hide score breakdown' : '▼ Show score breakdown'}
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
                  <p className="kicker">INTERVENTION SIMULATOR</p>
                  <h2>
                    What if we shift demand
                    <br />
                    <em>before it becomes pressure?</em>
                  </h2>
                  <p>
                    Explore a directional portfolio intervention using DOSM’s state-level signals. Every control is transparent;
                    no black-box recommendation is concealed.
                  </p>
                </div>
                <div className="scenario-orbit">
                  <Sparkles size={24} />
                  <span>
                    Scenario
                    <br />
                    <strong>Lab 01</strong>
                  </span>
                </div>
              </div>
              <div className="scenario-grid">
                <div className="panel control-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">Policy levers</span>
                      <h2>Set guardrails</h2>
                    </div>
                    <SlidersHorizontal size={20} />
                  </div>
                  <label>
                    Shift peak promotion to lower-pressure states <output>{promotion}%</output>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={promotion}
                    onChange={(event) => setPromotion(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>0% broad campaign</span>
                    <span>30% demand shift</span>
                  </div>
                  <label>
                    Capacity investment index <output>{capacity}</output>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={capacity}
                    onChange={(event) => setCapacity(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>Promotion-led</span>
                    <span>Capacity-led</span>
                  </div>
                  <label>
                    Maximum pressure score cap <output>{pressureCap}</output>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={pressureCap}
                    onChange={(event) => setPressureCap(+event.target.value)}
                  />
                  <div className="range-note">
                    <span>Protective cap</span>
                    <span>Growth-seeking</span>
                  </div>
                  <button className="primary-button full" onClick={runScenario}>
                    <Sparkles size={16} /> Simulate portfolio
                  </button>
                  <p className="control-footnote">
                    The screening model estimates directional trade-offs and portfolio shifts. It does not claim causal econometric impact.
                  </p>
                </div>
                <div className="panel scenario-results">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">Scenario result</span>
                      <h2>{scenario ? 'Guardrails change the queue' : 'Ready to model'}</h2>
                    </div>
                    {scenario && <span className="pill">Preview estimate</span>}
                  </div>
                  {!scenario ? (
                    <div className="empty-scenario">
                      <div className="empty-icon">
                        <Sparkles size={22} />
                      </div>
                      <strong>Choose your guardrails</strong>
                      <p>Adjust the policy levers on the left, then run the simulation to model pressure reduction versus value lift.</p>
                    </div>
                  ) : (
                    <>
                      <div className="scenario-kpis">
                        <div>
                          <small>High-pressure states</small>
                          <strong>
                            {scenario.before_high_pressure} → {scenario.after_high_pressure}
                          </strong>
                          <span>
                            <ArrowDownRight size={14} /> fewer above cap
                          </span>
                        </div>
                        <div>
                          <small>Pressure reduced</small>
                          <strong>{scenario.estimated_pressure_reduction}</strong>
                          <span>
                            <ArrowDownRight size={14} /> index points
                          </span>
                        </div>
                        <div>
                          <small>Value lift</small>
                          <strong>+{scenario.estimated_value_lift}</strong>
                          <span>
                            <ArrowUpRight size={14} /> index points
                          </span>
                        </div>
                      </div>
                      <div className="scenario-table">
                        <div className="table-head">
                          <span>State</span>
                          <span>Pressure shift</span>
                          <span>Value shift</span>
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Policy copilot">
          <div className="modal-card">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">SOURCE-AWARE ASSISTANT</span>
                <h2>Policy copilot</h2>
              </div>
              <button className="modal-close" onClick={() => setCopilotOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="modal-copy">
              Ask about any state, demand pressure, capacity safeguards, growth, or local value. Responses are strictly grounded in
              the official DOSM extract.
            </p>
            <form onSubmit={askCopilot} className="copilot-form">
              <input
                autoFocus
                value={copilotQuestion}
                onChange={(event) => setCopilotQuestion(event.target.value)}
                placeholder={`e.g. Why is ${selectedState?.state ?? 'Putrajaya'} under pressure?`}
              />
              <button className="primary-button" type="submit">
                <Sparkles size={16} /> Ask
              </button>
            </form>
            {copilotAnswer && (
              <div className="copilot-answer">
                <div className="copilot-ai-badge">
                  <Sparkles size={12} /> AI Generated — requires human review before decision use
                </div>
                {typeof copilotAnswer === 'string' ? (
                  <p>{copilotAnswer}</p>
                ) : (
                  <>
                    {copilotAnswer.evidence && (
                      <div className="copilot-section">
                        <span className="eyebrow">Evidence</span>
                        <p>{copilotAnswer.evidence}</p>
                      </div>
                    )}
                    {copilotAnswer.interpretation && (
                      <div className="copilot-section">
                        <span className="eyebrow">Interpretation</span>
                        <p>{copilotAnswer.interpretation}</p>
                      </div>
                    )}
                    {copilotAnswer.limitations && (
                      <div className="copilot-section caveat-section">
                        <span className="eyebrow"><TriangleAlert size={11} /> Limitations</span>
                        <p>{copilotAnswer.limitations}</p>
                      </div>
                    )}
                    {copilotAnswer.next_action && (
                      <div className="copilot-section">
                        <span className="eyebrow">Next action</span>
                        <p>{copilotAnswer.next_action}</p>
                      </div>
                    )}
                    {copilotAnswer.answer && <p>{copilotAnswer.answer}</p>}
                  </>
                )}
                <small>Deterministic local evidence service · DOSM official data</small>
              </div>
            )}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Workspace status">
          <div className="modal-card compact-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">WORKSPACE</span>
                <h2>Local planning view</h2>
              </div>
              <button className="modal-close" onClick={() => setProfileOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="workspace-row">
              <span>Data vintage</span>
              <strong>{data.data_as_of}</strong>
            </div>
            <div className="workspace-row">
              <span>States & territories indexed</span>
              <strong>{data.states.length} (16 destinations)</strong>
            </div>
            <div className="workspace-row">
              <span>API services</span>
              <strong className="green">Health · Datasets · Scenario · Brief · Ask</strong>
            </div>
            <button
              className="outline-button full"
              onClick={() => {
                setProfileOpen(false)
                setTab('method')
              }}
            >
              <Layers3 size={16} /> Open evidence & method
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
