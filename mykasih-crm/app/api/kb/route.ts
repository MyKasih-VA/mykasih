import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('kb_entries')
      .select('*')
      .order('last_updated', { ascending: false })

    if (error) {
      return Response.json(
        { error: 'Failed to fetch KB entries', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ entries: data ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate required text fields
    if (
      typeof category !== 'string' || category.trim() === '' ||
      typeof question_bm !== 'string' || question_bm.trim() === '' ||
      typeof question_en !== 'string' || question_en.trim() === '' ||
      typeof answer_bm !== 'string' || answer_bm.trim() === '' ||
      typeof answer_en !== 'string' || answer_en.trim() === ''
    ) {
      return Response.json(
        { error: 'All fields (category, question_bm, question_en, answer_bm, answer_en) are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('kb_entries')
      .insert({
        category: category.trim(),
        question_bm: question_bm.trim(),
        question_en: question_en.trim(),
        answer_bm: answer_bm.trim(),
        answer_en: answer_en.trim(),
        is_active: typeof is_active === 'boolean' ? is_active : true,
        updated_by: user.email ?? null,
      })
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: 'Failed to create KB entry', detail: error.message },
        { status: 400 }
      )
    }

    return Response.json({ entry: data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
