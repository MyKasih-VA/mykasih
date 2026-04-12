/**
 * @jest-environment node
 */

// Mock next/headers (required by createClient in lib/supabase/server.ts)
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: () => [],
    set: jest.fn(),
  }),
}))

// Define mutable mock state at module scope
const _cfg = {
  user: null as { id: string } | null,
  role: 'admin' as string,
  settingsData: [
    { key: 'agent_hours_start', value: '08:00' },
    { key: 'agent_hours_end', value: '17:00' },
    { key: 'notification_email', value: '' },
    { key: 'data_retention_days', value: '90' },
  ] as Array<{ key: string; value: string }>,
  upsertError: null as { message: string } | null,
}

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: _cfg.user }, error: _cfg.user ? null : { message: 'Not authenticated' } })
      ),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { role: _cfg.role }, error: null }),
        }
      }
      if (table === 'settings') {
        return {
          select: jest.fn().mockResolvedValue({ data: _cfg.settingsData, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: _cfg.upsertError }),
        }
      }
      return {}
    }),
  }),
}))

describe('Settings API', () => {
  beforeEach(() => {
    // Reset to defaults
    _cfg.user = { id: 'user-123' }
    _cfg.role = 'admin'
    _cfg.settingsData = [
      { key: 'agent_hours_start', value: '08:00' },
      { key: 'agent_hours_end', value: '17:00' },
      { key: 'notification_email', value: '' },
      { key: 'data_retention_days', value: '90' },
    ]
    _cfg.upsertError = null
    jest.resetModules()
  })

  it('GET /api/settings returns default values', async () => {
    _cfg.settingsData = []
    const { GET } = await import('@/app/api/settings/route')
    const req = new Request('http://localhost/api/settings')
    const res = await GET(req as Parameters<typeof GET>[0])
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, string>
    expect(body.agent_hours_start).toBe('08:00')
    expect(body.agent_hours_end).toBe('17:00')
    expect(body.notification_email).toBe('')
    expect(body.data_retention_days).toBe('90')
  })

  it('PATCH /api/settings validates HH:MM format for agent hours', async () => {
    const { PATCH } = await import('@/app/api/settings/route')
    const req = new Request('http://localhost/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: [{ key: 'agent_hours_start', value: '8:00' }], // invalid — missing leading zero
      }),
    })
    const res = await PATCH(req as Parameters<typeof PATCH>[0])
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/HH:MM/)
  })

  it('PATCH /api/settings rejects non-admin users with 403', async () => {
    _cfg.role = 'mykasih'
    const { PATCH } = await import('@/app/api/settings/route')
    const req = new Request('http://localhost/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: [{ key: 'agent_hours_start', value: '09:00' }],
      }),
    })
    const res = await PATCH(req as Parameters<typeof PATCH>[0])
    expect(res.status).toBe(403)
  })
})
