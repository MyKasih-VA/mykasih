'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { t, type Language } from '@/lib/translations'

const DEFAULT_LANGUAGE: Language = 'en'

export default function LoginPage() {
  const router = useRouter()
  const lang = DEFAULT_LANGUAGE

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.name === 'AuthApiError') {
          setError(t('login.invalidCredentials', lang))
        } else {
          setError(t('login.serverError', lang))
        }
        setLoading(false)
        return
      }

      // Role-based redirect after successful sign-in
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = userData?.role ?? null

      // Admin MFA gate (SEC-05, per D-16, D-17)
      if (role === 'admin') {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        const { currentLevel, nextLevel } = aalData ?? { currentLevel: undefined, nextLevel: undefined }

        if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
          // MFA enrolled but not yet verified this session -- show challenge
          router.push('/login/mfa-challenge')
          return
        }

        if (nextLevel === 'aal1' || !nextLevel) {
          // MFA not yet enrolled -- force enrollment
          router.push('/login/mfa-enroll')
          return
        }
        // If currentLevel === 'aal2' -- MFA already verified, proceed to redirect
      }

      // Non-admin users and admin with aal2 proceed to role-based redirect
      if (role === 'qmedia') {
        router.push('/analytics')
      } else if (role === 'supervisor') {
        router.push('/live-monitor')
      } else {
        // admin, mykasih, and any unknown role go to dashboard home
        router.push('/')
      }
    } catch {
      setError(t('login.serverError', lang))
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="flex flex-col items-center w-full max-w-[400px] px-4">
        {/* Logo above card */}
        <img
          src="https://mykasih.com.my/wp-content/uploads/2025/05/MyKasih-logo.png"
          alt="MyKasih Foundation"
          width={140}
          className="mb-4"
        />

        {/* App name and subtitle */}
        <p
          className="text-base font-semibold text-center"
          style={{ color: 'var(--text-primary)', marginTop: '16px' }}
        >
          MyKasih Command Centre
        </p>
        <p
          className="text-xs text-center mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          AI Helpline CRM v1.0
        </p>

        {/* Sign-in card */}
        <div
          className="w-full mt-6 rounded-xl p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email input */}
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder', lang)}
              required
              disabled={loading}
              className="w-full h-11 rounded-md px-3 text-sm outline-none focus:outline-2 focus:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--bg-border)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outlineColor: 'var(--accent-teal)',
              }}
            />

            {/* Password input */}
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder', lang)}
              required
              disabled={loading}
              className="w-full h-11 rounded-md px-3 text-sm outline-none focus:outline-2 focus:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--bg-border)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outlineColor: 'var(--accent-teal)',
              }}
            />

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-md text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('login.signingIn', lang)}
                </>
              ) : (
                t('login.signIn', lang)
              )}
            </button>

            {/* Error message (AUTH-03) */}
            {error && (
              <p
                className="text-xs mt-2"
                role="alert"
                style={{ color: 'var(--status-red)' }}
              >
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
