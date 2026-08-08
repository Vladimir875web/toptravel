import { formatPrice } from '../lib/api'

export default function TourCard({ tour, onSelect }) {
  const price = formatPrice(tour.price_from, tour.currency)

  return (
    <button type="button" className="tour-card" onClick={() => onSelect(tour)}>
      <div
        className="tour-card__media"
        style={{
          backgroundImage: tour.image_url
            ? `url(${tour.image_url})`
            : undefined,
        }}
      >
        {tour.duration_days ? (
          <span className="tour-card__badge">{tour.duration_days} дн.</span>
        ) : null}
      </div>
      <div className="tour-card__body">
        <p className="tour-card__dest">{tour.destination}</p>
        <h3 className="tour-card__title">{tour.title}</h3>
        {price ? (
          <p className="tour-card__price">
            от <strong>{price}</strong>
          </p>
        ) : (
          <p className="tour-card__price">Цена по запросу</p>
        )}
      </div>
    </button>
  )
}
