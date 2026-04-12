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

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
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

    const { id } = await context.params
    const body = await request.json() as { role?: unknown }
    const { role } = body

    if (!isValidRole(role)) {
      return Response.json({ error: 'Invalid role. Must be one of: admin, mykasih, qmedia, supervisor' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: 'Failed to update role', detail: error.message },
        { status: 500 }
      )
    }

    return Response.json({ user: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const { id } = await context.params

    // Step 1: Get user email from users table
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .single()

    if (fetchError || !targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const userEmail = targetUser.email as string

    // Step 2: Find auth user by email and delete from Supabase Auth
    const adminClient = getAdminClient()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === userEmail)
    if (authUser) {
      await adminClient.auth.admin.deleteUser(authUser.id)
    }

    // Step 3: Delete from users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return Response.json(
        { error: 'Failed to delete user', detail: deleteError.message },
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
