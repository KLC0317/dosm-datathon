'use client'

import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Info,
  MapPin,
  Minus,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../lib/i18n'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  evidence?: string
  interpretation?: string
  limitations?: string
  next_action?: string
  state?: string
  mode?: string
  model?: string
  language?: string
  timestamp: string
}

interface ChatbotWidgetProps {
  isOpen: boolean
  onToggle: () => void
  selectedState?: {
    state: string
    pressure_score?: number
    prosperity_score?: number
    quadrant?: string
    action?: string
  } | null
  states?: string[]
}

// Lightweight, safe markdown-like formatter for structured LLM responses
function FormattedContent({ text }: { text: string }) {
  // Check if content contains markdown table
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Table line detector
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      // Check if separator line like |---|---|
      if (!cells.every((c) => /^:?-+:?$/.test(c))) {
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      // Table ended, render table
      if (tableRows.length > 0) {
        const header = tableRows[0]
        const rows = tableRows.slice(1)
        elements.push(
          <div key={`table-${i}`} className="chatbot-table-wrap">
            <table className="chatbot-data-table">
              <thead>
                <tr>
                  {header.map((h, hIdx) => (
                    <th key={hIdx}>{formatInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {r.map((cell, cIdx) => (
                      <td key={cIdx}>{formatInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      tableRows = []
      inTable = false
    }

    if (!line) {
      elements.push(<div key={`sp-${i}`} className="chatbot-line-space" />)
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="chatbot-h4">
          {formatInline(line.replace(/^###\s+/, ''))}
        </h4>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="chatbot-h3">
          {formatInline(line.replace(/^##\s+/, ''))}
        </h3>
      )
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="chatbot-list-item">
          <span className="chatbot-bullet">•</span>
          <span className="chatbot-list-text">{formatInline(line.replace(/^(\*|-)\s+/, ''))}</span>
        </div>
      )
    } else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)/)
      elements.push(
        <div key={`oli-${i}`} className="chatbot-list-item">
          <span className="chatbot-num-bullet">{match ? match[1] + '.' : '•'}</span>
          <span className="chatbot-list-text">{formatInline(match ? match[2] : line)}</span>
        </div>
      )
    } else {
      elements.push(
        <p key={`p-${i}`} className="chatbot-paragraph">
          {formatInline(line)}
        </p>
      )
    }
  }

  // Flush remaining table if ended at EOF
  if (inTable && tableRows.length > 0) {
    const header = tableRows[0]
    const rows = tableRows.slice(1)
    elements.push(
      <div key="table-end" className="chatbot-table-wrap">
        <table className="chatbot-data-table">
          <thead>
            <tr>
              {header.map((h, hIdx) => (
                <th key={hIdx}>{formatInline(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rIdx) => (
              <tr key={rIdx}>
                {r.map((cell, cIdx) => (
                  <td key={cIdx}>{formatInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <div className="chatbot-formatted-body">{elements}</div>
}

// Inline bolding and code formatting
function formatInline(str: string): React.ReactNode {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="chatbot-code">{part.slice(1, -1)}</code>
    }
    return part
  })
}

export function ChatbotWidget({ isOpen, onToggle, selectedState, states }: ChatbotWidgetProps) {
  const { lang } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})
  const [hasUnread, setHasUnread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with welcoming bilingual greeting
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'welcome-0',
        role: 'assistant',
        text:
          lang === 'ms'
            ? `**Selamat Datang ke Destinasi AI!** 👋\n\nSaya pembantu pintar berasaskan bukti rasmi DOSM (*Survei Pelancongan Domestik, IHP & Anggaran Penduduk*). Saya sedia menjawab sebarang soalan tentang **semua 16 negeri**, skor tekanan, kemakmuran, unjuran 2026, dan pelan dasar.\n\n*Anda boleh bertanya dalam Bahasa Melayu atau English.*`
            : `**Welcome to Destinasi AI!** 👋\n\nI am your official DOSM evidence intelligence assistant (*Domestic Tourism Survey, CPI & Population data*). I can answer queries across **all 16 states & federal territories**, pressure rankings, prosperity potentials, 2026 projections, and strategic policy options.\n\n*Feel free to ask in English or Bahasa Melayu.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([initialGreeting])
    }
  }, [lang, messages.length])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  const quickPrompts = [
    {
      id: 'p1',
      label: lang === 'ms' ? '🔥 Tekanan Tertinggi' : '🔥 Highest Pressure',
      query:
        lang === 'ms'
          ? 'Negeri manakah yang mempunyai skor tekanan pelancongan tertinggi dan apakah puncanya?'
          : 'Which states have the highest tourism pressure scores and what are the main drivers?',
    },
    {
      id: 'p2',
      label:
        selectedState?.state
          ? `📍 ${selectedState.state}`
          : lang === 'ms'
          ? '📍 Melaka vs Penang'
          : '📍 Melaka vs Penang',
      query: selectedState?.state
        ? lang === 'ms'
          ? `Terangkan profil tekanan, kemakmuran dan pilihan dasar untuk ${selectedState.state}.`
          : `Explain the pressure, prosperity profile, and policy options for ${selectedState.state}.`
        : lang === 'ms'
        ? 'Bandingkan Melaka dan Pulau Pinang dari segi tekanan pelancongan dan pilihan dasar.'
        : 'Compare Melaka and Penang in terms of tourism pressure and strategic policy options.',
    },
    {
      id: 'p3',
      label: lang === 'ms' ? '📈 Unjuran 2026' : '📈 2026 Forecast',
      query:
        lang === 'ms'
          ? 'Apakah unjuran bilangan pelawat domestik bagi suku-suku tahun 2026?'
          : 'What is the quarterly domestic visitor forecast for 2026 and what model is used?',
    },
    {
      id: 'p4',
      label: lang === 'ms' ? '💡 Kuadran Pertumbuhan' : '💡 Growth Quadrants',
      query:
        lang === 'ms'
          ? 'Senaraikan negeri dalam kuadran Manage growth dan apakah cadangan tindakannya?'
          : 'List the states in the Manage growth quadrant and explain the recommended policy actions.',
    },
  ]

  async function handleSend(textToSend?: string) {
    const questionText = (textToSend || input).trim()
    if (!questionText || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      })

      if (!res.ok) {
        throw new Error(`API error ${res.status}`)
      }

      const data = await res.json()
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.answer || (lang === 'ms' ? 'Tiada jawapan diterima.' : 'No answer received.'),
        evidence: data.evidence,
        interpretation: data.interpretation,
        limitations: data.limitations,
        next_action: data.next_action,
        state: data.state,
        mode: data.mode,
        model: data.model,
        language: data.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])
      if (!isOpen) {
        setHasUnread(true)
      }
    } catch (err) {
      console.warn('Chatbot fallback trigger:', err)
      // Deterministic client fallback if network / backend offline
      const st = selectedState?.state || 'Malaysia'
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        text:
          lang === 'ms'
            ? `Berdasarkan data saringan DOSM untuk **${st}**:\n\n• **Skor Tekanan**: ${selectedState?.pressure_score ?? 50}/100\n• **Potensi Kemakmuran**: ${selectedState?.prosperity_score ?? 50}/100\n• **Kuadran**: *${selectedState?.quadrant ?? 'Pantau'}*\n• **Hala Tuju Disyorkan**: ${selectedState?.action ?? 'Pengurusan kapasiti dan saringan permintaan berterusan.'}`
            : `Based on DOSM screening signals for **${st}**:\n\n• **Pressure Score**: ${selectedState?.pressure_score ?? 50}/100\n• **Prosperity Potential**: ${selectedState?.prosperity_score ?? 50}/100\n• **Quadrant**: *${selectedState?.quadrant ?? 'Monitor'}*\n• **Recommended Action**: ${selectedState?.action ?? 'Capacity-first growth with demand monitoring.'}`,
        evidence: 'DOSM DTS 2025 extract.',
        interpretation: 'Local deterministic fallback response.',
        limitations: 'Screening index based on state aggregates; no econometric causality inferred.',
        next_action: 'Verify with the Evidence & Method tab.',
        mode: 'deterministic_fallback',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleReset() {
    const initialGreeting: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      text:
        lang === 'ms'
          ? `Perbualan telah diset semula. Ada sebarang data atau negeri yang ingin anda semak?`
          : `Conversation cleared. Which state, metric, or policy option would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([initialGreeting])
    setExpandedDetails({})
  }

  const toggleDetails = (msgId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  return (
    <>
      {/* ─── Floating Launcher Button (Bottom Right) ─── */}
      <div className="destinasi-chatbot-launcher-container">
        <button
          type="button"
          className={`destinasi-chatbot-launcher-btn ${isOpen ? 'active' : ''}`}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={lang === 'ms' ? 'Buka Pembantu AI DOSM' : 'Open DOSM AI Assistant'}
          title={lang === 'ms' ? 'Tanya Destinasi AI (Data DOSM)' : 'Ask Destinasi AI (DOSM Data)'}
        >
          <div className="launcher-icon-wrap">
            <Sparkles size={20} className="launcher-sparkle" />
            <Bot size={22} className="launcher-bot" />
          </div>

          <span className="launcher-pill-text">
            {lang === 'ms' ? 'Tanya AI' : 'Ask AI'}
          </span>

          <span className="launcher-status-dot" aria-hidden="true" />

          {hasUnread && !isOpen && (
            <span className="launcher-unread-badge" aria-label="Mesej baru">
              1
            </span>
          )}
        </button>
      </div>

      {/* ─── Floating Chatbot Window Docked Bottom Right ─── */}
      {isOpen && (
        <aside
          className="destinasi-chatbot-window"
          role="dialog"
          aria-label="Destinasi AI Chatbot"
          aria-modal="false"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-identity">
              <div className="chatbot-avatar-orb">
                <Bot size={19} />
                <span className="avatar-online-dot" />
              </div>
              <div className="chatbot-header-text">
                <div className="chatbot-title-row">
                  <h3 className="chatbot-title">Destinasi AI</h3>
                  <span className="chatbot-tag-dosm">DOSM Evidence</span>
                </div>
                <p className="chatbot-subtitle">
                  {lang === 'ms' ? 'Dwibahasa · BM & English' : 'Bilingual · BM & English'}
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-ctrl-btn"
                onClick={handleReset}
                title={lang === 'ms' ? 'Set semula perbualan' : 'Reset conversation'}
                aria-label="Reset chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="chatbot-ctrl-btn"
                onClick={onToggle}
                title={lang === 'ms' ? 'Kecilkan' : 'Minimize'}
                aria-label="Minimize"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                className="chatbot-ctrl-btn close-btn"
                onClick={onToggle}
                title={lang === 'ms' ? 'Tutup' : 'Close'}
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          {selectedState?.state && (
            <div className="chatbot-state-context-banner">
              <div className="context-banner-info">
                <MapPin size={13} className="context-pin-icon" />
                <span className="context-state-name">{selectedState.state}</span>
                {selectedState.pressure_score !== undefined && (
                  <span className="context-badge-pressure">
                    {lang === 'ms' ? 'Tekanan' : 'Pressure'}: {selectedState.pressure_score}
                  </span>
                )}
                {selectedState.prosperity_score !== undefined && (
                  <span className="context-badge-prosperity">
                    {lang === 'ms' ? 'Kemakmuran' : 'Prosperity'}: {selectedState.prosperity_score}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="context-quick-ask"
                onClick={() =>
                  handleSend(
                    lang === 'ms'
                      ? `Apakah analisis data utama dan pilihan dasar bagi ${selectedState.state}?`
                      : `What are the key data signals and recommended policy options for ${selectedState.state}?`
                  )
                }
              >
                {lang === 'ms' ? 'Tanya pasal negeri ini' : 'Ask about this state'}
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div className="chatbot-messages-area">
            {messages.map((msg) => {
              const isUser = msg.role === 'user'
              const showDetails = expandedDetails[msg.id]
              const hasMetadata =
                !isUser && (msg.evidence || msg.interpretation || msg.limitations || msg.next_action)

              return (
                <div
                  key={msg.id}
                  className={`chatbot-message-row ${isUser ? 'user-row' : 'assistant-row'}`}
                >
                  {!isUser && (
                    <div className="chatbot-message-avatar" aria-hidden="true">
                      <Bot size={15} />
                    </div>
                  )}

                  <div className={`chatbot-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                    {/* Mode badge for assistant */}
                    {!isUser && (
                      <div className="chatbot-bubble-badge">
                        <Sparkles size={11} />
                        <span>
                          {lang === 'ms'
                            ? 'Pembantu AI DOSM'
                            : 'DOSM AI Assistant'}
                        </span>
                      </div>
                    )}

                    {/* Main Text with Markdown Formatting */}
                    <div className="chatbot-bubble-content">
                      <FormattedContent text={msg.text} />
                    </div>

                    {/* Collapsible Evidence / Assumptions Accordion */}
                    {hasMetadata && (
                      <div className="chatbot-metadata-drawer">
                        <button
                          type="button"
                          className="chatbot-details-toggle"
                          onClick={() => toggleDetails(msg.id)}
                        >
                          <Info size={12} />
                          <span>
                            {lang === 'ms'
                              ? showDetails
                                ? 'Sembunyi Bukti & Metodologi'
                                : 'Papar Bukti & Metodologi DOSM'
                              : showDetails
                              ? 'Hide Evidence & Methodology'
                              : 'Show Evidence & DOSM Source'}
                          </span>
                          {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {showDetails && (
                          <div className="chatbot-details-expanded">
                            {msg.evidence && (
                              <div className="details-section">
                                <span className="details-label">
                                  <Shield size={11} /> {lang === 'ms' ? 'Bukti Data' : 'Evidence Data'}
                                </span>
                                <p>{msg.evidence}</p>
                              </div>
                            )}

                            {msg.interpretation && (
                              <div className="details-section">
                                <span className="details-label">
                                  <TrendingUp size={11} /> {lang === 'ms' ? 'Tafsiran' : 'Interpretation'}
                                </span>
                                <p>{msg.interpretation}</p>
                              </div>
                            )}

                            {msg.limitations && (
                              <div className="details-section caveat">
                                <span className="details-label">
                                  <AlertTriangle size={11} /> {lang === 'ms' ? 'Batasan Saringan' : 'Screening Limitations'}
                                </span>
                                <p>{msg.limitations}</p>
                              </div>
                            )}

                            {msg.next_action && (
                              <div className="details-section">
                                <span className="details-label">
                                  <CornerDownLeft size={11} /> {lang === 'ms' ? 'Tindakan Seterusnya' : 'Next Action'}
                                </span>
                                <p>{msg.next_action}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="chatbot-timestamp">{msg.timestamp}</div>
                  </div>
                </div>
              )
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="chatbot-message-row assistant-row">
                <div className="chatbot-message-avatar" aria-hidden="true">
                  <Bot size={15} />
                </div>
                <div className="chatbot-bubble assistant-bubble loading-bubble">
                  <div className="chatbot-typing-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="loading-text">
                    {lang === 'ms' ? 'Menganalisis bukti data DOSM…' : 'Analyzing DOSM evidence data…'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chatbot-chips-bar">
            {quickPrompts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chatbot-quick-chip"
                onClick={() => handleSend(p.query)}
                disabled={isLoading}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chatbot-input-container">
            <form
              className="chatbot-input-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  lang === 'ms'
                    ? 'Tanya soalan (BM atau English)…'
                    : 'Ask a question (in English or Malay)…'
                }
                className="chatbot-input-field"
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!input.trim() || isLoading}
                aria-label={lang === 'ms' ? 'Hantar soalan' : 'Send question'}
              >
                <Send size={16} />
              </button>
            </form>

            <div className="chatbot-footer-hint">
              <span>{lang === 'ms' ? '● Mengesan BM & EN secara automatik' : '● Auto-detects BM & English'}</span>
              <span className="footer-pipe">•</span>
              <span>{lang === 'ms' ? 'Sumber Rasmi DOSM' : 'Official DOSM Evidence'}</span>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
