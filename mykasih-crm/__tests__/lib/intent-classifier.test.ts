// Mock Anthropic SDK BEFORE importing the module under test.
// The factory must not reference any variable declared outside it (temporal dead zone).
// We attach the mock function to the mock instance so tests can control it via
// the Anthropic constructor's return value.
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn()
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }))
  // Expose mockCreate on the constructor so tests can retrieve it
  ;(MockAnthropic as unknown as Record<string, unknown>)._mockCreate = mockCreate
  return {
    __esModule: true,
    default: MockAnthropic,
  }
})

// Import after mocking so the module picks up the mock
import { classifyIntent } from '@/lib/chatbot/intent-classifier'
import Anthropic from '@anthropic-ai/sdk'
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages'

// Retrieve the shared mockCreate reference attached to the constructor
const mockCreate = (Anthropic as unknown as Record<string, unknown>)
  ._mockCreate as jest.MockedFunction<() => Promise<unknown>>

function makeTextResponse(text: string) {
  return {
    content: [{ type: 'text', text } as TextBlock],
  }
}

beforeEach(() => {
  mockCreate.mockReset()
})

describe('classifyIntent', () => {
  it('returns balance_check for "semak baki" (BM)', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"balance_check","language":"bm","confidence":"high"}')
    )
    const result = await classifyIntent('semak baki')
    expect(result).toEqual({ intent: 'balance_check', language: 'bm', confidence: 'high' })
  })

  it('returns faq with en language for "I need help"', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"faq","language":"en","confidence":"high"}')
    )
    const result = await classifyIntent('I need help')
    expect(result).toEqual({ intent: 'faq', language: 'en', confidence: 'high' })
  })

  it('returns merchant_lookup for "kedai berdekatan"', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"merchant_lookup","language":"bm","confidence":"high"}')
    )
    const result = await classifyIntent('kedai berdekatan')
    expect(result).toEqual({ intent: 'merchant_lookup', language: 'bm', confidence: 'high' })
  })

  it('returns complaint for "ada masalah dengan kad"', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"complaint","language":"bm","confidence":"high"}')
    )
    const result = await classifyIntent('ada masalah dengan kad')
    expect(result).toEqual({ intent: 'complaint', language: 'bm', confidence: 'high' })
  })

  it('returns unknown with low confidence when JSON parse fails', async () => {
    mockCreate.mockResolvedValueOnce(makeTextResponse('not json at all'))
    const result = await classifyIntent('gibberish')
    expect(result).toEqual({ intent: 'unknown', language: 'bm', confidence: 'low' })
  })

  it('returns unknown with low confidence when API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'))
    const result = await classifyIntent('semak baki')
    expect(result).toEqual({ intent: 'unknown', language: 'bm', confidence: 'low' })
  })

  it('normalises invalid intent to unknown', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"nonsense_intent","language":"bm","confidence":"high"}')
    )
    const result = await classifyIntent('some message')
    expect(result.intent).toBe('unknown')
  })

  it('normalises invalid language to bm', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"faq","language":"zh","confidence":"high"}')
    )
    const result = await classifyIntent('some message')
    expect(result.language).toBe('bm')
  })

  it('calls Anthropic with model claude-haiku-4-5-20251001', async () => {
    mockCreate.mockResolvedValueOnce(
      makeTextResponse('{"intent":"faq","language":"en","confidence":"high"}')
    )
    await classifyIntent('test message')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001' })
    )
  })
})
