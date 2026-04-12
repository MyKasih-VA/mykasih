'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { type Language, t } from '@/lib/translations'

interface VoiceSession {
  id: string
  caller_name: string | null
  wa_number: string | null
  language: string | null
  started_at: string
}

interface VoiceSessionCardProps {
  session: VoiceSession
  language: Language
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function VoiceSessionCard({ session, language }: VoiceSessionCardProps) {
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

  const displayName = session.caller_name || t('liveMonitor.unknownCaller', language)
  const langLabel = session.language
    ? session.language.charAt(0).toUpperCase() + session.language.slice(1)
    : null

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-4 flex flex-col gap-2">
      {/* Row 1: caller name */}
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>

      {/* Row 2: WA number */}
      {session.wa_number && (
        <p className="text-xs text-[var(--text-muted)]">{session.wa_number}</p>
      )}

      {/* Row 3: Live duration counter */}
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--status-green)' }}
          aria-hidden="true"
        />
        <span className="text-xs font-mono text-[var(--text-primary)]">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* Row 4: Language badge */}
      {langLabel && (
        <Badge variant="outline" className="self-start text-xs">
          {langLabel}
        </Badge>
      )}
    </div>
  )
}
