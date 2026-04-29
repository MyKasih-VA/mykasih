'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { t, type Language } from '@/lib/translations'

const DEFAULT_LANGUAGE: Language = 'en'

export default function MfaChallengePage() {
  const router = useRouter()
  const lang = DEFAULT_LANGUAGE
  const codeInputRef = useRef<HTMLInputElement>(null)

  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    initChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function initChallenge() {
    setInitializing(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        // No MFA factor enrolled — abnormal state, redirect to login
        router.push('/login')
        return
      }

      setFactorId(totpFactor.id)

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id })

      if (challengeError || !challengeData) {
        setError(t('mfa.challengeErrorCode', lang))
        setInitializing(false)
        return
      }

      setChallengeId(challengeData.id)
      setInitializing(false)

      // Auto-focus input after challenge is ready
      setTimeout(() => {
        codeInputRef.current?.focus()
      }, 100)
    } catch {
      setError(t('mfa.challengeErrorCode', lang))
      setInitializing(false)
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!factorId || !challengeId || code.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      })

      if (verifyError) {
        setError(t('mfa.challengeErrorCode', lang))
        setCode('')
        setLoading(false)
        return
      }

      // Session upgrades to aal2 — redirect to dashboard
      router.push('/')
    } catch {
      setError(t('mfa.challengeErrorCode', lang))
      setCode('')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="flex flex-col items-center w-full max-w-[400px] px-4">
        {/* Logo */}
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

        {/* MFA Challenge card */}
        <div
          className="w-full mt-6 rounded-xl p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
        >
          {initializing ? (
            /* Spinner while listFactors + challenge complete */
            <div className="flex justify-center items-center py-8">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <>
              {/* Heading */}
              <p
                className="text-base font-semibold text-center mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('mfa.challengeHeading', lang)}
              </p>

              {/* Instruction */}
              <p
                className="text-sm text-center mb-6"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('mfa.challengeInstruction', lang)}
              </p>

              {/* TOTP input form */}
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="totp-code"
                    className="text-xs block mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('mfa.codePlaceholder', lang)}
                  </label>
                  <input
                    id="totp-code"
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                    className="w-full h-11 rounded-md px-3 text-center text-lg tracking-widest outline-none focus:outline-2 focus:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--bg-border)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      outlineColor: 'var(--accent-teal)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  aria-busy={loading}
                  className="w-full h-11 rounded-md text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('mfa.challengeVerifying', lang)}
                    </>
                  ) : (
                    t('mfa.challengeButton', lang)
                  )}
                </button>

                {error && (
                  <p
                    className="text-xs mt-1"
                    role="alert"
                    style={{ color: 'var(--status-red)' }}
                  >
                    {error}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
