'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useLanguage } from '@/hooks/useLanguage'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { language, toggleLanguage } = useLanguage()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar language={language} />
      <div className="ml-[260px] min-h-screen flex flex-col">
        <Topbar language={language} onToggleLanguage={toggleLanguage} />
        <main
          className="p-6 flex-1"
          style={{ background: 'var(--bg-primary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
