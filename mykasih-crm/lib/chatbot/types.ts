export type Intent = 'faq' | 'balance_check' | 'merchant_lookup' | 'complaint' | 'unknown'
export type Language = 'bm' | 'en'

export interface Classification {
  intent: Intent
  language: Language
  confidence: 'high' | 'low'
}

export interface Session {
  id: string
  wa_phone: string
  wa_message_id: string | null
  intent: Intent | null
  step: number
  collected_data: Record<string, unknown>
  language: Language
  created_at: string
  expires_at: string
}

export interface ChatbotRequest {
  waPhone: string
  message: string
  wamid: string
  contactName: string
  isTest?: boolean
}

export interface HandlerResponse {
  text: string
  sessionComplete?: boolean
  callId?: string
  ticketRef?: string
}

// Meta WA incoming payload types
export interface MetaWATextPayload {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'interactive'
          text?: { body: string }
          interactive?: {
            type: 'button_reply' | 'list_reply'
            button_reply?: { id: string; title: string }
            list_reply?: { id: string; title: string; description?: string }
          }
        }>
        statuses?: Array<{ id: string; status: string; timestamp: string }>
      }
      field: 'messages'
    }>
  }>
}
