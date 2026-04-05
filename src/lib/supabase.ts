import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

if (url && anonKey) {
  client = createClient(url, anonKey)
} else if (import.meta.env.DEV) {
  console.error(
    '[budget] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local.'
  )
}

export function getSupabase(): SupabaseClient | null {
  return client
}
