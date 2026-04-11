import { sendWhatsAppMessage, sendWhatsAppButtons } from '@/lib/meta-wa'

describe('sendWhatsAppMessage', () => {
  it('logs to console with [WA STUB] prefix when env vars absent', async () => {
    const originalPhoneId = process.env.META_WA_PHONE_NUMBER_ID
    const originalToken = process.env.META_WA_ACCESS_TOKEN
    delete process.env.META_WA_PHONE_NUMBER_ID
    delete process.env.META_WA_ACCESS_TOKEN

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    await sendWhatsAppMessage('60123456789', 'Hello from stub')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WA STUB]')
    )

    consoleSpy.mockRestore()
    process.env.META_WA_PHONE_NUMBER_ID = originalPhoneId
    process.env.META_WA_ACCESS_TOKEN = originalToken
  })

  it('calls fetch with correct graph.facebook.com URL when env vars present', async () => {
    process.env.META_WA_PHONE_NUMBER_ID = 'test-phone-id'
    process.env.META_WA_ACCESS_TOKEN = 'test-token'

    const mockFetch = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch as unknown as typeof fetch

    await sendWhatsAppMessage('60123456789', 'Test message')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('graph.facebook.com/v20.0'),
      expect.objectContaining({ method: 'POST' })
    )

    delete process.env.META_WA_PHONE_NUMBER_ID
    delete process.env.META_WA_ACCESS_TOKEN
  })
})

describe('sendWhatsAppButtons', () => {
  it('serializes payload with type list (not button) when env vars present', async () => {
    process.env.META_WA_PHONE_NUMBER_ID = 'test-phone-id'
    process.env.META_WA_ACCESS_TOKEN = 'test-token'

    let capturedBody: Record<string, unknown> = {}
    const mockFetch = jest.fn().mockImplementation((_, opts: RequestInit) => {
      capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>
      return Promise.resolve({ ok: true })
    })
    global.fetch = mockFetch as unknown as typeof fetch

    await sendWhatsAppButtons('60123456789', 'Choose an option', [
      { id: 'balance', title: 'Semak baki' },
      { id: 'merchant', title: 'Kedai berdekatan' },
    ])

    const interactive = capturedBody['interactive'] as Record<string, unknown>
    expect(interactive['type']).toBe('list')

    delete process.env.META_WA_PHONE_NUMBER_ID
    delete process.env.META_WA_ACCESS_TOKEN
  })

  it('sends all items in sections.rows when env vars present', async () => {
    process.env.META_WA_PHONE_NUMBER_ID = 'test-phone-id'
    process.env.META_WA_ACCESS_TOKEN = 'test-token'

    let capturedBody: Record<string, unknown> = {}
    const mockFetch = jest.fn().mockImplementation((_, opts: RequestInit) => {
      capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>
      return Promise.resolve({ ok: true })
    })
    global.fetch = mockFetch as unknown as typeof fetch

    const items = [
      { id: 'balance', title: 'Semak baki' },
      { id: 'merchant', title: 'Kedai berdekatan' },
      { id: 'sara', title: 'Bantuan SARA' },
      { id: 'status', title: 'Status aduan' },
    ]
    await sendWhatsAppButtons('60123456789', 'Choose', items)

    const interactive = capturedBody['interactive'] as { action: { sections: Array<{ rows: unknown[] }> } }
    expect(interactive.action.sections[0].rows).toHaveLength(4)

    delete process.env.META_WA_PHONE_NUMBER_ID
    delete process.env.META_WA_ACCESS_TOKEN
  })

  it('logs to console with [WA STUB] prefix in stub mode (env vars absent)', async () => {
    delete process.env.META_WA_PHONE_NUMBER_ID
    delete process.env.META_WA_ACCESS_TOKEN

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    await sendWhatsAppButtons('60123456789', 'Choose', [
      { id: 'balance', title: 'Semak baki' },
    ])

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WA STUB]')
    )

    consoleSpy.mockRestore()
  })
})
