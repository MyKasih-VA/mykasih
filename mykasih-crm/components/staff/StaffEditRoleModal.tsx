'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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

type StaffRole = StaffUser['role']

interface StaffEditRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: StaffUser | null
  language: Language
  onUpdated: () => void
}

export function StaffEditRoleModal({
  open,
  onOpenChange,
  user,
  language,
  onUpdated,
}: StaffEditRoleModalProps) {
  const [role, setRole] = useState<StaffRole>('mykasih')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setRole(user.role)
    }
  }, [user])

  async function handleSubmit() {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Role update failed')
      }
      toast.success(`Role updated for ${user.name}`)
      onUpdated()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[500px]"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">
            {t('staff.editRole.title', language)} — {user?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {t('staff.fields.role', language)}
            </label>
            <Select
              value={role}
              onValueChange={v => setRole(v as StaffRole)}
              disabled={loading}
            >
              <SelectTrigger className="bg-[var(--bg-primary)] border-[var(--bg-border)] text-[var(--text-primary)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="mykasih">MyKasih</SelectItem>
                <SelectItem value="qmedia">QMedia</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-[var(--text-muted)]"
          >
            {t('staff.keepCurrentRole', language)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !user}
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('staff.updateRole', language)}
              </>
            ) : (
              t('staff.updateRole', language)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
