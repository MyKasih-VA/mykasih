import * as XLSX from 'xlsx'

// ---- Types for export data ----

interface CallExportRow {
  no: number
  timestamp: string
  channel: string
  caller_name: string | null
  wa_number: string | null
  location: string | null
  language: string | null
  duration_or_messages: number | null
  category: string | null
  outcome: string | null
  csat_rating: number | null
  is_test: boolean
}

interface TicketExportRow {
  no: number
  reference_no: string
  created_at: string
  category: string | null
  description: string | null
  status: string
  masked_ic: string | null
  assigned_to: string | null
  call_id: string | null
}

interface ExportSummary {
  total_interactions: number
  voice_count: number
  chat_count: number
  by_category: Record<string, number>
  by_outcome: Record<string, number>
  average_csat: number | null
  tickets_open: number
  tickets_in_progress: number
  tickets_resolved: number
  date_from: string | null
  date_to: string | null
}

interface ExportData {
  calls: CallExportRow[]
  tickets: TicketExportRow[]
  summary: ExportSummary
}

/**
 * Builds a 3-sheet XLSX workbook from export data.
 * Sheet 1: "Semua Interaksi" — all calls/interactions
 * Sheet 2: "Tiket" — all tickets
 * Sheet 3: "Ringkasan" — aggregate summary
 *
 * Returns a Buffer suitable for Response body.
 *
 * Security note: IC numbers must be masked before being passed to this function.
 * CallExportRow intentionally has no plain IC field — masked_ic lives on TicketExportRow only.
 */
export function buildExportWorkbook(data: ExportData): Buffer {
  const workbook = XLSX.utils.book_new()

  // ---- Sheet 1: Semua Interaksi ----
  const callHeaders = [
    'No.', 'Timestamp', 'Channel', 'Caller Name', 'WA Number',
    'Location', 'Language', 'Duration/Messages', 'Category',
    'Outcome', 'CSAT Rating', 'Is Test'
  ]
  const callRows = data.calls.map((c) => [
    c.no, c.timestamp, c.channel, c.caller_name ?? '',
    c.wa_number ?? '', c.location ?? '', c.language ?? '',
    c.duration_or_messages ?? '', c.category ?? '',
    c.outcome ?? '', c.csat_rating ?? '', c.is_test ? 'Yes' : 'No'
  ])
  const callsSheet = XLSX.utils.aoa_to_sheet([callHeaders, ...callRows])
  callsSheet['!cols'] = [
    { wch: 5 }, { wch: 22 }, { wch: 8 }, { wch: 20 }, { wch: 15 },
    { wch: 15 }, { wch: 8 }, { wch: 18 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 8 }
  ]

  // ---- Sheet 2: Tiket ----
  const ticketHeaders = [
    'No.', 'Reference No.', 'Created At', 'Category', 'Description',
    'Status', 'Masked IC', 'Assigned To', 'Linked Call ID'
  ]
  const ticketRows = data.tickets.map((t) => [
    t.no, t.reference_no, t.created_at, t.category ?? '',
    t.description ?? '', t.status, t.masked_ic ?? '',
    t.assigned_to ?? '', t.call_id ?? ''
  ])
  const ticketsSheet = XLSX.utils.aoa_to_sheet([ticketHeaders, ...ticketRows])
  ticketsSheet['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 40 },
    { wch: 14 }, { wch: 16 }, { wch: 15 }, { wch: 38 }
  ]

  // ---- Sheet 3: Ringkasan ----
  const summaryRows: (string | number | null)[][] = [
    ['Metrik', 'Nilai'],
    ['Jumlah Interaksi', data.summary.total_interactions],
    ['Suara (Voice)', data.summary.voice_count],
    ['Chat', data.summary.chat_count],
    [''],
    ['Kategori', 'Bilangan'],
  ]

  const categories = ['eligibility', 'faq', 'registration', 'complaint', 'merchant_lookup', 'balance_check']
  for (const cat of categories) {
    summaryRows.push([cat, data.summary.by_category[cat] ?? 0])
  }

  summaryRows.push([''])
  summaryRows.push(['Outcome', 'Bilangan'])
  const outcomes = ['resolved', 'escalated', 'callback', 'abandoned']
  for (const out of outcomes) {
    summaryRows.push([out, data.summary.by_outcome[out] ?? 0])
  }

  summaryRows.push([''])
  summaryRows.push(['Purata CSAT', data.summary.average_csat ?? 'N/A'])
  summaryRows.push([''])
  summaryRows.push(['Tiket Status', 'Bilangan'])
  summaryRows.push(['Open', data.summary.tickets_open])
  summaryRows.push(['In Progress', data.summary.tickets_in_progress])
  summaryRows.push(['Resolved', data.summary.tickets_resolved])
  summaryRows.push([''])
  summaryRows.push(['Tarikh Mula', data.summary.date_from ?? 'Semua'])
  summaryRows.push(['Tarikh Akhir', data.summary.date_to ?? 'Semua'])

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }]

  // ---- Assemble workbook ----
  XLSX.utils.book_append_sheet(workbook, callsSheet, 'Semua Interaksi')
  XLSX.utils.book_append_sheet(workbook, ticketsSheet, 'Tiket')
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}

export type { CallExportRow, TicketExportRow, ExportSummary, ExportData }
