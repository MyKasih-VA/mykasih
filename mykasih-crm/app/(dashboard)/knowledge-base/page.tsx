'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'
import { KbTable } from '@/components/knowledge-base/KbTable'
import { KbEntryModal, type KbEntry } from '@/components/knowledge-base/KbEntryModal'

export default function KnowledgeBasePage() {
  const { language } = useLanguage()

  const [entries, setEntries] = useState<KbEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [langToggle, setLangToggle] = useState<'bm' | 'en'>('en')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KbEntry | null>(null)
  const [syncing, setSyncing] = useState(false)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kb')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json() as { entries?: KbEntry[] }
      setEntries(json.entries ?? [])
    } catch {
      toast.error(t('kb.error', language))
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const handleAddEntry = () => {
    setEditingEntry(null)
    setModalOpen(true)
  }

  const handleEditEntry = (entry: KbEntry) => {
    setEditingEntry(entry)
    setModalOpen(true)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_active: isActive } : e))
    )

    try {
      const res = await fetch(`/api/kb/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch {
      // Revert on failure
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_active: !isActive } : e))
      )
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      // Delete failed — entries remain unchanged
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/kb/sync', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        const errorMsg = json.error ?? 'Unknown error'
        toast.error(t('kb.syncError', language).replace('{error}', errorMsg))
        return
      }
      toast.success(t('kb.syncSuccess', language))
    } catch {
      toast.error(t('kb.syncError', language).replace('{error}', 'Network error'))
    } finally {
      setSyncing(false)
    }
  }

  const handleSaved = () => {
    void loadEntries()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          {t('kb.title', language)}
        </h1>

        <div className="flex items-center gap-3">
          {/* BM / EN language toggle for table columns */}
          <Tabs
            value={langToggle}
            onValueChange={(val) => setLangToggle(val as 'bm' | 'en')}
          >
            <TabsList
              className="h-8"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <TabsTrigger value="en" className="text-xs px-3">EN</TabsTrigger>
              <TabsTrigger value="bm" className="text-xs px-3">BM</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Add Entry button */}
          <button
            type="button"
            onClick={handleAddEntry}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4" />
            {t('kb.addEntry', language)}
          </button>

          {/* Sync to ElevenLabs button */}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent-teal)' }}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? t('kb.syncing', language) : t('kb.syncToEL', language)}
          </button>
        </div>
      </div>

      {/* KB Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
        }}
      >
        <KbTable
          entries={entries}
          loading={loading}
          langToggle={langToggle}
          language={language}
          onToggleActive={handleToggleActive}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
        />
      </div>

      {/* Add / Edit modal */}
      <KbEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entry={editingEntry}
        language={language}
        onSaved={handleSaved}
      />
    </div>
  )
}
