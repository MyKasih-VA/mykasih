'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { type Language, t } from '@/lib/translations'

interface ChatSession {
  id: string
  wa_number: string
  intent: string | null
  language: string | null
  started_at: string
  message_count: number
}

interface ChatSessionCardProps {
  session: ChatSession
  language: Language
}

function formatRelativeAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s ago`
}

export function ChatSessionCard({ session, language }: ChatSessionCardProps) {
  const [elapsed, setElapsed] = useState(() => {
    const diff = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const intentLabel = session.intent
    ? session.intent.charAt(0).toUpperCase() + session.intent.slice(1).replace(/_/g, ' ')
    : null

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4 flex flex-col gap-2">
      {/* Row 1: WA number */}
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{session.wa_number}</p>

      {/* Row 2: Intent badge */}
      {intentLabel && (
        <Badge variant="outline" className="self-start text-xs">
          {intentLabel}
        </Badge>
      )}

      {/* Row 3: Session age */}
      <p className="text-xs text-[var(--text-muted)]">
        {t('liveMonitor.startedAgo', language).replace('{n}', formatRelativeAge(elapsed))}
      </p>

      {/* Row 4: Message count */}
      <p className="text-xs text-[var(--text-muted)]">
        {session.message_count} {t('liveMonitor.messages', language)}
      </p>
    </div>
  )
}
