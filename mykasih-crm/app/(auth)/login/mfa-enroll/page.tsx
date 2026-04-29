'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { t, type Language } from '@/lib/translations'

const DEFAULT_LANGUAGE: Language = 'en'

export default function MfaEnrollPage() {
  const router = useRouter()
  const lang = DEFAULT_LANGUAGE
  const codeInputRef = useRef<HTMLInputElement>(null)

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(true)

  useEffect(() => {
    startEnrollment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startEnrollment() {
    setEnrolling(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (enrollError || !data) {
        setError(t('mfa.enrollErrorStart', lang))
        setEnrolling(false)
        return
      }

      // Generate QR code data URL from the TOTP URI
      const qrUrl = await QRCode.toDataURL(data.totp.uri)
      setQrCodeDataUrl(qrUrl)
      setSecret(data.totp.secret)
      setFactorId(data.id)

      // Immediately create a challenge so QR + input are on same screen (no second round-trip)
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: data.id })

      if (challengeError || !challengeData) {
        setError(t('mfa.enrollErrorStart', lang))
        setEnrolling(false)
        return
      }

      setChallengeId(challengeData.id)
      setEnrolling(false)

      // Auto-focus TOTP input when QR is loaded
      setTimeout(() => {
        codeInputRef.current?.focus()
      }, 100)
    } catch {
      setError(t('mfa.enrollErrorStart', lang))
      setEnrolling(false)
    }
  }

  async function verifyEnrollment(e: React.FormEvent<HTMLFormElement>) {
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
        setError(t('mfa.enrollErrorCode', lang))
        setCode('')
        setLoading(false)
        return
      }

      // Session is now aal2 — redirect to dashboard
      router.push('/')
    } catch {
      setError(t('mfa.enrollErrorCode', lang))
      setCode('')
      setLoading(false)
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret)
    } catch {
      // Clipboard access denied — silently fail
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

        {/* MFA Enrollment card */}
        <div
          className="w-full mt-6 rounded-xl p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
        >
          {/* Heading */}
          <p
            className="text-base font-semibold text-center mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('mfa.enrollHeading', lang)}
          </p>

          {/* Instruction */}
          <p
            className="text-sm text-center mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('mfa.enrollInstruction', lang)}
          </p>

          {/* QR Code or skeleton */}
          <div className="flex justify-center mb-4">
            {enrolling || !qrCodeDataUrl ? (
              <div
                className="rounded-md animate-pulse"
                style={{
                  width: 180,
                  height: 180,
                  backgroundColor: 'var(--bg-border)',
                }}
                aria-label="Loading QR code..."
              />
            ) : (
              <div
                className="rounded-md p-2"
                style={{ backgroundColor: '#ffffff' }}
              >
                <img
                  src={qrCodeDataUrl}
                  alt="Scan this QR code with your authenticator app"
                  width={180}
                  height={180}
                />
              </div>
            )}
          </div>

          {/* Secret fallback */}
          {!enrolling && secret && (
            <div className="mb-4">
              <p
                className="text-xs mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('mfa.secretLabel', lang)}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-mono flex-1 break-all"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {secret}
                </span>
                <button
                  type="button"
                  onClick={copySecret}
                  aria-label={t('mfa.copySecret', lang)}
                  className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Recovery caveat */}
          <p
            className="text-xs mb-4"
            style={{ color: 'var(--status-yellow)' }}
          >
            {t('mfa.recoveryCaveat', lang)}
          </p>

          {/* TOTP input form */}
          <form onSubmit={verifyEnrollment} className="flex flex-col gap-4">
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
                disabled={loading || enrolling}
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
              disabled={loading || enrolling || code.length !== 6}
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
                  {t('mfa.enrollVerifying', lang)}
                </>
              ) : (
                t('mfa.enrollButton', lang)
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
        </div>
      </div>
    </main>
  )
}
