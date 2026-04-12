'use client'

import { useEffect, useState, useCallback } from 'react'
import { Activity, BarChart2, Clock, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/dashboard/StatCard'
import { PeriodSelector } from '@/components/analytics/PeriodSelector'
import { VolumeBarChart } from '@/components/analytics/VolumeBarChart'
import { CsatTrendChart } from '@/components/analytics/CsatTrendChart'
import { LanguagePieChart } from '@/components/analytics/LanguagePieChart'
import { PeakHeatmap } from '@/components/analytics/PeakHeatmap'
import { CategoryTable } from '@/components/analytics/CategoryTable'
import { t } from '@/lib/translations'
import { useLanguage } from '@/hooks/useLanguage'

interface AnalyticsStats {
  totalInteractions: number
  avgCsat: number | null
  resolutionRate: number
  peakHour: string
}

interface AnalyticsData {
  stats: AnalyticsStats
  volumeByDay: Array<{ date: string; voice: number; chat: number }>
  csatByDay: Array<{ date: string; avg: number }>
  languageDistribution: Array<{ name: string; value: number }>
  heatmap: Array<{ day: number; hour: number; count: number }>
  categoryBreakdown: Array<{
    category: string
    voice: number
    chat: number
    total: number
    percentage: number
  }>
}

export default function AnalyticsPage() {
  const { language } = useLanguage()

  const [period, setPeriod] = useState('thisWeek')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(
    async (currentPeriod: string, currentFrom: Date | null, currentTo: Date | null) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ period: currentPeriod })
        if (currentPeriod === 'custom' && currentFrom && currentTo) {
          params.set('from', currentFrom.toISOString())
          params.set('to', currentTo.toISOString())
        }
        const res = await fetch(`/api/analytics/charts?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: AnalyticsData = await res.json()
        setData(json)
      } catch {
        setError(t('analytics.error', language))
      } finally {
        setLoading(false)
      }
    },
    [language],
  )

  useEffect(() => {
    void fetchAnalytics(period, from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to])

  function handlePeriodChange(newPeriod: string, newFrom?: Date, newTo?: Date) {
    setPeriod(newPeriod)
    setFrom(newFrom ?? null)
    setTo(newTo ?? null)
  }

  const stats = data?.stats

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {t('analytics.title', language)}
        </h1>
        <PeriodSelector
          period={period}
          from={from}
          to={to}
          onPeriodChange={handlePeriodChange}
          language={language}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-sm text-[var(--status-red)]">{error}</p>
          <button
            onClick={() => void fetchAnalytics(period, from, to)}
            className="text-xs text-[var(--accent-primary)] underline underline-offset-2"
          >
            {t('common.tryAgain', language)}
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Stat Cards — 4 columns on lg, 2 on sm */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t('analytics.totalInteractions', language)}
              value={loading ? '—' : (stats?.totalInteractions ?? 0)}
              icon={Activity}
              loading={loading}
            />
            <StatCard
              label={t('analytics.avgCsat', language)}
              value={
                loading
                  ? '—'
                  : stats?.avgCsat !== null && stats?.avgCsat !== undefined
                    ? `${stats.avgCsat} / 5`
                    : '—'
              }
              icon={Star}
              loading={loading}
            />
            <StatCard
              label={t('analytics.resolutionRate', language)}
              value={loading ? '—' : `${stats?.resolutionRate ?? 0}%`}
              icon={BarChart2}
              loading={loading}
            />
            <StatCard
              label={t('analytics.peakHour', language)}
              value={loading ? '—' : (stats?.peakHour ?? '—')}
              icon={Clock}
              loading={loading}
            />
          </div>

          {/* Charts 2x2 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume Bar Chart */}
            <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {t('analytics.volumeChart', language)}
              </p>
              {loading ? (
                <Skeleton className="w-full h-[240px] bg-[var(--bg-border)]" />
              ) : (
                <VolumeBarChart data={data?.volumeByDay ?? []} language={language} />
              )}
            </div>

            {/* CSAT Trend Chart */}
            <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {t('analytics.csatTrend', language)}
              </p>
              {loading ? (
                <Skeleton className="w-full h-[240px] bg-[var(--bg-border)]" />
              ) : (
                <CsatTrendChart data={data?.csatByDay ?? []} language={language} />
              )}
            </div>

            {/* Language Pie Chart */}
            <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {t('analytics.languagePie', language)}
              </p>
              {loading ? (
                <Skeleton className="w-full h-[240px] bg-[var(--bg-border)]" />
              ) : (
                <LanguagePieChart data={data?.languageDistribution ?? []} language={language} />
              )}
            </div>

            {/* Peak Heatmap */}
            <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {t('analytics.peakHeatmap', language)}
              </p>
              {loading ? (
                <Skeleton className="w-full h-[240px] bg-[var(--bg-border)]" />
              ) : (
                <PeakHeatmap data={data?.heatmap ?? []} language={language} />
              )}
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              {t('analytics.categoryBreakdown', language)}
            </p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-full h-10 bg-[var(--bg-border)]" />
                ))}
              </div>
            ) : (
              <CategoryTable data={data?.categoryBreakdown ?? []} language={language} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
