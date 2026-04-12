'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { t, type Language } from '@/lib/translations'
import { formatCategory } from '@/components/calls/CallsTable'

interface CategoryRow {
  category: string
  voice: number
  chat: number
  total: number
  percentage: number
}

interface CategoryTableProps {
  data: CategoryRow[]
  language: Language
}

export function CategoryTable({ data, language }: CategoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow style={{ borderColor: 'var(--bg-border)' }}>
          <TableHead style={{ color: 'var(--text-muted)' }}>
            {t('analytics.category', language)}
          </TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>
            {t('analytics.voiceCount', language)}
          </TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>
            {t('analytics.chatCount', language)}
          </TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>
            {t('analytics.total', language)}
          </TableHead>
          <TableHead style={{ color: 'var(--text-muted)' }}>
            {t('analytics.percentage', language)}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow
            key={row.category}
            style={{ borderColor: 'var(--bg-border)' }}
            className="hover:bg-[var(--bg-surface)]"
          >
            <TableCell style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {formatCategory(row.category)}
            </TableCell>
            <TableCell style={{ color: 'var(--text-muted)' }}>{row.voice}</TableCell>
            <TableCell style={{ color: 'var(--text-muted)' }}>{row.chat}</TableCell>
            <TableCell style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {row.total}
            </TableCell>
            <TableCell style={{ color: 'var(--text-muted)' }}>
              {row.percentage.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
