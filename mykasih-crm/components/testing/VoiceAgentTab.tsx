'use client'

import { useRef, useState, useEffect } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

// --- Types ---
interface TranscriptLine {
  speaker: 'user' | 'bot'
  text: string
}

type DisplayStatus = 'ready' | 'connecting' | 'active' | 'ended'

// --- VoiceAgentInner ---
function VoiceAgentInner() {
  const { language } = useLanguage()
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('ready')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef<string | undefined>(undefined)

  const { startSession, endSession, status } = useConversation({
    onConnect: () => {
      setDisplayStatus('active')
    },
    onDisconnect: async () => {
      // Fallback POST to guarantee is_test=true reaches Supabase
      // regardless of SDK dynamic_variables support
      try {
        await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'voice',
            is_test: true,
            elevenlabs_conversation_id: conversationIdRef.current ?? null,
          }),
        })
      } catch {
        // Best-effort fallback — do not surface to user
      }
      setDisplayStatus('ended')
    },
    onError: () => {
      toast.error(t('testing.voice.error', language))
      setDisplayStatus('ready')
    },
    onMessage: (message) => {
      const role = (message as { source?: string }).source === 'user' ? 'user' : 'bot'
      const text =
        typeof (message as { message?: unknown }).message === 'string'
          ? (message as { message: string }).message
          : JSON.stringify(message)
      setTranscript((prev) => [...prev, { speaker: role, text }])
    },
  })

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcript])

  const isConnecting = status === 'connecting'
  const isConnected = status === 'connected'

  const handleStartSession = () => {
    setDisplayStatus('connecting')
    setTranscript([])
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? ''
    startSession({
      agentId,
      connectionType: 'webrtc',
      dynamicVariables: {
        is_test: 'true',
      },
    })
    // Capture the conversation ID after session starts
    // getId() is available via hook but not exported; use ref after connect
    // The fallback POST in onDisconnect will pick up conversationIdRef if set
  }

  const handleEndSession = () => {
    endSession()
  }

  // Derive dot color and label from displayStatus
  const statusConfig: Record<DisplayStatus, { label: string; dotColor: string; pulse: boolean }> = {
    ready: {
      label: t('testing.voice.status.ready', language),
      dotColor: 'var(--status-green)',
      pulse: false,
    },
    connecting: {
      label: t('testing.voice.status.connecting', language),
      dotColor: 'var(--status-yellow)',
      pulse: false,
    },
    active: {
      label: t('testing.voice.status.active', language),
      dotColor: 'var(--status-green)',
      pulse: true,
    },
    ended: {
      label: t('testing.voice.status.ended', language),
      dotColor: 'var(--text-muted)',
      pulse: false,
    },
  }

  const currentStatus = statusConfig[displayStatus]

  return (
    <div className="max-w-lg mx-auto py-8 flex flex-col gap-6">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0${currentStatus.pulse ? ' animate-pulse' : ''}`}
          style={{ backgroundColor: currentStatus.dotColor }}
        />
        <span className="text-sm" style={{ color: currentStatus.dotColor }}>
          {currentStatus.label}
        </span>
      </div>

      {/* Mic Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={isConnected ? handleEndSession : handleStartSession}
          disabled={isConnecting}
          className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-semibold text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor:
              isConnected
                ? 'var(--status-red)'
                : 'var(--accent-primary)',
          }}
        >
          {isConnected
            ? t('testing.voice.endSession', language)
            : t('testing.voice.startSession', language)}
        </button>

        {/* Test tag caption */}
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {t('testing.voice.testTagged', language)}
        </p>
      </div>

      {/* Live Transcript Panel */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          {t('testing.voice.liveTranscript', language)}
        </h3>
        <div
          className="rounded p-4 overflow-y-auto min-h-[200px] max-h-[320px]"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {transcript.length === 0 ? (
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {t('testing.voice.transcriptEmpty', language)}
            </p>
          ) : (
            transcript.map((line, idx) => (
              <div key={idx} className="mb-2">
                <span className="text-xs mr-1 capitalize" style={{ color: 'var(--text-muted)' }}>
                  {line.speaker}:
                </span>
                <span className="text-sm text-[var(--text-primary)]">{line.text}</span>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  )
}

// --- VoiceAgentTab (exported) ---
export function VoiceAgentTab() {
  return (
    <ConversationProvider>
      <VoiceAgentInner />
    </ConversationProvider>
  )
}
