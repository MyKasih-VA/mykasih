import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { score?: unknown }
    const score = body.score

    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'score must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('calls')
      .update({ csat_rating: score })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}
