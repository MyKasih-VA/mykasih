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

      {/* Info card — Anam AI blocks iframe embedding (frame-ancestors: none) */}
      <div
        className="w-full max-w-2xl rounded-xl flex flex-col items-center justify-center gap-6 py-16 px-6"
        style={{
          border: '1px solid var(--bg-border)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Avatar icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="m2 14 6 6" />
            <path d="m22 14-6 6" />
          </svg>
        </div>

        <div className="text-center max-w-md">
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {language === 'bm' ? 'Avatar AI Kasih' : 'Kasih AI Avatar'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {language === 'bm'
              ? 'Avatar AI Kasih dihos di Anam AI Lab. Klik butang di bawah untuk membuka dalam tab baharu dan berbual dengan avatar.'
              : 'Kasih AI Avatar is hosted on Anam AI Lab. Click the button below to open in a new tab and chat with the avatar.'}
          </p>
        </div>

        <a
          href={ANAM_SHARE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
          {language === 'bm' ? 'Buka Avatar Kasih' : 'Open Kasih Avatar'}
        </a>

        <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          {language === 'bm'
            ? 'Memerlukan kamera & mikrofon'
            : 'Requires camera & microphone'}
        </p>
      </div>
    </div>
  )
}
