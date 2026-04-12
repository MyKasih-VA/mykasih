'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { type Language, t } from '@/lib/translations'
import { type KbEntry } from './KbEntryModal'

const PAGE_SIZE = 25

interface KbTableProps {
  entries: KbEntry[]
  loading: boolean
  langToggle: 'bm' | 'en'
  language: Language
  onToggleActive: (id: string, isActive: boolean) => void
  onEdit: (entry: KbEntry) => void
  onDelete: (id: string) => void
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function KbTable({
  entries,
  loading,
  langToggle,
  language,
  onToggleActive,
  onEdit,
  onDelete,
}: KbTableProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const pageEntries = entries.slice(start, start + PAGE_SIZE)

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-[var(--bg-border)]" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-border)] flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          {t('kb.empty.heading', language)}
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          {t('kb.empty.body', language)}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <TableHead className="w-16 text-[var(--text-muted)]">
                {t('kb.fields.active', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)]">
                {t('kb.fields.category', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)]">
                {t('kb.question', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)]">
                {t('kb.answer', language)}
              </TableHead>
              <TableHead className="w-24 text-right text-[var(--text-muted)]">
                {t('kb.actions', language)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageEntries.map((entry) => (
              <TableRow
                key={entry.id}
                className={entry.is_active ? '' : 'opacity-50'}
                style={{ borderBottom: '1px solid var(--bg-border)' }}
              >
                {/* Active switch */}
                <TableCell>
                  <Switch
                    checked={entry.is_active}
                    onCheckedChange={(checked) => onToggleActive(entry.id, checked)}
                    aria-label={`Toggle active state for ${langToggle === 'bm' ? entry.question_bm : entry.question_en}`}
                    style={{
                      backgroundColor: entry.is_active ? 'var(--accent-primary)' : 'var(--bg-border)',
                    }}
                  />
                </TableCell>

                {/* Category */}
                <TableCell className="text-sm text-[var(--text-primary)]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--bg-border)] text-[var(--text-muted)]">
                    {formatCategory(entry.category)}
                  </span>
                </TableCell>

                {/* Question — language-toggled */}
                <TableCell className="text-sm text-[var(--text-primary)] max-w-[220px]">
                  <span className="line-clamp-2">
                    {langToggle === 'bm' ? entry.question_bm : entry.question_en}
                  </span>
                </TableCell>

                {/* Answer — language-toggled, truncated */}
                <TableCell className="text-sm text-[var(--text-muted)] max-w-xs">
                  <span className="line-clamp-2">
                    {langToggle === 'bm' ? entry.answer_bm : entry.answer_en}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      {t('kb.edit', language)}
                    </button>

                    {/* Delete with AlertDialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-[var(--status-red)] hover:border-[var(--status-red)] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t('kb.deleteBtn', language)}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--bg-border)',
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[var(--text-primary)]">
                            {t('kb.deleteBtn', language)}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-[var(--text-muted)]">
                            {t('kb.deleteConfirm', language)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          {/* Focus lands on Cancel by default */}
                          <AlertDialogCancel
                            autoFocus
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--bg-border)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t('kb.keepEntry', language)}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(entry.id)}
                            style={{
                              background: 'var(--status-red)',
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            {t('kb.deleteBtn', language)}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--bg-border)]">
          <span className="text-xs text-[var(--text-muted)]">
            {t('pagination.showing', language)} {start + 1}–{Math.min(start + PAGE_SIZE, entries.length)} {t('pagination.of', language)} {entries.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs border border-[var(--bg-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
