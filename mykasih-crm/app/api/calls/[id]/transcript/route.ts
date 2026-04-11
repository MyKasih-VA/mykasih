import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // MUST await in Next.js 16

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the call exists
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id, channel, caller_name, timestamp, duration, category, outcome')
      .eq('id', id)
      .single()

    if (callError || !call) {
      return Response.json({ error: 'Call not found' }, { status: 404 })
    }

    // Fetch transcript turns ordered by timestamp
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id, speaker, message, timestamp')
      .eq('call_id', id)
      .order('timestamp', { ascending: true })

    if (transcriptError) {
      return Response.json(
        { error: 'Failed to fetch transcript', detail: transcriptError.message },
        { status: 500 }
      )
    }

    return Response.json({
      call,
      transcript: transcript ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
