'use client'

import { Users } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export default function Page() {
  const { language } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-border)] flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-[var(--text-muted)]" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        {language === 'en' ? 'Beneficiaries' : 'Penerima Manfaat'}
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        {language === 'en'
          ? 'This page is being built in Phase 4.'
          : 'Halaman ini sedang dibina dalam Phase 4.'}
      </p>
    </div>
  )
}
