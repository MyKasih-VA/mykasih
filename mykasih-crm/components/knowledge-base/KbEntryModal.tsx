'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { type Language, t } from '@/lib/translations'

export interface KbEntry {
  id: string
  category: string
  question_bm: string
  question_en: string
  answer_bm: string
  answer_en: string
  is_active: boolean
  last_updated: string
  updated_by: string | null
}

interface KbEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: KbEntry | null
  language: Language
  onSaved: () => void
}

const CATEGORIES = [
  'eligibility',
  'faq',
  'registration',
  'complaint',
  'merchant_lookup',
  'balance_check',
] as const

type Category = typeof CATEGORIES[number]

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function KbEntryModal({
  open,
  onOpenChange,
  entry,
  language,
  onSaved,
}: KbEntryModalProps) {
  const [category, setCategory] = useState<Category | ''>('')
  const [questionBm, setQuestionBm] = useState('')
  const [answerBm, setAnswerBm] = useState('')
  const [questionEn, setQuestionEn] = useState('')
  const [answerEn, setAnswerEn] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Initialize form from entry when editing, or reset when adding
  useEffect(() => {
    if (open) {
      if (entry) {
        setCategory(entry.category as Category)
        setQuestionBm(entry.question_bm)
        setAnswerBm(entry.answer_bm)
        setQuestionEn(entry.question_en)
        setAnswerEn(entry.answer_en)
        setIsActive(entry.is_active)
      } else {
        setCategory('')
        setQuestionBm('')
        setAnswerBm('')
        setQuestionEn('')
        setAnswerEn('')
        setIsActive(true)
      }
    }
  }, [open, entry])

  const handleSave = async () => {
    if (!category || !questionBm.trim() || !questionEn.trim() || !answerBm.trim() || !answerEn.trim()) {
      return
    }

    setSaving(true)
    try {
      const url = entry ? `/api/kb/${entry.id}` : '/api/kb'
      const method = entry ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          question_bm: questionBm.trim(),
          question_en: questionEn.trim(),
          answer_bm: answerBm.trim(),
          answer_en: answerEn.trim(),
          is_active: isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }

      onSaved()
      onOpenChange(false)
    } catch {
      // Could not save — let user retry
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    onOpenChange(false)
  }

  const title = entry ? t('kb.editModal.title', language) : t('kb.addModal.title', language)

  const textareaClass =
    'w-full bg-[var(--bg-primary)] border border-[var(--bg-border)] rounded-md p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('kb.fields.category', language)}
            </label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as Category)}
            >
              <SelectTrigger
                className="w-full"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              >
                <SelectValue placeholder={t('kb.fields.category', language)} />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                }}
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {formatCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question (BM) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('kb.fields.questionBm', language)}
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              value={questionBm}
              onChange={(e) => setQuestionBm(e.target.value)}
              placeholder={t('kb.fields.questionBm', language)}
            />
          </div>

          {/* Answer (BM) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('kb.fields.answerBm', language)}
            </label>
            <textarea
              className={textareaClass}
              rows={4}
              value={answerBm}
              onChange={(e) => setAnswerBm(e.target.value)}
              placeholder={t('kb.fields.answerBm', language)}
            />
          </div>

          {/* Question (EN) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('kb.fields.questionEn', language)}
            </label>
            <textarea
              className={textareaClass}
              rows={3}
              value={questionEn}
              onChange={(e) => setQuestionEn(e.target.value)}
              placeholder={t('kb.fields.questionEn', language)}
            />
          </div>

          {/* Answer (EN) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('kb.fields.answerEn', language)}
            </label>
            <textarea
              className={textareaClass}
              rows={4}
              value={answerEn}
              onChange={(e) => setAnswerEn(e.target.value)}
              placeholder={t('kb.fields.answerEn', language)}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              id="kb-active-switch"
            />
            <label
              htmlFor="kb-active-switch"
              className="text-sm text-[var(--text-primary)] cursor-pointer"
            >
              {t('kb.fields.active', language)}
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--bg-border)]">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {t('kb.discardChanges', language)}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !category || !questionBm.trim() || !questionEn.trim() || !answerBm.trim() || !answerEn.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--accent-primary)' }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('kb.saveEntry', language)}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
