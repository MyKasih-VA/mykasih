export type Language = 'en' | 'bm'

export const translations = {
  // Navigation groups
  'nav.overview': { en: 'OVERVIEW', bm: 'GAMBARAN' },
  'nav.callManagement': { en: 'CALL MANAGEMENT', bm: 'PENGURUSAN PANGGILAN' },
  'nav.operations': { en: 'OPERATIONS', bm: 'OPERASI' },
  'nav.intelligence': { en: 'INTELLIGENCE', bm: 'KECERDASAN' },
  'nav.system': { en: 'SYSTEM', bm: 'SISTEM' },

  // Navigation items (all 14)
  'nav.dashboard': { en: 'Dashboard', bm: 'Papan Pemuka' },
  'nav.voiceCalls': { en: 'Voice Calls', bm: 'Panggilan Suara' },
  'nav.chatMessages': { en: 'Chat Messages', bm: 'Mesej Chat' },
  'nav.allInteractions': { en: 'All Interactions', bm: 'Semua Interaksi' },
  'nav.tickets': { en: 'Tickets', bm: 'Tiket' },
  'nav.beneficiaries': { en: 'Beneficiaries', bm: 'Penerima Manfaat' },
  'nav.liveMonitor': { en: 'Live Monitor', bm: 'Monitor Langsung' },
  'nav.analytics': { en: 'Analytics', bm: 'Analitik' },
  'nav.knowledgeBase': { en: 'Knowledge Base', bm: 'Pangkalan Ilmu' },
  'nav.staffManagement': { en: 'Staff Management', bm: 'Pengurusan Kakitangan' },
  'nav.integrations': { en: 'Integrations', bm: 'Integrasi' },
  'nav.testingConsole': { en: 'Testing Console', bm: 'Konsol Ujian' },
  'nav.aiDemo': { en: 'AI Demo', bm: 'Demo AI' },
  'nav.settings': { en: 'Settings', bm: 'Tetapan' },

  // Login page
  'login.emailPlaceholder': { en: 'Email address', bm: 'Alamat e-mel' },
  'login.passwordPlaceholder': { en: 'Password', bm: 'Kata laluan' },
  'login.signIn': { en: 'Sign In', bm: 'Log Masuk' },
  'login.signingIn': { en: 'Signing in...', bm: 'Log masuk...' },
  'login.invalidCredentials': { en: 'Invalid email or password. Please try again.', bm: 'E-mel atau kata laluan tidak sah. Sila cuba lagi.' },
  'login.serverError': { en: 'Something went wrong. Please try again later.', bm: 'Ralat berlaku. Sila cuba sebentar lagi.' },

  // Dashboard home
  'dashboard.title': { en: 'Dashboard', bm: 'Papan Pemuka' },
  'dashboard.todayInteractions': { en: "Today's Interactions", bm: 'Interaksi Hari Ini' },
  'dashboard.resolutionRate': { en: 'Resolution Rate', bm: 'Kadar Penyelesaian' },
  'dashboard.openTickets': { en: 'Open Tickets', bm: 'Tiket Terbuka' },
  'dashboard.avgDuration': { en: 'Avg. Duration', bm: 'Purata Tempoh' },
  'dashboard.recentInteractions': { en: 'Recent Interactions', bm: 'Interaksi Terkini' },
  'dashboard.callVolume': { en: 'Call Volume \u2014 Last 7 Days', bm: 'Jumlah Panggilan \u2014 7 Hari Lepas' },
  'dashboard.byCategory': { en: 'Interactions by Category', bm: 'Interaksi Mengikut Kategori' },

  // Empty states
  'empty.noInteractions.heading': { en: 'No interactions yet', bm: 'Tiada interaksi lagi' },
  'empty.noInteractions.body': { en: 'Interactions will appear here once calls or chats are received.', bm: 'Interaksi akan dipaparkan di sini setelah panggilan atau sembang diterima.' },

  // Sidebar footer
  'sidebar.aiConnected': { en: 'AI Connected', bm: 'AI Disambung' },
  'sidebar.signOut': { en: 'Sign Out', bm: 'Log Keluar' },

  // Table columns
  'table.channel': { en: 'Channel', bm: 'Saluran' },
  'table.caller': { en: 'Caller', bm: 'Pemanggil' },
  'table.category': { en: 'Category', bm: 'Kategori' },
  'table.outcome': { en: 'Outcome', bm: 'Hasil' },
  'table.time': { en: 'Time', bm: 'Masa' },
  'table.duration': { en: 'Duration', bm: 'Tempoh' },

  // Channel labels
  'channel.voice': { en: 'Voice', bm: 'Suara' },
  'channel.chat': { en: 'Chat', bm: 'Chat' },

  // Common
  'common.search': { en: 'Search...', bm: 'Cari...' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language): string {
  return translations[key][lang]
}
