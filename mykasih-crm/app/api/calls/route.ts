import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // All authenticated roles can read calls
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    // Filters
    const channel = searchParams.get('channel') // 'voice' | 'chat' | null (all)
    const category = searchParams.get('category')
    const outcome = searchParams.get('outcome')
    const language = searchParams.get('language')
    const from = searchParams.get('from') // YYYY-MM-DD
    const to = searchParams.get('to')     // YYYY-MM-DD
    const search = searchParams.get('search') // searches caller_name, wa_number
    const includeTest = searchParams.get('include_test') === 'true'

    let query = supabase
      .from('calls')
      .select('*', { count: 'exact' })

    // Apply filters
    if (!includeTest) {
      query = query.eq('is_test', false)
    }
    if (channel) {
      query = query.eq('channel', channel)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (outcome) {
      query = query.eq('outcome', outcome)
    }
    if (language) {
      query = query.eq('language', language)
    }
    if (from) {
      query = query.gte('timestamp', `${from}T00:00:00.000Z`)
    }
    if (to) {
      query = query.lte('timestamp', `${to}T23:59:59.999Z`)
    }
    if (search) {
      query = query.or(`caller_name.ilike.%${search}%,wa_number.ilike.%${search}%`)
    }

    // Order and paginate
    query = query.order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      return Response.json(
        { error: 'Failed to fetch calls', detail: error.message },
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
