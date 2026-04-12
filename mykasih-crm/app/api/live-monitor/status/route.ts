import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface VoiceSession {
  id: string
  caller_name: string | null
  wa_number: string | null
  language: string | null
  started_at: string
}

interface ChatSession {
  id: string
  wa_number: string
  intent: string | null
  language: string | null
  started_at: string
  message_count: number
}

async function getActiveVoiceSessions(): Promise<VoiceSession[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID
  if (!apiKey || !agentId) return []

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&status=active`,
      {
        headers: { 'xi-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return []
    const data = await res.json() as { conversations?: Record<string, unknown>[] }
    return (data.conversations || []).map((conv) => ({
      id: conv.conversation_id as string,
      caller_name: (conv.metadata as Record<string, unknown> | undefined)?.caller_name as string | null ?? null,
      wa_number: (conv.metadata as Record<string, unknown> | undefined)?.phone as string | null ?? null,
      language: (conv.metadata as Record<string, unknown> | undefined)?.language as string | null ?? null,
      started_at: conv.start_time as string || new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

async function getActiveChatSessions(): Promise<ChatSession[]> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('sessions')
    .select('id, wa_phone, language, intent, step, created_at, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return []

  return (data || []).map((session: {
    id: string
    wa_phone: string
    language: string | null
    intent: string | null
    step: number | null
    created_at: string
    expires_at: string
  }) => ({
    id: session.id,
    wa_number: session.wa_phone,
    intent: session.intent,
    language: session.language,
    started_at: session.created_at,
    message_count: session.step ?? 0,
  }))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [voiceResult, chatResult] = await Promise.allSettled([
      getActiveVoiceSessions(),
      getActiveChatSessions(),
    ])

    const voiceSessions = voiceResult.status === 'fulfilled' ? voiceResult.value : []
    const chatSessions = chatResult.status === 'fulfilled' ? chatResult.value : []

    return NextResponse.json({
      voice_sessions: voiceSessions,
      chat_sessions: chatSessions,
      voice_count: voiceSessions.length,
      chat_count: chatSessions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[live-monitor/status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
