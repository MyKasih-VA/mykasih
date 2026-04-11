import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface Merchant {
  id: string
  chain: string
  outlet_name: string
  state: string
  city: string
  postcode: string
  address: string
}

/**
 * Returns merchants whose postcode starts with the first 4 digits of the given postcode.
 * Used by the chatbot merchant_lookup intent and the beneficiaries page.
 */
export async function lookupByPostcode(postcode: string): Promise<Merchant[]> {
  const supabase = await createClient()
  const prefix = postcode.trim().substring(0, 4)
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .like('postcode', `${prefix}%`)
    .limit(10)

  if (error) {
    console.error('Merchant postcode lookup error:', error)
    return []
  }

  return (data ?? []) as Merchant[]
}

/**
 * Returns up to 10 merchants filtered by state and optional city.
 * Used by the chatbot merchant_lookup intent and the analytics page.
 */
export async function lookupByState(
  state: string,
  city?: string
): Promise<Merchant[]> {
  const supabase = await createClient()
  let query = supabase
    .from('merchants')
    .select('*')
    .ilike('state', state.trim())

  if (city) {
    query = query.ilike('city', city.trim())
  }

  const { data, error } = await query.limit(10)

  if (error) {
    console.error('Merchant state lookup error:', error)
    return []
  }

  return (data ?? []) as Merchant[]
}

// ---------------------------------------------------------------------------
// Service-role variants — for use in API routes without cookie context
// (e.g., chatbot webhook handlers). Same query logic as the cookie-based
// versions above; use SUPABASE_SERVICE_ROLE_KEY instead of cookies().
// ---------------------------------------------------------------------------

function getServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Service-role variant of lookupByPostcode — for use in API routes without cookie context
 * (e.g., chatbot webhook handlers). Same query logic as lookupByPostcode.
 */
export async function lookupByPostcodeServiceRole(postcode: string): Promise<Merchant[]> {
  const supabase = getServiceRoleClient()
  const prefix = postcode.trim().substring(0, 4)
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .like('postcode', `${prefix}%`)
    .limit(10)

  if (error) {
    console.error('Merchant postcode lookup error:', error)
    return []
  }

  return (data ?? []) as Merchant[]
}

/**
 * Service-role variant of lookupByState — for use in API routes without cookie context.
 * Same query logic as lookupByState.
 */
export async function lookupByStateServiceRole(
  state: string,
  city?: string
): Promise<Merchant[]> {
  const supabase = getServiceRoleClient()
  let query = supabase
    .from('merchants')
    .select('*')
    .ilike('state', state.trim())

  if (city) {
    query = query.ilike('city', city.trim())
  }

  const { data, error } = await query.limit(10)

  if (error) {
    console.error('Merchant state lookup error:', error)
    return []
  }

  return (data ?? []) as Merchant[]
}
