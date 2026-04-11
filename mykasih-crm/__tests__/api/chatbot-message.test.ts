/** @jest-environment node */

// ---------------------------------------------------------------------------
// Mocks — factories must NOT reference outer const variables (TDZ issue).
// ---------------------------------------------------------------------------

jest.mock('@/lib/chatbot/session-manager', () => ({
  getActiveSession: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
}))

jest.mock('@/lib/chatbot/intent-classifier', () => ({
  classifyIntent: jest.fn(),
}))

jest.mock('@/lib/meta-wa', () => ({
  sendWhatsAppMessage: jest.fn(),
  sendWhatsAppButtons: jest.fn(),
}))

// Handler mocks — dynamic imports in the route use these via jest module registry
jest.mock('@/lib/chatbot/faq-handler', () => ({ faqHandler: jest.fn() }))
jest.mock('@/lib/chatbot/balance-handler', () => ({ balanceHandler: jest.fn() }))
jest.mock('@/lib/chatbot/merchant-handler', () => ({ merchantHandler: jest.fn() }))
jest.mock('@/lib/chatbot/complaint-handler', () => ({ complaintHandler: jest.fn() }))

// ---------------------------------------------------------------------------
// Imports after mocks — retrieve typed references to the mocked functions
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/chatbot/message/route'
import { getActiveSession, createSession, updateSession } from '@/lib/chatbot/session-manager'
import { classifyIntent } from '@/lib/chatbot/intent-classifier'
import { sendWhatsAppMessage, sendWhatsAppButtons } from '@/lib/meta-wa'
import { faqHandler } from '@/lib/chatbot/faq-handler'
import { balanceHandler } from '@/lib/chatbot/balance-handler'
import { merchantHandler } from '@/lib/chatbot/merchant-handler'
import { complaintHandler } from '@/lib/chatbot/complaint-handler'
import type { Session } from '@/lib/chatbot/types'

const mockGetActiveSession = getActiveSession as jest.MockedFunction<typeof getActiveSession>
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>
const mockUpdateSession = updateSession as jest.MockedFunction<typeof updateSession>
const mockClassifyIntent = classifyIntent as jest.MockedFunction<typeof classifyIntent>
const mockSendWhatsAppButtons = sendWhatsAppButtons as jest.MockedFunction<typeof sendWhatsAppButtons>
const mockSendWhatsAppMessage = sendWhatsAppMessage as jest.MockedFunction<typeof sendWhatsAppMessage>
const mockFaqHandler = faqHandler as jest.MockedFunction<typeof faqHandler>
const mockBalanceHandler = balanceHandler as jest.MockedFunction<typeof balanceHandler>
const mockMerchantHandler = merchantHandler as jest.MockedFunction<typeof merchantHandler>
const mockComplaintHandler = complaintHandler as jest.MockedFunction<typeof complaintHandler>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const N8N_SECRET = 'test-secret'

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/chatbot/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-001',
    wa_phone: '60123456789',
    wa_message_id: null,
    language: 'bm',
    intent: null,
    step: 0,
    collected_data: {},
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  process.env.N8N_WEBHOOK_SECRET = N8N_SECRET
  mockGetActiveSession.mockReset()
  mockCreateSession.mockReset()
  mockUpdateSession.mockReset()
  mockClassifyIntent.mockReset()
  mockSendWhatsAppMessage.mockReset()
  mockSendWhatsAppButtons.mockReset()
  mockFaqHandler.mockReset()
  mockBalanceHandler.mockReset()
  mockMerchantHandler.mockReset()
  mockComplaintHandler.mockReset()
})

afterEach(() => {
  delete process.env.N8N_WEBHOOK_SECRET
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/chatbot/message', () => {
  it('returns 401 without n8n webhook secret header', async () => {
    const req = makeRequest({ waPhone: '60123456789', message: 'hello' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when n8n secret header value is wrong', async () => {
    const req = makeRequest(
      { waPhone: '60123456789', message: 'hello' },
      { 'x-n8n-webhook-secret': 'bad-secret' }
    )
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when waPhone is missing', async () => {
    const req = makeRequest(
      { message: 'hello' },
      { 'x-n8n-webhook-secret': N8N_SECRET }
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when message is missing', async () => {
    const req = makeRequest(
      { waPhone: '60123456789' },
      { 'x-n8n-webhook-secret': N8N_SECRET }
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('sends first contact list and returns first_contact status for new sessions', async () => {
    mockGetActiveSession.mockResolvedValueOnce(null)
    mockClassifyIntent.mockResolvedValueOnce({ intent: 'faq', language: 'bm', confidence: 'high' })
    mockCreateSession.mockResolvedValueOnce(makeSession({ language: 'bm' }))
    mockSendWhatsAppButtons.mockResolvedValueOnce(undefined)

    const req = makeRequest(
      { waPhone: '60123456789', message: 'hello there' },
      { 'x-n8n-webhook-secret': N8N_SECRET }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.status).toBe('first_contact')
    expect(mockSendWhatsAppButtons).toHaveBeenCalled()
  })

  it('dispatches to faqHandler for faq intent and returns ok', async () => {
    const session = makeSession({ intent: 'faq', step: 0 })
    mockGetActiveSession.mockResolvedValueOnce(session)
    mockFaqHandler.mockResolvedValueOnce('Ini adalah FAQ jawapan')
    mockSendWhatsAppMessage.mockResolvedValueOnce(undefined)

    const req = makeRequest(
      { waPhone: '60123456789', message: 'apa tu sara?' },
      { 'x-n8n-webhook-secret': N8N_SECRET }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.status).toBe('ok')
    expect(body.intent).toBe('faq')
    expect(mockFaqHandler).toHaveBeenCalled()
  })

  it('uses locked session intent instead of re-classifying', async () => {
    const session = makeSession({ intent: 'balance_check', step: 1 })
    mockGetActiveSession.mockResolvedValueOnce(session)
    mockBalanceHandler.mockResolvedValueOnce('Baki anda: RM100')
    mockSendWhatsAppMessage.mockResolvedValueOnce(undefined)

    const req = makeRequest(
      { waPhone: '60123456789', message: '880512-12-3456' },
      { 'x-n8n-webhook-secret': N8N_SECRET }
    )
    await POST(req)
    // classifyIntent should NOT be called — intent is already locked in session
    expect(mockClassifyIntent).not.toHaveBeenCalled()
    expect(mockBalanceHandler).toHaveBeenCalled()
  })
})
