import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const agencyId = import.meta.env.VITE_AGENCY_ID || ''
export const isConfigured = Boolean(url && anonKey && agencyId)

export const supabase = isConfigured
  ? createClient(url, anonKey)
  : null
