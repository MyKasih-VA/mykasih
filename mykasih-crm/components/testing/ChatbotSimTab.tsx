'use client'

import { useRef, useState, useEffect, type KeyboardEvent } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

// --- Types ---
interface SimMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  intent: string | null
  timestamp: Date
  showChips?: boolean
}

interface ChatbotApiResponse {
  status: 'ok' | 'first_contact'
  intent?: string
  language?: 'bm' | 'en'
  reply?: string
  message?: string
}

// --- Intent badge colors ---
const INTENT_COLORS: Record<string, { bg: string; text: string }> = {
  balance_check: { bg: 'color-mix(in srgb, var(--accent-teal) 18%, transparent)', text: 'var(--accent-teal)' },
  faq: { bg: 'color-mix(in srgb, #3B82F6 18%, transparent)', text: '#60A5FA' },
  registration: { bg: 'color-mix(in srgb, #8B5CF6 18%, transparent)', text: '#A78BFA' },
  complaint: { bg: 'color-mix(in srgb, var(--status-red) 18%, transparent)', text: 'var(--status-red)' },
  eligibility: { bg: 'color-mix(in srgb, var(--accent-primary) 18%, transparent)', text: 'var(--status-green)' },
  merchant_lookup: { bg: 'color-mix(in srgb, var(--status-yellow) 18%, transparent)', text: 'var(--status-yellow)' },
  unknown: { bg: 'color-mix(in srgb, var(--text-muted) 18%, transparent)', text: 'var(--text-muted)' },
}

function IntentPill({ intent }: { intent: string | null }) {
  if (!intent) return null
  const colors = INTENT_COLORS[intent] ?? INTENT_COLORS.unknown
  const label = intent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span
      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  )
}

const GREETING_MESSAGE: SimMessage = {
  id: 'greeting-001',
  role: 'bot',
  content:
    'Selamat datang ke MyKasih! \u{1F44B}\n\nSaya Kasih, pembantu digital anda. Saya boleh membantu anda dengan:\n\u2022 Semak baki kad\n\u2022 Cari kedai berdekatan\n\u2022 Panduan pendaftaran\n\u2022 Hantar aduan\n\nBagaimana saya boleh membantu anda hari ini?',
  intent: null,
  timestamp: new Date(),
  showChips: true,
}

const QUICK_CHIPS = ['Semak Baki', 'Kedai Berdekatan', 'Daftar Program', 'Aduan']

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// --- Component ---
export function ChatbotSimTab() {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<SimMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chipsVisible, setChipsVisible] = useState(true)
  const bubbleEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(0)

  // Bot-initiated greeting on mount
  useEffect(() => {
    setMessages([{ ...GREETING_MESSAGE, timestamp: new Date() }])
  }, [])

  // Auto-scroll on new message
  useEffect(() => {
    if (bubbleEndRef.current) {
      bubbleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? inputValue).trim()
    if (!trimmed || isLoading) return

    // Hide chips after first user message
    setChipsVisible(false)

    msgIdRef.current += 1
    const userMsg: SimMessage = {
      id: `user-${msgIdRef.current}`,
      role: 'user',
      content: trimmed,
      intent: null,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chatbot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          senderId: 'simulator-001',
          isTest: true,
          history,
        }),
      })

      const data: ChatbotApiResponse = await res.json()
      const replyText = data.reply ?? data.message ?? ''
      msgIdRef.current += 1
      const botMsg: SimMessage = {
        id: `bot-${msgIdRef.current}`,
        role: 'bot',
        content: replyText,
        intent: data.intent ?? null,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      msgIdRef.current += 1
      const errorMsg: SimMessage = {
        id: `bot-${msgIdRef.current}`,
        role: 'bot',
        content: 'Error connecting to chatbot. Please try again.',
        intent: 'unknown',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const handleClear = () => {
    setMessages([{ ...GREETING_MESSAGE, timestamp: new Date() }])
    setChipsVisible(true)
    setInputValue('')
    msgIdRef.current = 0
  }

  return (
    <div
      className="flex flex-col w-full max-w-lg mx-auto rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--bg-border)' }}
    >
      {/* Chat Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          K
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Kasih
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            MyKasih Assistant
          </p>
        </div>
        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--status-green)' }}
          />
          <span className="text-xs" style={{ color: 'var(--status-green)' }}>
            Online
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="h-[460px] overflow-y-auto px-4 py-3 flex flex-col gap-2"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {messages.map((msg) =>
          msg.role === 'user' ? (
            // User bubble — right aligned (WhatsApp style)
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] flex flex-col">
                <div
                  className="px-3 py-2 text-sm text-white whitespace-pre-wrap"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    borderRadius: '12px 4px 12px 12px',
                  }}
                >
                  {msg.content}
                  <span
                    className="block text-right mt-1"
                    style={{ fontSize: '10px', opacity: 0.7 }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Bot bubble — left aligned (WhatsApp style)
            <div key={msg.id} className="flex flex-col items-start">
              <div className="max-w-[75%] flex flex-col">
                <div
                  className="px-3 py-2 text-sm whitespace-pre-wrap"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '4px 12px 12px 12px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }}
                >
                  {msg.content}
                  <span
                    className="block text-right mt-1"
                    style={{ fontSize: '10px', color: 'var(--text-muted)' }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {/* Intent badge below bubble */}
                <IntentPill intent={msg.intent} />
              </div>

              {/* Quick reply chips — only on greeting */}
              {msg.showChips && chipsVisible && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => void sendMessage(chip)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div
              className="px-4 py-3 flex items-center gap-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '4px 12px 12px 12px',
              }}
            >
              <style>{`
                @keyframes dotBounce {
                  0%, 80%, 100% { opacity: 0.4; transform: translateY(0); }
                  40% { opacity: 1; transform: translateY(-4px); }
                }
              `}</style>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: 'var(--text-muted)',
                    animation: 'dotBounce 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bubbleEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--bg-border)',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('testing.chat.inputPlaceholder', language)}
          disabled={isLoading}
          className="flex-1 h-10 rounded-full border px-4 py-2 text-sm bg-transparent disabled:opacity-50 focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isLoading || !inputValue.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
        <button
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title={t('testing.chat.clearConversation', language)}
        >
          {t('testing.chat.clearConversation', language)}
        </button>
      </div>
    </div>
  )
}
