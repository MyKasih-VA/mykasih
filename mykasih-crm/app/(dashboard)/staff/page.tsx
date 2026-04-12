'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { StaffTable } from '@/components/staff/StaffTable'
import { StaffInviteModal } from '@/components/staff/StaffInviteModal'
import { StaffEditRoleModal } from '@/components/staff/StaffEditRoleModal'

interface StaffUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'mykasih' | 'qmedia' | 'supervisor'
  status: 'active' | 'pending'
  created_at: string
  last_login: string | null
}

export default function StaffPage() {
  const { language } = useLanguage()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/staff')
      if (!res.ok) throw new Error('Failed to fetch staff')
      const json = await res.json() as { users: StaffUser[] }
      setUsers(json.users ?? [])
    } catch {
      toast.error(t('staff.error', language))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEditRole(user: StaffUser) {
    setEditingUser(user)
    setEditRoleOpen(true)
  }

  async function handleRemove(user: StaffUser) {
    try {
      const res = await fetch(`/api/staff/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Remove failed')
      }
      toast.success(t('staff.removeSuccess', language))
      void fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove staff member'
      toast.error(message)
    }
  }

  async function handleResendInvite(user: StaffUser) {
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Resend failed')
      }
      toast.success(t('staff.inviteSuccess', language).replace('{email}', user.email))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('staff.inviteError', language)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {t('staff.title', language)}
        </h1>
        <Button
          onClick={() => setInviteOpen(true)}
          style={{ background: 'var(--accent-primary)', color: '#fff' }}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {t('staff.inviteStaff', language)}
        </Button>
      </div>

      {/* Staff Table */}
      <StaffTable
        users={users}
        loading={loading}
        language={language}
        onEditRole={handleEditRole}
        onRemove={handleRemove}
        onResendInvite={handleResendInvite}
      />

      {/* Invite Modal */}
      <StaffInviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        language={language}
        onInvited={fetchUsers}
      />

      {/* Edit Role Modal */}
      <StaffEditRoleModal
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        user={editingUser}
        language={language}
        onUpdated={fetchUsers}
      />
    </div>
  )
}
