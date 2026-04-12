import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
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

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, last_login')
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json(
        { error: 'Failed to fetch staff', detail: error.message },
        { status: 500 }
      )
    }

    const users = (data ?? []).map(u => ({
      ...u,
      status: u.last_login ? 'active' : 'pending',
    }))

    return Response.json({ users })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
