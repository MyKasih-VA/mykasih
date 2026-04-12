'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Star } from 'lucide-react'
import { type Language, t } from '@/lib/translations'

interface TranscriptModalProps {
  callId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  language: Language
}

interface TranscriptTurn {
  id: string
  speaker: 'user' | 'bot' | 'agent'
  message: string
  timestamp: string
}

function getSpeakerLabel(speaker: TranscriptTurn['speaker'], language: Language): string {
  if (speaker === 'user') return t('transcript.speaker.user', language)
  if (speaker === 'bot') return t('transcript.speaker.bot', language)
  return t('transcript.speaker.agent', language)
}

function getSpeakerColor(speaker: TranscriptTurn['speaker']): string {
  if (speaker === 'user') return 'var(--text-primary)'
  if (speaker === 'bot') return 'var(--chart-chat)'
  return 'var(--status-yellow)'
}

export function TranscriptModal({
  callId,
  open,
  onOpenChange,
  language,
}: TranscriptModalProps) {
  const title = t('modal.transcript', language)

  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [csatScore, setCsatScore] = useState<number | null>(null)
  const [csatHover, setCsatHover] = useState<number | null>(null)
  const [csatSubmitting, setCsatSubmitting] = useState(false)
  const [csatSubmitted, setCsatSubmitted] = useState(false)

  useEffect(() => {
    if (!open || !callId) return
    setLoading(true)
    setError(false)
    setCsatScore(null)
    setCsatSubmitted(false)
    fetch(`/api/calls/${callId}/transcript`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((json: { transcript?: TranscriptTurn[] }) => {
        setTurns(json.transcript ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [open, callId])

  async function handleCsatSubmit(score: number) {
    if (!callId || csatSubmitting || csatSubmitted) return
    setCsatScore(score)
    setCsatSubmitting(true)
    try {
      await fetch(`/api/calls/${callId}/csat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      setCsatSubmitted(true)
    } finally {
      setCsatSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px]"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div aria-busy="true" className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-[var(--bg-border)]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--text-muted)] text-center">
              {t('error.loadTranscript', language)}
            </p>
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--text-muted)] text-center">
              {t('empty.noTranscript', language)}
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {turns.map((turn, i) => (
              <div
                key={turn.id}
                className={i < turns.length - 1 ? 'border-b border-[var(--bg-border)] pb-3 mb-3' : ''}
              >
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: getSpeakerColor(turn.speaker) }}
                >
                  {getSpeakerLabel(turn.speaker, language)}
                </p>
                <p className="text-sm text-[var(--text-primary)]">{turn.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {new Date(turn.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CSAT star rating — shown after transcript loads */}
        {!loading && !error && (
          <div className="border-t border-[var(--bg-border)] pt-3 mt-2">
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {t('transcript.rateInteraction', language)}
            </p>
            {csatSubmitted ? (
              <p className="text-xs text-[var(--status-green)]">
                {t('transcript.ratingSubmitted', language).replace('{score}', String(csatScore))}
              </p>
            ) : (
              <div className="flex items-center gap-1" role="group" aria-label="CSAT rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (csatHover ?? csatScore ?? 0)
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={csatSubmitting}
                      onClick={() => void handleCsatSubmit(star)}
                      onMouseEnter={() => setCsatHover(star)}
                      onMouseLeave={() => setCsatHover(null)}
                      aria-label={`${star} star`}
                      className="disabled:opacity-40 transition-colors"
                    >
                      <Star
                        className="w-5 h-5"
                        style={{
                          color: filled ? 'var(--status-yellow)' : 'var(--text-muted)',
                          fill: filled ? 'var(--status-yellow)' : 'transparent',
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
