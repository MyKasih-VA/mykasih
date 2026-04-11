import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST() {
  // Guard 1: Admin role only — validate via Supabase Auth
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRecord?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden — admin only' },
        { status: 403 }
      )
    }

    // Guard 2: Idempotency — if merchants already exist, return 409
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count } = await serviceClient
      .from('merchants')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Already seeded', count },
        { status: 409 }
      )
    }

    // Read merchants.json from project root (one level up from mykasih-crm/)
    const startTime = Date.now()
    const filePath = join(process.cwd(), '..', 'merchants.json')
    const raw = await readFile(filePath, 'utf-8')
    const merchants = JSON.parse(raw) as Array<{
      chain: string
      outlet_name: string
      state: string
      city: string
      postcode: string
      address: string
    }>

    // Guard 3: Batch insert in chunks of 500 to avoid Supabase payload limits
    const CHUNK_SIZE = 500
    let inserted = 0

    for (let i = 0; i < merchants.length; i += CHUNK_SIZE) {
      const chunk = merchants.slice(i, i + CHUNK_SIZE)
      const { error: insertError } = await serviceClient
        .from('merchants')
        .insert(chunk)

      if (insertError) {
        return NextResponse.json(
          {
            error: `Insert failed at chunk ${Math.floor(i / CHUNK_SIZE)}`,
            detail: insertError.message,
          },
          { status: 500 }
        )
      }
      inserted += chunk.length
    }

    const durationMs = Date.now() - startTime

    // Guard 4: Return insert summary
    return NextResponse.json({
      inserted,
      skipped: 0,
      duration_ms: durationMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
