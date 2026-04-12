'use client'

const ANAM_SHARE_URL = 'https://lab.anam.ai/share/ABLTOrY3iUovduzq_wplu'

export default function DemoPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center py-16 px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* MyKasih Logo */}
      <img
        src="https://mykasih.com.my/wp-content/uploads/2025/05/MyKasih-logo.png"
        alt="MyKasih"
        className="h-12 object-contain"
      />

      {/* Title */}
      <h1
        className="text-[28px] font-semibold mt-6 text-center"
        style={{ color: 'var(--text-primary)' }}
      >
        AI Helpline Demo
      </h1>

      {/* Subtitle */}
      <p
        className="text-sm mt-2 italic text-center"
        style={{ color: 'var(--accent-teal)' }}
      >
        Kasih — AI Avatar of MyKasih (Beta)
      </p>

      {/* Content section */}
      <div className="w-full max-w-2xl mt-8 flex flex-col items-center gap-6">
        {/* Kasih identity bar */}
        <div className="flex items-center gap-3 self-start">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))' }}
          >
            K
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Kasih — AI Avatar of MyKasih (Beta)
          </span>
        </div>

        {/* Info card — Anam AI blocks iframe (frame-ancestors: none) */}
        <div
          className="w-full rounded-2xl flex flex-col items-center justify-center gap-6 py-20 px-6"
          style={{
            border: '1px solid var(--bg-border)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {/* Avatar icon */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))',
            }}
          >
            <svg
              width="44"
              height="44"
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
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Meet Kasih, Your AI Assistant
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Chat face-to-face with Kasih, an AI-powered avatar that can help you with MyKasih SARA program enquiries in BM or English.
            </p>
          </div>

          <a
            href={ANAM_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            <svg
              width="18"
              height="18"
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
            Start AI Demo
          </a>

          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            Opens in a new tab — requires camera & microphone
          </p>
        </div>
      </div>
    </div>
  )
}
