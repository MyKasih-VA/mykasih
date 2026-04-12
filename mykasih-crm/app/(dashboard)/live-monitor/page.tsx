'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Phone, PhoneOff, MessageSquare, MessageCircleX, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { VoiceSessionCard } from '@/components/live-monitor/VoiceSessionCard'
import { ChatSessionCard } from '@/components/live-monitor/ChatSessionCard'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

interface VoiceSession {
  id: string
  caller_name: string | null
  wa_number: string | null
  language: string | null
  started_at: string
}

interface ChatSession {
  id: string
  wa_number: string
  intent: string | null
  language: string | null
  started_at: string
  message_count: number
}

const AUTO_REFRESH_INTERVAL = 10000 // 10 seconds

export default function LiveMonitorPage() {
  const { language } = useLanguage()

  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [voiceCount, setVoiceCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/live-monitor/status')
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json() as {
        voice_sessions: VoiceSession[]
        chat_sessions: ChatSession[]
        voice_count: number
        chat_count: number
      }
      setVoiceSessions(data.voice_sessions)
      setChatSessions(data.chat_sessions)
      setVoiceCount(data.voice_count)
      setChatCount(data.chat_count)
      setLastFetchTime(new Date())
      setSecondsSinceRefresh(0)
      setError(null)
    } catch {
      setError(t('liveMonitor.error', language))
    } finally {
      setLoading(false)
    }
  }, [language])

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      fetchStatus()
    }, AUTO_REFRESH_INTERVAL)
  }, [fetchStatus])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchStatus()
    startInterval()

    return () => {
      stopInterval()
    }
  }, [fetchStatus, startInterval, stopInterval])

  // Visibility-aware polling
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopInterval()
      } else {
        fetchStatus()
        startInterval()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchStatus, startInterval, stopInterval])

  // Tick counter for "Updated Ns ago"
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setSecondsSinceRefresh((s) => s + 1)
    }, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [lastFetchTime])

  const handleManualRefresh = () => {
    fetchStatus()
    startInterval()
  }

  const lastRefreshedText =
    secondsSinceRefresh === 0
      ? t('liveMonitor.updatedJustNow', language)
      : t('liveMonitor.updatedAgo', language).replace('{n}', String(secondsSinceRefresh))

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {t('liveMonitor.title', language)}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('liveMonitor.refreshNow', language)}
          </Button>
          {lastFetchTime && (
            <span className="text-xs text-[var(--text-muted)]">{lastRefreshedText}</span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--status-red)]/40 bg-[var(--status-red)]/10 px-4 py-3">
          <p className="text-sm text-[var(--status-red)]">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="ml-4 shrink-0"
          >
            {t('common.tryAgain', language)}
          </Button>
        </div>
      )}

      {/* Session counts — aria-live for accessibility */}
      <div aria-live="polite" className="sr-only">
        {!loading && (
          <>
            {voiceCount} active voice sessions, {chatCount} active chat sessions
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Voice Sessions column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[var(--chart-voice)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {t('liveMonitor.activeVoice', language)}
            </h2>
            <span
              className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--chart-voice)' }}
            >
              {voiceCount}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : voiceSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <PhoneOff className="w-8 h-8 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('liveMonitor.emptyVoice.heading', language)}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                {t('liveMonitor.emptyVoice.body', language)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {voiceSessions.map((session) => (
                <VoiceSessionCard key={session.id} session={session} language={language} />
              ))}
            </div>
          )}
        </div>

        {/* Chat Sessions column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--chart-chat)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {t('liveMonitor.activeChat', language)}
            </h2>
            <span
              className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--chart-chat)' }}
            >
              {chatCount}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <MessageCircleX className="w-8 h-8 text-[var(--text-muted)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {t('liveMonitor.emptyChat.heading', language)}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                {t('liveMonitor.emptyChat.body', language)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chatSessions.map((session) => (
                <ChatSessionCard key={session.id} session={session} language={language} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
