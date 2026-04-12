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

      {/* Anam AI Embed */}
      <div className="w-full max-w-2xl mt-8 flex-1">
        <anam-agent
          agent-id={process.env.NEXT_PUBLIC_ANAM_AGENT_ID}
          style={{ width: '100%', minHeight: '480px' }}
        />
      </div>

      {/* Footer */}
      <p
        className="text-xs mt-6 text-center"
        style={{ color: 'var(--accent-teal)' }}
      >
        Powered by Anam AI
      </p>
    </div>
  )
}
