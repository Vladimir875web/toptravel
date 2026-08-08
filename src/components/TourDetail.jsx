import { formatPrice } from '../lib/api'

export default function TourDetail({ tour, onBack, onApply }) {
  const price = formatPrice(tour.price_from, tour.currency)

  return (
    <section className="detail">
      <button type="button" className="back-btn" onClick={onBack}>
        ← К каталогу
      </button>

      <div
        className="detail__hero"
        style={{
          backgroundImage: tour.image_url
            ? `url(${tour.image_url})`
            : undefined,
        }}
      />

      <div className="detail__content">
        <p className="eyebrow">{tour.destination}</p>
        <h2>{tour.title}</h2>
        <div className="detail__meta">
          {tour.duration_days ? <span>{tour.duration_days} дней</span> : null}
          {price ? <span>от {price}</span> : <span>Цена по запросу</span>}
        </div>
        <p className="detail__desc">{tour.description}</p>
      </div>

      <div className="sticky-cta">
        <button type="button" className="btn btn--primary" onClick={onApply}>
          Оставить заявку
        </button>
      </div>
    </section>
  )
}
