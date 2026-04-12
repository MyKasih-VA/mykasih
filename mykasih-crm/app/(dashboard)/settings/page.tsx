'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default function Page() {
  const { language } = useLanguage()

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
        {t('settings.title', language)}
      </h2>
      <SettingsForm />
    </div>
  )
}
