// Mock @supabase/supabase-js before import
const mockSingle = jest.fn()
const mockLimit = jest.fn(() => ({ single: mockSingle }))
const mockOrder = jest.fn(() => ({ limit: mockLimit }))
const mockLike = jest.fn(() => ({ order: mockOrder }))
const mockSelect = jest.fn(() => ({ like: mockLike }))
const mockFrom = jest.fn(() => ({ select: mockSelect }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}))

import { generateTicketRef } from '@/lib/ticket-ref'

describe('generateTicketRef', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns TKT-2026-00001 when table is empty', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    const ref = await generateTicketRef()
    expect(ref).toBe('TKT-2026-00001')
  })

  it('increments from existing max', async () => {
    mockSingle.mockResolvedValue({ data: { reference_no: 'TKT-2026-00001' }, error: null })
    const ref = await generateTicketRef()
    expect(ref).toBe('TKT-2026-00002')
  })

  it('pads to 5 digits', async () => {
    mockSingle.mockResolvedValue({ data: { reference_no: 'TKT-2026-00099' }, error: null })
    const ref = await generateTicketRef()
    expect(ref).toBe('TKT-2026-00100')
  })
})
