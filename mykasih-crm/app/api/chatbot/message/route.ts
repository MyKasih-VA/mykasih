export const runtime = 'nodejs'

import { getActiveSession, createSession, updateSession } from '@/lib/chatbot/session-manager'
import { classifyIntent } from '@/lib/chatbot/intent-classifier'
import { sendWhatsAppMessage, sendWhatsAppButtons } from '@/lib/meta-wa'
import type { ChatbotRequest, Intent } from '@/lib/chatbot/types'

// First contact quick reply items — MUST use list type (4 items > button max of 3)
const FIRST_CONTACT_ITEMS = [
  { id: 'balance_check', title: 'Semak baki', description: 'Semak kredit SARA anda' },
  { id: 'merchant_lookup', title: 'Kedai berdekatan', description: 'Cari kedai yang menerima SARA' },
  { id: 'faq', title: 'Bantuan SARA', description: 'Soalan lazim tentang program' },
  { id: 'complaint', title: 'Status aduan', description: 'Buat atau semak aduan' },
]

function getWelcomeText(language: 'bm' | 'en'): string {
  return language === 'bm'
    ? 'Selamat datang ke MyKasih. Sila pilih perkhidmatan:'
    : 'Welcome to MyKasih. Please select a service:'
}

function getFallbackText(language: 'bm' | 'en'): string {
  return language === 'bm'
    ? 'Maaf, saya tidak faham. Sila pilih dari senarai atau taip soalan anda.'
    : 'Sorry, I did not understand. Please select from the list or type your question.'
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Validate n8n webhook secret
    const n8nSecret = process.env.N8N_WEBHOOK_SECRET
    if (n8nSecret) {
      const headerSecret = request.headers.get('x-n8n-webhook-secret')
      if (headerSecret !== n8nSecret) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json() as ChatbotRequest
    const { waPhone, message, wamid, contactName, isTest = false } = body

    if (!waPhone || !message) {
      return Response.json({ error: 'Missing waPhone or message' }, { status: 400 })
    }

    // 1. Session lookup
    let session = await getActiveSession(waPhone)

    // 2. First contact — no active session
    if (!session) {
      // Check if message is a direct intent from list selection
      const directIntents: Intent[] = ['balance_check', 'merchant_lookup', 'faq', 'complaint']
      if (directIntents.includes(message as Intent)) {
        // User tapped a list item — create session with that intent
        const { language } = await classifyIntent(message)
        session = await createSession(waPhone, language)
        await updateSession(session.id, { intent: message })
        // Fall through to dispatch below with the selected intent
        session = { ...session, intent: message as Intent }
      } else {
        // Truly new contact — classify language, send welcome list
        const { language } = await classifyIntent(message)
        session = await createSession(waPhone, language)
        await sendWhatsAppButtons(waPhone, getWelcomeText(language), FIRST_CONTACT_ITEMS)
        return Response.json({ status: 'first_contact', language })
      }
    }

    // 3. Determine intent — use locked session intent or classify
    let intent: Intent
    if (session.intent) {
      intent = session.intent
    } else {
      // Check if message is a list selection (from first contact reply)
      const directIntents: Intent[] = ['balance_check', 'merchant_lookup', 'faq', 'complaint']
      if (directIntents.includes(message as Intent)) {
        intent = message as Intent
      } else {
        const classification = await classifyIntent(message)
        intent = classification.intent
      }
      // Lock intent to session
      await updateSession(session.id, { intent })
    }

    // 4. Dispatch to handler (handlers created in Plans 04-06)
    // Dynamic imports prevent build failures when handler files don't exist yet
    let responseText: string
    try {
      switch (intent) {
        case 'faq': {
          const { faqHandler } = await import('@/lib/chatbot/faq-handler')
          responseText = await faqHandler(message, session, wamid)
          break
        }
        case 'balance_check': {
          // @ts-expect-error — balance-handler created in Plan 04; dynamic import prevents build failure
          const { balanceHandler } = await import('@/lib/chatbot/balance-handler')
          responseText = await (balanceHandler as (m: string, s: typeof session, wamid?: string) => Promise<string>)(message, session, wamid)
          break
        }
        case 'merchant_lookup': {
          const { merchantHandler } = await import('@/lib/chatbot/merchant-handler')
          responseText = await merchantHandler(message, session, wamid)
          break
        }
        case 'complaint': {
          // @ts-expect-error — complaint-handler created in Plan 06; dynamic import prevents build failure
          const { complaintHandler } = await import('@/lib/chatbot/complaint-handler')
          responseText = await (complaintHandler as (m: string, s: typeof session, t: boolean, wamid?: string) => Promise<string>)(message, session, isTest, wamid)
          break
        }
        default:
          responseText = getFallbackText(session.language)
      }
    } catch (handlerErr) {
      console.error(`[chatbot/message] Handler ${intent} error:`, handlerErr)
      responseText = getFallbackText(session.language)
    }

    // 5. Send reply via WA
    await sendWhatsAppMessage(waPhone, responseText)

    // Satisfy strict mode: contactName is received but not yet used in call record (future feature)
    void contactName

    return Response.json({ status: 'ok', intent, language: session.language })
  } catch (err) {
    console.error('[chatbot/message] Unhandled error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
