import { useEffect, useState } from 'react'
import Catalog from './components/Catalog'
import LeadForm from './components/LeadForm'
import Success from './components/Success'
import TourDetail from './components/TourDetail'
import { fetchCatalog } from './lib/api'
import { haptic, initTelegram } from './lib/telegram'

export default function App() {
  const [view, setView] = useState('catalog') // catalog | detail | form | success
  const [categories, setCategories] = useState([])
  const [tours, setTours] = useState([])
  const [demo, setDemo] = useState(false)
  const [selectedTour, setSelectedTour] = useState(null)
  const [formSource, setFormSource] = useState('custom')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    initTelegram()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchCatalog()
        if (cancelled) return
        setCategories(data.categories)
        setTours(data.tours)
        setDemo(data.demo)
      } catch (err) {
        console.error(err)
        if (!cancelled) setLoadError('Не удалось загрузить каталог')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function openTour(tour) {
    haptic('light')
    setSelectedTour(tour)
    setView('detail')
  }

  function openCustomForm() {
    haptic('light')
    setSelectedTour(null)
    setFormSource('custom')
    setView('form')
  }

  function openTourForm() {
    setFormSource('catalog')
    setView('form')
  }

  function goCatalog() {
    setView('catalog')
    setSelectedTour(null)
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading">Загружаем туры…</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="loading">{loadError}</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {view === 'catalog' && (
        <Catalog
          categories={categories}
          tours={tours}
          demo={demo}
          onSelectTour={openTour}
          onCustom={openCustomForm}
        />
      )}

      {view === 'detail' && selectedTour && (
        <TourDetail
          tour={selectedTour}
          onBack={goCatalog}
          onApply={openTourForm}
        />
      )}

      {view === 'form' && (
        <LeadForm
          tour={selectedTour}
          source={formSource}
          onBack={() =>
            setView(formSource === 'catalog' && selectedTour ? 'detail' : 'catalog')
          }
          onSuccess={() => setView('success')}
        />
      )}

      {view === 'success' && <Success onHome={goCatalog} />}
    </div>
  )
}
