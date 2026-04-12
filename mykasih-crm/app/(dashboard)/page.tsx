'use client'

import { useState, useEffect } from 'react'
import { Phone, Percent, Ticket, Clock } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { StatCard } from '@/components/dashboard/StatCard'
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart'
import { CategoryDonut } from '@/components/dashboard/CategoryDonut'
import { RecentInteractions } from '@/components/dashboard/RecentInteractions'

interface DashboardStats {
  todayTotal: number
  todayVoice: number
  todayChat: number
  resolutionRate: number
  openTickets: number
  inProgressTickets: number
  avgDuration: number
  avgMessages: number
}

interface DashboardData {
  stats: DashboardStats
  dailyVolume: Array<{ day: string; voice: number; chat: number }>
  categories: Array<{ name: string; value: number }>
  recent: Array<{
    id: string
    channel: 'voice' | 'chat'
    caller_name: string | null
    category: string | null
    outcome: string | null
    timestamp: string
    duration: number | null
    message_count: number | null
  }>
}

export default function DashboardPage() {
  const { language } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats

  return (
    <div>
      {/* Stat cards — 4-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.todayInteractions', language)}
          value={stats?.todayTotal ?? 0}
          subInfo={
            stats
              ? t('dashboard.stat.voiceChat', language)
                  .replace('{v}', String(stats.todayVoice))
                  .replace('{c}', String(stats.todayChat))
              : undefined
          }
          icon={Phone}
          loading={loading}
        />
        <StatCard
          label={t('dashboard.resolutionRate', language)}
          value={stats ? `${stats.resolutionRate}%` : '—'}
          icon={Percent}
          loading={loading}
        />
        <StatCard
          label={t('dashboard.openTickets', language)}
          value={stats?.openTickets ?? 0}
          subInfo={
            stats
              ? t('dashboard.stat.inProgress', language).replace('{n}', String(stats.inProgressTickets))
              : undefined
          }
          icon={Ticket}
          loading={loading}
        />
        <StatCard
          label={t('dashboard.avgDuration', language)}
          value={stats ? `${stats.avgDuration}s` : '—'}
          subInfo={
            stats
              ? t('dashboard.stat.avgMsgs', language).replace('{n}', String(stats.avgMessages))
              : undefined
          }
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Charts — 2fr / 1fr grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <CallVolumeChart
            data={data?.dailyVolume ?? []}
            title={t('dashboard.callVolume', language)}
            language={language}
            loading={loading}
          />
        </div>
        <CategoryDonut
          data={data?.categories ?? []}
          title={t('dashboard.byCategory', language)}
          language={language}
          loading={loading}
        />
      </div>

      {/* Recent interactions table */}
      <div className="mt-4">
        <RecentInteractions
          data={data?.recent ?? []}
          language={language}
          loading={loading}
        />
      </div>
    </div>
  )
}
