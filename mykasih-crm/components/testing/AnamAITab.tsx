'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

const ANAM_SHARE_URL = 'https://lab.anam.ai/share/ABLTOrY3iUovduzq_wplu'

export function AnamAITab() {
  const { language } = useLanguage()

  return (
    <div className="relative w-full flex flex-col items-center gap-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 w-full max-w-2xl">
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

      {/* Embed container — iframe approach for proper centering */}
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden"
        style={{
          height: '540px',
          border: '1px solid var(--bg-border)',
        }}
      >
        <iframe
          src={ANAM_SHARE_URL}
          title="Kasih AI Avatar"
          allow="camera; microphone; autoplay"
          className="w-full h-full border-0"
          style={{ borderRadius: '12px' }}
        />
      </div>
    </div>
  )
}
