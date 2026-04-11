'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Language } from '@/lib/translations'

interface TranscriptModalProps {
  callId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  language: Language
}

export function TranscriptModal({
  callId,
  open,
  onOpenChange,
  language,
}: TranscriptModalProps) {
  const title = language === 'en' ? 'Transcript' : 'Transkrip'

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
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--text-muted)] text-center">
            {language === 'en'
              ? `Transcript loading will be available in Phase 4. Call ID: ${callId ?? 'N/A'}`
              : `Pemuatan transkrip akan tersedia dalam Fasa 4. ID Panggilan: ${callId ?? 'N/A'}`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
