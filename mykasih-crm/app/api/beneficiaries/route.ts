import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('query')?.trim()
    if (!q || q.length < 2) {
      return Response.json({ error: 'Query too short' }, { status: 400 })
    }

    // Search calls by wa_number or caller_name, exclude test calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .or(`wa_number.ilike.%${q}%,caller_name.ilike.%${q}%`)
      .eq('is_test', false)
      .order('timestamp', { ascending: false })
      .limit(100)

    if (callsError) {
      return Response.json(
        { error: 'Failed to search calls', detail: callsError.message },
        { status: 500 }
      )
    }

    const callIds = (calls ?? []).map((c: { id: string }) => c.id)

    // Fetch tickets linked to those calls
    const { data: tickets, error: ticketsError } = callIds.length > 0
      ? await supabase
          .from('tickets')
          .select('*')
          .in('call_id', callIds)
          .order('created_at', { ascending: false })
      : { data: [] as Record<string, unknown>[], error: null }

    if (ticketsError) {
      return Response.json(
        { error: 'Failed to fetch tickets', detail: ticketsError.message },
        { status: 500 }
      )
    }

    return Response.json({ calls: calls ?? [], tickets: tickets ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
