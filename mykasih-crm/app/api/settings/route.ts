export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const DEFAULTS: Record<string, string> = {
  agent_hours_start: '08:00',
  agent_hours_end: '17:00',
  notification_email: '',
  data_retention_days: '90',
}

const ALLOWED_KEYS = new Set(Object.keys(DEFAULTS))

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, userRecord: null, unauthorized: true, forbidden: false }
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.role !== 'admin') {
    return { supabase, user, userRecord, unauthorized: false, forbidden: true }
  }

  return { supabase, user, userRecord, unauthorized: false, forbidden: false }
}

export async function GET(_request: NextRequest) {
  try {
    const { supabase, unauthorized, forbidden } = await getAdminUser()

    if (unauthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (forbidden) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error) {
      return Response.json({ error: 'Failed to load settings', detail: error.message }, { status: 500 })
    }

    const result = {
      ...DEFAULTS,
      ...Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])),
    }

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, unauthorized, forbidden } = await getAdminUser()

    if (unauthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (forbidden) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as { settings?: Array<{ key: string; value: string }> }

    if (!body.settings || !Array.isArray(body.settings)) {
      return Response.json({ error: 'Invalid request body: settings array required' }, { status: 400 })
    }

    // Validate each key-value pair
    for (const { key, value } of body.settings) {
      if (!ALLOWED_KEYS.has(key)) {
        return Response.json({ error: `Unknown setting key: ${key}` }, { status: 400 })
      }

      if (key === 'agent_hours_start' || key === 'agent_hours_end') {
        if (!/^\d{2}:\d{2}$/.test(value)) {
          return Response.json(
            { error: `Invalid time format for ${key}: expected HH:MM (e.g. 08:00)` },
            { status: 400 }
          )
        }
      }

      if (key === 'notification_email' && value !== '') {
        if (!value.includes('@')) {
          return Response.json(
            { error: 'Invalid notification_email: must be a valid email address' },
            { status: 400 }
          )
        }
      }

      if (key === 'data_retention_days') {
        const parsed = parseInt(value, 10)
        if (isNaN(parsed) || parsed <= 0) {
          return Response.json(
            { error: 'Invalid data_retention_days: must be a positive integer' },
            { status: 400 }
          )
        }
      }
    }

    // Upsert each key-value pair
    for (const { key, value } of body.settings) {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

      if (error) {
        return Response.json({ error: `Failed to save ${key}`, detail: error.message }, { status: 500 })
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}
