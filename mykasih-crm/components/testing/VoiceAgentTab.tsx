'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
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

const CATEGORY_CHIPS = [
  'Semak Baki',
  'Kelayakan',
  'Aduan / Complaints',
  'Kedai / Merchants',
  'Soalan Lazim / FAQ',
]

// --- VoiceAgentInner ---
function VoiceAgentInner() {
  const { language } = useLanguage()
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('ready')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef<string | undefined>(undefined)
  const sessionStartRef = useRef<number>(0)

  const { startSession, endSession, status } = useConversation({
    onConnect: () => {
      sessionStartRef.current = Date.now()
      setDisplayStatus('active')
    },
    onDisconnect: async () => {
      const elapsed = Date.now() - sessionStartRef.current
      if (sessionStartRef.current > 0 && elapsed < 3000) {
        toast.error(t('testing.voice.error', language))
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
        // Best-effort fallback
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

  const handleStartSession = useCallback(async () => {
    setDisplayStatus('connecting')
    setTranscript([])
    sessionStartRef.current = 0
    try {
      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Fetch signed URL from backend (never expose API key to client)
      const res = await fetch('/api/elevenlabs/signed-url')
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown' }))
        throw new Error(`signed_url_failed: ${(data as { error?: string }).error ?? 'Unknown'}`)
      }
      const { signedUrl } = (await res.json()) as { signedUrl: string }
      if (!signedUrl) throw new Error('signed_url_empty')

      // Start session with signed URL + is_test flag via dynamicVariables
      await startSession({ signedUrl, dynamicVariables: { is_test: true } })
    } catch {
      toast.error(t('testing.voice.error', language))
      setDisplayStatus('ready')
    }
  }, [startSession, language])

  const handleEndSession = () => {
    endSession()
  }

  // Status label + color from translation system
  const statusLabel = t(`testing.voice.status.${displayStatus}` as Parameters<typeof t>[0], language)

  const statusDotColors: Record<DisplayStatus, string> = {
    ready: 'var(--status-green)',
    connecting: 'var(--status-yellow)',
    active: 'var(--status-green)',
    ended: 'var(--text-muted)',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Orb keyframe animations — using CSS custom properties for theming */}
      <style>{`
        @keyframes orbGlow {
          0%, 100% { box-shadow: 0 0 40px 8px color-mix(in srgb, var(--accent-primary) 25%, transparent); }
          50% { box-shadow: 0 0 50px 12px color-mix(in srgb, var(--accent-primary) 35%, transparent); }
        }
        @keyframes orbPulseConnect {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.25); opacity: 0.6; }
        }
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes orbRing1 {
          0% { transform: scale(1); opacity: 0.35; }
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes orbRing2 {
          0% { transform: scale(1); opacity: 0.2; }
          75%, 100% { transform: scale(1.85); opacity: 0; }
        }
        @keyframes orbRing3 {
          0% { transform: scale(1); opacity: 0.1; }
          75%, 100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes audioLevelDash {
          0%, 100% { border-color: color-mix(in srgb, var(--accent-primary) 20%, transparent); }
          50% { border-color: color-mix(in srgb, var(--accent-primary) 50%, transparent); }
        }
      `}</style>

      {/* Split panel layout */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '520px' }}>
        {/* LEFT PANEL — Voice Agent Controls (~55%) */}
        <div
          className="flex-[55] flex flex-col items-center rounded-lg px-6 py-6"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Category chips — horizontal scrollable */}
          <div className="w-full overflow-x-auto pb-2 mb-4 flex-shrink-0">
            <div className="flex gap-2 min-w-max">
              {CATEGORY_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap select-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0${displayStatus === 'active' ? ' animate-pulse' : ''}`}
              style={{ backgroundColor: statusDotColors[displayStatus] }}
            />
            <span
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: statusDotColors[displayStatus] }}
            >
              {statusLabel.toUpperCase()}
            </span>
          </div>

          {/* Orb area — centered with flex grow */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Orb container */}
            <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
              {/* Active state — expanding green glow rings */}
              {displayStatus === 'active' && (
                <>
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: 150,
                      height: 150,
                      left: 15,
                      top: 15,
                      backgroundColor: 'var(--accent-primary)',
                      animation: 'orbRing1 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: 150,
                      height: 150,
                      left: 15,
                      top: 15,
                      backgroundColor: 'var(--accent-primary)',
                      animation: 'orbRing2 2s cubic-bezier(0, 0, 0.2, 1) infinite 250ms',
                    }}
                  />
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: 150,
                      height: 150,
                      left: 15,
                      top: 15,
                      backgroundColor: 'var(--accent-primary)',
                      animation: 'orbRing3 2s cubic-bezier(0, 0, 0.2, 1) infinite 500ms',
                    }}
                  />
                </>
              )}

              {/* Connecting state — pulsing ring */}
              {displayStatus === 'connecting' && (
                <span
                  className="absolute rounded-full"
                  style={{
                    width: 150,
                    height: 150,
                    left: 15,
                    top: 15,
                    backgroundColor: 'var(--status-yellow)',
                    animation: 'orbPulseConnect 1.5s ease-in-out infinite',
                  }}
                />
              )}

              {/* Orb core — clean gradient, no mic icon */}
              <div
                className="relative z-10 rounded-full"
                style={{
                  width: 150,
                  height: 150,
                  background:
                    displayStatus === 'ended'
                      ? 'var(--bg-border)'
                      : displayStatus === 'active'
                        ? 'radial-gradient(circle at 40% 35%, var(--accent-primary), var(--accent-teal))'
                        : 'radial-gradient(circle at 40% 35%, var(--status-green), var(--accent-primary))',
                  boxShadow:
                    displayStatus === 'ended'
                      ? 'none'
                      : displayStatus === 'active'
                        ? '0 0 40px 10px color-mix(in srgb, var(--accent-primary) 40%, transparent)'
                        : '0 0 40px 8px color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                  animation:
                    displayStatus === 'active'
                      ? 'orbBreathe 3s ease-in-out infinite'
                      : displayStatus === 'ready'
                        ? 'orbGlow 4s ease-in-out infinite'
                        : undefined,
                  opacity: displayStatus === 'ended' ? 0.4 : 1,
                  transition: 'opacity 0.5s ease',
                }}
              />
            </div>

            {/* Dashed audio level indicator ring */}
            <div
              className="mt-3 rounded-full"
              style={{
                width: 80,
                height: 4,
                border: '1px dashed',
                borderColor: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                animation:
                  displayStatus === 'active' || displayStatus === 'connecting'
                    ? 'audioLevelDash 1.5s ease-in-out infinite'
                    : undefined,
              }}
            />
          </div>

          {/* Button + hints — bottom area */}
          <div className="flex flex-col items-center gap-3 mt-6 flex-shrink-0">
            {/* Start / End button */}
            <button
              onClick={isConnected ? handleEndSession : () => void handleStartSession()}
              disabled={isConnecting}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: isConnected ? 'var(--status-red)' : 'var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {/* Mic / Stop icon */}
              {isConnected ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              ) : (
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
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
              {isConnected
                ? t('testing.voice.endSession', language)
                : displayStatus === 'ended'
                  ? (language === 'bm' ? 'Mula Semula' : 'Restart')
                  : t('testing.voice.startSession', language)}
            </button>

            {/* Language hint */}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {language === 'bm'
                ? 'Bercakap dalam BM atau EN'
                : 'Speak in BM or English'}
            </p>

            {/* Test tag caption */}
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              {t('testing.voice.testTagged', language)}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — Transcript (~45%) */}
        <div
          className="flex-[45] flex flex-col rounded-lg px-5 py-5"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Transcript header */}
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3
              className="text-xs font-semibold tracking-wider uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('testing.voice.liveTranscript', language)}
            </h3>
          </div>

          {/* Transcript body — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {transcript.length === 0 ? (
              <div className="h-full flex items-center justify-center px-4">
                <p
                  className="text-sm text-center leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('testing.voice.transcriptEmpty', language)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {transcript.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${line.speaker === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide mb-1 px-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {line.speaker === 'user'
                        ? (language === 'bm' ? 'Anda' : 'You')
                        : 'SARA'}
                    </span>
                    <div
                      className="rounded-lg px-3 py-2 text-sm max-w-[85%]"
                      style={{
                        backgroundColor:
                          line.speaker === 'user'
                            ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                            : 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border:
                          line.speaker === 'user'
                            ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)'
                            : '1px solid var(--bg-border)',
                      }}
                    >
                      {line.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
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
