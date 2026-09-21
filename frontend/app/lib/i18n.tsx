'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

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

  heroEyebrow: { en: 'Tourism pressure and local benefit, state by state', ms: 'Tekanan pelancongan dan manfaat tempatan, mengikut negeri' },
  heroH1Line1: { en: 'Balance tourism pressure', ms: 'Imbangkan tekanan pelancongan' },
  heroH1Line2: { en: 'with shared prosperity.', ms: 'dengan kemakmuran bersama.' },
  heroCopy: {
    en: 'Every Malaysian state scored two ways: how hard visitor demand is pushing on local capacity, and how much economic value that demand brings in. Built for state and federal tourism planners.',
    ms: 'Setiap negeri di Malaysia diberi skor mengikut dua cara: sejauh mana permintaan pelawat menekan kapasiti tempatan, dan berapa banyak nilai ekonomi yang dibawa oleh permintaan itu. Dibina untuk perancang pelancongan negeri dan persekutuan.',
  },

  statDomesticVisitors: { en: 'Domestic visitors (2025)', ms: 'Pelawat domestik (2025)' },
  statDomesticVisitorsNote: { en: 'Trips within Malaysia, day trips included', ms: 'Perjalanan dalam Malaysia, termasuk lawatan sehari' },

  alertsTitle: { en: 'Alerts', ms: 'Amaran' },
  noAlerts: { en: 'No active alerts', ms: 'Tiada amaran aktif' },
  dismissAlert: { en: 'Dismiss alert', ms: 'Ketepikan amaran' },
  alertFootnote: {
    en: 'An alert appears when a figure crosses the limit we set for it. Based on the latest DOSM data.',
    ms: 'Amaran akan muncul apabila sesuatu angka melepasi had yang kami tetapkan untuknya. Berdasarkan data DOSM terkini.',
  },

  decompEyebrow: { en: 'Score breakdown', ms: 'Pecahan skor' },
  decompTitle: { en: 'How the score is built for', ms: 'Bagaimana skor dibina untuk' },
  decompNote: {
    en: 'Every input, its weight, and its contribution to the final score.',
    ms: 'Setiap input, pemberatnya, dan sumbangannya kepada skor akhir.',
  },
  decompSensitivityWarning: {
    en: 'We chose how much each input counts. Weighting them differently would change this state’s place in the ranking.',
    ms: 'Kami menentukan berapa banyak setiap input dikira. Jika pemberatan yang berbeza digunakan, kedudukan negeri ini dalam ranking boleh berubah.',
  },
  decompPressureTable: { en: 'Pressure inputs', ms: 'Input tekanan' },
  decompProsperityTable: { en: 'Prosperity inputs', ms: 'Input kemakmuran' },
  decompCaveatText: {
    en: 'These scores compare the 16 states against each other. They are not official limits, and they do not prove that tourism caused any of these changes.',
    ms: 'Skor ini membandingkan 16 negeri antara satu sama lain. Ia bukan had rasmi, dan tidak membuktikan bahawa pelancongan menyebabkan sebarang perubahan ini.',
  },
  decompColInput: { en: 'What we measured', ms: 'Apa yang kami ukur' },
  decompColRaw: { en: 'Actual value', ms: 'Nilai sebenar' },
  decompColNorm: { en: 'Score out of 100', ms: 'Skor daripada 100' },
  decompColWeight: { en: 'How much it counts', ms: 'Berapa banyak ia dikira' },
  decompColContrib: { en: 'Points added', ms: 'Mata ditambah' },
  decompColSource: { en: 'Where it came from', ms: 'Dari mana ia datang' },
  decompTotalScore: { en: 'Total score', ms: 'Jumlah skor' },

  evidenceDesc: {
    en: 'Every figure on this dashboard traces back to a named source and a date, so you can check it yourself.',
    ms: 'Setiap angka pada papan pemuka ini boleh dikesan kepada sumber dan tarikh yang dinamakan, supaya anda boleh menyemaknya sendiri.',
  },
  dictSearchPlaceholder: { en: 'Search metrics…', ms: 'Cari metrik…' },

  policyOptionsDesc: {
    en: 'Things the state could do about it, each with the evidence behind it and what it would cost.',
    ms: 'Perkara yang boleh dilakukan oleh negeri mengenainya, setiap satu disertakan bukti dan anggaran kosnya.',
  },
  policyDisclaimer: {
    en: 'These are starting points for discussion, not decisions.',
    ms: 'Ini adalah titik permulaan untuk perbincangan, bukan keputusan.',
  },
  targetDest: { en: 'Where it applies', ms: 'Tempat ia terpakai' },
  targetPop: { en: 'Who it affects', ms: 'Siapa yang terjejas' },
  leadAgency: { en: 'Who runs it', ms: 'Siapa yang menjalankannya' },
  implPeriod: { en: 'When', ms: 'Bila' },
  budgetEst: { en: 'Estimated budget', ms: 'Anggaran belanjawan' },
  evidenceSupport: { en: 'Evidence for it', ms: 'Bukti sokongan' },
  expectedOutput: { en: 'What gets delivered', ms: 'Apa yang akan disampaikan' },
  intendedOutcome: { en: 'What should change as a result', ms: 'Apa yang sepatutnya berubah akibatnya' },
  riskMitigation: { en: 'What could go wrong, and the plan', ms: 'Apa yang boleh tersasar, dan pelannya' },
  monitoringKpi: { en: 'What we will track', ms: 'Apa yang akan kami pantau' },
  tocTitle: { en: 'How this is meant to work', ms: 'Bagaimana ini sepatutnya berfungsi' },
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

  // Keep the document language in step with the switcher. Without this a
  // screen reader reads English content with Malay pronunciation rules.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

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
