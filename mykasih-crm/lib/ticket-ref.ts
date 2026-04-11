import { createClient as createServiceClient } from '@supabase/supabase-js'

const YEAR = new Date().getFullYear()
const PREFIX = `TKT-${YEAR}-`

/**
 * Generates the next sequential ticket reference number.
 * Format: TKT-2026-NNNNN (zero-padded 5 digits)
 *
 * Queries MAX(reference_no) from tickets table — restart-safe.
 * Starts at TKT-2026-00001 on empty table.
 */
export async function generateTicketRef(): Promise<string> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('tickets')
    .select('reference_no')
    .like('reference_no', `${PREFIX}%`)
    .order('reference_no', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1

  if (data?.reference_no) {
    const lastNum = parseInt(
      (data.reference_no as string).replace(PREFIX, ''),
      10
    )
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1
    }
  }

  return `${PREFIX}${String(nextNum).padStart(5, '0')}`
}
