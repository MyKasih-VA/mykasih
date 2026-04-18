// Resolution Rate = resolved_tickets / (resolved_tickets + escalated_calls)
// Numerator: tickets with status='resolved' in time window
// Denominator: resolved + escalated outcomes (excludes open, in_progress, abandoned, callback)
// Time window: defaults to current calendar day (UTC+8)
// Reopened tickets: not yet implemented — planned for v1.1

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Run ALL queries in parallel for speed
    const [
      todayTotalResult,
      todayVoiceResult,
      todayChatResult,
      totalCallsResult,
      resolvedCallsResult,
      openTicketsResult,
      inProgressTicketsResult,
      voiceCallsResult,
      chatCallsResult,
      recentCallsResult,
      categoryCountsResult,
      recentResult,
    ] = await Promise.all([
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_test', false).gte('timestamp', todayISO),
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_test', false).eq('channel', 'voice').gte('timestamp', todayISO),
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_test', false).eq('channel', 'chat').gte('timestamp', todayISO),
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_test', false),
      supabase.from('calls').select('*', { count: 'exact', head: true }).eq('is_test', false).eq('outcome', 'resolved'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('calls').select('duration').eq('is_test', false).eq('channel', 'voice').not('duration', 'is', null),
      supabase.from('calls').select('message_count').eq('is_test', false).eq('channel', 'chat').not('message_count', 'is', null),
      supabase.from('calls').select('channel, timestamp').eq('is_test', false).gte('timestamp', sevenDaysAgo.toISOString()).order('timestamp', { ascending: true }),
      supabase.from('calls').select('category').eq('is_test', false),
      supabase.from('calls').select('id, channel, caller_name, category, outcome, timestamp, duration, message_count').eq('is_test', false).order('timestamp', { ascending: false }).limit(10),
    ])

    const todayTotal = todayTotalResult.count ?? 0
    const todayVoice = todayVoiceResult.count ?? 0
    const todayChat = todayChatResult.count ?? 0
    const totalCalls = totalCallsResult.count ?? 0
    const resolvedCalls = resolvedCallsResult.count ?? 0
    const openTickets = openTicketsResult.count ?? 0
    const inProgressTickets = inProgressTicketsResult.count ?? 0

    const resolutionRate = totalCalls > 0
      ? Math.round(resolvedCalls / totalCalls * 100)
      : 0

    const voiceCalls = voiceCallsResult.data ?? []
    const avgDuration = voiceCalls.length > 0
      ? Math.round(voiceCalls.reduce((sum, c) => sum + (c.duration ?? 0), 0) / voiceCalls.length)
      : 0

    const chatCalls = chatCallsResult.data ?? []
    const avgMessages = chatCalls.length > 0
      ? Math.round(chatCalls.reduce((sum, c) => sum + (c.message_count ?? 0), 0) / chatCalls.length)
      : 0

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const volumeByDay: Record<string, { voice: number; chat: number }> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const key = dayNames[d.getDay()]
      volumeByDay[key] = { voice: 0, chat: 0 }
    }
    for (const call of recentCallsResult.data ?? []) {
      const d = new Date(call.timestamp)
      const key = dayNames[d.getDay()]
      if (volumeByDay[key]) {
        if (call.channel === 'voice') volumeByDay[key].voice++
        else volumeByDay[key].chat++
      }
    }
    const dailyVolume = Object.entries(volumeByDay).map(([day, counts]) => ({
      day,
      ...counts,
    }))

    // Category breakdown
    const categoryMap: Record<string, number> = {}
    for (const c of categoryCountsResult.data ?? []) {
      if (c.category) {
        categoryMap[c.category] = (categoryMap[c.category] ?? 0) + 1
      }
    }
    const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      stats: {
        todayTotal,
        todayVoice,
        todayChat,
        resolutionRate,
        openTickets,
        inProgressTickets,
        avgDuration,
        avgMessages,
      },
      dailyVolume,
      categories,
      recent: recentResult.data ?? [],
    })
  } catch (error) {
    console.error('[analytics/summary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
