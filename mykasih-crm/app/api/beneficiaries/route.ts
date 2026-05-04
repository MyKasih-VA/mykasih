import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Beneficiary interface — used by GET /api/beneficiaries (contacts list mode)
// ---------------------------------------------------------------------------

export interface Beneficiary {
  id: string                     // first call id (for deep-link to profile)
  name: string | null            // caller_name from most recent call
  channel: 'voice' | 'chat' | 'both'
  wa_number: string | null
  last_contact: string           // ISO timestamp of most recent call
  interaction_count: number
  open_ticket_count: number      // defaults to 0 — ticket join deferred to Phase 2
}

// ---------------------------------------------------------------------------
// GET handler — two modes:
//   1. ?query=<string>  → search mode (existing behaviour — used by beneficiaries page)
//   2. ?page=&limit=    → contacts list mode (new — aggregated beneficiary list)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('query')?.trim()

    // ── MODE 1: Search mode (query present) ──────────────────────────────────
    if (q !== undefined && q !== null) {
      if (q.length < 2) {
        return NextResponse.json({ error: 'Query too short' }, { status: 400 })
      }

      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .or(`wa_number.ilike.%${q}%,caller_name.ilike.%${q}%`)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (callsError) {
        return NextResponse.json(
          { error: 'Failed to search calls', detail: callsError.message },
          { status: 500 }
        )
      }

      const callIds = (calls ?? []).map((c: { id: string }) => c.id)

      const { data: tickets, error: ticketsError } = callIds.length > 0
        ? await supabase
            .from('tickets')
            .select('*')
            .in('call_id', callIds)
            .order('created_at', { ascending: false })
        : { data: [] as Record<string, unknown>[], error: null }

      if (ticketsError) {
        return NextResponse.json(
          { error: 'Failed to fetch tickets', detail: ticketsError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ calls: calls ?? [], tickets: tickets ?? [] })
    }

    // ── MODE 2: Contacts list mode (no query param) ───────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const offset = (page - 1) * limit

    // Fetch all calls needed for JS-side aggregation (including test calls)
    // Safety cap of 5000 rows — at 100 calls/day covers ~50 days (acceptable for POC)
    const { data: calls, error } = await supabase
      .from('calls')
      .select('id, channel, caller_name, wa_number, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5000)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
    }

    // --- JS-side aggregation ---
    const byWaNumber = new Map<string, {
      id: string
      name: string | null
      channels: Set<string>
      wa_number: string
      last_contact: string
      count: number
    }>()

    const byCallerName = new Map<string, {
      id: string
      name: string
      channels: Set<string>
      last_contact: string
      count: number
    }>()

    let unknownCount = 0

    for (const call of calls ?? []) {
      if (call.wa_number) {
        // Chat beneficiary — keyed by wa_number
        const existing = byWaNumber.get(call.wa_number)
        if (!existing) {
          byWaNumber.set(call.wa_number, {
            id: call.id,
            name: call.caller_name,
            channels: new Set([call.channel]),
            wa_number: call.wa_number,
            last_contact: call.timestamp,
            count: 1,
          })
        } else {
          existing.channels.add(call.channel)
          existing.count++
          // Keep most recent name if current stored name is null
          if (!existing.name && call.caller_name) existing.name = call.caller_name
          // last_contact already set to most recent (calls ordered DESC)
        }
      } else if (call.caller_name) {
        // Voice-only beneficiary with known name — keyed by caller_name (normalised lowercase)
        const key = call.caller_name.toLowerCase().trim()
        const existing = byCallerName.get(key)
        if (!existing) {
          byCallerName.set(key, {
            id: call.id,
            name: call.caller_name,
            channels: new Set([call.channel]),
            last_contact: call.timestamp,
            count: 1,
          })
        } else {
          existing.channels.add(call.channel)
          existing.count++
        }
      } else {
        unknownCount++
      }
    }

    // Build flat sorted array
    const beneficiaries: Beneficiary[] = [
      ...Array.from(byWaNumber.values()).map((b) => ({
        id: b.id,
        name: b.name,
        channel: (b.channels.has('voice') && b.channels.has('chat') ? 'both'
          : b.channels.has('chat') ? 'chat'
          : 'voice') as Beneficiary['channel'],
        wa_number: b.wa_number,
        last_contact: b.last_contact,
        interaction_count: b.count,
        open_ticket_count: 0,  // ticket join deferred — Phase 2
      })),
      ...Array.from(byCallerName.values()).map((b) => ({
        id: b.id,
        name: b.name,
        channel: 'voice' as Beneficiary['channel'],
        wa_number: null,
        last_contact: b.last_contact,
        interaction_count: b.count,
        open_ticket_count: 0,
      })),
    ].sort((a, b) => new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime())

    const total = beneficiaries.length
    const paginated = beneficiaries.slice(offset, offset + limit)

    return NextResponse.json({
      beneficiaries: paginated,
      total,
      unknown_count: unknownCount,
      page,
      limit,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
