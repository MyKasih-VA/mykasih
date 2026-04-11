import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const VALID_STATUSES = ['open', 'in_progress', 'resolved'] as const
type TicketStatus = typeof VALID_STATUSES[number]

interface TicketUpdateBody {
  status?: TicketStatus
  assigned_to?: string | null
}

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

    // Parse request body
    const body = (await request.json()) as TicketUpdateBody

    // Validate status if provided
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return Response.json(
        {
          error: 'Invalid status',
          valid_values: VALID_STATUSES,
        },
        { status: 400 }
      )
    }

    // Build update object — only include provided fields
    const updateFields: Record<string, string | null> = {}
    if (body.status !== undefined) {
      updateFields.status = body.status
    }
    if (body.assigned_to !== undefined) {
      updateFields.assigned_to = body.assigned_to
    }

    if (Object.keys(updateFields).length === 0) {
      return Response.json(
        { error: 'No fields to update. Provide status and/or assigned_to.' },
        { status: 400 }
      )
    }

    // Add updated_at timestamp
    updateFields.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('tickets')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ error: 'Ticket not found' }, { status: 404 })
      }
      return Response.json(
        { error: 'Failed to update ticket', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
