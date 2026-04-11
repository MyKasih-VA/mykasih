import Anthropic from '@anthropic-ai/sdk'
import type { Classification, Intent, Language } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a bilingual (BM/EN) intent classifier for the MyKasih SARA helpline.
Classify the user message into EXACTLY ONE intent:
- faq: general questions about SARA program, eligibility, how to use credit
- balance_check: checking balance, baki, credit amount
- merchant_lookup: finding nearby stores, kedai berdekatan, mana boleh guna
- complaint: reporting a problem, aduan, issue with card or merchant
- unknown: anything else

Also detect the language: "bm" for Bahasa Melayu, "en" for English.

Respond with ONLY a JSON object (no markdown, no backticks):
{"intent": "<intent>", "language": "<bm|en>", "confidence": "<high|low>"}`

const VALID_INTENTS: Intent[] = ['faq', 'balance_check', 'merchant_lookup', 'complaint', 'unknown']
const VALID_LANGUAGES: Language[] = ['bm', 'en']

export async function classifyIntent(message: string): Promise<Classification> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text) as Record<string, string>

    const intent = VALID_INTENTS.includes(parsed.intent as Intent)
      ? (parsed.intent as Intent)
      : 'unknown'
    const language = VALID_LANGUAGES.includes(parsed.language as Language)
      ? (parsed.language as Language)
      : 'bm'
    const confidence = parsed.confidence === 'high' ? 'high' : 'low'

    return { intent, language, confidence }
  } catch (err) {
    console.error('[intent-classifier] Classification failed:', err)
    return { intent: 'unknown', language: 'bm', confidence: 'low' }
  }
}
