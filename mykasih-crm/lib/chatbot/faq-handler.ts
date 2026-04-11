import { createClient as createServiceClient } from '@supabase/supabase-js'
import { expireSession } from './session-manager'
import type { Session } from './types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function faqHandler(message: string, session: Session, wamid?: string): Promise<string> {
  const lang = session.language
  const supabase = getServiceClient()

  // Search kb_entries for active entries matching the user's question
  // Use ilike on the question field in the user's language
  const questionField = lang === 'bm' ? 'question_bm' : 'question_en'
  const answerField = lang === 'bm' ? 'answer_bm' : 'answer_en'

  // Try keyword match against kb_entries
  const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  let bestMatch: string | null = null

  for (const keyword of keywords) {
    const { data } = await supabase
      .from('kb_entries')
      .select(`${questionField}, ${answerField}`)
      .eq('is_active', true)
      .ilike(questionField, `%${keyword}%`)
      .limit(1)
      .single()

    if (data && (data as Record<string, unknown>)[answerField]) {
      bestMatch = (data as Record<string, unknown>)[answerField] as string
      break
    }
  }

  // If no keyword match, try fetching a general FAQ entry
  if (!bestMatch) {
    const { data: generalFaq } = await supabase
      .from('kb_entries')
      .select(answerField)
      .eq('is_active', true)
      .eq('category', 'general')
      .limit(1)
      .single()

    if (generalFaq && (generalFaq as Record<string, unknown>)[answerField]) {
      bestMatch = (generalFaq as Record<string, unknown>)[answerField] as string
    }
  }

  // Save call record (include wa_message_id for dedup)
  const { data: callData } = await supabase.from('calls').insert({
    channel: 'chat',
    wa_number: session.wa_phone,
    wa_message_id: wamid ?? null,
    language: lang,
    category: 'faq',
    outcome: bestMatch ? 'resolved' : 'abandoned',
    message_count: 1,
    is_test: false,
  }).select('id').single()

  // Save transcript
  if (callData?.id) {
    await supabase.from('transcripts').insert([
      { call_id: callData.id, speaker: 'user', message },
      { call_id: callData.id, speaker: 'bot', message: bestMatch ?? 'No answer found' },
    ])
  }

  // Expire session after single-turn FAQ
  await expireSession(session.id)

  if (bestMatch) {
    return bestMatch
  }

  // Chatbot conversational fallback — dynamic text, exempt from lib/translations.ts (not a UI label)
  return lang === 'bm'
    ? 'Maaf, saya tidak menemui jawapan untuk soalan anda. Sila hubungi talian bantuan MyKasih.'
    : 'Sorry, I could not find an answer to your question. Please contact the MyKasih helpline.'
}
