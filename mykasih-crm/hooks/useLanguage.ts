'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Language } from '@/lib/translations'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'mykasih-language'
const DEFAULT_LANGUAGE: Language = 'en'

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored === 'en' || stored === 'bm') {
      setLanguageState(stored)
    }
    setIsLoaded(true)
  }, [])

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)

    // Per DASH-04: sync language preference to users.language in Supabase
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ language: lang }).eq('id', user.id)
      }
    } catch {
      // Supabase sync is best-effort — localStorage is the primary source
      // If user is not authenticated (e.g. login page), this silently fails
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'bm' : 'en')
  }, [language, setLanguage])

  return { language, setLanguage, toggleLanguage, isLoaded }
}
