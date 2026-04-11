'use client'

import { type Language } from '@/lib/translations'

interface LanguageToggleProps {
  language: Language
  onToggle: () => void
}

export function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="Switch language"
      aria-checked={language === 'bm'}
      onClick={onToggle}
      className="inline-flex items-center rounded-full bg-[var(--bg-border)] p-1 cursor-pointer"
    >
      <span
        className={[
          'px-3 py-1 text-xs font-semibold rounded-full transition-colors',
          language === 'en'
            ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]'
            : 'text-[var(--text-muted)]',
        ].join(' ')}
      >
        EN
      </span>
      <span
        className={[
          'px-3 py-1 text-xs font-semibold rounded-full transition-colors',
          language === 'bm'
            ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]'
            : 'text-[var(--text-muted)]',
        ].join(' ')}
      >
        BM
      </span>
    </button>
  )
}
