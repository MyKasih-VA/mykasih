import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('ticket_notes')
      .select('id, author, content, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return Response.json(
        { error: 'Failed to fetch notes', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ data: data ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { content: string }

    if (!body.content || body.content.trim().length === 0) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get author name from user metadata or email
    const author = user.user_metadata?.name ?? user.email ?? 'Unknown'

    const { data, error } = await supabase
      .from('ticket_notes')
      .insert({
        ticket_id: id,
        author,
        content: body.content.trim(),
      })
      .select('id, author, content, created_at')
      .single()

    if (error) {
      return Response.json(
        { error: 'Failed to add note', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
