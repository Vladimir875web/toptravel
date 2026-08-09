import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AGENCY_ID = import.meta.env.VITE_AGENCY_ID;

const emptyTour = {
  id: null,
  title: '',
  destination: '',
  description: '',
  price_from: '',
  currency: 'Kč',
  duration_days: '',
  image_url: '',
  category_id: '',
  is_active: true,
};

export default function ToursManager() {
  const [tours, setTours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = закрыто, emptyTour = новый, объект = редактирование
  const [saving, setSaving] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  async function loadAll() {
    setLoading(true);
    const { data: toursData } = await supabase
      .from('tours')
      .select('*')
      .eq('agency_id', AGENCY_ID)
      .order('sort_order');

    const { data: catsData } = await supabase
      .from('tour_categories')
      .select('*')
      .eq('agency_id', AGENCY_ID)
      .order('sort_order');

    setTours(toursData ?? []);
    setCategories(catsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function categoryName(id) {
    return categories.find((c) => c.id === id)?.name ?? '—';
  }

  async function handleSave() {
    if (!editing.title.trim()) {
      alert('Укажите название тура');
      return;
    }
    if (!editing.destination?.trim()) {
      alert('Укажите направление');
      return;
    }
    setSaving(true);

    const payload = {
      agency_id: AGENCY_ID,
      title: editing.title,
      destination: editing.destination.trim(),
      description: editing.description || null,
      price_from: editing.price_from ? parseFloat(editing.price_from) : null,
      currency: editing.currency || 'Kč',
      duration_days: editing.duration_days ? parseInt(editing.duration_days, 10) : null,
      image_url: editing.image_url || null,
      category_id: editing.category_id || null,
      is_active: editing.is_active,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from('tours').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('tours').insert(payload));
    }

    setSaving(false);

    if (error) {
      alert('Не удалось сохранить: ' + error.message);
      return;
    }

    setEditing(null);
    loadAll();
  }

  async function handleImportFromUrl() {
    if (!importUrl.trim()) return;
    setImporting(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-tour-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: importUrl }),
        }
      );
      const data = await res.json();

      if (data.error) {
        alert('Не удалось получить данные: ' + data.error);
        setImporting(false);
        return;
      }

      let priceFrom = '';
      if (data.priceGuess) {
        const digits = String(data.priceGuess).replace(/[^\d]/g, '');
        if (digits) priceFrom = digits;
      }

      setEditing({
        ...emptyTour,
        title: data.title || '',
        description: data.description || '',
        image_url: data.image || '',
        price_from: priceFrom,
        currency: 'Kč',
      });
    } catch (err) {
      alert('Ошибка при обращении к странице: ' + err.message);
    }

    setImporting(false);
  }

  async function handleDelete(tourId) {
    if (!confirm('Удалить этот тур? Действие необратимо.')) return;
    const { error } = await supabase.from('tours').delete().eq('id', tourId);
    if (error) {
      alert('Не удалось удалить: ' + error.message);
      return;
    }
    loadAll();
  }

  async function toggleActive(tour) {
    const { error } = await supabase
      .from('tours')
      .update({ is_active: !tour.is_active })
      .eq('id', tour.id);
    if (error) {
      alert('Не удалось изменить статус');
      return;
    }
    loadAll();
  }

  if (editing) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ margin: 0, fontSize: 20 }}>
            {editing.id ? 'Редактирование тура' : 'Новый тур'}
          </h1>
          <button onClick={() => setEditing(null)} style={styles.cancelBtn}>
            ✕ Отмена
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Название *</label>
          <input
            style={styles.input}
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            placeholder="Турция, Анталья — 7 ночей"
          />

          <label style={styles.label}>Направление *</label>
          <input
            style={styles.input}
            value={editing.destination || ''}
            onChange={(e) =>
              setEditing({ ...editing, destination: e.target.value })
            }
            placeholder="Турция, Анталья"
            required
          />

          <label style={styles.label}>Категория</label>
          <select
            style={styles.input}
            value={editing.category_id || ''}
            onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
          >
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label style={styles.label}>Описание</label>
          <textarea
            style={{ ...styles.input, minHeight: 80 }}
            value={editing.description || ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            placeholder="Что входит, особенности тура..."
          />

          <div style={styles.row2}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Цена от (Kč)</label>
              <input
                style={styles.input}
                type="number"
                value={editing.price_from || ''}
                onChange={(e) => setEditing({ ...editing, price_from: e.target.value })}
                placeholder="149000"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Дней</label>
              <input
                style={styles.input}
                type="number"
                value={editing.duration_days || ''}
                onChange={(e) => setEditing({ ...editing, duration_days: e.target.value })}
                placeholder="8"
              />
            </div>
          </div>

          <label style={styles.label}>Ссылка на фото</label>
          <input
            style={styles.input}
            value={editing.image_url || ''}
            onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
            placeholder="https://..."
          />
          {editing.image_url && (
            <img src={editing.image_url} alt="preview" style={styles.photoPreview} />
          )}

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
            />
            Показывать в каталоге
          </label>

          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Туры</h1>
        <button onClick={() => setEditing(emptyTour)} style={styles.addBtn}>
          + Добавить тур
        </button>
      </div>

      <div style={styles.importBox}>
        <input
          style={styles.input}
          placeholder="Вставь ссылку на тур с traveldeluxe.cz..."
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
        />
        <button
          onClick={handleImportFromUrl}
          disabled={importing}
          style={styles.importBtn}
        >
          {importing ? 'Загрузка...' : 'Подтянуть данные'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>Загрузка...</div>
      ) : tours.length === 0 ? (
        <div style={{ padding: 20, color: '#888' }}>Туров пока нет</div>
      ) : (
        <div style={styles.list}>
          {tours.map((tour) => (
            <div key={tour.id} style={styles.card}>
              {tour.image_url && (
                <img src={tour.image_url} alt={tour.title} style={styles.thumb} />
              )}
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitleRow}>
                  <b>{tour.title}</b>
                  {!tour.is_active && <span style={styles.hiddenBadge}>скрыт</span>}
                </div>
                <div style={styles.cardMeta}>
                  {tour.destination || '—'}
                  {categoryName(tour.category_id)
                    ? ` · ${categoryName(tour.category_id)}`
                    : ''}
                  {tour.duration_days ? ` · ${tour.duration_days} дн.` : ''}
                  {tour.price_from
                    ? ` · от ${tour.price_from} ${tour.currency || 'Kč'}`
                    : ''}
                </div>
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => toggleActive(tour)} style={styles.smallBtn}>
                  {tour.is_active ? 'Скрыть' : 'Показать'}
                </button>
                <button onClick={() => setEditing(tour)} style={styles.smallBtn}>
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(tour.id)}
                  style={{ ...styles.smallBtn, color: '#ef4444', borderColor: '#7f1d1d' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, sans-serif',
    padding: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: {
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
  },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  hiddenBadge: {
    fontSize: 11,
    background: '#7c2d12',
    color: '#fdba74',
    padding: '2px 8px',
    borderRadius: 10,
  },
  cardMeta: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0 },
  smallBtn: {
    background: '#0f172a',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 480 },
  label: { fontSize: 13, color: '#94a3b8', marginTop: 10, marginBottom: 4 },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#fff',
    boxSizing: 'border-box',
    fontSize: 14,
  },
  row2: { display: 'flex', gap: 12 },
  photoPreview: {
    width: '100%',
    maxWidth: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 20,
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
  },
  importBox: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  importBtn: {
    background: '#334155',
    color: '#fff',
    border: '1px solid #475569',
    borderRadius: 8,
    padding: '10px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 14,
  },
};
