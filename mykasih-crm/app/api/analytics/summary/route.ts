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

    // Today's interactions (voice + chat count)
    const { count: todayTotal } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false)
      .gte('timestamp', todayISO)

    const { count: todayVoice } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false)
      .eq('channel', 'voice')
      .gte('timestamp', todayISO)

    const { count: todayChat } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false)
      .eq('channel', 'chat')
      .gte('timestamp', todayISO)

    // Resolution rate (resolved / total non-test calls)
    const { count: totalCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false)

    const { count: resolvedCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false)
      .eq('outcome', 'resolved')

    const resolutionRate = totalCalls && totalCalls > 0
      ? Math.round((resolvedCalls ?? 0) / totalCalls * 100)
      : 0

    // Open tickets count
    const { count: openTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    const { count: inProgressTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    // Average duration (voice calls only)
    const { data: voiceCalls } = await supabase
      .from('calls')
      .select('duration')
      .eq('is_test', false)
      .eq('channel', 'voice')
      .not('duration', 'is', null)

    const avgDuration = voiceCalls && voiceCalls.length > 0
      ? Math.round(voiceCalls.reduce((sum, c) => sum + (c.duration ?? 0), 0) / voiceCalls.length)
      : 0

    // Average message count (chat only)
    const { data: chatCalls } = await supabase
      .from('calls')
      .select('message_count')
      .eq('is_test', false)
      .eq('channel', 'chat')
      .not('message_count', 'is', null)

    const avgMessages = chatCalls && chatCalls.length > 0
      ? Math.round(chatCalls.reduce((sum, c) => sum + (c.message_count ?? 0), 0) / chatCalls.length)
      : 0

    // Last 7 days volume (for bar chart)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: recentCalls } = await supabase
      .from('calls')
      .select('channel, timestamp')
      .eq('is_test', false)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: true })

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const volumeByDay: Record<string, { voice: number; chat: number }> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const key = dayNames[d.getDay()]
      volumeByDay[key] = { voice: 0, chat: 0 }
    }
    for (const call of recentCalls ?? []) {
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

    // Category breakdown (for donut chart)
    const { data: categoryCounts } = await supabase
      .from('calls')
      .select('category')
      .eq('is_test', false)

    const categoryMap: Record<string, number> = {}
    for (const c of categoryCounts ?? []) {
      if (c.category) {
        categoryMap[c.category] = (categoryMap[c.category] ?? 0) + 1
      }
    }
    const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

    // Recent 10 interactions
    const { data: recent } = await supabase
      .from('calls')
      .select('id, channel, caller_name, category, outcome, timestamp, duration, message_count')
      .eq('is_test', false)
      .order('timestamp', { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: {
        todayTotal: todayTotal ?? 0,
        todayVoice: todayVoice ?? 0,
        todayChat: todayChat ?? 0,
        resolutionRate,
        openTickets: openTickets ?? 0,
        inProgressTickets: inProgressTickets ?? 0,
        avgDuration,
        avgMessages,
      },
      dailyVolume,
      categories,
      recent: recent ?? [],
    })
  } catch (error) {
    console.error('[analytics/summary] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
