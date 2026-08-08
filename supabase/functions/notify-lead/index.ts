// Supabase Edge Function: notify manager in Telegram when a lead is created
// Deploy: supabase functions deploy notify-lead
// Secret: supabase secrets set TELEGRAM_BOT_TOKEN=xxx
// Webhook: Database → Webhooks → leads INSERT → this function URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org'

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      return new Response('Missing TELEGRAM_BOT_TOKEN', { status: 500 })
    }

    const payload = await req.json()
    // Database Webhook shape: { type, table, record, ... }
    const record = payload.record ?? payload

    if (!record?.id || !record?.agency_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('name, telegram_manager_chat_id')
      .eq('id', record.agency_id)
      .single()

    if (agencyError || !agency?.telegram_manager_chat_id) {
      return new Response(JSON.stringify({ error: 'Agency chat not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let tourTitle: string | null = null
    if (record.tour_id) {
      const { data: tour } = await supabase
        .from('tours')
        .select('title, destination')
        .eq('id', record.tour_id)
        .maybeSingle()
      if (tour) {
        tourTitle = `${tour.title} (${tour.destination})`
      }
    }

    const sourceLabel =
      record.source === 'catalog' ? 'Каталог туров' : 'Индивидуальный подбор'

    const tgUser = record.telegram_username
      ? `@${record.telegram_username}`
      : record.telegram_user_id
        ? `id:${record.telegram_user_id}`
        : '—'

    const lines = [
      `🆕 Новая заявка — ${agency.name}`,
      ``,
      `Источник: ${sourceLabel}`,
      tourTitle ? `Тур: ${tourTitle}` : null,
      `Телефон: ${record.phone}`,
      record.customer_name || record.client_name
        ? `Имя: ${record.customer_name || record.client_name}`
        : null,
      record.telegram_username ? `Username: @${record.telegram_username}` : null,
      record.travel_dates ? `Даты: ${record.travel_dates}` : null,
      record.budget ? `Бюджет: ${record.budget}` : null,
      record.wishes ? `Пожелания: ${record.wishes}` : null,
      `Telegram: ${tgUser}`,
      ``,
      `Lead ID: ${record.id}`,
    ].filter(Boolean)

    const text = lines.join('\n')

    const tgRes = await fetch(
      `${TELEGRAM_API}/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: agency.telegram_manager_chat_id,
          text,
          disable_web_page_preview: true,
        }),
      },
    )

    if (!tgRes.ok) {
      const errBody = await tgRes.text()
      console.error('Telegram API error:', errBody)
      return new Response(JSON.stringify({ error: 'Telegram send failed', details: errBody }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
