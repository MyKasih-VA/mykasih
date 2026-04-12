'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { t, type Language } from '@/lib/translations'

interface StaffInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  language: Language
  onInvited: () => void
}

type StaffRole = 'admin' | 'mykasih' | 'qmedia' | 'supervisor'

export function StaffInviteModal({
  open,
  onOpenChange,
  language,
  onInvited,
}: StaffInviteModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole | ''>('')
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setName('')
    setEmail('')
    setRole('')
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !role) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Invite failed')
      }
      toast.success(t('staff.inviteSuccess', language).replace('{email}', email.trim()))
      onInvited()
      resetForm()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('staff.inviteError', language)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function handleDiscard() {
    resetForm()
    onOpenChange(false)
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
            {t('staff.inviteModal.title', language)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {t('staff.fields.name', language)}
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('staff.fields.name', language)}
              className="bg-[var(--bg-primary)] border-[var(--bg-border)] text-[var(--text-primary)]"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {t('staff.fields.email', language)}
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('staff.fields.email', language)}
              className="bg-[var(--bg-primary)] border-[var(--bg-border)] text-[var(--text-primary)]"
              disabled={loading}
            />
          </div>

          {/* Role */}
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
                <SelectValue placeholder={t('staff.fields.role', language)} />
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
            onClick={handleDiscard}
            disabled={loading}
            className="text-[var(--text-muted)]"
          >
            {t('staff.discard', language)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !email.trim() || !role}
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('staff.sendInvite', language)}
              </>
            ) : (
              t('staff.sendInvite', language)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
