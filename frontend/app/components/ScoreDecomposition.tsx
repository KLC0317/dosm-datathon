'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { DataStatusBadge } from './DataStatusBadge'
import { useLanguage } from '../lib/i18n'

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
  const { t } = useLanguage()

  return (
    <div className="score-decomp-container">
      <div className="decomp-header">
        <span className="eyebrow">{t('decompEyebrow')}</span>
        <h3>{t('decompTitle')} {state}</h3>
        <p className="decomp-note">
          {t('decompNote')}
        </p>
        {sensitiveToWeights && (
          <div className="sensitivity-warning">
            <AlertTriangle size={14} />
            <span>
              {t('decompSensitivityWarning')}
            </span>
          </div>
        )}
      </div>

      <DecompTable label={t('decompPressureTable')} inputs={pressureDecomp.inputs} total={pressureDecomp.stored_score} colorClass="pressure-color" />
      <DecompTable label={t('decompProsperityTable')} inputs={prosperityDecomp.inputs} total={prosperityDecomp.stored_score} colorClass="prosperity-color" />

      <div className="decomp-caveat">
        <Info size={14} />
        <p>{t('decompCaveatText')}</p>
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
  const { t } = useLanguage()

  return (
    <div className="decomp-table-block">
      <div className="decomp-table-title">{label}</div>
      <div className="decomp-table" role="table" aria-label={`${label} decomposition`}>
        <div className="decomp-row decomp-thead" role="row">
          <span role="columnheader">{t('decompColInput')}</span>
          <span role="columnheader">{t('decompColRaw')}</span>
          <span role="columnheader">{t('decompColNorm')}</span>
          <span role="columnheader">{t('decompColWeight')}</span>
          <span role="columnheader">{t('decompColContrib')}</span>
          <span role="columnheader">{t('decompColSource')}</span>
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
            {t('decompTotalScore')}
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
