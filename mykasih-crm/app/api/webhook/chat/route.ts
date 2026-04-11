export const runtime = 'nodejs'

import type { MetaWATextPayload } from '@/lib/chatbot/types'

// ---------------------------------------------------------------------------
// GET — Meta webhook verification (CHAT-01)
// Meta sends GET with hub.mode, hub.verify_token, hub.challenge
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WA_VERIFY_TOKEN) {
    // Return challenge as plain text (not JSON) — Meta expects raw challenge value
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new Response('Forbidden', { status: 403 })
}

// ---------------------------------------------------------------------------
// POST — Receive incoming WA messages (CHAT-02)
// Validates n8n webhook secret, extracts text/interactive messages,
// forwards to /api/chatbot/message, always returns 200 to Meta.
// ---------------------------------------------------------------------------

function extractMessage(payload: MetaWATextPayload): {
  from: string
  wamid: string
  body: string
  contactName: string
} | null {
  const value = payload.entry?.[0]?.changes?.[0]?.value
  const msg = value?.messages?.[0]
  if (!msg) return null

  let body = ''
  if (msg.type === 'text') {
    body = msg.text?.body ?? ''
  } else if (msg.type === 'interactive') {
    const interactive = msg.interactive
    if (interactive?.type === 'list_reply') {
      body = interactive.list_reply?.id ?? interactive.list_reply?.title ?? ''
    } else if (interactive?.type === 'button_reply') {
      body = interactive.button_reply?.id ?? interactive.button_reply?.title ?? ''
    }
  }

  const contactName = value?.contacts?.[0]?.profile?.name ?? ''

  return {
    from: msg.from,
    wamid: msg.id,
    body,
    contactName,
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Validate n8n webhook secret (if configured)
    const n8nSecret = process.env.N8N_WEBHOOK_SECRET
    if (n8nSecret) {
      const headerSecret = request.headers.get('x-n8n-webhook-secret')
      if (headerSecret !== n8nSecret) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload = (await request.json()) as MetaWATextPayload
    const extracted = extractMessage(payload)

    // Status-only events (delivered, read) have no messages — return 200 early
    if (!extracted) {
      return Response.json({ status: 'no_message' }, { status: 200 })
    }

    // Forward to chatbot message handler
    const origin = new URL(request.url).origin
    const chatbotResponse = await fetch(`${origin}/api/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-webhook-secret': n8nSecret ?? '',
      },
      body: JSON.stringify({
        waPhone: extracted.from,
        message: extracted.body,
        wamid: extracted.wamid,
        contactName: extracted.contactName,
        isTest: false,
      }),
    })

    const result = (await chatbotResponse.json()) as Record<string, unknown>
    return Response.json({ status: 'ok', chatbot: result }, { status: 200 })
  } catch (err) {
    console.error('[webhook/chat] Error:', err)
    // Always return 200 to Meta — non-200 causes Meta to retry
    return Response.json({ error: 'Internal error' }, { status: 200 })
  }
}
