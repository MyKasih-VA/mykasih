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
    <div className="relative w-full flex flex-col items-center gap-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 w-full max-w-lg">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))' }}
        >
          K
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Kasih
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('testing.chat.anamLabel', language)}
          </p>
        </div>
        <span
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
            color: 'var(--accent-primary)',
          }}
        >
          Beta
        </span>
      </div>

      {/* Embed container — force inline positioning */}
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          minHeight: '480px',
          border: '1px solid var(--bg-border)',
          position: 'relative',
        }}
      >
        <style>{`
          anam-agent {
            position: static !important;
            width: 100% !important;
            height: 480px !important;
            display: block !important;
            border-radius: 12px !important;
          }
          anam-agent > * {
            position: static !important;
          }
        `}</style>
        <anam-agent
          agent-id={process.env.NEXT_PUBLIC_ANAM_AGENT_ID}
          style={{ width: '100%', height: '480px', display: 'block' }}
        />
      </div>
    </div>
  )
}
