/**
 * TypeScript interfaces for ElevenLabs Conversational AI webhook payloads.
 * Source: elevenlabs.io/docs/api-reference/conversations/get
 * (webhook payload matches the GET conversation response structure)
 */

export interface ElevenLabsTranscriptTurn {
  role: 'agent' | 'user'
  message: string | null
  time_in_call_secs: number
  tool_calls: unknown[] | null
  tool_results: unknown[] | null
  feedback: unknown | null
}

export interface ElevenLabsDataCollectionResult {
  data_collection_id: string
  value: string | null
  json_schema: unknown
  rationale: string | null
}

export interface ElevenLabsWebhookPayload {
  type: 'post_call_transcription' | 'post_call_audio' | 'call_initiation_failure'
  event_timestamp: number
  data: {
    agent_id: string
    conversation_id: string
    status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed'
    user_id: string | null
    transcript: ElevenLabsTranscriptTurn[]
    metadata: {
      start_time_unix_secs: number
      call_duration_secs: number
      cost: number | null
      termination_reason: string
    }
    analysis: {
      call_successful: 'success' | 'failure' | 'unknown'
      transcript_summary: string
      data_collection_results: Record<string, ElevenLabsDataCollectionResult>
      evaluation_criteria_results: Record<string, unknown>
    }
    conversation_initiation_client_data: unknown | null
    has_audio: boolean
    has_user_audio: boolean
    has_response_audio: boolean
  }
}
