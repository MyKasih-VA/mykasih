import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Session } from './types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getActiveSession(waPhone: string): Promise<Session | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('wa_phone', waPhone)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data as Session | null) ?? null
}

export async function createSession(waPhone: string, language: 'bm' | 'en'): Promise<Session> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({ wa_phone: waPhone, language, step: 0, collected_data: {} })
    .select()
    .single()
  if (error || !data) throw new Error(`Failed to create session: ${error?.message}`)
  return data as Session
}

export async function updateSession(
  id: string,
  updates: { intent?: string; step?: number; collected_data?: Record<string, unknown> }
): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from('sessions').update(updates).eq('id', id)
  if (error) throw new Error(`Failed to update session ${id}: ${error.message}`)
}

export async function expireSession(id: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('sessions')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Failed to expire session ${id}: ${error.message}`)
}
