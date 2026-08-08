import { useState } from 'react'
import { createLead } from '../lib/api'
import { getTelegramUser, haptic } from '../lib/telegram'

const initial = {
  phone: '',
  travelDates: '',
  budget: '',
  wishes: '',
}

export default function LeadForm({ tour, source, onBack, onSuccess }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const title =
    source === 'catalog' && tour
      ? `Заявка: ${tour.title}`
      : 'Индивидуальный подбор тура'

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const phone = form.phone.trim()
    if (phone.length < 8) {
      setError('Укажите корректный телефон')
      return
    }

    setLoading(true)
    try {
      const tgUser = getTelegramUser()
      await createLead({
        source,
        tourId: tour?.id,
        phone,
        travelDates: form.travelDates.trim(),
        budget: form.budget.trim(),
        wishes: form.wishes.trim(),
        customerName: tgUser?.firstName || tgUser?.name || null,
        telegramUserId: tgUser?.id || null,
        telegramUsername: tgUser?.username || null,
      })
      haptic('medium')
      onSuccess()
    } catch (err) {
      console.error(err)
      setError('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Назад
      </button>

      <header className="form-screen__head">
        <p className="eyebrow">Заявка менеджеру</p>
        <h2>{title}</h2>
        <p className="muted">
          Коротко заполните форму — менеджер свяжется с вами в Telegram или по
          телефону.
        </p>
      </header>

      <form className="lead-form" onSubmit={handleSubmit}>
        <label>
          <span>Телефон *</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="+420 / +380 ..."
            value={form.phone}
            onChange={update('phone')}
            required
            autoComplete="tel"
          />
        </label>

        <label>
          <span>Даты поездки</span>
          <input
            type="text"
            placeholder="Напр. 10–20 сентября"
            value={form.travelDates}
            onChange={update('travelDates')}
          />
        </label>

        <label>
          <span>Бюджет</span>
          <input
            type="text"
            placeholder="Напр. до 1500 € на двоих"
            value={form.budget}
            onChange={update('budget')}
          />
        </label>

        <label>
          <span>Пожелания</span>
          <textarea
            rows={4}
            placeholder="Куда, с кем, отель, перелёт…"
            value={form.wishes}
            onChange={update('wishes')}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
        >
          {loading ? 'Отправляем…' : 'Отправить заявку'}
        </button>
      </form>
    </section>
  )
}
