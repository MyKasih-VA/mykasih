// ---------------------------------------------------------------------------
// Mocks — factories must NOT reference outer const variables (TDZ issue).
// Instead we create fns inside the factory and expose them via module exports
// so tests can retrieve them after import.
// ---------------------------------------------------------------------------

jest.mock('@supabase/supabase-js', () => {
  const insertCalls = jest.fn()
  const insertTickets = jest.fn()
  const insertTranscripts = jest.fn()
  const fromFn = jest.fn((table: string) => {
    if (table === 'calls') return { insert: insertCalls }
    if (table === 'tickets') return { insert: insertTickets }
    return { insert: insertTranscripts }
  })
  const client = { from: fromFn }
  const createClient = jest.fn(() => client)
  // Expose for retrieval in tests
  ;(createClient as unknown as Record<string, unknown>)._insertCalls = insertCalls
  ;(createClient as unknown as Record<string, unknown>)._insertTickets = insertTickets
  ;(createClient as unknown as Record<string, unknown>)._insertTranscripts = insertTranscripts
  return { createClient }
})

jest.mock('@/lib/ic-mask', () => ({
  maskIC: jest.fn((_ic: string) => '880512-**-****'),
}))

jest.mock('@/lib/ticket-ref', () => ({
  generateTicketRef: jest.fn(() => Promise.resolve('TKT-2026-00001')),
}))

jest.mock('@/lib/chatbot/session-manager', () => {
  const updateSession = jest.fn()
  const expireSession = jest.fn()
  return { updateSession, expireSession }
})

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { complaintHandler } from '@/lib/chatbot/complaint-handler'
import { maskIC } from '@/lib/ic-mask'
import { generateTicketRef } from '@/lib/ticket-ref'
import { updateSession, expireSession } from '@/lib/chatbot/session-manager'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@/lib/chatbot/types'

// Retrieve shared mock references
const mockUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>
const mockExpireSession = expireSession as jest.MockedFunction<typeof expireSession>
const cc = createClient as unknown as Record<string, unknown>
const mockInsertCalls = cc._insertCalls as jest.MockedFunction<() => unknown>
const mockInsertTickets = cc._insertTickets as jest.MockedFunction<() => unknown>
const mockInsertTranscripts = cc._insertTranscripts as jest.MockedFunction<() => unknown>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-001',
    wa_phone: '60123456789',
    language: 'bm',
    intent: 'complaint',
    step: 0,
    collected_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockUpdateSession.mockReset()
  mockExpireSession.mockReset()
  mockInsertCalls.mockReset()
  mockInsertTickets.mockReset()
  mockInsertTranscripts.mockReset()
  ;(maskIC as jest.Mock).mockClear()
  ;(generateTicketRef as jest.Mock).mockClear()

  // Default: calls insert succeeds
  mockInsertCalls.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-call-id' },
        error: null,
      }),
    }),
  })
  mockInsertTickets.mockResolvedValue({ error: null })
  mockInsertTranscripts.mockResolvedValue({ error: null })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('complaintHandler', () => {
  describe('step 0 — greeting', () => {
    it('returns BM greeting asking for name and advances to step 1', async () => {
      const session = makeSession({ step: 0, language: 'bm' })
      const reply = await complaintHandler('start', session, false)
      expect(reply).toContain('nama anda')
      expect(mockUpdateSession).toHaveBeenCalledWith(
        'session-001',
        expect.objectContaining({ step: 1 })
      )
    })

    it('returns EN greeting for English sessions', async () => {
      const session = makeSession({ step: 0, language: 'en' })
      const reply = await complaintHandler('start', session, false)
      expect(reply).toContain('name')
    })
  })

  describe('step 1 — collect name', () => {
    it('stores name in collected_data and advances to step 2', async () => {
      const session = makeSession({ step: 1, collected_data: {} })
      await complaintHandler('Ali Hassan', session, false)
      expect(mockUpdateSession).toHaveBeenCalledWith(
        'session-001',
        expect.objectContaining({
          step: 2,
          collected_data: expect.objectContaining({ name: 'Ali Hassan' }),
        })
      )
    })
  })

  describe('step 2 — collect IC (PDPA: mask immediately)', () => {
    it('calls maskIC() with the raw IC message', async () => {
      const session = makeSession({ step: 2, collected_data: { name: 'Ali' } })
      await complaintHandler('880512-12-3456', session, false)
      expect(maskIC).toHaveBeenCalledWith('880512-12-3456')
    })

    it('stores masked_ic (NOT raw IC) in collected_data', async () => {
      const session = makeSession({ step: 2, collected_data: { name: 'Ali' } })
      await complaintHandler('880512-12-3456', session, false)
      expect(mockUpdateSession).toHaveBeenCalledWith(
        'session-001',
        expect.objectContaining({
          collected_data: expect.objectContaining({
            masked_ic: '880512-**-****',
          }),
        })
      )
      // Ensure raw IC is never stored
      const callArg = mockUpdateSession.mock.calls[0][1] as Record<string, unknown>
      const data = callArg.collected_data as Record<string, unknown>
      expect(data).not.toHaveProperty('raw_ic')
      expect(data).not.toHaveProperty('ic')
    })
  })

  describe('step 3 — collect description', () => {
    it('stores description and advances to step 4 with confirmation summary', async () => {
      const session = makeSession({
        step: 3,
        language: 'bm',
        collected_data: { name: 'Ali', masked_ic: '880512-**-****' },
      })
      const reply = await complaintHandler('Kad tidak berfungsi', session, false)
      expect(mockUpdateSession).toHaveBeenCalledWith(
        'session-001',
        expect.objectContaining({ step: 4 })
      )
      expect(reply).toContain('Sahkan')
    })
  })

  describe('step 4 — confirmation', () => {
    it('creates call with channel=chat, category=complaint, outcome=escalated on "ya"', async () => {
      const session = makeSession({
        step: 4,
        language: 'bm',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Kad rosak',
        },
      })
      await complaintHandler('ya', session, false, 'wamid.test123')

      expect(generateTicketRef).toHaveBeenCalled()
      expect(mockInsertCalls).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'chat',
          category: 'complaint',
          outcome: 'escalated',
          wa_message_id: 'wamid.test123',
        })
      )
    })

    it('inserts ticket with reference_no on confirmation', async () => {
      const session = makeSession({
        step: 4,
        language: 'bm',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Kad rosak',
        },
      })
      await complaintHandler('ya', session, false)

      expect(mockInsertTickets).toHaveBeenCalledWith(
        expect.objectContaining({ reference_no: 'TKT-2026-00001' })
      )
    })

    it('passes isTest flag through to call insert', async () => {
      const session = makeSession({
        step: 4,
        language: 'bm',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Kad rosak',
        },
      })
      await complaintHandler('ya', session, true)

      expect(mockInsertCalls).toHaveBeenCalledWith(
        expect.objectContaining({ is_test: true })
      )
    })

    it('calls expireSession after successful ticket creation', async () => {
      const session = makeSession({
        step: 4,
        language: 'bm',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Kad rosak',
        },
      })
      await complaintHandler('ya', session, false)
      expect(mockExpireSession).toHaveBeenCalledWith('session-001')
    })

    it('calls expireSession and does NOT insert call/ticket on rejection ("tidak")', async () => {
      const session = makeSession({
        step: 4,
        language: 'bm',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Kad rosak',
        },
      })
      const reply = await complaintHandler('tidak', session, false)
      expect(mockExpireSession).toHaveBeenCalledWith('session-001')
      expect(mockInsertCalls).not.toHaveBeenCalled()
      expect(mockInsertTickets).not.toHaveBeenCalled()
      expect(reply).toContain('dibatalkan')
    })

    it('includes wa_message_id in call insert for DB deduplication', async () => {
      const session = makeSession({
        step: 4,
        language: 'en',
        collected_data: {
          name: 'Ali',
          masked_ic: '880512-**-****',
          description: 'Card not working',
        },
      })
      await complaintHandler('yes', session, false, 'wamid.dedup999')
      expect(mockInsertCalls).toHaveBeenCalledWith(
        expect.objectContaining({ wa_message_id: 'wamid.dedup999' })
      )
    })
  })
})
