import { createClient as createServiceClient } from '@supabase/supabase-js'
import { maskIC } from '@/lib/ic-mask'
import { generateTicketRef } from '@/lib/ticket-ref'
import { updateSession, expireSession } from './session-manager'
import type { Session } from './types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function complaintHandler(
  message: string,
  session: Session,
  isTest: boolean,
  wamid?: string
): Promise<string> {
  const lang = session.language
  const data = (session.collected_data ?? {}) as Record<string, string>

  switch (session.step) {
    case 0: {
      await updateSession(session.id, { intent: 'complaint', step: 1 })
      // Chatbot conversational prompt — dynamic text, exempt from lib/translations.ts
      return lang === 'bm'
        ? 'Terima kasih kerana menghubungi kami. Boleh saya tahu nama anda?'
        : 'Thank you for reaching out. May I have your name?'
    }

    case 1: {
      await updateSession(session.id, {
        step: 2,
        collected_data: { ...data, name: message.trim() },
      })
      return lang === 'bm'
        ? 'Boleh berikan nombor IC anda? (cth: 880512-12-3456)'
        : 'Please provide your IC number (e.g. 880512-12-3456)'
    }

    case 2: {
      // PDPA: mask IC IMMEDIATELY — raw IC NEVER persisted
      const maskedIC = maskIC(message)
      await updateSession(session.id, {
        step: 3,
        collected_data: { ...data, masked_ic: maskedIC },
      })
      return lang === 'bm'
        ? 'Sila huraikan masalah anda:'
        : 'Please describe your issue:'
    }

    case 3: {
      await updateSession(session.id, {
        step: 4,
        collected_data: { ...data, description: message.trim() },
      })
      const summary = lang === 'bm'
        ? `Aduan anda:\nNama: ${data.name}\nIC: ${data.masked_ic}\nMasalah: ${message.trim()}\n\nSahkan? (Ya/Tidak)`
        : `Your complaint:\nName: ${data.name}\nIC: ${data.masked_ic}\nIssue: ${message.trim()}\n\nConfirm? (Yes/No)`
      return summary
    }

    case 4: {
      const yesWords = ['ya', 'yes', 'ok', 'okay', 'sahkan', 'confirm', 'betul']
      const isConfirmed = yesWords.some(w => message.toLowerCase().trim().includes(w))

      if (!isConfirmed) {
        await expireSession(session.id)
        return lang === 'bm'
          ? 'Aduan dibatalkan. Hubungi kami semula jika diperlukan.'
          : 'Complaint cancelled. Contact us again if needed.'
      }

      // Generate ticket reference
      const referenceNo = await generateTicketRef()
      const supabase = getServiceClient()

      // Create call record (CHAT-09: channel='chat', include wa_message_id for dedup)
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert({
          channel: 'chat',
          wa_number: session.wa_phone,
          wa_message_id: wamid ?? null,
          caller_name: data.name,
          language: lang,
          category: 'complaint',
          outcome: 'escalated',
          message_count: 5,
          is_test: isTest,
        })
        .select('id')
        .single()

      if (callError || !callData) {
        console.error('[complaint-handler] Call insert failed:', callError)
        await expireSession(session.id)
        return lang === 'bm'
          ? 'Maaf, terdapat ralat. Sila cuba lagi kemudian.'
          : 'Sorry, there was an error. Please try again later.'
      }

      const callId = callData.id as string

      // Create ticket
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          call_id: callId,
          channel: 'chat',
          category: 'complaint',
          description: data.description ?? message.trim(),
          status: 'open',
          reference_no: referenceNo,
          masked_ic: data.masked_ic,
        })

      if (ticketError) {
        console.error('[complaint-handler] Ticket insert failed:', ticketError)
      }

      // Save transcript turns
      await supabase.from('transcripts').insert([
        { call_id: callId, speaker: 'bot', message: 'Boleh saya tahu nama anda?' },
        { call_id: callId, speaker: 'user', message: data.name },
        { call_id: callId, speaker: 'bot', message: 'Sila masukkan IC anda' },
        { call_id: callId, speaker: 'user', message: `[IC masked: ${data.masked_ic}]` },
        { call_id: callId, speaker: 'bot', message: 'Sila huraikan masalah anda' },
        { call_id: callId, speaker: 'user', message: data.description ?? '' },
        { call_id: callId, speaker: 'bot', message: `Aduan difailkan: ${referenceNo}` },
      ])

      await expireSession(session.id)

      return lang === 'bm'
        ? `Aduan anda telah difailkan.\n\nNombor rujukan: ${referenceNo}\n\nKami akan menghubungi anda dalam 2-3 hari bekerja.`
        : `Your complaint has been filed.\n\nReference: ${referenceNo}\n\nWe will contact you within 2-3 business days.`
    }

    default: {
      await expireSession(session.id)
      return lang === 'bm'
        ? 'Sesi tamat. Sila mulakan semula.'
        : 'Session ended. Please start again.'
    }
  }
}
