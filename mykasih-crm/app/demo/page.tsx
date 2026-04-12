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

      {/* Embed section — full centered layout */}
      <div className="w-full max-w-2xl mt-8 flex flex-col items-center gap-4">
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

        {/* Embed with iframe — avoids shadow DOM positioning issues */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            height: '580px',
            border: '1px solid var(--bg-border)',
          }}
        >
          <iframe
            src={ANAM_SHARE_URL}
            title="Kasih AI Avatar Demo"
            allow="camera; microphone; autoplay"
            className="w-full h-full border-0"
            style={{ borderRadius: '16px' }}
          />
        </div>
      </div>
    </div>
  )
}
