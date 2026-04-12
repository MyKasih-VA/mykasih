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

  // Page titles
  'page.voiceCalls': { en: 'Voice Calls', bm: 'Panggilan Suara' },
  'page.chatMessages': { en: 'Chat Messages', bm: 'Mesej Chat' },
  'page.allInteractions': { en: 'All Interactions', bm: 'Semua Interaksi' },
  'page.tickets': { en: 'Tickets', bm: 'Tiket' },
  'page.beneficiaries': { en: 'Beneficiaries', bm: 'Penerima Manfaat' },

  // Table columns
  'table.waNumber': { en: 'WA Number', bm: 'No. WA' },
  'table.intent': { en: 'Intent', bm: 'Niat' },
  'table.messages': { en: 'Messages', bm: 'Mesej' },
  'table.refNo': { en: 'Ref No.', bm: 'No. Ruj.' },
  'table.maskedIc': { en: 'IC (masked)', bm: 'IC (tersembunyi)' },
  'table.status': { en: 'Status', bm: 'Status' },
  'table.durationMsgs': { en: 'Dur / Msgs', bm: 'Tempoh / Mesej' },

  // Filter labels
  'filter.today': { en: 'Today', bm: 'Hari Ini' },
  'filter.thisWeek': { en: 'This week', bm: 'Minggu ini' },
  'filter.thisMonth': { en: 'This month', bm: 'Bulan ini' },
  'filter.custom': { en: 'Custom', bm: 'Tersuai' },
  'filter.allTime': { en: 'All time', bm: 'Semua masa' },
  'filter.allCategories': { en: 'All categories', bm: 'Semua kategori' },
  'filter.allOutcomes': { en: 'All outcomes', bm: 'Semua hasil' },
  'filter.allLanguages': { en: 'All languages', bm: 'Semua bahasa' },
  'filter.allChannels': { en: 'All', bm: 'Semua' },
  'filter.searchPlaceholder': { en: 'Search by name or WA number...', bm: 'Cari mengikut nama atau no. WA...' },

  // Kanban
  'kanban.open': { en: 'Open', bm: 'Terbuka' },
  'kanban.inProgress': { en: 'In Progress', bm: 'Dalam Proses' },
  'kanban.resolved': { en: 'Resolved', bm: 'Selesai' },

  // Actions
  'action.export': { en: 'Export to Excel', bm: 'Eksport ke Excel' },

  // Beneficiaries
  'beneficiaries.searchHeading': { en: 'Find a Beneficiary', bm: 'Cari Penerima Manfaat' },
  'beneficiaries.searchSubtext': { en: 'Search by WhatsApp number or name', bm: 'Cari mengikut nombor WA atau nama' },
  'beneficiaries.noResultsHeading': { en: 'No beneficiary found', bm: 'Tiada penerima manfaat ditemui' },
  'beneficiaries.noResultsBody': { en: 'Try a different WA number or name.', bm: 'Cuba nombor WA atau nama yang berbeza.' },
  'beneficiaries.interactionHistory': { en: 'Interaction History', bm: 'Sejarah Interaksi' },
  'beneficiaries.ticketHistory': { en: 'Ticket History', bm: 'Sejarah Tiket' },

  // Empty states
  'empty.noVoiceCalls.heading': { en: 'No voice calls yet', bm: 'Tiada panggilan suara lagi' },
  'empty.noVoiceCalls.body': { en: 'Voice calls will appear here once SARA receives calls via WhatsApp.', bm: 'Panggilan suara akan muncul di sini setelah SARA menerima panggilan melalui WhatsApp.' },
  'empty.noChatMessages.heading': { en: 'No chat messages yet', bm: 'Tiada mesej chat lagi' },
  'empty.noChatMessages.body': { en: 'WhatsApp conversations will appear here once the chatbot goes live.', bm: 'Perbualan WhatsApp akan muncul di sini setelah chatbot aktif.' },
  'empty.noInteractionsFiltered.heading': { en: 'No interactions found', bm: 'Tiada interaksi ditemui' },
  'empty.noInteractionsFiltered.body': { en: 'Try adjusting your filters or check back later.', bm: 'Cuba laraskan penapis anda atau semak semula kemudian.' },
  'empty.noTickets': { en: 'No tickets', bm: 'Tiada tiket' },

  // Errors
  'error.loadCalls': { en: 'Unable to load calls. Check your connection and try again.', bm: 'Tidak dapat memuatkan panggilan. Semak sambungan anda dan cuba lagi.' },
  'error.loadChat': { en: 'Unable to load chat messages. Check your connection and try again.', bm: 'Tidak dapat memuatkan mesej chat. Semak sambungan anda dan cuba lagi.' },
  'error.loadTickets': { en: 'Unable to load tickets. Check your connection and try again.', bm: 'Tidak dapat memuatkan tiket. Semak sambungan anda dan cuba lagi.' },
  'error.statusUpdate': { en: 'Status update failed. Please try again.', bm: 'Kemaskini status gagal. Sila cuba lagi.' },

  // Pagination
  'pagination.showing': { en: 'Showing', bm: 'Menunjukkan' },
  'pagination.of': { en: 'of', bm: 'daripada' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language): string {
  return translations[key][lang]
}
