'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { DataStatusBadge } from './DataStatusBadge'

type ScoreInput = {
  input: string
  raw: number
  raw_unit: string
  normalised: number
  weight: number
  contribution: number
  source: string
  period: string
}

type Decomposition = {
  inputs: ScoreInput[]
  total: number
  stored_score: number
}

type Props = {
  state: string
  pressureDecomp: Decomposition
  prosperityDecomp: Decomposition
  sensitiveToWeights: boolean
}

export function ScoreDecomposition({ state, pressureDecomp, prosperityDecomp, sensitiveToWeights }: Props) {
  return (
    <div className="score-decomp-container">
      <div className="decomp-header">
        <span className="eyebrow">Score decomposition</span>
        <h3>Why {state} has these scores</h3>
        <p className="decomp-note">
          Every figure below is traceable to an official DOSM source. These are relative screening indices, not
          official carrying-capacity measurements.
        </p>
        {sensitiveToWeights && (
          <div className="sensitivity-warning">
            <AlertTriangle size={14} />
            <span>
              <strong>Sensitive to assumptions</strong> — the quadrant classification could change if index weights
              shift by ±10%. Inspect the contributions below.
            </span>
          </div>
        )}
      </div>

      <DecompTable label="Pressure Index" inputs={pressureDecomp.inputs} total={pressureDecomp.stored_score} colorClass="pressure-color" />
      <DecompTable label="Prosperity Potential Index" inputs={prosperityDecomp.inputs} total={prosperityDecomp.stored_score} colorClass="prosperity-color" />

      <div className="decomp-caveat">
        <Info size={14} />
        <p>
          Weights are: Pressure = 50% visitor density + 30% growth + 20% CPI. Prosperity = 35% density + 30%
          growth + 35% overnight mix. All inputs normalised to 0–100 using min-max across all 16 states. Thresholds
          are relative, not absolute carrying-capacity limits.
        </p>
      </div>
    </div>
  )
}

function DecompTable({
  label,
  inputs,
  total,
  colorClass,
}: {
  label: string
  inputs: ScoreInput[]
  total: number
  colorClass: string
}) {
  return (
    <div className="decomp-table-block">
      <div className="decomp-table-title">{label}</div>
      <div className="decomp-table" role="table" aria-label={`${label} decomposition`}>
        <div className="decomp-row decomp-thead" role="row">
          <span role="columnheader">Input</span>
          <span role="columnheader">Raw value</span>
          <span role="columnheader">Normalised (0–100)</span>
          <span role="columnheader">Weight</span>
          <span role="columnheader">Contribution</span>
          <span role="columnheader">Source / period</span>
        </div>
        {inputs.map((inp) => (
          <div key={inp.input} className="decomp-row" role="row">
            <span role="cell" className="decomp-input-name">
              {inp.input}
              <DataStatusBadge status="derived" compact />
            </span>
            <span role="cell">
              {inp.raw} <small>{inp.raw_unit}</small>
            </span>
            <span role="cell">
              <NormBar value={inp.normalised} />
            </span>
            <span role="cell">{(inp.weight * 100).toFixed(0)}%</span>
            <span role="cell" className={`decomp-contribution ${colorClass}`}>
              {inp.contribution.toFixed(1)}
            </span>
            <span role="cell" className="decomp-source">
              <DataStatusBadge status="observed" compact />
              {inp.source}
              <small>{inp.period}</small>
            </span>
          </div>
        ))}
        <div className="decomp-row decomp-total" role="row">
          <span role="cell" className="total-label">
            Index total (stored score)
          </span>
          <span role="cell" />
          <span role="cell" />
          <span role="cell" />
          <span role="cell" className={`decomp-contribution total-score ${colorClass}`}>
            {total}
          </span>
          <span role="cell" />
        </div>
      </div>
    </div>
  )
}

function NormBar({ value }: { value: number }) {
  const color = value >= 75 ? '#7c331d' : value >= 50 ? '#9c6114' : '#17554c'
  return (
    <div className="norm-bar-wrap" aria-label={`${value}/100`}>
      <div
        className="norm-bar-fill"
        style={{ width: `${value}%`, background: color }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <span>{value}</span>
    </div>
  )
}
