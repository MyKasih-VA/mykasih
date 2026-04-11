import { createClient as createServiceClient } from '@supabase/supabase-js'
import { lookupByPostcodeServiceRole, lookupByStateServiceRole } from '@/lib/merchant-lookup'
import { updateSession, expireSession } from './session-manager'
import type { Session } from './types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function merchantHandler(message: string, session: Session, wamid?: string): Promise<string> {
  const lang = session.language

  switch (session.step) {
    case 0: {
      await updateSession(session.id, { intent: 'merchant_lookup', step: 1 })
      // Chatbot conversational prompt — dynamic text, exempt from lib/translations.ts
      return lang === 'bm'
        ? 'Sila masukkan poskod anda atau nama negeri/bandar (cth: 43000 atau Selangor):'
        : 'Please enter your postcode or state/city name (e.g. 43000 or Selangor):'
    }

    case 1: {
      const input = message.trim()

      // Detect if input is a postcode (4-5 digits) or text (state/city)
      const isPostcode = /^\d{4,5}$/.test(input)

      // Use lib/merchant-lookup.ts service-role functions (not inline queries)
      const merchants = isPostcode
        ? await lookupByPostcodeServiceRole(input)
        : await lookupByStateServiceRole(input)

      // Save call record (include wa_message_id for dedup)
      const supabase = getServiceClient()
      const { data: callData } = await supabase.from('calls').insert({
        channel: 'chat',
        wa_number: session.wa_phone,
        wa_message_id: wamid ?? null,
        language: lang,
        category: 'merchant_lookup',
        outcome: merchants.length > 0 ? 'resolved' : 'abandoned',
        message_count: 2,
        is_test: false,
      }).select('id').single()

      if (callData?.id) {
        await supabase.from('transcripts').insert([
          { call_id: callData.id, speaker: 'user', message },
          { call_id: callData.id, speaker: 'bot', message: `Found ${merchants.length} merchants` },
        ])
      }

      await expireSession(session.id)

      if (merchants.length === 0) {
        return lang === 'bm'
          ? 'Maaf, tiada kedai ditemui di kawasan tersebut. Cuba poskod lain.'
          : 'Sorry, no merchants found in that area. Try a different postcode.'
      }

      const header = lang === 'bm' ? 'Kedai berdekatan:' : 'Nearby merchants:'
      const list = merchants
        .slice(0, 5)
        .map((m, i) => `${i + 1}. ${m.chain} - ${m.outlet_name}\n   ${m.address} (${m.postcode})`)
        .join('\n\n')

      return `${header}\n\n${list}`
    }

    default: {
      await expireSession(session.id)
      return lang === 'bm' ? 'Sesi tamat. Sila mulakan semula.' : 'Session ended. Please start again.'
    }
  }
}
