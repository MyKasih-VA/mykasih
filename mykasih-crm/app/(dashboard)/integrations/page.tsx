'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { Plug, Loader2, CheckCircle } from 'lucide-react'

export default function IntegrationsPage() {
  const { language } = useLanguage()
  const [merchantCount, setMerchantCount] = useState<number | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ inserted: number } | null>(
    null
  )
  const [userRole, setUserRole] = useState<string | null>(null)

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
      // Error handling — toast notifications deferred to Phase 5
    } finally {
      setSeeding(false)
    }
  }

  const isAdmin = userRole === 'admin'
  const showSeedButton = isAdmin && merchantCount === 0 && !seedResult

  return (
    <div>
      <h1 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        {language === 'en' ? 'Integrations' : 'Integrasi'}
      </h1>

      <p className="text-sm text-[var(--text-muted)] mb-6">
        {language === 'en'
          ? 'Full integrations dashboard coming in Phase 5. Merchant seeding available below.'
          : 'Papan pemuka integrasi penuh akan datang di Fasa 5. Penyemaian saudagar tersedia di bawah.'}
      </p>

      {/* Seed Merchants section — per D-15 */}
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
