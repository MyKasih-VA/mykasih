'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

export function AnamAITab() {
  const { language } = useLanguage()

  useEffect(() => {
    const existing = document.querySelector('script[src*="@anam-ai/agent-widget"]')
    if (existing) return // already loaded (tab re-mount guard)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@anam-ai/agent-widget'
    script.async = true
    document.body.appendChild(script)
    // Do NOT remove script on unmount — custom element registry is global
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
        {t('testing.chat.anamLabel', language)}
      </p>
      <anam-agent
        agent-id={process.env.NEXT_PUBLIC_ANAM_AGENT_ID}
        style={{ flexGrow: 1, minHeight: '480px' }}
      />
    </div>
  )
}
