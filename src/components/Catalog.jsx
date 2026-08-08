import { useMemo, useState } from 'react'
import TourCard from './TourCard'

export default function Catalog({
  categories,
  tours,
  demo,
  onSelectTour,
  onCustom,
}) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return tours
    return tours.filter((t) => t.category_id === activeCategory)
  }, [tours, activeCategory])

  return (
    <section className="catalog">
      <header className="hero">
        <div className="hero__veil" />
        <div className="hero__content">
          <p className="brand">Toptravel Deluxe</p>
          <h1>Готовые туры и подбор под вас</h1>
          <p className="hero__sub">
            Выберите тур из каталога или опишите пожелания — менеджер ответит
            лично.
          </p>
          <button type="button" className="btn btn--accent" onClick={onCustom}>
            Подобрать тур индивидуально
          </button>
        </div>
      </header>

      {demo ? (
        <p className="demo-banner">
          Демо-режим: задайте VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и
          VITE_AGENCY_ID в .env
        </p>
      ) : null}

      <div className="catalog__body">
        <div className="chips" role="tablist" aria-label="Категории">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={
              activeCategory === 'all' ? 'chip chip--active' : 'chip'
            }
            onClick={() => setActiveCategory('all')}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === c.id}
              className={
                activeCategory === c.id ? 'chip chip--active' : 'chip'
              }
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="tour-grid">
          {filtered.length === 0 ? (
            <p className="muted empty">Пока нет туров в этой категории</p>
          ) : (
            filtered.map((tour) => (
              <TourCard key={tour.id} tour={tour} onSelect={onSelectTour} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
