import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ServiceStatus = 'ok' | 'error' | 'pending' | 'ready'

interface IntegrationStatusResponse {
  elevenlabs: ServiceStatus
  supabase: ServiceStatus
  n8n: ServiceStatus
  meta_wa: ServiceStatus
  anam_ai: ServiceStatus
  n8n_url: string | null
}

async function checkElevenLabs(): Promise<ServiceStatus> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID
  if (!apiKey || !agentId) return 'error'
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: { 'xi-api-key': apiKey },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

async function checkSupabase(): Promise<ServiceStatus> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
    return error ? 'error' : 'ok'
  } catch {
    return 'error'
  }
}

async function checkN8n(): Promise<ServiceStatus> {
  const baseUrl = process.env.N8N_BASE_URL
  if (!baseUrl) return 'pending'
  try {
    const res = await fetch(`${baseUrl}/healthz`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

async function checkMetaWA(): Promise<ServiceStatus> {
  const token = process.env.META_WA_ACCESS_TOKEN
  return token ? 'ok' : 'pending'
}

async function checkAnamAI(): Promise<ServiceStatus> {
  return 'ready'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [elevenlabs, supabaseStatus, n8nStatus, meta_wa, anam_ai] =
      await Promise.allSettled([
        checkElevenLabs(),
        checkSupabase(),
        checkN8n(),
        checkMetaWA(),
        checkAnamAI(),
      ])

    const result: IntegrationStatusResponse = {
      elevenlabs:
        elevenlabs.status === 'fulfilled' ? elevenlabs.value : 'error',
      supabase:
        supabaseStatus.status === 'fulfilled' ? supabaseStatus.value : 'error',
      n8n: n8nStatus.status === 'fulfilled' ? n8nStatus.value : 'error',
      meta_wa: meta_wa.status === 'fulfilled' ? meta_wa.value : 'error',
      anam_ai: anam_ai.status === 'fulfilled' ? anam_ai.value : 'ready',
      n8n_url: process.env.N8N_BASE_URL ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[integrations/status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
