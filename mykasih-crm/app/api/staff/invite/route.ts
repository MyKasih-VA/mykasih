import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_ROLES = ['admin', 'mykasih', 'qmedia', 'supervisor'] as const
type StaffRole = typeof VALID_ROLES[number]

function isValidRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && (VALID_ROLES as readonly string[]).includes(role)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const body = await request.json() as { name?: unknown; email?: unknown; role?: unknown }
    const { name, email, role } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!isValidRole(role)) {
      return Response.json({ error: 'Invalid role. Must be one of: admin, mykasih, qmedia, supervisor' }, { status: 400 })
    }

    // Step 1: Invite user via Supabase Admin
    const adminClient = getAdminClient()
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { name: name.trim(), role },
    })

    if (inviteError) {
      return Response.json(
        { error: inviteError.message },
        { status: 500 }
      )
    }

    // Step 2: Insert into users table
    const { data, error: insertError } = await supabase
      .from('users')
      .insert({ email, name: name.trim(), role })
      .select()
      .single()

    if (insertError) {
      // Unique constraint violation — user already exists
      if (insertError.code === '23505') {
        return Response.json({ error: 'User with this email already exists' }, { status: 409 })
      }
      return Response.json(
        { error: 'Failed to create user record', detail: insertError.message },
        { status: 500 }
      )
    }

    return Response.json({ user: data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
