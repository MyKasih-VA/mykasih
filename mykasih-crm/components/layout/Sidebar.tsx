'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  Activity,
  Ticket,
  Users,
  Radio,
  BarChart2,
  BookOpen,
  UserCog,
  Plug,
  FlaskConical,
  Sparkles,
  Settings,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type Language, type TranslationKey, t } from '@/lib/translations'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'nav.overview' as TranslationKey,
    items: [
      { key: 'nav.dashboard' as TranslationKey, icon: LayoutDashboard, href: '/' },
    ],
  },
  {
    label: 'nav.callManagement' as TranslationKey,
    items: [
      { key: 'nav.voiceCalls' as TranslationKey, icon: Phone, href: '/voice-calls' },
      { key: 'nav.chatMessages' as TranslationKey, icon: MessageSquare, href: '/chat-messages' },
      { key: 'nav.allInteractions' as TranslationKey, icon: Activity, href: '/all-interactions' },
    ],
  },
  {
    label: 'nav.operations' as TranslationKey,
    items: [
      { key: 'nav.tickets' as TranslationKey, icon: Ticket, href: '/tickets' },
      { key: 'nav.beneficiaries' as TranslationKey, icon: Users, href: '/beneficiaries' },
      { key: 'nav.liveMonitor' as TranslationKey, icon: Radio, href: '/live-monitor' },
    ],
  },
  {
    label: 'nav.intelligence' as TranslationKey,
    items: [
      { key: 'nav.analytics' as TranslationKey, icon: BarChart2, href: '/analytics' },
    ],
  },
  {
    label: 'nav.system' as TranslationKey,
    items: [
      { key: 'nav.knowledgeBase' as TranslationKey, icon: BookOpen, href: '/knowledge-base' },
      { key: 'nav.staffManagement' as TranslationKey, icon: UserCog, href: '/staff' },
      { key: 'nav.integrations' as TranslationKey, icon: Plug, href: '/integrations' },
      { key: 'nav.testingConsole' as TranslationKey, icon: FlaskConical, href: '/testing' },
      { key: 'nav.aiDemo' as TranslationKey, icon: Sparkles, href: '/demo' },
      { key: 'nav.settings' as TranslationKey, icon: Settings, href: '/settings' },
    ],
  },
]

interface SidebarProps {
  language: Language
}

export function Sidebar({ language }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-[var(--bg-surface)] border-r-2 border-[var(--bg-border)] z-40 flex flex-col">
      {/* Logo area */}
      <div className="p-4 flex flex-row items-center gap-2 border-b border-[var(--bg-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mykasih.com.my/wp-content/uploads/2025/05/MyKasih-logo.png"
          alt=""
          height={32}
          style={{ height: 32, width: 'auto' }}
        />
        <span className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          MyKasih Command Centre
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)] px-4 py-2 mt-4">
              {t(group.label, language)}
            </p>
            <ul>
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'flex items-center gap-2 h-11 px-4 text-sm rounded-md transition-colors',
                        active
                          ? 'bg-[var(--accent-primary)]/15 border-l-[3px] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-border)]/60 border-l-[3px] border-transparent',
                      ].join(' ')}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {t(item.key, language)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-[var(--bg-border)] mt-auto">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-[var(--bg-border)] text-[var(--text-primary)]">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">Admin</span>
            <span className="text-xs bg-[var(--bg-border)] text-[var(--text-muted)] rounded px-2 py-0.5 w-fit mt-0.5">
              admin
            </span>
          </div>
        </div>

        {/* AI Connected indicator */}
        <div className="flex items-center gap-1 mt-1">
          <span className="w-2 h-2 rounded-full bg-[var(--status-green)] shrink-0" />
          <span className="text-xs text-[var(--text-muted)]">
            {t('sidebar.aiConnected', language)}
          </span>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--status-red)] transition-colors cursor-pointer"
        >
          {t('sidebar.signOut', language)}
        </button>
      </div>
    </aside>
  )
}
