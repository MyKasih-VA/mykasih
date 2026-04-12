'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { IntegrationCard } from '@/components/integrations/IntegrationCard'
import {
  Plug,
  Loader2,
  CheckCircle,
  RefreshCw,
  Mic,
  MessageSquare,
  Zap,
  Database,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/lib/translations'

type ServiceStatus = 'ok' | 'error' | 'pending' | 'ready'

interface IntegrationStatuses {
  elevenlabs: ServiceStatus
  supabase: ServiceStatus
  n8n: ServiceStatus
  meta_wa: ServiceStatus
  anam_ai: ServiceStatus
  n8n_url: string | null
}

export default function IntegrationsPage() {
  const { language } = useLanguage()
  const [merchantCount, setMerchantCount] = useState<number | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ inserted: number } | null>(
    null
  )
  const [userRole, setUserRole] = useState<string | null>(null)

  // Integration status state
  const [statuses, setStatuses] = useState<IntegrationStatuses | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState(false)
  const [elTestLoading, setElTestLoading] = useState(false)

  // Load merchant count + user role
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()

        // Get user role
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          setUserRole(data?.role ?? null)
        }

        // Get merchant count
        const { count } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
        setMerchantCount(count ?? 0)
      } catch {
        // Silently fail — page will render without data
      }
    }
    load()
  }, [])

  // Fetch all integration statuses
  const fetchStatuses = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(false)
    try {
      const res = await fetch('/api/integrations/status')
      if (!res.ok) throw new Error('Status check failed')
      const data = (await res.json()) as IntegrationStatuses
      setStatuses(data)
    } catch {
      setStatusError(true)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  // Fetch statuses on mount
  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  const handleSeedMerchants = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed/merchants', { method: 'POST' })
      const data = (await res.json()) as { inserted: number; error?: string }
      if (res.ok) {
        setSeedResult(data)
        setMerchantCount(data.inserted)
      }
    } catch {
      // Error handling — silent
    } finally {
      setSeeding(false)
    }
  }

  // Test ElevenLabs connection — re-fetch only EL status
  const handleTestElevenLabs = async () => {
    setElTestLoading(true)
    try {
      const res = await fetch('/api/integrations/status')
      if (!res.ok) throw new Error('Status check failed')
      const data = (await res.json()) as IntegrationStatuses
      setStatuses(data)
    } catch {
      setStatuses((prev) =>
        prev ? { ...prev, elevenlabs: 'error' } : null
      )
    } finally {
      setElTestLoading(false)
    }
  }

  // Copy Meta WA webhook URL to clipboard
  const handleCopyWebhookUrl = async () => {
    const webhookUrl = `${window.location.origin}/api/webhook/chat`
    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.success(t('integrations.copySuccess', language))
    } catch {
      // Fallback for older browsers
      toast.error('Failed to copy URL')
    }
  }

  const isAdmin = userRole === 'admin'
  const showSeedButton = isAdmin && merchantCount === 0 && !seedResult

  // Status label helper
  function getStatusLabel(service: keyof Omit<IntegrationStatuses, 'n8n_url'>): string {
    if (!statuses) return t('integrations.pendingApproval', language)
    const status = statuses[service]
    switch (status) {
      case 'ok':
        return t('integrations.connected', language)
      case 'ready':
        return t('integrations.ready', language)
      case 'error':
        return t('integrations.error', language)
      case 'pending':
        return t('integrations.pendingApproval', language)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">
          {t('integrations.title', language)}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatuses}
          disabled={statusLoading}
        >
          {statusLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {t('integrations.refreshStatus', language)}
        </Button>
      </div>

      {/* Status error banner */}
      {statusError && (
        <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--status-red)]/40 rounded-lg p-4 mb-6 text-sm text-[var(--status-red)]">
          <span>{t('integrations.statusCheckFailed', language)}</span>
          <Button variant="outline" size="sm" onClick={fetchStatuses}>
            {t('common.tryAgain', language)}
          </Button>
        </div>
      )}

      {/* Integration cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* 1. ElevenLabs */}
        <IntegrationCard
          name="ElevenLabs Voice Agent"
          description="SARA voice agent powered by ElevenLabs Conversational AI"
          status={statuses?.elevenlabs ?? 'pending'}
          statusLabel={getStatusLabel('elevenlabs')}
          icon={Mic}
          actionLabel={t('integrations.testConnection', language)}
          actionType="button"
          onAction={handleTestElevenLabs}
          actionLoading={elTestLoading}
          language={language}
        />

        {/* 2. Meta WhatsApp */}
        <IntegrationCard
          name="Meta WhatsApp API"
          description="WhatsApp Business API for Kasih chatbot messaging"
          status={statuses?.meta_wa ?? 'pending'}
          statusLabel={getStatusLabel('meta_wa')}
          icon={MessageSquare}
          actionLabel={t('integrations.copyWebhookUrl', language)}
          actionType="button"
          onAction={handleCopyWebhookUrl}
          language={language}
        />

        {/* 3. n8n */}
        <IntegrationCard
          name="n8n Automation"
          description="Workflow orchestration for chatbot message routing"
          status={statuses?.n8n ?? 'pending'}
          statusLabel={getStatusLabel('n8n')}
          icon={Zap}
          actionLabel={t('integrations.openN8n', language)}
          actionType="external-link"
          actionHref={statuses?.n8n_url ?? '#'}
          onAction={() => {}}
          language={language}
        />

        {/* 4. Supabase */}
        <IntegrationCard
          name="Supabase Database"
          description="PostgreSQL database with real-time subscriptions and auth"
          status={statuses?.supabase ?? 'pending'}
          statusLabel={getStatusLabel('supabase')}
          icon={Database}
          actionLabel={t('integrations.viewProject', language)}
          actionType="external-link"
          actionHref="https://supabase.com/dashboard"
          onAction={() => {}}
          language={language}
        />

        {/* 5. Anam AI */}
        <IntegrationCard
          name="Anam AI Persona"
          description="AI video persona for demo and testing"
          status={statuses?.anam_ai ?? 'ready'}
          statusLabel={getStatusLabel('anam_ai')}
          icon={Bot}
          actionLabel={t('integrations.openDemo', language)}
          actionType="internal-link"
          actionHref="/demo"
          onAction={() => {}}
          language={language}
        />
      </div>

      {/* Database section — merchant seed */}
      <p className="text-sm font-semibold text-[var(--text-muted)] mb-4 mt-8">
        {t('integrations.database', language)}
      </p>

      {isAdmin && (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <Plug className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {language === 'en' ? 'Merchant Data' : 'Data Saudagar'}
            </h2>
          </div>

          {showSeedButton && (
            <Button
              onClick={handleSeedMerchants}
              disabled={seeding}
              className="bg-[var(--accent-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/80"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Seeding...' : 'Menyemai...'}
                </>
              ) : language === 'en' ? (
                'Seed Merchants'
              ) : (
                'Semai Saudagar'
              )}
            </Button>
          )}

          {(seedResult !== null ||
            (merchantCount !== null && merchantCount > 0)) && (
            <div className="flex items-center gap-2 text-sm text-[var(--status-green)]">
              <CheckCircle className="w-4 h-4" />
              {merchantCount?.toLocaleString()} outlets loaded
            </div>
          )}
        </div>
      )}
    </div>
  )
}
