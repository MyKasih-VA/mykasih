'use client'

import { Phone, MessageSquare } from 'lucide-react'
import { type Language, t } from '@/lib/translations'

interface ChannelBadgeProps {
  channel: 'voice' | 'chat'
  language: Language
}

export function ChannelBadge({ channel, language }: ChannelBadgeProps) {
  if (channel === 'voice') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[var(--chart-voice)]/15 border border-[var(--chart-voice)]/40 text-[var(--chart-voice)]">
        <Phone className="w-3 h-3 shrink-0" />
        {t('channel.voice', language)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[var(--chart-chat)]/15 border border-[var(--chart-chat)]/40 text-[var(--chart-chat)]">
      <MessageSquare className="w-3 h-3 shrink-0" />
      {t('channel.chat', language)}
    </span>
  )
}
