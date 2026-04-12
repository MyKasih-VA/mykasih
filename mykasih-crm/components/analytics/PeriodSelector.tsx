'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { t, type Language } from '@/lib/translations'
import type { DateRange } from 'react-day-picker'

interface PeriodSelectorProps {
  period: string
  from: Date | null
  to: Date | null
  onPeriodChange: (period: string, from?: Date, to?: Date) => void
  language: Language
}

export function PeriodSelector({ period, from, to, onPeriodChange, language }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(
    from && to ? { from, to } : undefined,
  )

  const presets = [
    { value: 'today', label: t('analytics.today', language) },
    { value: 'thisWeek', label: t('analytics.thisWeek', language) },
    { value: 'thisMonth', label: t('analytics.thisMonth', language) },
    { value: 'last3Months', label: t('analytics.last3Months', language) },
    { value: 'custom', label: t('analytics.custom', language) },
  ]

  function handleTabChange(value: string) {
    if (value === 'custom') {
      setOpen(true)
    } else {
      setOpen(false)
      onPeriodChange(value)
    }
  }

  function handleRangeSelect(selectedRange: DateRange | undefined) {
    setRange(selectedRange)
    if (selectedRange?.from && selectedRange?.to) {
      setOpen(false)
      onPeriodChange('custom', selectedRange.from, selectedRange.to)
    }
  }

  const customLabel =
    from && to
      ? `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`
      : t('analytics.custom', language)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tabs value={period} onValueChange={handleTabChange}>
        <TabsList
          className="h-9 gap-1 p-1"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
        >
          {presets.map(preset =>
            preset.value === 'custom' ? (
              <Popover key="custom" open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <TabsTrigger
                    value="custom"
                    style={
                      period === 'custom'
                        ? { background: 'var(--accent-primary)', color: 'var(--text-primary)' }
                        : { color: 'var(--text-muted)' }
                    }
                    className="text-xs h-7 px-3 rounded-sm data-[state=active]:shadow-none"
                  >
                    {period === 'custom' ? customLabel : preset.label}
                  </TabsTrigger>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                  }}
                  align="start"
                >
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={handleRangeSelect}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <TabsTrigger
                key={preset.value}
                value={preset.value}
                style={
                  period === preset.value
                    ? { background: 'var(--accent-primary)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }
                }
                className="text-xs h-7 px-3 rounded-sm data-[state=active]:shadow-none"
              >
                {preset.label}
              </TabsTrigger>
            ),
          )}
        </TabsList>
      </Tabs>
    </div>
  )
}
