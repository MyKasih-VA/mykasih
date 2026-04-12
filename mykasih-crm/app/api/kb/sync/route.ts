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

    // Format entries into a knowledge document string
    const knowledgeDocument = entries
      .map((entry) =>
        `Q (BM): ${entry.question_bm}\nA (BM): ${entry.answer_bm}\nQ (EN): ${entry.question_en}\nA (EN): ${entry.answer_en}`
      )
      .join('\n\n')

    // Push to ElevenLabs Agent API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${process.env.ELEVENLABS_AGENT_ID}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                knowledge_base: knowledgeDocument,
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
