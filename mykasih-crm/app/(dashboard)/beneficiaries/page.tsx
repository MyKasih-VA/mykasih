'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search as SearchIcon, Phone, MessageCircle, Loader2, UserX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  BeneficiaryProfile,
  type BeneficiaryCall,
  type BeneficiaryTicket,
} from '@/components/beneficiaries/BeneficiaryProfile'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import type { Beneficiary } from '@/app/api/beneficiaries/route'

// ─── Channel pill ─────────────────────────────────────────────────────────────
function ChannelPill({ channel }: { channel: Beneficiary['channel'] }) {
  if (channel === 'both') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{ background: 'var(--bg-border)', color: 'var(--text-muted)' }}
      >
        <Phone size={10} /> <MessageCircle size={10} />
      </span>
    )
  }
  if (channel === 'voice') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{ background: 'var(--bg-border)', color: 'var(--text-muted)' }}
      >
        <Phone size={10} /> Voice
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: 'var(--bg-border)', color: 'var(--text-muted)' }}
    >
      <MessageCircle size={10} /> WhatsApp
    </span>
  )
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  const { language } = useLanguage()
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [total, setTotal] = useState(0)
  const [unknownCount, setUnknownCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchBeneficiaries = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/beneficiaries?page=${p}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setBeneficiaries(json.beneficiaries ?? [])
      setTotal(json.total ?? 0)
      setUnknownCount(json.unknown_count ?? 0)
    } catch {
      setBeneficiaries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchBeneficiaries(page) }, [fetchBeneficiaries, page])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(language === 'bm' ? 'ms-MY' : 'en-MY', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (beneficiaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Users size={40} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {t('beneficiaries.noContacts', language)}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>{total} {t('beneficiaries.allContacts', language).toLowerCase()}</span>
        {unknownCount > 0 && (
          <span>· {unknownCount} {t('beneficiaries.unknownCaller', language).toLowerCase()}</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--bg-border)' }}>
        {/* Header */}
        <div
          className="grid grid-cols-12 px-4 py-2 text-xs font-medium"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--bg-border)',
          }}
        >
          <span className="col-span-4">Name</span>
          <span className="col-span-2">{t('beneficiaries.channel', language)}</span>
          <span className="col-span-3">WA / Phone</span>
          <span className="col-span-2">{t('beneficiaries.lastContact', language)}</span>
          <span className="col-span-1 text-right">{t('beneficiaries.interactions', language)}</span>
        </div>

        {/* Rows */}
        {beneficiaries.map((b) => (
          <div
            key={b.id}
            className="grid grid-cols-12 px-4 py-3 items-center text-sm transition-colors hover:brightness-110 cursor-pointer"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-border)' }}
            onClick={() =>
              void (window.location.href = `/beneficiaries?search=${encodeURIComponent(b.wa_number ?? b.name ?? '')}`)
            }
          >
            {/* Name */}
            <div className="col-span-4 flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: 'var(--bg-border)', color: 'var(--text-primary)' }}
              >
                {b.name ? b.name[0].toUpperCase() : '?'}
              </div>
              <span style={{ color: b.name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {b.name ?? t('beneficiaries.unknownCaller', language)}
              </span>
            </div>

            {/* Channel */}
            <div className="col-span-2">
              <ChannelPill channel={b.channel} />
            </div>

            {/* WA number */}
            <div className="col-span-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {b.wa_number ?? '—'}
            </div>

            {/* Last contact */}
            <div className="col-span-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(b.last_contact)}
            </div>

            {/* Interaction count */}
            <div
              className="col-span-1 text-right text-xs font-medium"
              style={{ color: 'var(--accent-teal)' }}
            >
              {b.interaction_count}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Search tab (existing behaviour preserved) ────────────────────────────────
function SearchTab() {
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
    if (trimmed.length < 2) return
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
    <div className="mt-6">
      <div
        className={
          !searched
            ? 'flex flex-col items-center justify-center min-h-[30vh] gap-4'
            : 'flex flex-col items-center gap-4 mb-6'
        }
      >
        {!searched && (
          <>
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('beneficiaries.searchHeading', language)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('beneficiaries.searchSubtext', language)}
            </p>
          </>
        )}
        <div className="flex gap-2 w-full max-w-lg">
          <Input
            className="flex-1"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            placeholder="+601X-XXX-XXXX or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSearch()
            }}
          />
          <Button
            onClick={() => void handleSearch()}
            disabled={loading}
            style={{ background: 'var(--accent-primary)' }}
            className="text-white hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results area */}
      {searched && (
        noResults ? (
          <div className="flex flex-col items-center justify-center py-12">
            <UserX className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('beneficiaries.noResultsHeading', language)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BeneficiariesPage() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'contacts' | 'search'>('contacts')

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('page.beneficiaries', language)}
        </h1>
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-lg w-fit"
        style={{ background: 'var(--bg-border)' }}
      >
        {(['contacts', 'search'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
            style={{
              background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {tab === 'contacts'
              ? t('beneficiaries.contacts', language)
              : t('beneficiaries.search', language)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'contacts' ? <ContactsTab /> : <SearchTab />}
    </div>
  )
}
