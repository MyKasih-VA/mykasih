'use client'

import Link from 'next/link'
import { LucideIcon, ExternalLink, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Language } from '@/lib/translations'

type ServiceStatus = 'ok' | 'error' | 'pending' | 'ready'

interface IntegrationCardProps {
  name: string
  description: string
  status: ServiceStatus
  statusLabel: string
  icon: LucideIcon
  actionLabel: string
  actionIcon?: LucideIcon
  onAction: () => void
  actionLoading?: boolean
  actionType?: 'button' | 'external-link' | 'internal-link'
  actionHref?: string
  language: Language
}

function statusStyle(status: ServiceStatus): string {
  switch (status) {
    case 'ok':
    case 'ready':
      return 'bg-[var(--status-green)] text-white'
    case 'error':
      return 'bg-[var(--status-red)] text-white'
    case 'pending':
      return 'bg-[var(--status-yellow)] text-white'
  }
}

export function IntegrationCard({
  name,
  description,
  status,
  statusLabel,
  icon: Icon,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionLoading = false,
  actionType = 'button',
  actionHref,
  language: _language,
}: IntegrationCardProps) {
  const renderAction = () => {
    if (actionType === 'external-link' && actionHref) {
      return (
        <a
          href={actionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-colors"
        >
          {ActionIcon ? (
            <ActionIcon className="w-4 h-4" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {actionLabel}
        </a>
      )
    }

    if (actionType === 'internal-link' && actionHref) {
      return (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-colors"
        >
          {ActionIcon ? (
            <ActionIcon className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          {actionLabel}
        </Link>
      )
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : ActionIcon ? (
          <ActionIcon className="w-4 h-4" />
        ) : null}
        {actionLabel}
      </Button>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6 flex flex-col gap-4">
      {/* Header row: icon + name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {name}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${statusStyle(status)}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        {description}
      </p>

      {/* Action button */}
      <div className="mt-auto">{renderAction()}</div>
    </div>
  )
}
