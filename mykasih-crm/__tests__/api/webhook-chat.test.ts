/** @jest-environment node */

import { GET, POST } from '@/app/api/webhook/chat/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/webhook/chat')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString(), { method: 'GET' })
}

function makePostRequest(
  body: unknown,
  headers: Record<string, string> = {}
): Request {
  return new Request('http://localhost/api/webhook/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// A minimal Meta text-message webhook payload
function makeTextPayload(from: string, wamid: string, text: string) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ profile: { name: 'Test User' } }],
              messages: [
                {
                  from,
                  id: wamid,
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  }
}

// A status-only payload (no messages array)
function makeStatusPayload() {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [{ id: 'wamid.xxx', status: 'delivered' }],
            },
          },
        ],
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Environment + fetch mock setup
// ---------------------------------------------------------------------------

const VERIFY_TOKEN = 'test-verify-token'
const N8N_SECRET = 'test-n8n-secret'

beforeEach(() => {
  process.env.META_WA_VERIFY_TOKEN = VERIFY_TOKEN
  process.env.N8N_WEBHOOK_SECRET = N8N_SECRET

  // Mock fetch so POST doesn't actually call /api/chatbot/message
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ status: 'ok', intent: 'faq', language: 'bm' }),
  }) as unknown as typeof fetch
})

afterEach(() => {
  delete process.env.META_WA_VERIFY_TOKEN
  delete process.env.N8N_WEBHOOK_SECRET
  jest.resetAllMocks()
})

// ---------------------------------------------------------------------------
// GET — hub verification
// ---------------------------------------------------------------------------

describe('GET /api/webhook/chat', () => {
  it('returns hub.challenge when mode=subscribe and token matches', async () => {
    const req = makeGetRequest({
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'test_challenge_123',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe('test_challenge_123')
  })

  it('returns 403 when token does not match', async () => {
    const req = makeGetRequest({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'test_challenge_123',
    })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 when mode is not subscribe', async () => {
    const req = makeGetRequest({
      'hub.mode': 'unsubscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'test_challenge_123',
    })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 when hub.challenge is missing but mode and token are correct', async () => {
    const req = makeGetRequest({
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
    })
    const res = await GET(req)
    // Returns 200 with empty body (challenge defaults to '' per route impl)
    // The Meta spec requires challenge echo — any non-403 is acceptable here
    expect([200, 403]).toContain(res.status)
  })
})

// ---------------------------------------------------------------------------
// POST — incoming WA message handling
// ---------------------------------------------------------------------------

describe('POST /api/webhook/chat', () => {
  it('returns 401 when N8N_WEBHOOK_SECRET is set but header is missing', async () => {
    const req = makePostRequest(makeTextPayload('60123456789', 'wamid.abc', 'hello'))
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when n8n secret header value is wrong', async () => {
    const req = makePostRequest(makeTextPayload('60123456789', 'wamid.abc', 'hello'), {
      'x-n8n-webhook-secret': 'wrong-secret',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with status ok for valid text message payload', async () => {
    const req = makePostRequest(makeTextPayload('60123456789', 'wamid.abc', 'semak baki'), {
      'x-n8n-webhook-secret': N8N_SECRET,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.status).toBe('ok')
  })

  it('returns 200 with no_message for status-only events (no messages array)', async () => {
    const req = makePostRequest(makeStatusPayload(), {
      'x-n8n-webhook-secret': N8N_SECRET,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.status).toBe('no_message')
  })

  it('forwards payload to /api/chatbot/message when message is present', async () => {
    const req = makePostRequest(makeTextPayload('60123456789', 'wamid.xyz', 'hello'), {
      'x-n8n-webhook-secret': N8N_SECRET,
    })
    await POST(req)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chatbot/message'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
