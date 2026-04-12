'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

interface SettingsState {
  agent_hours_start: string
  agent_hours_end: string
  notification_email: string
  data_retention_days: string
}

export function SettingsForm() {
  const { language } = useLanguage()

  const [form, setForm] = useState<SettingsState>({
    agent_hours_start: '08:00',
    agent_hours_end: '17:00',
    notification_email: '',
    data_retention_days: '90',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  // SSR-safe webhook URL derivation — window.location.origin only available client-side
  useEffect(() => {
    setBaseUrl(process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin)
  }, [])

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Load failed')
        const data = await res.json() as SettingsState
        setForm({
          agent_hours_start: data.agent_hours_start ?? '08:00',
          agent_hours_end: data.agent_hours_end ?? '17:00',
          notification_email: data.notification_email ?? '',
          data_retention_days: data.data_retention_days ?? '90',
        })
      } catch {
        toast.error(t('settings.loadError', language))
      } finally {
        setLoading(false)
      }
    }
    void loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(key: keyof SettingsState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'agent_hours_start', value: form.agent_hours_start },
            { key: 'agent_hours_end', value: form.agent_hours_end },
            { key: 'notification_email', value: form.notification_email },
            { key: 'data_retention_days', value: form.data_retention_days },
          ],
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(t('settings.saveSuccess', language))
    } catch {
      toast.error(t('settings.saveError', language))
    } finally {
      setSaving(false)
    }
  }

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  function copyToClipboard(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      toast.success('Copied!', { description: 'Webhook URL copied to clipboard.', duration: 2000 })
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 1500)
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const voiceWebhookUrl = `${baseUrl}/api/webhook/voice`
  const chatWebhookUrl = `${baseUrl}/api/webhook/chat`

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Agent Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              {t('settings.agentHours', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent_hours_start" className="text-sm text-[var(--text-muted)]">
                  {t('settings.agentHoursStart', language)}
                </Label>
                <Input
                  id="agent_hours_start"
                  type="time"
                  value={form.agent_hours_start}
                  onChange={(e) => handleChange('agent_hours_start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_hours_end" className="text-sm text-[var(--text-muted)]">
                  {t('settings.agentHoursEnd', language)}
                </Label>
                <Input
                  id="agent_hours_end"
                  type="time"
                  value={form.agent_hours_end}
                  onChange={(e) => handleChange('agent_hours_end', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              {t('settings.notifications', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="notification_email" className="text-sm text-[var(--text-muted)]">
              {t('settings.notificationEmail', language)}
            </Label>
            <Input
              id="notification_email"
              type="email"
              placeholder="admin@mykasih.com"
              value={form.notification_email}
              onChange={(e) => handleChange('notification_email', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Card 3: Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              {t('settings.dataRetention', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="data_retention_days" className="text-sm text-[var(--text-muted)]">
              {t('settings.dataRetentionDays', language)}
            </Label>
            <Input
              id="data_retention_days"
              type="number"
              min={1}
              value={form.data_retention_days}
              onChange={(e) => handleChange('data_retention_days', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Card 4: Webhook URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              {t('settings.webhookUrls', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice webhook */}
            <div className="space-y-2">
              <Label className="text-sm text-[var(--text-muted)]">
                {t('settings.voiceWebhookUrl', language)}
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  disabled
                  value={voiceWebhookUrl}
                  className="font-mono text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(voiceWebhookUrl)}
                  type="button"
                >
                  {copiedUrl === voiceWebhookUrl ? 'Copied \u2713' : t('settings.copyUrl', language)}
                </Button>
              </div>
            </div>

            {/* Chat webhook */}
            <div className="space-y-2">
              <Label className="text-sm text-[var(--text-muted)]">
                {t('settings.chatWebhookUrl', language)}
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  disabled
                  value={chatWebhookUrl}
                  className="font-mono text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(chatWebhookUrl)}
                  type="button"
                >
                  {copiedUrl === chatWebhookUrl ? 'Copied \u2713' : t('settings.copyUrl', language)}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Changes button */}
      <div className="mt-8">
        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
        >
          {saving ? 'Saving...' : t('settings.saveChanges', language)}
        </Button>
      </div>
    </div>
  )
}
