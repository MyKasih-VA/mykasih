/** @jest-environment node */

// ---------------------------------------------------------------------------
// Mocks — use a shared mutable config object to avoid TDZ issues.
// jest.mock factory is hoisted before const declarations, so closures over
// module-level consts fail. Instead, close over a mutable plain object which
// is initialized synchronously and mutated by each test via exported helpers.
// ---------------------------------------------------------------------------

// Shared state — mutated per test, safe to close over in factory
const _cfg = {
  user: null as { id: string } | null,
  authError: null as { message: string } | null,
  callsData: [] as Record<string, unknown>[],
  callsError: null as { message: string } | null,
  ticketsData: [] as Record<string, unknown>[],
  ticketsError: null as { message: string } | null,
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => {
    const ticketsChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockImplementation(async () => ({
        data: _cfg.ticketsData,
        error: _cfg.ticketsError,
      })),
    }

    const callsChain = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockImplementation(async () => ({
        data: _cfg.callsData,
        error: _cfg.callsError,
      })),
    }

    return {
      auth: {
        getUser: jest.fn().mockImplementation(async () => ({
          data: { user: _cfg.user },
          error: _cfg.authError,
        })),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'tickets') return ticketsChain
        return callsChain
      }),
    }
  }),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/beneficiaries/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/beneficiaries')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), { method: 'GET' })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset shared config before each test
  _cfg.user = null
  _cfg.authError = null
  _cfg.callsData = []
  _cfg.callsError = null
  _cfg.ticketsData = []
  _cfg.ticketsError = null
  jest.clearAllMocks()
})

describe('GET /api/beneficiaries', () => {
  it('returns 401 when user is not authenticated', async () => {
    _cfg.user = null
    _cfg.authError = { message: 'Not authenticated' }

    const res = await GET(makeRequest({ query: '+60123456789' }))
    expect(res.status).toBe(401)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when query param is missing', async () => {
    _cfg.user = { id: 'user-1' }
    _cfg.authError = null

    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Query too short')
  })

  it('returns 400 when query is only 1 character', async () => {
    _cfg.user = { id: 'user-1' }
    _cfg.authError = null

    const res = await GET(makeRequest({ query: 'a' }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Query too short')
  })

  it('returns 200 with calls and tickets for a valid query', async () => {
    _cfg.user = { id: 'user-1' }
    _cfg.authError = null
    _cfg.callsData = [
      { id: 'call-1', caller_name: 'Siti Aishah', wa_number: '+60123456789', channel: 'voice' },
    ]
    _cfg.callsError = null
    _cfg.ticketsData = [
      { id: 'ticket-1', call_id: 'call-1', reference_no: 'TKT-2026-00001' },
    ]
    _cfg.ticketsError = null

    const res = await GET(makeRequest({ query: '+60123' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toHaveProperty('calls')
    expect(body).toHaveProperty('tickets')
    expect((body.calls as unknown[]).length).toBe(1)
    expect((body.tickets as unknown[]).length).toBe(1)
  })
})
