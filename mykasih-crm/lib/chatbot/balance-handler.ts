import { createClient as createServiceClient } from '@supabase/supabase-js'
import { maskIC } from '@/lib/ic-mask'
import { updateSession, expireSession } from './session-manager'
import { mockBalanceAPI } from './mock-balance-api'
import type { Session } from './types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function balanceHandler(message: string, session: Session, wamid?: string): Promise<string> {
  const lang = session.language

  switch (session.step) {
    case 0: {
      await updateSession(session.id, { intent: 'balance_check', step: 1 })
      // Chatbot conversational prompt — dynamic text, exempt from lib/translations.ts
      return lang === 'bm'
        ? 'Sila masukkan nombor MyKad / IC anda (cth: 880512-12-3456):'
        : 'Please enter your MyKad / IC number (e.g. 880512-12-3456):'
    }

    case 1: {
      // PDPA: mask IC IMMEDIATELY — raw IC never persists
      const maskedIC = maskIC(message)

      // Store ONLY the masked IC in session — never the raw value
      await updateSession(session.id, {
        step: 2,
        collected_data: { ...session.collected_data, masked_ic: maskedIC },
      })

      // Call mock balance API with masked IC
      const result = mockBalanceAPI(maskedIC)

      // Format response (chatbot conversational text — exempt from lib/translations.ts)
      const response = lang === 'bm'
        ? `Maklumat baki SARA anda:\n\nNama: ${result.name}\nBaki: RM${result.balance.toFixed(2)}\nTarikh luput: ${result.expiry}\nKedai terdekat: ${result.nearest_merchant}`
        : `Your SARA balance:\n\nName: ${result.name}\nBalance: RM${result.balance.toFixed(2)}\nExpiry: ${result.expiry}\nNearest merchant: ${result.nearest_merchant}`

      // Save call record (include wa_message_id for dedup)
      const supabase = getServiceClient()
      const { data: callData } = await supabase.from('calls').insert({
        channel: 'chat',
        wa_number: session.wa_phone,
        wa_message_id: wamid ?? null,
        language: lang,
        category: 'balance_check',
        outcome: 'resolved',
        message_count: 2,
        is_test: false,
      }).select('id').single()

      // Save transcript turns
      if (callData?.id) {
        await supabase.from('transcripts').insert([
          { call_id: callData.id, speaker: 'bot', message: lang === 'bm' ? 'Sila masukkan nombor IC' : 'Please enter your IC number' },
          { call_id: callData.id, speaker: 'user', message: `[IC provided - masked: ${maskedIC}]` },
          { call_id: callData.id, speaker: 'bot', message: response },
        ])
      }

      await expireSession(session.id)
      return response
    }

    default: {
      await expireSession(session.id)
      return lang === 'bm' ? 'Sesi tamat. Sila mulakan semula.' : 'Session ended. Please start again.'
    }
  }
}
