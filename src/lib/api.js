import { agencyId, isConfigured, supabase } from './supabase'
import { demoCategories, demoTours } from './demoData'

export async function fetchCatalog() {
  if (!isConfigured) {
    return { categories: demoCategories, tours: demoTours, demo: true }
  }

  const [catRes, tourRes] = await Promise.all([
    supabase
      .from('tour_categories')
      .select('*')
      .eq('agency_id', agencyId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('tours')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('price_from', { ascending: true }),
  ])

  if (catRes.error) throw catRes.error
  if (tourRes.error) throw tourRes.error

  return {
    categories: catRes.data ?? [],
    tours: tourRes.data ?? [],
    demo: false,
  }
}

export async function createLead(payload) {
  if (!isConfigured) {
    await new Promise((r) => setTimeout(r, 600))
    console.info('[demo] lead submitted', payload)
    return { id: 'demo-' + Date.now(), demo: true }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      agency_id: agencyId,
      tour_id: payload.tourId || null,
      source: payload.source,
      phone: payload.phone,
      travel_dates: payload.travelDates || null,
      budget: payload.budget || null,
      wishes: payload.wishes || null,
      client_name: payload.clientName || null,
      telegram_user_id: payload.telegramUserId || null,
      telegram_username: payload.telegramUsername || null,
    })
    .select('id')
    .single()

  if (error) throw error
  return { ...data, demo: false }
}

export function formatPrice(price, currency = 'EUR') {
  if (price == null || price === '') return null
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n} ${currency}`
  }
}
