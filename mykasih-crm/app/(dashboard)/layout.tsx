import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin MFA enforcement — SEC-05 defense-in-depth (D-13)
  // Prevents an admin with aal1 from accessing dashboard routes via direct URL,
  // even if they bypassed the login MFA gate.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'admin') {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        redirect('/login/mfa-challenge')
      }
    }
  }

  return <DashboardShell>{children}</DashboardShell>
}
