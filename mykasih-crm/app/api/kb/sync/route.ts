import { createClient } from '@/lib/supabase/server'

interface KbEntry {
  id: string
  category: string
  question_bm: string
  question_en: string
  answer_bm: string
  answer_en: string
  is_active: boolean
  last_updated: string
  updated_by: string | null
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active KB entries
    const { data, error } = await supabase
      .from('kb_entries')
      .select('*')
      .eq('is_active', true)

    if (error) {
      return Response.json(
        { error: 'Failed to fetch KB entries for sync', detail: error.message },
        { status: 500 }
      )
    }

    const entries = (data ?? []) as KbEntry[]

    // Format entries as a structured FAQ section to append to agent system prompt
    const kbSection = entries
      .map((entry) =>
        `[${entry.category.toUpperCase()}]\nQ (BM): ${entry.question_bm}\nA (BM): ${entry.answer_bm}\nQ (EN): ${entry.question_en}\nA (EN): ${entry.answer_en}`
      )
      .join('\n\n')

    // Fetch current agent to get existing system prompt
    const agentId = process.env.ELEVENLABS_AGENT_ID
    const apiKey = process.env.ELEVENLABS_API_KEY!
    const getRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      { headers: { 'xi-api-key': apiKey } }
    )
    let basePrompt = ''
    if (getRes.ok) {
      const agentData = await getRes.json() as {
        conversation_config?: { agent?: { prompt?: { prompt?: string } } }
      }
      const existing = agentData.conversation_config?.agent?.prompt?.prompt ?? ''
      // Strip any previously synced KB section to avoid duplication
      const kbMarker = '\n\n--- KNOWLEDGE BASE ---'
      basePrompt = existing.includes(kbMarker)
        ? existing.substring(0, existing.indexOf(kbMarker))
        : existing
    }

    const updatedPrompt = entries.length > 0
      ? `${basePrompt}\n\n--- KNOWLEDGE BASE ---\n${kbSection}`
      : basePrompt

    // Push updated system prompt to ElevenLabs Agent API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: updatedPrompt,
              },
            },
          },
        }),
      }
    )

    if (!elevenLabsResponse.ok) {
      let errorMessage = `ElevenLabs API error ${elevenLabsResponse.status}`
      try {
        const errBody = await elevenLabsResponse.json() as { detail?: string; message?: string }
        errorMessage = errBody.detail ?? errBody.message ?? errorMessage
      } catch {
        // Could not parse error body — use default message
      }
      return Response.json(
        { error: errorMessage },
        { status: 502 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
