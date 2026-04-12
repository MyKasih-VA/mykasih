'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users } from 'lucide-react'
import { formatRelativeTime } from '@/components/calls/CallsTable'
import { t, type Language } from '@/lib/translations'

interface StaffUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'mykasih' | 'qmedia' | 'supervisor'
  status: 'active' | 'pending'
  created_at: string
  last_login: string | null
}

interface StaffTableProps {
  users: StaffUser[]
  loading: boolean
  language: Language
  onEditRole: (user: StaffUser) => void
  onRemove: (user: StaffUser) => void
  onResendInvite: (user: StaffUser) => void
}

const PAGE_SIZE = 25

function capitalizeRole(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin',
    mykasih: 'MyKasih',
    qmedia: 'QMedia',
    supervisor: 'Supervisor',
  }
  return labels[role] ?? role.charAt(0).toUpperCase() + role.slice(1)
}

export function StaffTable({
  users,
  loading,
  language,
  onEditRole,
  onRemove,
  onResendInvite,
}: StaffTableProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(users.length / PAGE_SIZE)
  const paginatedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-[var(--bg-border)]" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-border)] flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          {t('staff.empty.heading', language)}
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          {t('staff.empty.body', language)}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--bg-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--bg-border)] bg-[var(--bg-surface)]">
              <TableHead className="text-[var(--text-muted)] font-medium">
                {t('staff.fields.name', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)] font-medium">
                {t('staff.fields.email', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)] font-medium">
                {t('staff.fields.role', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)] font-medium">
                {t('staff.status', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)] font-medium">
                {t('staff.lastLogin', language)}
              </TableHead>
              <TableHead className="text-[var(--text-muted)] font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map(user => (
              <TableRow
                key={user.id}
                className="border-[var(--bg-border)] hover:bg-[var(--bg-surface)]"
              >
                <TableCell className="text-[var(--text-primary)] font-medium">
                  {user.name}
                </TableCell>
                <TableCell className="text-[var(--text-muted)] text-sm">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-[var(--bg-border)] text-[var(--text-primary)]">
                    {capitalizeRole(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.status === 'active' ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'var(--status-green)', color: '#fff' }}
                    >
                      {t('staff.active', language)}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'var(--status-yellow)', color: '#fff' }}
                    >
                      {t('staff.pending', language)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-[var(--text-muted)] text-sm">
                  {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditRole(user)}
                        className="border-[var(--bg-border)] text-[var(--text-primary)] h-7 text-xs"
                      >
                        Edit Role
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResendInvite(user)}
                        className="border-[var(--bg-border)] text-[var(--text-primary)] h-7 text-xs"
                      >
                        {t('staff.resendInvite', language)}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[var(--bg-border)] text-[var(--status-red)] hover:text-[var(--status-red)] h-7 text-xs"
                        >
                          {t('staff.removeBtn', language)}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--bg-border)',
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[var(--text-primary)]">
                            Remove Staff Member
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-[var(--text-muted)]">
                            {t('staff.removeConfirm', language).replace('{name}', user.name)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-[var(--bg-border)] text-[var(--text-primary)]">
                            {t('staff.keepMember', language)}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemove(user)}
                            style={{ background: 'var(--status-red)', color: '#fff' }}
                          >
                            {t('staff.removeBtn', language)}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>
            {t('pagination.showing', language)}{' '}
            {Math.min((page - 1) * PAGE_SIZE + 1, users.length)}–{Math.min(page * PAGE_SIZE, users.length)}{' '}
            {t('pagination.of', language)} {users.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="border-[var(--bg-border)] text-[var(--text-primary)] h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-[var(--bg-border)] text-[var(--text-primary)] h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
