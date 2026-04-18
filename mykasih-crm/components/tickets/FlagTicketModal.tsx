'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { t, type Language, type TranslationKey } from '@/lib/translations'
import { toast } from 'sonner'

interface FlagTicketModalProps {
  callId: string
  channel: 'voice' | 'chat'
  onSuccess: () => void
  onClose: () => void
  language: Language
}

const CATEGORIES = [
  { value: 'eligibility', labelKey: 'category.eligibility' as TranslationKey },
  { value: 'faq', labelKey: 'category.faq' as TranslationKey },
  { value: 'registration', labelKey: 'category.registration' as TranslationKey },
  { value: 'complaint', labelKey: 'category.complaint' as TranslationKey },
  { value: 'merchant_lookup', labelKey: 'category.merchantLookup' as TranslationKey },
  { value: 'balance_check', labelKey: 'category.balanceCheck' as TranslationKey },
]

export function FlagTicketModal({ callId, channel, onSuccess, onClose, language }: FlagTicketModalProps) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!category) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: callId,
          channel,
          category,
          description: description.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to create ticket')

      toast.success(t('tickets.flagSuccess', language))
      onSuccess()
      onClose()
    } catch {
      toast.error(t('tickets.flagError', language))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-[var(--bg-surface)] border-[var(--bg-border)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            {t('tickets.flagAsTicket', language)}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            {t('tickets.description', language)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              {t('interactions.category', language)}
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full text-sm bg-[var(--bg-primary)] border-[var(--bg-border)] text-[var(--text-primary)]">
                <SelectValue placeholder={t('tickets.selectCategory', language)} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-surface)] border-[var(--bg-border)]">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm">
                    {t(cat.labelKey, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1.5 block">
              {t('tickets.description', language)}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={4}
              className="w-full bg-[var(--bg-primary)] border border-[var(--bg-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-md px-3 py-2 focus:outline-2 focus:outline-[var(--accent-teal)] focus:outline-offset-2 resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="text-xs border-[var(--bg-border)] text-[var(--text-muted)]"
          >
            {t('common.cancel', language)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || submitting}
            className="text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {t('common.loading', language)}
              </>
            ) : (
              t('tickets.flagAsTicket', language)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
