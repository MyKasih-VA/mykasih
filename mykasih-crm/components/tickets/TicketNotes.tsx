'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { t, type Language } from '@/lib/translations'
import { toast } from 'sonner'

interface TicketNote {
  id: string
  author: string
  content: string
  created_at: string
}

interface TicketNotesProps {
  ticketId: string
  language: Language
}

function formatNoteTime(timestamp: string, language: Language): string {
  const locale = language === 'bm' ? 'ms-MY' : 'en-GB'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function TicketNotes({ ticketId, language }: TicketNotesProps) {
  const [notes, setNotes] = useState<TicketNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/notes`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = (await res.json()) as { data: TicketNote[] }
        setNotes(json.data)
      } catch {
        // Notes list stays empty
      } finally {
        setLoading(false)
      }
    }
    void fetchNotes()
  }, [ticketId])

  async function handleSaveNote() {
    if (!newNote.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })

      if (!res.ok) throw new Error('Failed to save')

      const json = (await res.json()) as { data: TicketNote }
      setNotes((prev) => [...prev, json.data])
      setNewNote('')
      toast.success(t('tickets.noteSuccess', language))
    } catch {
      toast.error(t('tickets.noteError', language))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {t('tickets.notes', language)}
      </p>

      {/* Notes list */}
      <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full bg-[var(--bg-border)] rounded" />
            <Skeleton className="h-16 w-full bg-[var(--bg-border)] rounded" />
          </>
        ) : notes.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">
            {language === 'bm' ? 'Tiada nota lagi' : 'No notes yet'}
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-[var(--bg-border)] rounded p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  {note.author}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {formatNoteTime(note.created_at, language)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)]">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add note */}
      <div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value.slice(0, 1000))}
          maxLength={1000}
          rows={3}
          placeholder={t('tickets.addNote', language)}
          className="w-full bg-[var(--bg-primary)] border border-[var(--bg-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-md px-3 py-2 focus:outline-2 focus:outline-[var(--accent-teal)] focus:outline-offset-2 resize-none"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-[var(--text-muted)]">
            {newNote.length}/1000
          </span>
          <Button
            onClick={handleSaveNote}
            disabled={!newNote.trim() || saving}
            size="sm"
            className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {t('common.loading', language)}
              </>
            ) : (
              t('tickets.saveNote', language)
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
