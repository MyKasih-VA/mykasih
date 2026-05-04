export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import {
  buildExportWorkbook,
  type CallExportRow,
  type TicketExportRow,
  type ExportSummary,
  type ExportData,
} from '@/lib/export-helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role guard: admin and qmedia only (per D-10)
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['admin', 'qmedia']
    if (!userRecord || !allowedRoles.includes(userRecord.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query params (per D-09)
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') // YYYY-MM-DD
    const to = searchParams.get('to')     // YYYY-MM-DD
    const excludeTest = searchParams.get('exclude_test') === 'true'

    // ---- Query calls ----
    let callsQuery = supabase
      .from('calls')
      .select('*')

    if (excludeTest) {
      callsQuery = callsQuery.eq('is_test', false)
    }
    if (from) {
      callsQuery = callsQuery.gte('timestamp', `${from}T00:00:00.000Z`)
    }
    if (to) {
      callsQuery = callsQuery.lte('timestamp', `${to}T23:59:59.999Z`)
    }

    callsQuery = callsQuery.order('timestamp', { ascending: false })

    const { data: callsRaw, error: callsError } = await callsQuery

    if (callsError) {
      return Response.json(
        { error: 'Failed to query calls', detail: callsError.message },
        { status: 500 }
      )
    }

    const calls = callsRaw ?? []

    // ---- Query tickets ----
    let ticketsQuery = supabase
      .from('tickets')
      .select('*')

    if (from) {
      ticketsQuery = ticketsQuery.gte('created_at', `${from}T00:00:00.000Z`)
    }
    if (to) {
      ticketsQuery = ticketsQuery.lte('created_at', `${to}T23:59:59.999Z`)
    }

    ticketsQuery = ticketsQuery.order('created_at', { ascending: false })

    const { data: ticketsRaw, error: ticketsError } = await ticketsQuery

    if (ticketsError) {
      return Response.json(
        { error: 'Failed to query tickets', detail: ticketsError.message },
        { status: 500 }
      )
    }

    const tickets = ticketsRaw ?? []

    // ---- Map to export row types ----
    const callRows: CallExportRow[] = calls.map((c, idx) => ({
      no: idx + 1,
      timestamp: c.timestamp ? new Date(c.timestamp as string).toLocaleString('en-MY') : '',
      channel: (c.channel as string) === 'voice' ? '📞 Voice' : '💬 Chat',
      caller_name: c.caller_name as string | null,
      wa_number: c.wa_number as string | null,
      location: c.location as string | null,
      language: c.language as string | null,
      duration_or_messages: (c.channel as string) === 'voice'
        ? (c.duration as number | null)
        : (c.message_count as number | null),
      category: c.category as string | null,
      outcome: c.outcome as string | null,
      csat_rating: c.csat_rating as number | null,
      is_test: c.is_test as boolean,
    }))

    const ticketRows: TicketExportRow[] = tickets.map((t, idx) => ({
      no: idx + 1,
      reference_no: t.reference_no as string,
      created_at: t.created_at ? new Date(t.created_at as string).toLocaleString('en-MY') : '',
      category: t.category as string | null,
      description: t.description as string | null,
      status: t.status as string,
      masked_ic: t.masked_ic as string | null,
      assigned_to: t.assigned_to as string | null,
      call_id: t.call_id as string | null,
    }))

    // ---- Build summary ----
    const voiceCount = calls.filter((c) => c.channel === 'voice').length
    const chatCount = calls.filter((c) => c.channel === 'chat').length

    const byCategory: Record<string, number> = {}
    for (const c of calls) {
      const cat = (c.category as string) ?? 'unknown'
      byCategory[cat] = (byCategory[cat] ?? 0) + 1
    }

    const byOutcome: Record<string, number> = {}
    for (const c of calls) {
      const out = (c.outcome as string) ?? 'unknown'
      byOutcome[out] = (byOutcome[out] ?? 0) + 1
    }

    const csatValues = calls
      .map((c) => c.csat_rating as number | null)
      .filter((v): v is number => v !== null)
    const averageCsat = csatValues.length > 0
      ? Math.round((csatValues.reduce((a, b) => a + b, 0) / csatValues.length) * 10) / 10
      : null

    const summary: ExportSummary = {
      total_interactions: calls.length,
      voice_count: voiceCount,
      chat_count: chatCount,
      by_category: byCategory,
      by_outcome: byOutcome,
      average_csat: averageCsat,
      tickets_open: tickets.filter((t) => t.status === 'open').length,
      tickets_in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      tickets_resolved: tickets.filter((t) => t.status === 'resolved').length,
      date_from: from,
      date_to: to,
    }

    // ---- Build workbook and return binary response ----
    const exportData: ExportData = {
      calls: callRows,
      tickets: ticketRows,
      summary,
    }

    const buffer = buildExportWorkbook(exportData)
    const filename = `mykasih-export-${new Date().toISOString().split('T')[0]}.xlsx`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
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
