'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { TicketKanban } from '@/components/tickets/TicketKanban'

export default function TicketsPage() {
  const { language } = useLanguage()

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('page.tickets', language)}
      </h1>
      <TicketKanban language={language} />
    </div>
  )
}
