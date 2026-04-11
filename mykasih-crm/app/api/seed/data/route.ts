import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// KB Seed Data — 5 hardcoded Q&A pairs (BM + EN) per D-11
// ---------------------------------------------------------------------------
const KB_SEED_DATA = [
  {
    category: 'eligibility',
    question_en: 'Who is eligible for SARA?',
    answer_en:
      'Malaysian citizens aged 21 and above with a household income of RM2,500 and below per month are eligible for SARA. You must have a valid MyKad.',
    question_bm: 'Siapa yang layak menerima SARA?',
    answer_bm:
      'Warganegara Malaysia berumur 21 tahun ke atas dengan pendapatan isi rumah RM2,500 dan ke bawah sebulan layak menerima SARA. Anda mesti memiliki MyKad yang sah.',
  },
  {
    category: 'balance_check',
    question_en: 'How do I check my SARA balance?',
    answer_en:
      'You can check your SARA balance at any participating merchant by presenting your MyKad at the counter. The cashier will tap your card and show your remaining balance.',
    question_bm: 'Bagaimana saya menyemak baki SARA?',
    answer_bm:
      'Anda boleh menyemak baki SARA di mana-mana kedai yang mengambil bahagian dengan menunjukkan MyKad di kaunter. Juruwang akan mengetuk kad anda dan menunjukkan baki.',
  },
  {
    category: 'merchant_lookup',
    question_en: 'Where can I use my SARA credit?',
    answer_en:
      'SARA credit can be used at over 10,000 participating outlets including 99 Speedmart, Econsave, KK Super Mart, and other approved retailers nationwide.',
    question_bm: 'Di mana saya boleh guna kredit SARA?',
    answer_bm:
      'Kredit SARA boleh digunakan di lebih 10,000 kedai termasuk 99 Speedmart, Econsave, KK Super Mart, dan peruncit lain yang diluluskan di seluruh negara.',
  },
  {
    category: 'complaint',
    question_en: 'How do I file a complaint about SARA?',
    answer_en:
      'You can file a complaint by calling our helpline or sending a WhatsApp message. We will create a ticket and track your issue until it is resolved.',
    question_bm: 'Bagaimana saya membuat aduan tentang SARA?',
    answer_bm:
      'Anda boleh membuat aduan dengan menghubungi talian bantuan kami atau menghantar mesej WhatsApp. Kami akan membuat tiket dan menjejaki isu anda sehingga selesai.',
  },
  {
    category: 'faq',
    question_en: 'Can I transfer my SARA credit to someone else?',
    answer_en:
      'No, SARA credit is personal and non-transferable. Each individual must use their own MyKad at the counter. Credit cannot be shared, delegated, or transferred.',
    question_bm: 'Bolehkah saya pindahkan kredit SARA kepada orang lain?',
    answer_bm:
      'Tidak, kredit SARA adalah peribadi dan tidak boleh dipindahkan. Setiap individu mesti menggunakan MyKad sendiri di kaunter. Kredit tidak boleh dikongsi atau diwakilkan.',
  },
]

// ---------------------------------------------------------------------------
// Helper generators
// ---------------------------------------------------------------------------
const DEMO_NAMES = [
  'DEMO_Siti Aminah',
  'DEMO_Ahmad Bin Hassan',
  'DEMO_Rajesh Kumar',
  'DEMO_Mei Ling Tan',
  'DEMO_Nurul Huda',
  'DEMO_Mohd Faizal',
  'DEMO_Kavitha Pillai',
  'DEMO_Lim Wei Xian',
  'DEMO_Zulaikha Binti Omar',
  'DEMO_Rajan Nair',
  'DEMO_Fatimah Zahra',
  'DEMO_Chong Boon Kiat',
  'DEMO_Hasnah Ibrahim',
  'DEMO_Suresh Babu',
  'DEMO_Norashikin Md Isa',
]

const LOCATIONS = [
  'Kuala Lumpur',
  'Johor Bahru',
  'Ipoh',
  'Penang',
  'Melaka',
  'Kota Kinabalu',
  'Kuching',
  'Shah Alam',
  'Petaling Jaya',
  'Subang Jaya',
]

const POSTCODES = [
  '50000',
  '80000',
  '30000',
  '10000',
  '75000',
  '88000',
  '93000',
  '40150',
  '47500',
  '47600',
]

const CATEGORIES = [
  'eligibility',
  'eligibility',
  'eligibility',
  'faq',
  'faq',
  'faq',
  'registration',
  'complaint',
  'complaint',
  'merchant_lookup',
  'merchant_lookup',
  'balance_check',
] as const

const OUTCOMES = [
  'resolved',
  'resolved',
  'resolved',
  'resolved',
  'resolved',
  'escalated',
  'escalated',
  'callback',
  'callback',
  'abandoned',
  'abandoned',
  'abandoned',
] as const

const LANGUAGES = ['bm', 'bm', 'bm', 'bm', 'bm', 'bm', 'en', 'en', 'en', 'mixed'] as const

const BOT_MESSAGES_EN = [
  'Hello! I am SARA, your AI assistant. How can I help you today?',
  'Thank you for contacting us. I can help you check your SARA balance, find nearby merchants, or file a complaint.',
  'I understand. Let me look into that for you.',
  'Based on the information you provided, I can confirm that you are eligible for SARA assistance.',
  'Your SARA credit balance is RM100. You can use it at any participating merchant.',
  'I have found 5 merchants near your postcode. The nearest is 99 Speedmart at 0.3 km.',
  'Your complaint has been recorded. Reference number: TKT-2026-00001.',
  'Is there anything else I can help you with today?',
  'Thank you for using our service. Have a great day!',
]

const USER_MESSAGES_EN = [
  'I need help with my SARA credit.',
  'How do I check my balance?',
  'Where can I use my SARA credit?',
  'I have a problem with my application.',
  'The merchant said my card was declined.',
  'I want to make a complaint.',
  'My IC number is correct but the system says I am not eligible.',
  'Thank you.',
]

const BOT_MESSAGES_BM = [
  'Selamat datang! Saya SARA, pembantu AI anda. Boleh saya bantu anda hari ini?',
  'Terima kasih kerana menghubungi kami. Saya boleh membantu semak baki SARA, cari kedai berdekatan, atau buat aduan.',
  'Saya faham. Biar saya semak untuk anda.',
  'Berdasarkan maklumat yang anda berikan, anda layak untuk bantuan SARA.',
  'Baki kredit SARA anda ialah RM100. Anda boleh gunakannya di mana-mana kedai yang menyertai.',
  'Saya telah jumpa 5 kedai berhampiran poskod anda. Yang paling dekat ialah 99 Speedmart pada jarak 0.3 km.',
  'Aduan anda telah direkodkan. Nombor rujukan: TKT-2026-00001.',
  'Ada lagi yang boleh saya bantu hari ini?',
  'Terima kasih kerana menggunakan perkhidmatan kami. Selamat sejahtera!',
]

const USER_MESSAGES_BM = [
  'Saya perlukan bantuan mengenai kredit SARA saya.',
  'Macam mana nak semak baki?',
  'Di mana boleh guna kredit SARA?',
  'Ada masalah dengan permohonan saya.',
  'Peniaga kata kad saya ditolak.',
  'Saya nak buat aduan.',
  'IC saya betul tapi sistem kata saya tidak layak.',
  'Terima kasih.',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randInt(7, 22), randInt(0, 59), randInt(0, 59))
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// POST /api/seed/data
// ---------------------------------------------------------------------------
export async function POST() {
  // Guard 1: Auth + admin role
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRecord?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden — admin only' },
        { status: 403 }
      )
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Guard 2: Idempotency — if DEMO_ rows exist, return 409
    const { count: existingCount } = await serviceClient
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .like('caller_name', 'DEMO_%')

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        { error: 'Already seeded', count: existingCount },
        { status: 409 }
      )
    }

    // -------------------------------------------------------------------------
    // 1. Seed ~120 calls with weighted distribution over last 30 days
    // -------------------------------------------------------------------------
    const callRows: Array<{
      channel: string
      caller_name: string
      wa_number: string
      location: string
      postcode: string
      language: string
      duration: number | null
      message_count: number | null
      category: string
      outcome: string
      csat_rating: number
      is_test: boolean
      timestamp: string
    }> = []

    const TOTAL_CALLS = 120

    for (let i = 0; i < TOTAL_CALLS; i++) {
      const isVoice = Math.random() < 0.6
      const lang = pick(LANGUAGES)
      // More volume in recent days — exponential weight toward day 0
      const daysBack = Math.floor(Math.pow(Math.random(), 1.5) * 30)

      callRows.push({
        channel: isVoice ? 'voice' : 'chat',
        caller_name: pick(DEMO_NAMES),
        wa_number: `601${randInt(1, 9)}-${randInt(1000000, 9999999)}`,
        location: pick(LOCATIONS),
        postcode: pick(POSTCODES),
        language: lang,
        duration: isVoice ? randInt(60, 300) : null,
        message_count: isVoice ? null : randInt(4, 12),
        category: pick(CATEGORIES),
        outcome: pick(OUTCOMES),
        csat_rating: Math.random() < 0.7 ? randInt(4, 5) : randInt(1, 3),
        is_test: true,
        timestamp: daysAgo(daysBack),
      })
    }

    const { data: insertedCalls, error: callsError } = await serviceClient
      .from('calls')
      .insert(callRows)
      .select('id, language, category')

    if (callsError) {
      return NextResponse.json(
        { error: 'Failed to insert calls', detail: callsError.message },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // 2. Seed transcripts — 5-8 turns per call
    // -------------------------------------------------------------------------
    const transcriptRows: Array<{
      call_id: string
      speaker: string
      message: string
      timestamp: string
    }> = []

    for (const call of insertedCalls ?? []) {
      const turns = randInt(5, 8)
      const useBM = call.language === 'bm' || (call.language === 'mixed' && Math.random() < 0.5)
      const botMsgs = useBM ? BOT_MESSAGES_BM : BOT_MESSAGES_EN
      const userMsgs = useBM ? USER_MESSAGES_BM : USER_MESSAGES_EN
      const callTime = new Date()
      callTime.setMinutes(callTime.getMinutes() - randInt(1, 2000))

      for (let t = 0; t < turns; t++) {
        const msgTime = new Date(callTime.getTime() + t * randInt(5000, 15000))
        transcriptRows.push({
          call_id: call.id,
          speaker: t % 2 === 0 ? 'bot' : 'user',
          message:
            t % 2 === 0
              ? botMsgs[Math.min(t, botMsgs.length - 1)]
              : userMsgs[Math.min(Math.floor(t / 2), userMsgs.length - 1)],
          timestamp: msgTime.toISOString(),
        })
      }
    }

    // Insert transcripts in batches of 500
    let transcriptsInserted = 0
    for (let i = 0; i < transcriptRows.length; i += 500) {
      const { error: trError } = await serviceClient
        .from('transcripts')
        .insert(transcriptRows.slice(i, i + 500))
      if (trError) {
        return NextResponse.json(
          { error: 'Failed to insert transcripts', detail: trError.message },
          { status: 500 }
        )
      }
      transcriptsInserted += Math.min(500, transcriptRows.length - i)
    }

    // -------------------------------------------------------------------------
    // 3. Seed ~15 tickets linked to complaint/escalated calls
    // -------------------------------------------------------------------------
    const complaintCalls = (insertedCalls ?? []).filter(
      (c) => c.category === 'complaint'
    )
    const ticketCalls = complaintCalls.slice(0, 15)

    const ticketRows = ticketCalls.map((call, idx) => {
      const num = String(idx + 1).padStart(5, '0')
      const icPrefix = [880512, 910823, 950614, 1230, 871105][idx % 5]
      const statusOptions = ['open', 'open', 'open', 'open', 'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress', 'resolved', 'resolved', 'resolved', 'resolved', 'resolved', 'resolved'] as const

      return {
        call_id: call.id,
        channel: 'voice',
        category: call.category,
        description: `Beneficiary reported issue with SARA eligibility check. Demo ticket for testing purposes.`,
        status: statusOptions[idx % statusOptions.length],
        reference_no: `TKT-2026-${num}`,
        masked_ic: `${icPrefix}-**-****`,
        assigned_to: null,
      }
    })

    const { data: insertedTickets, error: ticketsError } = await serviceClient
      .from('tickets')
      .insert(ticketRows)
      .select('id')

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Failed to insert tickets', detail: ticketsError.message },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // 4. Seed KB entries — 5 hardcoded Q&A pairs
    // -------------------------------------------------------------------------
    const kbRows = KB_SEED_DATA.map((entry) => ({
      ...entry,
      is_active: true,
      updated_by: 'seed',
    }))

    const { data: insertedKb, error: kbError } = await serviceClient
      .from('kb_entries')
      .insert(kbRows)
      .select('id')

    if (kbError) {
      return NextResponse.json(
        { error: 'Failed to insert KB entries', detail: kbError.message },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // 5. Seed 4 test users (users table only — Auth accounts created separately)
    // -------------------------------------------------------------------------
    const userRows = [
      { email: 'admin@mykasih.com', name: 'Admin User', role: 'admin' },
      { email: 'staff@mykasih.com', name: 'Sarah Ahmad', role: 'mykasih' },
      { email: 'qmedia@mykasih.com', name: 'QMedia Analyst', role: 'qmedia' },
      { email: 'supervisor@mykasih.com', name: 'Supervisor Lim', role: 'supervisor' },
    ]

    const { data: insertedUsers, error: usersError } = await serviceClient
      .from('users')
      .insert(userRows)
      .select('id')

    // Users may already exist — ignore unique constraint errors
    const userCount = usersError ? 0 : (insertedUsers?.length ?? 0)

    // -------------------------------------------------------------------------
    // Return counts
    // -------------------------------------------------------------------------
    return NextResponse.json({
      calls: insertedCalls?.length ?? 0,
      transcripts: transcriptsInserted,
      tickets: insertedTickets?.length ?? 0,
      kb_entries: insertedKb?.length ?? 0,
      users: userCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    )
  }
}
