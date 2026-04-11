'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { type Language, type TranslationKey, t } from '@/lib/translations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PATHNAME_TO_TITLE: Record<string, TranslationKey> = {
  '/': 'dashboard.title',
  '/voice-calls': 'nav.voiceCalls',
  '/chat-messages': 'nav.chatMessages',
  '/all-interactions': 'nav.allInteractions',
  '/tickets': 'nav.tickets',
  '/beneficiaries': 'nav.beneficiaries',
  '/live-monitor': 'nav.liveMonitor',
  '/analytics': 'nav.analytics',
  '/knowledge-base': 'nav.knowledgeBase',
  '/staff': 'nav.staffManagement',
  '/integrations': 'nav.integrations',
  '/testing': 'nav.testingConsole',
  '/demo': 'nav.aiDemo',
  '/settings': 'nav.settings',
}

function getPageTitle(pathname: string, language: Language): string {
  const key = PATHNAME_TO_TITLE[pathname] ?? 'dashboard.title'
  return t(key, language)
}

function getFormattedDate(language: Language): string {
  const locale = language === 'en' ? 'en-GB' : 'ms-MY'
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

interface TopbarProps {
  language: Language
  onToggleLanguage: () => void
}

export function Topbar({ language, onToggleLanguage }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const pageTitle = getPageTitle(pathname, language)
  const formattedDate = getFormattedDate(language)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 h-16 bg-[var(--bg-surface)] border-b border-[var(--bg-border)] px-6 z-30 flex items-center justify-between">
      {/* Left: page title + date */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-[var(--text-muted)]">{formattedDate}</p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        {/* Language toggle */}
        <LanguageToggle language={language} onToggle={onToggleLanguage} />

        {/* Search input */}
        <input
          type="search"
          placeholder={t('common.search', language)}
          className="w-[220px] h-9 bg-[var(--bg-primary)] border border-[var(--bg-border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-md px-3 focus:outline-2 focus:outline-[var(--accent-teal)] focus:outline-offset-2"
        />

        {/* Notification bell */}
        <button
          type="button"
          aria-label={language === 'en' ? 'Notifications' : 'Pemberitahuan'}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* User avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="focus:outline-2 focus:outline-[var(--accent-teal)] focus:outline-offset-2 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-[var(--bg-border)] text-[var(--text-primary)]">
                  AD
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[var(--bg-surface)] border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            <DropdownMenuItem className="text-xs cursor-default" disabled>
              Admin
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-[var(--text-muted)] cursor-default" disabled>
              admin
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs text-[var(--status-red)] cursor-pointer focus:text-[var(--status-red)]"
              onClick={handleSignOut}
            >
              {t('sidebar.signOut', language)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
