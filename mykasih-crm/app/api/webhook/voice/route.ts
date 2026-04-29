import type { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateTicketRef } from '@/lib/ticket-ref'
import type { ElevenLabsWebhookPayload } from '@/lib/elevenlabs-types'

// --- HMAC Signature Validation (per D-14) ---

function validateElevenLabsSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  // Header format: "t=<unix_timestamp>,v0=<hex_hmac>"
  const parts: Record<string, string> = {}
  for (const segment of signatureHeader.split(',')) {
    const eqIdx = segment.indexOf('=')
    if (eqIdx > 0) {
      parts[segment.substring(0, eqIdx)] = segment.substring(eqIdx + 1)
    }
  }

  const timestamp = parts['t']
  const receivedSig = parts['v0']

  if (!timestamp || !receivedSig) return false

  // Reject replays older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  // Signed content: "<timestamp>.<raw_body>"
  const signedContent = `${timestamp}.${rawBody}`
  const expectedSig = createHmac('sha256', secret)
    .update(signedContent, 'utf8')
    .digest('hex')

  // Constant-time comparison prevents timing attacks
  const expected = Buffer.from(expectedSig, 'hex')
  const received = Buffer.from(receivedSig, 'hex')
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

// --- Category Keyword Fallback (per D-02) ---

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  complaint: ['aduan', 'complaint', 'masalah', 'problem', 'report'],
  balance_check: ['baki', 'balance', 'credit', 'kredit'],
  merchant_lookup: ['kedai', 'merchant', 'shop', 'outlet', 'store'],
  eligibility: ['kelayakan', 'eligible', 'eligibility', 'layak'],
  faq: ['soalan', 'question', 'how', 'bagaimana', 'apa', 'what'],
  registration: ['daftar', 'register', 'registration', 'pendaftaran'],
}

function detectCategoryFromTranscript(
  transcript: { role: string; message: string | null }[]
): string | null {
  const userMessages = transcript
    .filter((t) => t.role === 'user' && t.message)
    .map((t) => (t.message as string).toLowerCase())
    .join(' ')

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => userMessages.includes(kw))) {
      return category
    }
  }
  return null // per D-03: store null if fallback also fails
}

// --- Language Detection Fallback ---

const BM_KEYWORDS = ['saya', 'nak', 'boleh', 'tidak', 'ada', 'baki', 'kedai', 'daftar', 'bantuan', 'terima kasih', 'bagaimana', 'tolong']
const EN_KEYWORDS = ['hello', 'please', 'thank you', 'how', 'what', 'help', 'balance', 'register', 'merchant', 'eligible']

function detectLanguageFromTranscript(
  transcript: { role: string; message: string | null }[]
): 'bm' | 'en' | 'mixed' | null {
  const userMessages = transcript
    .filter((t) => t.role === 'user' && t.message)
    .map((t) => (t.message as string).toLowerCase())
    .join(' ')

  if (!userMessages) return null

  const hasBm = BM_KEYWORDS.some((kw) => userMessages.includes(kw))
  const hasEn = EN_KEYWORDS.some((kw) => userMessages.includes(kw))

  if (hasBm && hasEn) return 'mixed'
  if (hasBm) return 'bm'
  if (hasEn) return 'en'
  return null
}

// --- Outcome Mapping ---

function mapOutcome(
  callSuccessful: 'success' | 'failure' | 'unknown'
): string | null {
  switch (callSuccessful) {
    case 'success': return 'resolved'
    case 'failure': return 'escalated'
    default: return null
  }
}

// --- Main Route Handler ---

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET

  // Step 1: Read raw body as text FIRST (before JSON parsing)
  const rawBody = await request.text()
  const signatureHeader = request.headers.get('elevenlabs-signature') ?? ''

  // Step 2: Validate HMAC-SHA256 (per D-14 — only 401 case)
  // Dev mode: skip validation when secret is not configured (per D-12)
  if (!webhookSecret) {
    console.warn('[webhook/voice] ELEVENLABS_WEBHOOK_SECRET not set — signature validation skipped')
  } else if (!validateElevenLabsSignature(rawBody, signatureHeader, webhookSecret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Step 3: Parse JSON from already-read string
  let payload: ElevenLabsWebhookPayload
  try {
    payload = JSON.parse(rawBody) as ElevenLabsWebhookPayload
  } catch {
    // Malformed JSON — still return 200 per D-11
    return Response.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 200 }
    )
  }

  // Only process post_call_transcription events
  if (payload.type !== 'post_call_transcription') {
    return Response.json(
      { success: true, skipped: true, reason: `Event type ${payload.type} not processed` },
      { status: 200 }
    )
  }

  const conversationId = payload.data.conversation_id

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 4: Extract category from data_collection (per D-01)
    let category: string | null = null
    const dcResults = payload.data.analysis?.data_collection_results
    if (dcResults) {
      // Check multiple possible key names for the category field
      // (Assumption A2: exact key name depends on ElevenLabs dashboard config)
      const categoryResult =
        dcResults['category'] ?? dcResults['call_category'] ?? dcResults['intent']
      if (categoryResult?.value) {
        const validCategories = [
          'eligibility',
          'faq',
          'registration',
          'complaint',
          'merchant_lookup',
          'balance_check',
        ]
        category = validCategories.includes(categoryResult.value)
          ? categoryResult.value
          : null
      }
    }

    // Step 5: Keyword fallback if category still null (per D-02)
    if (!category) {
      category = detectCategoryFromTranscript(payload.data.transcript)
    }
    // Step 6: If still null, store null (per D-03) — no action needed

    // Step 7: Extract language from data_collection if available, else detect from transcript
    let language: string | null = null
    if (dcResults) {
      const langResult = dcResults['language'] ?? dcResults['call_language']
      if (langResult?.value) {
        const validLanguages = ['bm', 'en', 'mixed']
        language = validLanguages.includes(langResult.value) ? langResult.value : null
      }
    }
    if (!language) {
      language = detectLanguageFromTranscript(payload.data.transcript)
    }

    // Step 8: Map outcome
    const outcome = mapOutcome(payload.data.analysis.call_successful)

    // Step 9: Check for is_test flag from dynamic variables
    const clientData = payload.data.conversation_initiation_client_data as
      | { dynamic_variables?: { is_test?: boolean } }
      | null
    const isTest = clientData?.dynamic_variables?.is_test === true

    // Step 10: Insert call record (per VOICE-02)
    const callTimestamp = new Date(
      payload.data.metadata.start_time_unix_secs * 1000
    ).toISOString()

    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert({
        channel: 'voice',
        caller_name: null, // per D-04: voice calls don't collect caller info
        wa_number: null, // per D-04: voice calls have no WA number
        location: null,
        postcode: null,
        language,
        duration: payload.data.metadata.call_duration_secs,
        message_count: null, // voice calls use duration, not message_count
        category,
        outcome,
        csat_rating: null,
        is_test: isTest,
        elevenlabs_conversation_id: conversationId,
        timestamp: callTimestamp,
      })
      .select('id')
      .single()

    if (callError || !callData) {
      // per D-12: log error, return 200
      console.error(
        `[webhook/voice] Call insert failed for conversation_id=${conversationId}:`,
        callError
      )
      return Response.json(
        { success: false, error: 'DB write failed', conversation_id: conversationId },
        { status: 200 }
      )
    }

    const callId = callData.id as string

    // Step 11: Insert transcript turns (per VOICE-03)
    const transcriptRows = payload.data.transcript
      .filter((turn) => turn.message !== null)
      .map((turn) => ({
        call_id: callId,
        speaker: turn.role === 'agent' ? 'bot' : 'user',
        message: turn.message,
        timestamp: new Date(
          (payload.data.metadata.start_time_unix_secs + turn.time_in_call_secs) * 1000
        ).toISOString(),
      }))

    if (transcriptRows.length > 0) {
      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert(transcriptRows)

      if (transcriptError) {
        console.error(
          `[webhook/voice] Transcript insert failed for call_id=${callId}:`,
          transcriptError
        )
        // Continue — call record was saved; transcript loss is recoverable from ElevenLabs
      }
    }

    // Step 12: Auto-create ticket if category === 'complaint' (per D-15, D-16)
    let ticketId: string | null = null

    if (category === 'complaint') {
      const complaintTurns = payload.data.transcript
        .filter((t) => t.message)
        .map((t) => t.message as string)
        .join(' ')
      const description = complaintTurns.substring(0, 500) // per D-16: first 500 chars

      try {
        const referenceNo = await generateTicketRef()

        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            call_id: callId,
            channel: 'voice',
            category: 'complaint',
            description,
            status: 'open',
            reference_no: referenceNo,
            masked_ic: null, // per D-05: voice calls have no IC
          })
          .select('id')
          .single()

        if (ticketError) {
          // Retry once on unique constraint violation (race condition on reference_no)
          if (ticketError.code === '23505') {
            const retryRef = await generateTicketRef()
            const { data: retryData, error: retryError } = await supabase
              .from('tickets')
              .insert({
                call_id: callId,
                channel: 'voice',
                category: 'complaint',
                description,
                status: 'open',
                reference_no: retryRef,
                masked_ic: null,
              })
              .select('id')
              .single()

            if (!retryError && retryData) {
              ticketId = retryData.id as string
            } else {
              console.error(
                `[webhook/voice] Ticket insert retry failed for call_id=${callId}:`,
                retryError
              )
            }
          } else {
            console.error(
              `[webhook/voice] Ticket insert failed for call_id=${callId}:`,
              ticketError
            )
          }
        } else if (ticketData) {
          ticketId = ticketData.id as string
        }
      } catch (ticketErr) {
        console.error(
          `[webhook/voice] Ticket creation error for call_id=${callId}:`,
          ticketErr
        )
      }
    }

    // Step 13: Return success (per D-13)
    return Response.json(
      { success: true, call_id: callId, ticket_id: ticketId },
      { status: 200 }
    )
  } catch (err) {
    // per D-11, D-12: always 200 on DB/processing failure
    console.error(
      `[webhook/voice] Unhandled error for conversation_id=${conversationId}:`,
      err
    )
    return Response.json(
      { success: false, error: 'DB write failed', conversation_id: conversationId },
      { status: 200 }
    )
  }
}
