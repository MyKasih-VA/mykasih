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

  // Dashboard stat sub-labels
  'dashboard.stat.voiceChat': { en: '{v} voice / {c} chat', bm: '{v} suara / {c} chat' },
  'dashboard.stat.inProgress': { en: '{n} in progress', bm: '{n} dalam proses' },
  'dashboard.stat.avgMsgs': { en: '{n} avg msgs (chat)', bm: '{n} purata mesej (chat)' },

  // Dashboard table columns
  'dashboard.recent.title': { en: 'Recent Interactions', bm: 'Interaksi Terkini' },
  'dashboard.recent.channel': { en: 'Channel', bm: 'Saluran' },
  'dashboard.recent.caller': { en: 'Caller', bm: 'Pemanggil' },
  'dashboard.recent.category': { en: 'Category', bm: 'Kategori' },
  'dashboard.recent.outcome': { en: 'Outcome', bm: 'Hasil' },
  'dashboard.recent.time': { en: 'Time', bm: 'Masa' },
  'dashboard.recent.duration': { en: 'Dur / Msgs', bm: 'Dur / Mesej' },

  // Chart legends
  'dashboard.chart.voice': { en: 'Voice', bm: 'Suara' },
  'dashboard.chart.chat': { en: 'Chat', bm: 'Chat' },

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
  'beneficiaries.lastSeen': { en: 'Last seen', bm: 'Terakhir dilihat' },
  'beneficiaries.noInteractions': { en: 'No interactions', bm: 'Tiada interaksi' },

  // Empty states
  'empty.noVoiceCalls.heading': { en: 'No voice calls yet', bm: 'Tiada panggilan suara lagi' },
  'empty.noVoiceCalls.body': { en: 'Voice calls will appear here once SARA receives calls via WhatsApp.', bm: 'Panggilan suara akan muncul di sini setelah SARA menerima panggilan melalui WhatsApp.' },
  'empty.noChatMessages.heading': { en: 'No chat messages yet', bm: 'Tiada mesej chat lagi' },
  'empty.noChatMessages.body': { en: 'WhatsApp conversations will appear here once the chatbot goes live.', bm: 'Perbualan WhatsApp akan muncul di sini setelah chatbot aktif.' },
  'empty.noInteractionsFiltered.heading': { en: 'No interactions found', bm: 'Tiada interaksi ditemui' },
  'empty.noInteractionsFiltered.body': { en: 'Try adjusting your filters or check back later.', bm: 'Cuba laraskan penapis anda atau semak semula kemudian.' },
  'empty.noTickets': { en: 'No tickets', bm: 'Tiada tiket' },

  // Transcript modal
  'modal.transcript': { en: 'Transcript', bm: 'Transkrip' },
  'error.loadTranscript': { en: 'Unable to load transcript.', bm: 'Tidak dapat memuatkan transkrip.' },
  'empty.noTranscript': { en: 'No transcript available.', bm: 'Tiada transkrip tersedia.' },
  'transcript.rateInteraction': { en: 'Rate this interaction:', bm: 'Nilai interaksi ini:' },
  'transcript.ratingSubmitted': { en: 'Rating submitted ({score}/5)', bm: 'Penilaian dihantar ({score}/5)' },
  'transcript.speaker.user': { en: 'User', bm: 'Pengguna' },
  'transcript.speaker.bot': { en: 'Bot', bm: 'Bot' },
  'transcript.speaker.agent': { en: 'Agent', bm: 'Ejen' },

  // Errors
  'error.loadCalls': { en: 'Unable to load calls. Check your connection and try again.', bm: 'Tidak dapat memuatkan panggilan. Semak sambungan anda dan cuba lagi.' },
  'error.loadChat': { en: 'Unable to load chat messages. Check your connection and try again.', bm: 'Tidak dapat memuatkan mesej chat. Semak sambungan anda dan cuba lagi.' },
  'error.loadTickets': { en: 'Unable to load tickets. Check your connection and try again.', bm: 'Tidak dapat memuatkan tiket. Semak sambungan anda dan cuba lagi.' },
  'error.statusUpdate': { en: 'Status update failed. Please try again.', bm: 'Kemaskini status gagal. Sila cuba lagi.' },

  // Pagination
  'pagination.showing': { en: 'Showing', bm: 'Menunjukkan' },
  'pagination.of': { en: 'of', bm: 'daripada' },

  // Analytics page
  'analytics.title': { en: 'Analytics', bm: 'Analitik' },
  'analytics.totalInteractions': { en: 'Total Interactions', bm: 'Jumlah Interaksi' },
  'analytics.avgCsat': { en: 'Avg. CSAT', bm: 'Purata CSAT' },
  'analytics.resolutionRate': { en: 'Resolution Rate', bm: 'Kadar Penyelesaian' },
  'analytics.peakHour': { en: 'Peak Hour', bm: 'Waktu Puncak' },
  'analytics.volumeChart': { en: 'Call Volume', bm: 'Jumlah Panggilan' },
  'analytics.csatTrend': { en: 'CSAT Trend', bm: 'Trend CSAT' },
  'analytics.languagePie': { en: 'Language Distribution', bm: 'Taburan Bahasa' },
  'analytics.peakHeatmap': { en: 'Peak Hours Heatmap', bm: 'Peta Haba Waktu Puncak' },
  'analytics.categoryBreakdown': { en: 'Category Breakdown', bm: 'Pecahan Kategori' },
  'analytics.voice': { en: 'Voice', bm: 'Suara' },
  'analytics.chat': { en: 'Chat', bm: 'Sembang' },
  'analytics.category': { en: 'Category', bm: 'Kategori' },
  'analytics.voiceCount': { en: 'Voice', bm: 'Suara' },
  'analytics.chatCount': { en: 'Chat', bm: 'Sembang' },
  'analytics.total': { en: 'Total', bm: 'Jumlah' },
  'analytics.percentage': { en: '% of Total', bm: '% Jumlah' },
  'analytics.today': { en: 'Today', bm: 'Hari Ini' },
  'analytics.thisWeek': { en: 'This Week', bm: 'Minggu Ini' },
  'analytics.thisMonth': { en: 'This Month', bm: 'Bulan Ini' },
  'analytics.last3Months': { en: 'Last 3 Months', bm: '3 Bulan Lepas' },
  'analytics.custom': { en: 'Custom', bm: 'Tersuai' },
  'analytics.noCSAT.heading': { en: 'No CSAT ratings yet', bm: 'Tiada penilaian CSAT lagi' },
  'analytics.noCSAT.body': { en: 'Ratings appear after calls are scored', bm: 'Penilaian akan dipaparkan selepas panggilan dinilai' },
  'analytics.error': { en: 'Failed to load analytics. Try refreshing the page.', bm: 'Gagal memuatkan analitik. Cuba muat semula halaman.' },
  'analytics.interactions': { en: 'interactions', bm: 'interaksi' },

  // Knowledge Base page
  'kb.title': { en: 'Knowledge Base', bm: 'Pangkalan Pengetahuan' },
  'kb.addEntry': { en: 'Add Entry', bm: 'Tambah Entri' },
  'kb.syncToEL': { en: 'Sync to ElevenLabs', bm: 'Segerak ke ElevenLabs' },
  'kb.syncing': { en: 'Syncing...', bm: 'Menyegerak...' },
  'kb.syncSuccess': { en: 'Knowledge base synced to ElevenLabs', bm: 'Pangkalan pengetahuan disegerakkan ke ElevenLabs' },
  'kb.syncError': { en: 'Sync failed: {error}. Try again.', bm: 'Segerak gagal: {error}. Cuba lagi.' },
  'kb.addModal.title': { en: 'Add KB Entry', bm: 'Tambah Entri KB' },
  'kb.editModal.title': { en: 'Edit KB Entry', bm: 'Edit Entri KB' },
  'kb.fields.category': { en: 'Category', bm: 'Kategori' },
  'kb.fields.questionBm': { en: 'Question (BM)', bm: 'Soalan (BM)' },
  'kb.fields.answerBm': { en: 'Answer (BM)', bm: 'Jawapan (BM)' },
  'kb.fields.questionEn': { en: 'Question (EN)', bm: 'Soalan (EN)' },
  'kb.fields.answerEn': { en: 'Answer (EN)', bm: 'Jawapan (EN)' },
  'kb.fields.active': { en: 'Active', bm: 'Aktif' },
  'kb.saveEntry': { en: 'Save Entry', bm: 'Simpan Entri' },
  'kb.discardChanges': { en: 'Discard changes', bm: 'Buang perubahan' },
  'kb.deleteConfirm': { en: 'Delete this KB entry? This cannot be undone.', bm: 'Padam entri KB ini? Tindakan ini tidak boleh dibatalkan.' },
  'kb.deleteBtn': { en: 'Delete', bm: 'Padam' },
  'kb.keepEntry': { en: 'Keep entry', bm: 'Simpan entri' },
  'kb.empty.heading': { en: 'No knowledge base entries', bm: 'Tiada entri pangkalan pengetahuan' },
  'kb.empty.body': { en: 'Add your first entry to get started.', bm: 'Tambah entri pertama anda untuk bermula.' },
  'kb.error': { en: 'Failed to load knowledge base. Try refreshing the page.', bm: 'Gagal memuatkan pangkalan pengetahuan. Cuba muat semula halaman.' },
  'kb.question': { en: 'Question', bm: 'Soalan' },
  'kb.answer': { en: 'Answer', bm: 'Jawapan' },
  'kb.actions': { en: 'Actions', bm: 'Tindakan' },
  'kb.edit': { en: 'Edit', bm: 'Edit' },

  // Staff Management page
  'staff.title': { en: 'Staff Management', bm: 'Pengurusan Kakitangan' },
  'staff.inviteStaff': { en: 'Invite Staff', bm: 'Jemput Kakitangan' },
  'staff.inviteModal.title': { en: 'Invite Staff Member', bm: 'Jemput Ahli Kakitangan' },
  'staff.fields.name': { en: 'Name', bm: 'Nama' },
  'staff.fields.email': { en: 'Email', bm: 'E-mel' },
  'staff.fields.role': { en: 'Role', bm: 'Peranan' },
  'staff.sendInvite': { en: 'Send Invite', bm: 'Hantar Jemputan' },
  'staff.discard': { en: 'Discard', bm: 'Buang' },
  'staff.editRole.title': { en: 'Change Role', bm: 'Tukar Peranan' },
  'staff.updateRole': { en: 'Update Role', bm: 'Kemaskini Peranan' },
  'staff.keepCurrentRole': { en: 'Keep current role', bm: 'Kekalkan peranan semasa' },
  'staff.removeConfirm': { en: 'Remove {name}? They will lose access immediately.', bm: 'Buang {name}? Mereka akan kehilangan akses serta-merta.' },
  'staff.removeBtn': { en: 'Remove', bm: 'Buang' },
  'staff.keepMember': { en: 'Keep member', bm: 'Kekalkan ahli' },
  'staff.empty.heading': { en: 'No staff members', bm: 'Tiada ahli kakitangan' },
  'staff.empty.body': { en: 'Invite your first team member to get started.', bm: 'Jemput ahli pasukan pertama anda untuk bermula.' },
  'staff.error': { en: 'Failed to load staff. Try refreshing the page.', bm: 'Gagal memuatkan kakitangan. Cuba muat semula halaman.' },
  'staff.inviteSuccess': { en: 'Invite sent to {email}', bm: 'Jemputan dihantar ke {email}' },
  'staff.inviteError': { en: 'Failed to send invite. Try again.', bm: 'Gagal menghantar jemputan. Cuba lagi.' },
  'staff.removeSuccess': { en: 'Staff member removed.', bm: 'Ahli kakitangan dibuang.' },
  'staff.resendInvite': { en: 'Resend invite', bm: 'Hantar semula jemputan' },
  'staff.status': { en: 'Status', bm: 'Status' },
  'staff.lastLogin': { en: 'Last Login', bm: 'Log Masuk Terakhir' },
  'staff.active': { en: 'Active', bm: 'Aktif' },
  'staff.pending': { en: 'Pending', bm: 'Menunggu' },

  // Integrations page
  'integrations.title': { en: 'Integrations', bm: 'Integrasi' },
  'integrations.refreshStatus': { en: 'Refresh Status', bm: 'Muat Semula Status' },
  'integrations.statusCheckFailed': { en: 'Status check failed. Try refreshing.', bm: 'Semakan status gagal. Cuba muat semula.' },
  'integrations.copySuccess': { en: 'Webhook URL copied', bm: 'URL webhook telah disalin' },
  'integrations.testConnection': { en: 'Test Connection', bm: 'Uji Sambungan' },
  'integrations.copyWebhookUrl': { en: 'Copy Webhook URL', bm: 'Salin URL Webhook' },
  'integrations.openN8n': { en: 'Open n8n', bm: 'Buka n8n' },
  'integrations.viewProject': { en: 'View Project', bm: 'Lihat Projek' },
  'integrations.openDemo': { en: 'Open Demo', bm: 'Buka Demo' },
  'integrations.database': { en: 'Database', bm: 'Pangkalan Data' },
  'integrations.connected': { en: 'Connected', bm: 'Disambungkan' },
  'integrations.error': { en: 'Error', bm: 'Ralat' },
  'integrations.pendingApproval': { en: 'Pending Approval', bm: 'Menunggu Kelulusan' },
  'integrations.ready': { en: 'Ready', bm: 'Sedia' },
  'integrations.notConfigured': { en: 'Not Configured', bm: 'Tidak Dikonfigurasi' },
  'integrations.merchantData': { en: 'Merchant Data', bm: 'Data Saudagar' },
  'integrations.seeding': { en: 'Seeding...', bm: 'Menyemai...' },
  'integrations.seedMerchants': { en: 'Seed Merchants', bm: 'Semai Saudagar' },

  // Live Monitor page
  'liveMonitor.title': { en: 'Live Monitor', bm: 'Monitor Langsung' },
  'liveMonitor.refreshNow': { en: 'Refresh Now', bm: 'Muat Semula' },
  'liveMonitor.updatedJustNow': { en: 'Updated just now', bm: 'Dikemaskini sebentar tadi' },
  'liveMonitor.updatedAgo': { en: 'Updated {n}s ago', bm: 'Dikemaskini {n}s lalu' },
  'liveMonitor.activeVoice': { en: 'Active Voice Sessions', bm: 'Sesi Suara Aktif' },
  'liveMonitor.activeChat': { en: 'Active Chat Sessions', bm: 'Sesi Sembang Aktif' },
  'liveMonitor.emptyVoice.heading': { en: 'No active voice sessions', bm: 'Tiada sesi suara aktif' },
  'liveMonitor.emptyVoice.body': { en: 'Live sessions appear here when calls are in progress.', bm: 'Sesi langsung dipaparkan di sini apabila panggilan sedang berlangsung.' },
  'liveMonitor.emptyChat.heading': { en: 'No active chat sessions', bm: 'Tiada sesi sembang aktif' },
  'liveMonitor.emptyChat.body': { en: 'Live sessions appear here when WhatsApp conversations are in progress.', bm: 'Sesi langsung dipaparkan di sini apabila perbualan WhatsApp sedang berlangsung.' },
  'liveMonitor.error': { en: 'Could not load live sessions. Check your connection and try again.', bm: 'Tidak dapat memuatkan sesi langsung. Semak sambungan anda dan cuba lagi.' },
  'liveMonitor.unknownCaller': { en: 'Unknown Caller', bm: 'Pemanggil Tidak Diketahui' },
  'liveMonitor.messages': { en: 'messages', bm: 'mesej' },
  'liveMonitor.startedAgo': { en: 'Started {n} ago', bm: 'Bermula {n} lalu' },

  // Common
  'common.tryAgain': { en: 'Try again', bm: 'Cuba lagi' },
  'common.unknown': { en: 'Unknown', bm: 'Tidak diketahui' },
  'common.notifications': { en: 'Notifications', bm: 'Pemberitahuan' },
  'common.locale': { en: 'en-GB', bm: 'ms-MY' },

  // Testing Console (Phase 6)
  'testing.title': { en: 'Testing Console', bm: 'Konsol Ujian' },
  'testing.tab.voiceAgent': { en: 'Voice Agent', bm: 'Ejen Suara' },
  'testing.tab.kasihChatbot': { en: 'Kasih Chatbot', bm: 'Chatbot Kasih' },
  'testing.tab.anamAI': { en: 'Kasih Avatar', bm: 'Avatar Kasih' },
  'testing.voice.startSession': { en: 'Start Session', bm: 'Mulakan Sesi' },
  'testing.voice.endSession': { en: 'End Session', bm: 'Tamatkan Sesi' },
  'testing.voice.status.ready': { en: 'Ready', bm: 'Sedia' },
  'testing.voice.status.connecting': { en: 'Connecting...', bm: 'Menyambung...' },
  'testing.voice.status.active': { en: 'Active', bm: 'Aktif' },
  'testing.voice.status.ended': { en: 'Ended', bm: 'Tamat' },
  'testing.voice.liveTranscript': { en: 'Live Transcript', bm: 'Transkrip Langsung' },
  'testing.voice.testTagged': { en: 'All sessions tagged is_test=true', bm: 'Semua sesi ditanda is_test=true' },
  'testing.voice.transcriptEmpty': { en: 'Transcript will appear here when a session is active.', bm: 'Transkrip akan dipaparkan di sini apabila sesi aktif.' },
  'testing.voice.error': { en: 'Connection failed. Check your ElevenLabs agent configuration.', bm: 'Sambungan gagal. Semak konfigurasi ejen ElevenLabs anda.' },
  'testing.chat.inputPlaceholder': { en: 'Type a message as a beneficiary...', bm: 'Taip mesej sebagai penerima manfaat...' },
  'testing.chat.send': { en: 'Send', bm: 'Hantar' },
  'testing.chat.clearConversation': { en: 'Clear Conversation', bm: 'Kosongkan Perbualan' },
  'testing.chat.anamLabel': { en: 'Kasih — MyKasih AI Avatar (Beta)', bm: 'Kasih — Avatar AI MyKasih (Beta)' },
  'testing.chat.emptyState': { en: 'Start a conversation to test the Kasih chatbot.', bm: 'Mulakan perbualan untuk menguji chatbot Kasih.' },
  'testing.chat.firstContact.en': { en: 'Welcome to MyKasih. Please select a service: Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan', bm: 'Welcome to MyKasih. Please select a service: Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan' },
  'testing.chat.firstContact.bm': { en: 'Selamat datang ke MyKasih. Sila pilih perkhidmatan: Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan', bm: 'Selamat datang ke MyKasih. Sila pilih perkhidmatan: Semak baki | Kedai berdekatan | Bantuan SARA | Status aduan' },

  // Settings page (Phase 6)
  'settings.title': { en: 'Settings', bm: 'Tetapan' },
  'settings.agentHours': { en: 'Agent Hours', bm: 'Waktu Ejen' },
  'settings.agentHoursStart': { en: 'Start Time', bm: 'Masa Mula' },
  'settings.agentHoursEnd': { en: 'End Time', bm: 'Masa Tamat' },
  'settings.notifications': { en: 'Notifications', bm: 'Pemberitahuan' },
  'settings.notificationEmail': { en: 'Notification Email', bm: 'E-mel Pemberitahuan' },
  'settings.dataRetention': { en: 'Data Retention', bm: 'Pengekalan Data' },
  'settings.dataRetentionDays': { en: 'Retention Period (days)', bm: 'Tempoh Pengekalan (hari)' },
  'settings.webhookUrls': { en: 'Webhook URLs', bm: 'URL Webhook' },
  'settings.voiceWebhookUrl': { en: 'Voice Webhook URL', bm: 'URL Webhook Suara' },
  'settings.chatWebhookUrl': { en: 'Chat Webhook URL', bm: 'URL Webhook Chat' },
  'settings.copyUrl': { en: 'Copy', bm: 'Salin' },
  'settings.saveChanges': { en: 'Save Changes', bm: 'Simpan Perubahan' },
  'settings.saveSuccess': { en: 'Settings saved', bm: 'Tetapan disimpan' },
  'settings.saveError': { en: 'Failed to save settings. Try again.', bm: 'Gagal menyimpan tetapan. Cuba lagi.' },
  'settings.loadError': { en: 'Failed to load settings. Try refreshing.', bm: 'Gagal memuatkan tetapan. Cuba muat semula.' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Language): string {
  return translations[key][lang]
}
