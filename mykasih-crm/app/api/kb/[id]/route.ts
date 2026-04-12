import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // MUST await in Next.js 16

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      category,
      question_bm,
      question_en,
      answer_bm,
      answer_en,
      is_active,
    } = body as {
      category?: unknown
      question_bm?: unknown
      question_en?: unknown
      answer_bm?: unknown
      answer_en?: unknown
      is_active?: unknown
    }

    // Build partial update — only include provided fields
    const updates: Record<string, unknown> = {
      last_updated: new Date().toISOString(),
      updated_by: user.email ?? null,
    }

    if (typeof category === 'string' && category.trim() !== '') {
      updates.category = category.trim()
    }
    if (typeof question_bm === 'string') {
      updates.question_bm = question_bm.trim()
    }
    if (typeof question_en === 'string') {
      updates.question_en = question_en.trim()
    }
    if (typeof answer_bm === 'string') {
      updates.answer_bm = answer_bm.trim()
    }
    if (typeof answer_en === 'string') {
      updates.answer_en = answer_en.trim()
    }
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    const { data, error } = await supabase
      .from('kb_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: 'Failed to update KB entry', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ entry: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // MUST await in Next.js 16

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('kb_entries')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to delete KB entry', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
