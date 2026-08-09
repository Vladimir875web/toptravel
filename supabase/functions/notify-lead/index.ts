// Supabase Edge Function: notify-lead
// Триггерится через SQL-триггер on_lead_created при INSERT в таблицу leads
//
// ОБНОВЛЕНИЕ: теперь отправляет ДВА сообщения —
// 1. Менеджеру (как раньше) — детали заявки
// 2. Клиенту (новое) — подтверждение, что заявка принята
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: object,
) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  })
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const lead = payload.record
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: agency } = await supabase
      .from('agencies')
      .select('telegram_manager_chat_id, name')
      .eq('id', lead.agency_id)
      .single()

    let tourLine = 'Тип заявки: подобрать тур индивидуально'
    if (lead.tour_id) {
      const { data: tour } = await supabase
        .from('tours')
        .select('title')
        .eq('id', lead.tour_id)
        .single()
      if (tour) tourLine = `Тур: ${tour.title}`
    }

    // --- 1. Уведомление менеджеру (как раньше) ---
    if (agency?.telegram_manager_chat_id) {
      const managerText =
        `🆕 Новая заявка — ${agency.name}\n\n` +
        `${tourLine}\n` +
        `Клиент: ${lead.client_name || 'Без имени'}\n` +
        `Телефон: ${lead.phone}\n` +
        (lead.travel_dates ? `Даты: ${lead.travel_dates}\n` : '') +
        (lead.travelers_count
          ? `Кол-во человек: ${lead.travelers_count}\n`
          : '') +
        (lead.budget ? `Бюджет: ${lead.budget}\n` : '') +
        (lead.wishes ? `Пожелания: ${lead.wishes}\n` : '') +
        (lead.telegram_username
          ? `Telegram: @${lead.telegram_username}\n`
          : `Telegram: —\n`) +
        `Lead ID: ${lead.id}`

      await sendTelegramMessage(agency.telegram_manager_chat_id, managerText, {
        inline_keyboard: [
          [
            { text: '📞 Взял в работу', callback_data: `progress_${lead.id}` },
            { text: '✅ Закрыта', callback_data: `closed_${lead.id}` },
          ],
        ],
      })
    }

    // --- 2. Подтверждение клиенту (новое) ---
    if (lead.telegram_user_id && lead.telegram_user_id !== 'unknown') {
      const clientName = lead.client_name ? `, ${lead.client_name}` : ''
      const clientText =
        `Спасибо${clientName}! ✅\n\n` +
        `Ваша заявка принята. Менеджер ${agency?.name ?? ''} свяжется с вами в ближайшее время ` +
        `в Telegram или по телефону ${lead.phone}.`

      await sendTelegramMessage(lead.telegram_user_id, clientText)
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('Error: ' + err.message, { status: 500 })
  }
})
