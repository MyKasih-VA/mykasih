'use client'

import { useRef, useState, useEffect, type KeyboardEvent } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { IntentBadge } from '@/components/chat/IntentBadge'

// --- Types ---
interface SimMessage {
  role: 'user' | 'bot'
  text: string
  intent?: string
  timestamp: Date
}

interface ChatbotApiResponse {
  status: 'ok' | 'first_contact'
  intent?: string
  language?: 'bm' | 'en'
  reply?: string
  message?: string
}

// --- Component ---
export function ChatbotSimTab() {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<SimMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const bubbleEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new message
  useEffect(() => {
    if (bubbleEndRef.current) {
      bubbleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const sendMessage = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMsg: SimMessage = { role: 'user', text: trimmed, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waPhone: 'simulator-001',
          message: trimmed,
          isTest: true,
        }),
      })

      const data: ChatbotApiResponse = await res.json()

      if (data.status === 'first_contact') {
        const firstContactKey =
          language === 'bm' ? 'testing.chat.firstContact.bm' : 'testing.chat.firstContact.en'
        const botMsg: SimMessage = {
          role: 'bot',
          text: t(firstContactKey, language),
          intent: undefined,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        // status === 'ok'
        const replyText = data.reply ?? data.message ?? ''
        const botMsg: SimMessage = {
          role: 'bot',
          text: replyText,
          intent: data.intent,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      }
    } catch {
      const errorMsg: SimMessage = {
        role: 'bot',
        text: 'Error connecting to chatbot. Please try again.',
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
    setMessages([])
    setInputValue('')
  }

  return (
    <div className="flex flex-col w-full py-4">
      {/* Bubble Area */}
      <div
        className="h-[420px] overflow-y-auto rounded-lg p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {messages.length === 0 && !isLoading ? (
          <p className="text-sm text-center m-auto" style={{ color: 'var(--text-muted)' }}>
            {t('testing.chat.emptyState', language)}
          </p>
        ) : (
          <>
            {messages.map((msg, idx) =>
              msg.role === 'user' ? (
                // User bubble — right aligned
                <div key={idx} className="flex justify-end">
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-tl-xl rounded-bl-xl rounded-tr-sm text-sm text-[var(--text-primary)]"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                // Bot bubble — left aligned
                <div key={idx} className="flex flex-col items-start gap-1">
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-tr-xl rounded-br-xl rounded-tl-sm text-sm text-[var(--text-primary)]"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--bg-border)',
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'bot' && (
                    <div className="ml-1">
                      <IntentBadge intent={msg.intent ?? null} />
                    </div>
                  )}
                </div>
              )
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-1 ml-1">
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
            )}
          </>
        )}
        <div ref={bubbleEndRef} />
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('testing.chat.inputPlaceholder', language)}
          disabled={isLoading}
          className="flex-1 h-10 rounded-md border px-3 py-2 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          style={{ borderColor: 'var(--bg-border)' }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isLoading || !inputValue.trim()}
          className="h-10 px-4 rounded-md text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {t('testing.chat.send', language)}
        </button>
        <button
          onClick={handleClear}
          className="h-10 px-4 rounded-md text-sm font-semibold transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('testing.chat.clearConversation', language)}
        </button>
      </div>
    </div>
  )
}
