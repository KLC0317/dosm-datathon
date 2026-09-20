'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ms'

type DictionaryEntry = { en: string; ms: string }

const DICTIONARY: Record<string, DictionaryEntry> = {
  navOverview: { en: 'Overview', ms: 'Ringkasan' },
  navPolicy: { en: 'Policy', ms: 'Dasar' },
  navScenario: { en: 'Scenario', ms: 'Senario' },
  navDecisions: { en: 'Decisions', ms: 'Keputusan' },
  navMethod: { en: 'Method', ms: 'Kaedah' },

  printAria: { en: 'Print dashboard', ms: 'Cetak papan pemuka' },
  printTitle: { en: 'Print', ms: 'Cetak' },
  refreshAria: { en: 'Refresh data', ms: 'Muat semula data' },

  heroEyebrow: { en: 'Pressure to prosperity intelligence', ms: 'Kecerdasan tekanan kepada kemakmuran' },
  heroH1Line1: { en: 'Balance tourism pressure', ms: 'Imbangkan tekanan pelancongan' },
  heroH1Line2: { en: 'with shared prosperity.', ms: 'dengan kemakmuran bersama.' },
  heroCopy: {
    en: 'A relative pressure-to-prosperity intelligence layer for Malaysia tourism, built for public-sector planning.',
    ms: 'Lapisan kecerdasan tekanan-kepada-kemakmuran relatif bagi pelancongan Malaysia, dibina untuk perancangan sektor awam.',
  },

  statDomesticVisitors: { en: 'Domestic Visitors', ms: 'Pelawat Domestik' },
  statDomesticVisitorsNote: { en: 'DOSM Domestic Tourism Survey 2025', ms: 'Tinjauan Pelancongan Domestik DOSM 2025' },

  alertsTitle: { en: 'Alerts', ms: 'Amaran' },
  noAlerts: { en: 'No active alerts', ms: 'Tiada amaran aktif' },
  dismissAlert: { en: 'Dismiss alert', ms: 'Ketepikan amaran' },
  alertFootnote: {
    en: 'Alerts are generated from threshold breaches in the latest data extract.',
    ms: 'Amaran dijana daripada pelanggaran ambang dalam petikan data terkini.',
  },

  decompEyebrow: { en: 'Score breakdown', ms: 'Pecahan skor' },
  decompTitle: { en: 'How the score is built for', ms: 'Bagaimana skor dibina untuk' },
  decompNote: {
    en: 'Every input, its weight, and its contribution to the final score.',
    ms: 'Setiap input, pemberatnya, dan sumbangannya kepada skor akhir.',
  },
  decompSensitivityWarning: {
    en: 'This score is sensitive to the chosen weights; small weight changes can shift the ranking.',
    ms: 'Skor ini sensitif kepada pemberat yang dipilih; perubahan pemberat kecil boleh mengubah kedudukan.',
  },
  decompPressureTable: { en: 'Pressure inputs', ms: 'Input tekanan' },
  decompProsperityTable: { en: 'Prosperity inputs', ms: 'Input kemakmuran' },
  decompCaveatText: {
    en: 'These are transparent relative screening indices, not official carrying-capacity limits or causal estimates.',
    ms: 'Ini merupakan indeks saringan relatif yang telus, bukan had daya tampung rasmi atau anggaran kausal.',
  },
  decompColInput: { en: 'Input', ms: 'Input' },
  decompColRaw: { en: 'Raw', ms: 'Mentah' },
  decompColNorm: { en: 'Normalised', ms: 'Ternormal' },
  decompColWeight: { en: 'Weight', ms: 'Pemberat' },
  decompColContrib: { en: 'Contribution', ms: 'Sumbangan' },
  decompColSource: { en: 'Source', ms: 'Sumber' },
  decompTotalScore: { en: 'Total score', ms: 'Jumlah skor' },

  evidenceDesc: {
    en: 'Every indicator on this dashboard traces back to a named source and vintage, so you can verify it yourself.',
    ms: 'Setiap penunjuk pada papan pemuka ini boleh dikesan kepada sumber dan tempoh yang dinamakan, supaya anda boleh mengesahkannya sendiri.',
  },
  dictSearchPlaceholder: { en: 'Search metrics…', ms: 'Cari metrik…' },

  policyOptionsDesc: {
    en: 'Evidence-linked intervention options, ranked by expected outcome and reviewable before approval.',
    ms: 'Pilihan intervensi berkait bukti, disusun mengikut hasil dijangka dan boleh disemak sebelum diluluskan.',
  },
  policyDisclaimer: {
    en: 'These options support investigation and planning; they are not automatic policy decisions.',
    ms: 'Pilihan ini menyokong penyiasatan dan perancangan; ia bukan keputusan dasar automatik.',
  },
  targetDest: { en: 'Target destination', ms: 'Destinasi sasaran' },
  targetPop: { en: 'Target population', ms: 'Populasi sasaran' },
  leadAgency: { en: 'Lead agency', ms: 'Agensi peneraju' },
  implPeriod: { en: 'Implementation period', ms: 'Tempoh pelaksanaan' },
  budgetEst: { en: 'Estimated budget', ms: 'Anggaran belanjawan' },
  evidenceSupport: { en: 'Supporting evidence', ms: 'Bukti sokongan' },
  expectedOutput: { en: 'Expected output', ms: 'Output dijangka' },
  intendedOutcome: { en: 'Intended outcome', ms: 'Hasil disasarkan' },
  riskMitigation: { en: 'Risk mitigation', ms: 'Mitigasi risiko' },
  monitoringKpi: { en: 'Monitoring KPI', ms: 'KPI pemantauan' },
  tocTitle: { en: 'Theory of change', ms: 'Teori perubahan' },
}

const SEVERITY: Record<string, DictionaryEntry> = {
  high: { en: 'High', ms: 'Tinggi' },
  medium: { en: 'Medium', ms: 'Sederhana' },
  low: { en: 'Low', ms: 'Rendah' },
}

const STATUS: Record<string, DictionaryEntry> = {
  draft: { en: 'Draft', ms: 'Draf' },
  reviewed: { en: 'Reviewed', ms: 'Disemak' },
  approved: { en: 'Approved', ms: 'Diluluskan' },
  rejected: { en: 'Rejected', ms: 'Ditolak' },
  all: { en: 'All', ms: 'Semua' },
}

const QUADRANT: Record<string, DictionaryEntry> = {
  'Build readiness': { en: 'Build readiness', ms: 'Bina kesediaan' },
  'Grow selectively': { en: 'Grow selectively', ms: 'Berkembang secara terpilih' },
  'Manage growth': { en: 'Manage growth', ms: 'Urus pertumbuhan' },
  'Protect value': { en: 'Protect value', ms: 'Lindungi nilai' },
}

const ACTION: Record<string, DictionaryEntry> = {
  'Capacity-first growth': { en: 'Capacity-first growth', ms: 'Pertumbuhan keutamaan kapasiti' },
  'Product and access pilot': { en: 'Product and access pilot', ms: 'Rintis produk dan akses' },
  'Stabilise first': { en: 'Stabilise first', ms: 'Stabilkan dahulu' },
  'Targeted promotion': { en: 'Targeted promotion', ms: 'Promosi bersasar' },
}

const CONFIDENCE: Record<string, DictionaryEntry> = {
  High: { en: 'High', ms: 'Tinggi' },
  Medium: { en: 'Medium', ms: 'Sederhana' },
  Low: { en: 'Low', ms: 'Rendah' },
}

function lookup(map: Record<string, DictionaryEntry>, key: string, lang: Lang): string {
  return map[key]?.[lang] ?? key
}

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  translateSeverity: (severity: string) => string
  translateStatus: (status: string) => string
  translateQuadrant: (quadrant: string) => string
  translateAction: (action: string) => string
  translateConfidence: (confidence: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => lookup(DICTIONARY, key, lang),
      translateSeverity: (severity) => lookup(SEVERITY, severity, lang),
      translateStatus: (status) => lookup(STATUS, status, lang),
      translateQuadrant: (quadrant) => lookup(QUADRANT, quadrant, lang),
      translateAction: (action) => lookup(ACTION, action, lang),
      translateConfidence: (confidence) => lookup(CONFIDENCE, confidence, lang),
    }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
