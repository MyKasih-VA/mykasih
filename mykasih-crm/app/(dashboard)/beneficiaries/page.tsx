'use client'

import { useState } from 'react'
import { Search, Loader2, UserX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  BeneficiaryProfile,
  type BeneficiaryCall,
  type BeneficiaryTicket,
} from '@/components/beneficiaries/BeneficiaryProfile'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { t } from '@/lib/translations'
import { useLanguage } from '@/hooks/useLanguage'

export default function Page() {
  const { language } = useLanguage()
  const [query, setQuery] = useState('')
  const [calls, setCalls] = useState<BeneficiaryCall[]>([])
  const [tickets, setTickets] = useState<BeneficiaryTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  async function handleSearch() {
    const trimmed = query.trim()
    if (trimmed.length < 2) return // minimum 2 chars
    setLoading(true)
    setSearched(true)
    setNoResults(false)
    try {
      const res = await fetch(`/api/beneficiaries?query=${encodeURIComponent(trimmed)}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setCalls(json.calls ?? [])
      setTickets(json.tickets ?? [])
      setNoResults((json.calls ?? []).length === 0)
    } catch {
      setCalls([])
      setTickets([])
      setNoResults(true)
    }
    setLoading(false)
  }

  return (
    <div className="p-6">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
        {t('page.beneficiaries', language)}
      </h1>

      {/* Search panel */}
      <div
        className={
          !searched
            ? 'flex flex-col items-center justify-center min-h-[40vh] gap-4'
            : 'flex flex-col items-center gap-4 mb-6'
        }
      >
        <p className="text-xl font-semibold text-[var(--text-primary)]">
          {t('beneficiaries.searchHeading', language)}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {t('beneficiaries.searchSubtext', language)}
        </p>
        <div className="flex gap-2 w-full max-w-lg">
          <Input
            className="flex-1 bg-[var(--bg-surface)] border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            placeholder="+601X-XXX-XXXX or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSearch()
              }
            }}
          />
          <Button
            className="bg-[var(--accent-primary)] text-white hover:opacity-90"
            onClick={() => void handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results area */}
      {searched && (
        noResults ? (
          <div className="flex flex-col items-center justify-center py-12">
            <UserX className="w-8 h-8 text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {t('beneficiaries.noResultsHeading', language)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t('beneficiaries.noResultsBody', language)}
            </p>
          </div>
        ) : (
          <BeneficiaryProfile
            calls={calls}
            tickets={tickets}
            language={language}
            onCallClick={(id) => {
              setSelectedCallId(id)
              setModalOpen(true)
            }}
          />
        )
      )}

      {/* Transcript modal */}
      <TranscriptModal
        callId={selectedCallId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        language={language}
      />
    </div>
  )
}
