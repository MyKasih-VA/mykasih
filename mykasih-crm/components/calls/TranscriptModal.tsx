'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { type Language } from '@/lib/translations'

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
  if (language === 'bm') {
    if (speaker === 'user') return 'Pengguna'
    if (speaker === 'bot') return 'Bot'
    return 'Ejen'
  }
  if (speaker === 'user') return 'User'
  if (speaker === 'bot') return 'Bot'
  return 'Agent'
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
  const title = language === 'en' ? 'Transcript' : 'Transkrip'

  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open || !callId) return
    setLoading(true)
    setError(false)
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
              {language === 'en'
                ? 'Unable to load transcript.'
                : 'Tidak dapat memuatkan transkrip.'}
            </p>
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--text-muted)] text-center">
              {language === 'en'
                ? 'No transcript available.'
                : 'Tiada transkrip tersedia.'}
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
      </DialogContent>
    </Dialog>
  )
}
