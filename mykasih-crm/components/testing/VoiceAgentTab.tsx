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
  const sessionStartRef = useRef<number>(0)

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

  const { startSession, endSession, status } = useConversation({
    onConnect: () => {
      sessionStartRef.current = Date.now()
      setDisplayStatus('active')
    },
    onDisconnect: async () => {
      // Check if session was too short — likely a connection failure
      const elapsed = Date.now() - sessionStartRef.current
      if (sessionStartRef.current > 0 && elapsed < 3000) {
        toast.error(
          language === 'bm'
            ? 'Tidak dapat menyambung ke ejen suara. Semak kebenaran mikrofon dan cuba lagi.'
            : 'Could not connect to voice agent. Check microphone permissions and try again.'
        )
      }

      // Fallback POST to guarantee is_test=true reaches Supabase
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

  const handleStartSession = async () => {
    setDisplayStatus('connecting')
    setTranscript([])
    sessionStartRef.current = 0
    try {
      await startSession({
        agentId: agentId ?? '',
        connectionType: 'webrtc',
        dynamicVariables: {
          is_test: 'true',
        },
      })
    } catch {
      toast.error(
        language === 'bm'
          ? 'Tidak dapat menyambung ke ejen suara. Semak kebenaran mikrofon dan cuba lagi.'
          : 'Could not connect to voice agent. Check microphone permissions and try again.'
      )
      setDisplayStatus('ready')
    }
  }

  const handleEndSession = () => {
    endSession()
  }

  // Derive status badge config
  const statusConfig: Record<DisplayStatus, { label: string; dotColor: string }> = {
    ready: {
      label: t('testing.voice.status.ready', language),
      dotColor: 'var(--status-green)',
    },
    connecting: {
      label: t('testing.voice.status.connecting', language),
      dotColor: 'var(--status-yellow)',
    },
    active: {
      label: t('testing.voice.status.active', language),
      dotColor: 'var(--status-green)',
    },
    ended: {
      label: t('testing.voice.status.ended', language),
      dotColor: 'var(--text-muted)',
    },
  }

  const currentStatus = statusConfig[displayStatus]

  return (
    <div className="max-w-lg mx-auto py-8 flex flex-col gap-6 items-center">
      {/* Agent ID missing warning */}
      {!agentId && (
        <div
          className="w-full rounded-md px-4 py-3 text-sm font-medium text-center"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--status-yellow) 15%, transparent)',
            color: 'var(--status-yellow)',
            border: '1px solid color-mix(in srgb, var(--status-yellow) 30%, transparent)',
          }}
        >
          Voice agent not configured — NEXT_PUBLIC_ELEVENLABS_AGENT_ID missing
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0${displayStatus === 'active' ? ' animate-pulse' : ''}`}
          style={{ backgroundColor: currentStatus.dotColor }}
        />
        <span className="text-sm" style={{ color: currentStatus.dotColor }}>
          {currentStatus.label}
        </span>
      </div>

      {/* Animated Orb */}
      <div className="relative w-32 h-32 flex items-center justify-center mt-4">
        {/* Orb CSS */}
        <style>{`
          @keyframes orbPing1 {
            0% { transform: scale(1); opacity: 0.4; }
            75%, 100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes orbPing2 {
            0% { transform: scale(1); opacity: 0.25; }
            75%, 100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes orbPing3 {
            0% { transform: scale(1); opacity: 0.15; }
            75%, 100% { transform: scale(2.0); opacity: 0; }
          }
          @keyframes orbBreathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes orbPulseConnect {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
        `}</style>

        {/* Active state — 3 concentric animated rings */}
        {displayStatus === 'active' && (
          <>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--accent-primary)',
                opacity: 0.4,
                animation: 'orbPing1 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--accent-primary)',
                opacity: 0.25,
                animation: 'orbPing2 2s cubic-bezier(0, 0, 0.2, 1) infinite 300ms',
              }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--accent-primary)',
                opacity: 0.15,
                animation: 'orbPing3 2s cubic-bezier(0, 0, 0.2, 1) infinite 600ms',
              }}
            />
          </>
        )}

        {/* Connecting state — single pulsing amber ring */}
        {displayStatus === 'connecting' && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: 'var(--status-yellow)',
              animation: 'orbPulseConnect 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Orb core */}
        <button
          onClick={isConnected ? handleEndSession : () => void handleStartSession()}
          disabled={isConnecting || !agentId}
          className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all duration-300"
          style={{
            background:
              displayStatus === 'ended'
                ? 'var(--bg-border)'
                : displayStatus === 'active'
                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))'
                  : displayStatus === 'connecting'
                    ? 'linear-gradient(135deg, var(--status-yellow), #B8860B)'
                    : 'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))',
            boxShadow:
              displayStatus === 'active'
                ? '0 0 30px color-mix(in srgb, var(--accent-primary) 40%, transparent), inset 0 0 20px rgba(255,255,255,0.1)'
                : displayStatus === 'connecting'
                  ? '0 0 20px color-mix(in srgb, var(--status-yellow) 30%, transparent)'
                  : 'inset 0 0 20px rgba(255,255,255,0.05)',
            animation: displayStatus === 'active' ? 'orbBreathe 3s ease-in-out infinite' : undefined,
            opacity: displayStatus === 'ended' ? 0.5 : 1,
          }}
        >
          {/* Mic icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: displayStatus === 'ended' ? 'var(--text-muted)' : '#fff' }}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      </div>

      {/* Label below orb */}
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {isConnected
          ? t('testing.voice.endSession', language)
          : displayStatus === 'ended'
            ? (language === 'bm' ? 'Sesi Tamat' : 'Session Ended')
            : t('testing.voice.startSession', language)}
      </p>

      {/* Helper text */}
      {displayStatus === 'ready' && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {language === 'bm' ? 'Akses mikrofon diperlukan' : 'Microphone access required'}
        </p>
      )}

      {/* Test tag caption */}
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {t('testing.voice.testTagged', language)}
      </p>

      {/* Live Transcript Panel */}
      <div className="w-full">
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
