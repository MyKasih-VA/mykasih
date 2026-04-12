export const runtime = 'nodejs'

import { readFileSync } from 'fs'
import { join } from 'path'

// ---------- Types ----------

interface SimulateRequest {
  message: string
  senderId: string
  isTest: boolean
  history?: Array<{ role: 'user' | 'bot'; content: string }>
}

type Intent =
  | 'balance_check'
  | 'merchant_lookup'
  | 'faq'
  | 'complaint'
  | 'registration'
  | 'eligibility'
  | 'unknown'

interface Merchant {
  chain: string
  outlet_name: string
  state: string
  city: string
  postcode: string
  address: string
}

interface SimulateResponse {
  status: 'ok'
  reply: string
  intent: Intent
}

// ---------- Merchant data (loaded once) ----------

let merchantsCache: Merchant[] | null = null

function loadMerchants(): Merchant[] {
  if (merchantsCache) return merchantsCache
  try {
    const filePath = join(process.cwd(), '..', 'merchants.json')
    const raw = readFileSync(filePath, 'utf-8')
    merchantsCache = JSON.parse(raw) as Merchant[]
    return merchantsCache
  } catch (err) {
    console.error('[chatbot/simulate] Failed to load merchants.json:', err)
    return []
  }
}

// ---------- Intent classification ----------

function classifyIntent(message: string, history?: SimulateRequest['history']): Intent {
  const lower = message.toLowerCase().trim()

  // Check if we're mid-flow (history has a locked intent)
  if (history && history.length > 0) {
    const lastBotMsg = [...history].reverse().find((m) => m.role === 'bot')
    if (lastBotMsg) {
      const botLower = lastBotMsg.content.toLowerCase()
      if (botLower.includes('nombor ic') || botLower.includes('semakan baki')) return 'balance_check'
      if (botLower.includes('poskod') || botLower.includes('kedai berdekatan')) return 'merchant_lookup'
      if (botLower.includes('aduan') || botLower.includes('nama penuh')) return 'complaint'
    }
  }

  // Keyword matching
  if (/\b(baki|balance|kredit|credit)\b/i.test(lower)) return 'balance_check'
  if (/\b(kedai|merchant|shop|store|speedmart|econsave)\b/i.test(lower)) return 'merchant_lookup'
  if (/\b(aduan|complaint|masalah|problem)\b/i.test(lower)) return 'complaint'
  if (/\b(daftar|register|pendaftaran)\b/i.test(lower)) return 'registration'
  if (/\b(layak|eligible|kelayakan|eligibility|syarat)\b/i.test(lower)) return 'eligibility'

  return 'faq'
}

// ---------- IC pattern helpers ----------

const IC_PATTERN_DASHED = /^\d{6}-\d{2}-\d{4}$/
const IC_PATTERN_PLAIN = /^\d{12}$/

function looksLikeIC(text: string): boolean {
  const trimmed = text.trim()
  return IC_PATTERN_DASHED.test(trimmed) || IC_PATTERN_PLAIN.test(trimmed)
}

function maskIC(ic: string): string {
  const digits = ic.replace(/-/g, '')
  if (digits.length !== 12) return '******-**-****'
  return `${digits.slice(0, 6)}-**-****`
}

// ---------- Postcode helper ----------

function looksLikePostcode(text: string): boolean {
  return /^\d{5}$/.test(text.trim())
}

// ---------- Flow handlers ----------

function handleBalanceCheck(
  message: string,
  history: SimulateRequest['history']
): string {
  // Check if user just sent an IC number
  if (looksLikeIC(message)) {
    const masked = maskIC(message)
    return (
      `Maklumat akaun MyKasih anda:\n\n` +
      `👤 Nama: Ahmad bin Ibrahim\n` +
      `🪪 IC: ${masked}\n` +
      `💳 Baki: RM85.00\n` +
      `📅 Tamat: 31 Disember 2026\n` +
      `🏪 Kedai terdekat: 99 Speedmart\n\n` +
      `Baki anda boleh digunakan di mana-mana kedai MyKasih yang berdaftar. Ada lagi yang boleh saya bantu?`
    )
  }

  // Check if IC was already provided earlier in history
  const hasIC = history?.some((m) => m.role === 'user' && looksLikeIC(m.content))
  if (hasIC) {
    return 'Maklumat baki anda sudah dipaparkan. Ada lagi yang boleh saya bantu?'
  }

  // Ask for IC
  return 'Untuk semakan baki, sila berikan nombor IC anda (contoh: 880512-10-5234)'
}

function handleMerchantLookup(
  message: string,
  history: SimulateRequest['history']
): string {
  // Check if user sent a postcode
  if (looksLikePostcode(message)) {
    const postcode = message.trim()
    const merchants = loadMerchants()
    const prefix3 = postcode.slice(0, 3)

    // Exact match first, then prefix match
    let matches = merchants.filter((m) => m.postcode === postcode)
    if (matches.length === 0) {
      matches = merchants.filter((m) => m.postcode.startsWith(prefix3))
    }

    if (matches.length === 0) {
      return `Maaf, tiada kedai MyKasih dijumpai di kawasan poskod ${postcode}. Cuba poskod berdekatan atau hubungi 1-800-88-2638.`
    }

    const top5 = matches.slice(0, 5)
    const list = top5
      .map((m, i) => `${i + 1}. ${m.outlet_name}\n   📍 ${m.address}`)
      .join('\n\n')

    return `🏪 Kedai berdekatan poskod ${postcode}:\n\n${list}\n\nAda lagi yang boleh saya bantu?`
  }

  // Check if postcode was already given in history
  const hasPostcode = history?.some(
    (m) => m.role === 'user' && looksLikePostcode(m.content)
  )
  if (hasPostcode) {
    return 'Senarai kedai sudah dipaparkan. Sila nyatakan poskod lain jika ingin cari semula, atau ada lagi yang boleh saya bantu?'
  }

  // Ask for postcode
  return 'Sila berikan poskod kawasan anda untuk cari kedai berdekatan (contoh: 81300)'
}

function handleComplaint(
  _message: string,
  history: SimulateRequest['history']
): string {
  // Count user messages that were part of the complaint flow
  const complaintMessages =
    history?.filter((m) => m.role === 'user').length ?? 0

  if (complaintMessages >= 2) {
    const refNum = String(Math.floor(10000 + Math.random() * 90000))
    return (
      `Terima kasih. Aduan anda telah direkodkan.\n\n` +
      `📋 Nombor rujukan: TKT-2026-${refNum}\n` +
      `⏰ Jangkamasa: 3-5 hari bekerja\n\n` +
      `Kami akan hubungi anda melalui WhatsApp. Ada lagi yang boleh saya bantu?`
    )
  }

  return (
    `Untuk merekod aduan anda, sila berikan maklumat berikut:\n\n` +
    `1. Nama penuh\n` +
    `2. Nombor IC\n` +
    `3. Penerangan masalah\n` +
    `4. Tarikh kejadian\n\n` +
    `Sila nyatakan nama penuh anda dahulu.`
  )
}

function handleRegistration(): string {
  return (
    `Untuk mendaftar program MyKasih SARA:\n\n` +
    `1. Layari mykasih.com.my\n` +
    `2. Atau lawat pejabat Lembaga Zakat terdekat\n` +
    `3. Bawa IC asal dan salinan\n` +
    `4. Bukti pendapatan B40\n\n` +
    `📞 Hotline: 1-800-88-2638\n` +
    `⏰ Waktu: Isnin–Jumaat, 9pg–6ptg\n\n` +
    `Ada lagi yang boleh saya bantu?`
  )
}

function handleEligibility(): string {
  return (
    `Syarat kelayakan program SARA MyKasih:\n\n` +
    `✅ Warganegara Malaysia\n` +
    `✅ Isi rumah B40 (pendapatan < RM4,849/bulan)\n` +
    `✅ Berumur 18 tahun ke atas\n` +
    `✅ Tidak menerima bantuan serupa\n\n` +
    `📋 Dokumen diperlukan:\n` +
    `- IC asal & salinan\n` +
    `- Slip gaji / surat pengesahan pendapatan\n\n` +
    `Untuk semak kelayakan, sila berikan nombor IC anda.`
  )
}

function handleFAQ(): string {
  return (
    `Terima kasih atas soalan anda. Berikut beberapa maklumat berguna:\n\n` +
    `📞 Hotline: 1-800-88-2638\n` +
    `⏰ Waktu operasi: Isnin–Jumaat, 9pg–6ptg\n` +
    `🌐 Laman web: mykasih.com.my\n` +
    `📱 WhatsApp: 011-2345 6789\n\n` +
    `Untuk bantuan lanjut, sila nyatakan soalan anda dengan lebih spesifik. Ada lagi yang boleh saya bantu?`
  )
}

// ---------- Main handler ----------

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SimulateRequest
    const { message, senderId, isTest, history } = body

    if (!message || !senderId) {
      return Response.json(
        { error: 'Missing required fields: message, senderId' },
        { status: 400 }
      )
    }

    if (typeof isTest !== 'boolean') {
      return Response.json(
        { error: 'isTest must be a boolean' },
        { status: 400 }
      )
    }

    // Classify intent (uses history for mid-flow context)
    const intent = classifyIntent(message, history)

    // Dispatch to handler
    let reply: string
    switch (intent) {
      case 'balance_check':
        reply = handleBalanceCheck(message, history)
        break
      case 'merchant_lookup':
        reply = handleMerchantLookup(message, history)
        break
      case 'complaint':
        reply = handleComplaint(message, history)
        break
      case 'registration':
        reply = handleRegistration()
        break
      case 'eligibility':
        reply = handleEligibility()
        break
      case 'faq':
      default:
        reply = handleFAQ()
        break
    }

    const response: SimulateResponse = {
      status: 'ok',
      reply,
      intent,
    }

    return Response.json(response)
  } catch (err) {
    console.error('[chatbot/simulate] Unhandled error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
