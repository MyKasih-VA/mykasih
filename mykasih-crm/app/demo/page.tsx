'use client'

import { useEffect } from 'react'

export default function DemoPage() {
  useEffect(() => {
    const existing = document.querySelector('script[src*="@anam-ai/agent-widget"]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@anam-ai/agent-widget'
    script.async = true
    document.body.appendChild(script)
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center py-16"
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

        {/* Embed with positioning override */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            minHeight: '520px',
            position: 'relative',
            border: '1px solid var(--bg-border)',
          }}
        >
          <style>{`
            anam-agent {
              position: static !important;
              width: 100% !important;
              height: 520px !important;
              display: block !important;
            }
            anam-agent > * {
              position: static !important;
            }
          `}</style>
          <anam-agent
            agent-id={process.env.NEXT_PUBLIC_ANAM_AGENT_ID}
            style={{ width: '100%', height: '520px', display: 'block' }}
          />
        </div>
      </div>
    </div>
  )
}
