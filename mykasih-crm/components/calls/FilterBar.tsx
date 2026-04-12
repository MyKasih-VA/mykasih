'use client'

import { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t, type Language } from '@/lib/translations'

export interface CallFilters {
  search: string
  datePreset: '' | 'today' | 'week' | 'month' | 'custom'
  dateFrom: string
  dateTo: string
  language: string
  category: string
  outcome: string
}

export const DEFAULT_FILTERS: CallFilters = {
  search: '',
  datePreset: '',
  dateFrom: '',
  dateTo: '',
  language: '',
  category: '',
  outcome: '',
}

interface FilterBarProps {
  filters: CallFilters
  onFilterChange: (filters: CallFilters) => void
  onExport: () => void
  showLanguageFilter?: boolean
  language: Language
  exporting?: boolean
}

export function FilterBar({
  filters,
  onFilterChange,
  onExport,
  showLanguageFilter = false,
  language,
  exporting = false,
}: FilterBarProps) {
  // Local search state with 300ms debounce
  const [localSearch, setLocalSearch] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Keep local search in sync if parent resets filters
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  function handleDatePreset(value: string) {
    onFilterChange({
      ...filters,
      datePreset: value as CallFilters['datePreset'],
      dateFrom: value !== 'custom' ? '' : filters.dateFrom,
      dateTo: value !== 'custom' ? '' : filters.dateTo,
    })
  }

  return (
    <div className="flex flex-row gap-3 items-center flex-wrap">
      {/* Search */}
      <Input
        className="flex-1 min-w-[200px]"
        placeholder={t('filter.searchPlaceholder', language)}
        value={localSearch}
        onChange={e => setLocalSearch(e.target.value)}
      />

      {/* Date preset */}
      <Select
        value={filters.datePreset || '__all__'}
        onValueChange={v => handleDatePreset(v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('filter.allTime', language)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filter.allTime', language)}</SelectItem>
          <SelectItem value="today">{t('filter.today', language)}</SelectItem>
          <SelectItem value="week">{t('filter.thisWeek', language)}</SelectItem>
          <SelectItem value="month">{t('filter.thisMonth', language)}</SelectItem>
          <SelectItem value="custom">{t('filter.custom', language)}</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom date range inputs */}
      {filters.datePreset === 'custom' && (
        <>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => onFilterChange({ ...filters, dateFrom: e.target.value })}
            className="w-[130px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)]"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => onFilterChange({ ...filters, dateTo: e.target.value })}
            className="w-[130px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)]"
          />
        </>
      )}

      {/* Language filter — Voice Calls only */}
      {showLanguageFilter && (
        <Select
          value={filters.language || '__all__'}
          onValueChange={v => onFilterChange({ ...filters, language: v === '__all__' ? '' : v })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('filter.allLanguages', language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('filter.allLanguages', language)}</SelectItem>
            <SelectItem value="bm">BM</SelectItem>
            <SelectItem value="en">EN</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Category */}
      <Select
        value={filters.category || '__all__'}
        onValueChange={v => onFilterChange({ ...filters, category: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('filter.allCategories', language)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filter.allCategories', language)}</SelectItem>
          <SelectItem value="eligibility">Eligibility</SelectItem>
          <SelectItem value="faq">FAQ</SelectItem>
          <SelectItem value="registration">Registration</SelectItem>
          <SelectItem value="complaint">Complaint</SelectItem>
          <SelectItem value="merchant_lookup">Merchant Lookup</SelectItem>
          <SelectItem value="balance_check">Balance Check</SelectItem>
        </SelectContent>
      </Select>

      {/* Outcome */}
      <Select
        value={filters.outcome || '__all__'}
        onValueChange={v => onFilterChange({ ...filters, outcome: v === '__all__' ? '' : v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('filter.allOutcomes', language)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filter.allOutcomes', language)}</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="escalated">Escalated</SelectItem>
          <SelectItem value="callback">Callback</SelectItem>
          <SelectItem value="abandoned">Abandoned</SelectItem>
        </SelectContent>
      </Select>

      {/* Export button */}
      <Button
        className="ml-auto text-white"
        style={{ background: 'var(--accent-primary)' }}
        onClick={onExport}
        disabled={exporting}
      >
        <Download className="w-4 h-4" />
        {t('action.export', language)}
      </Button>
    </div>
  )
}
