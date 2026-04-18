import { createClient } from '@/lib/supabase/server'
import { generateTicketRef } from '@/lib/ticket-ref'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      call_id: string
      channel: string
      category: string
      description: string
    }

    if (!body.call_id || !body.category) {
      return Response.json({ error: 'call_id and category are required' }, { status: 400 })
    }

    const reference_no = await generateTicketRef()

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        call_id: body.call_id,
        channel: body.channel || null,
        category: body.category,
        description: body.description || null,
        status: 'open',
        reference_no,
      })
      .select('id, reference_no')
      .single()

    if (error) {
      return Response.json(
        { error: 'Failed to create ticket', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ ticket_id: data.id, reference_no: data.reference_no }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
    const offset = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') // 'open' | 'in_progress' | 'resolved'
    const category = searchParams.get('category')
    const channel = searchParams.get('channel')
    const search = searchParams.get('search') // searches reference_no, description

    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (channel) {
      query = query.eq('channel', channel)
    }
    if (search) {
      query = query.or(
        `reference_no.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      return Response.json(
        { error: 'Failed to fetch tickets', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
