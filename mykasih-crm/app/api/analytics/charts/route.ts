import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getDateRange(
  period: string | null,
  fromParam: string | null,
  toParam: string | null,
): { fromDate: string; toDate: string } {
  const now = new Date()
  const toDate = new Date(now)
  toDate.setHours(23, 59, 59, 999)

  if (period === 'custom' && fromParam && toParam) {
    const from = new Date(fromParam)
    from.setHours(0, 0, 0, 0)
    const to = new Date(toParam)
    to.setHours(23, 59, 59, 999)
    return { fromDate: from.toISOString(), toDate: to.toISOString() }
  }

  let fromDate: Date
  switch (period) {
    case 'today': {
      fromDate = new Date(now)
      fromDate.setHours(0, 0, 0, 0)
      break
    }
    case 'thisMonth': {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
      fromDate.setHours(0, 0, 0, 0)
      break
    }
    case 'last3Months': {
      fromDate = new Date(now)
      fromDate.setDate(fromDate.getDate() - 90)
      fromDate.setHours(0, 0, 0, 0)
      break
    }
    case 'thisWeek':
    default: {
      // Start from Monday of current week
      fromDate = new Date(now)
      const dayOfWeek = fromDate.getDay() // 0=Sun, 1=Mon, ...
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      fromDate.setDate(fromDate.getDate() + diff)
      fromDate.setHours(0, 0, 0, 0)
      break
    }
  }

  return { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const { fromDate, toDate } = getDateRange(period, fromParam, toParam)

    // Fetch all calls in range (non-test)
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, channel, category, outcome, language, csat_rating, timestamp')
      .eq('is_test', false)
      .gte('timestamp', fromDate)
      .lte('timestamp', toDate)

    if (callsError) {
      console.error('[analytics/charts] Supabase error:', callsError)
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
    }

    const allCalls = calls ?? []
    const totalInteractions = allCalls.length

    // Stats
    const csatRatings = allCalls
      .map(c => c.csat_rating)
      .filter((r): r is number => r !== null && r !== undefined)

    const avgCsat =
      csatRatings.length > 0
        ? Math.round((csatRatings.reduce((a, b) => a + b, 0) / csatRatings.length) * 10) / 10
        : null

    const resolvedCount = allCalls.filter(c => c.outcome === 'resolved').length
    const resolutionRate =
      totalInteractions > 0 ? Math.round((resolvedCount / totalInteractions) * 100) : 0

    // Peak hour — count calls per hour, find max
    const hourCounts: number[] = Array(24).fill(0)
    for (const call of allCalls) {
      const hour = new Date(call.timestamp).getHours()
      hourCounts[hour]++
    }
    const maxHourCount = Math.max(...hourCounts)
    const peakHourIndex = maxHourCount > 0 ? hourCounts.indexOf(maxHourCount) : 9 // default 09:00
    const peakHour = `${String(peakHourIndex).padStart(2, '0')}:00`

    // Volume by day — group by YYYY-MM-DD
    const volumeMap: Record<string, { voice: number; chat: number }> = {}
    for (const call of allCalls) {
      const date = call.timestamp.slice(0, 10) // YYYY-MM-DD
      if (!volumeMap[date]) volumeMap[date] = { voice: 0, chat: 0 }
      if (call.channel === 'voice') volumeMap[date].voice++
      else if (call.channel === 'chat') volumeMap[date].chat++
    }
    const volumeByDay = Object.entries(volumeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }))

    // CSAT by day
    const csatDayMap: Record<string, number[]> = {}
    for (const call of allCalls) {
      if (call.csat_rating !== null && call.csat_rating !== undefined) {
        const date = call.timestamp.slice(0, 10)
        if (!csatDayMap[date]) csatDayMap[date] = []
        csatDayMap[date].push(call.csat_rating)
      }
    }
    const csatByDay = Object.entries(csatDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ratings]) => ({
        date,
        avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      }))

    // Language distribution
    const langMap: Record<string, number> = {}
    for (const call of allCalls) {
      const lang = call.language ?? 'unknown'
      langMap[lang] = (langMap[lang] ?? 0) + 1
    }
    const languageDistribution = Object.entries(langMap).map(([name, value]) => ({ name, value }))

    // Heatmap — day 0=Mon..6=Sun, hour 0-23
    const heatmapMap: Record<string, number> = {}
    for (const call of allCalls) {
      const d = new Date(call.timestamp)
      const jsDay = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
      const monBasedDay = jsDay === 0 ? 6 : jsDay - 1 // Convert to Mon=0..Sun=6
      const hour = d.getHours()
      const key = `${monBasedDay}-${hour}`
      heatmapMap[key] = (heatmapMap[key] ?? 0) + 1
    }
    const heatmap = Object.entries(heatmapMap).map(([key, count]) => {
      const [dayStr, hourStr] = key.split('-')
      return { day: Number(dayStr), hour: Number(hourStr), count }
    })

    // Category breakdown
    const catMap: Record<string, { voice: number; chat: number }> = {}
    for (const call of allCalls) {
      const cat = call.category ?? 'unknown'
      if (!catMap[cat]) catMap[cat] = { voice: 0, chat: 0 }
      if (call.channel === 'voice') catMap[cat].voice++
      else if (call.channel === 'chat') catMap[cat].chat++
    }
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, counts]) => ({
        category,
        voice: counts.voice,
        chat: counts.chat,
        total: counts.voice + counts.chat,
        percentage:
          totalInteractions > 0
            ? Math.round(((counts.voice + counts.chat) / totalInteractions) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      stats: {
        totalInteractions,
        avgCsat,
        resolutionRate,
        peakHour,
      },
      volumeByDay,
      csatByDay,
      languageDistribution,
      heatmap,
      categoryBreakdown,
    })
  } catch (error) {
    console.error('[analytics/charts] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
