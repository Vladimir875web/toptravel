import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ToursManager from './ToursManager';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const STATUS_LABELS = {
  new: 'Новая',
  in_progress: 'В работе',
  offer_sent: 'Предложение отправлено',
  closed_won: 'Закрыта — успех',
  closed_lost: 'Закрыта — отказ',
};

const STATUS_COLORS = {
  new: '#3b82f6',
  in_progress: '#f59e0b',
  offer_sent: '#8b5cf6',
  closed_won: '#10b981',
  closed_lost: '#ef4444',
};

const STATUS_ORDER = ['new', 'in_progress', 'offer_sent', 'closed_won', 'closed_lost'];

export default function AdminPanel() {
  const [authed, setAuthed] = useState(
    sessionStorage.getItem('admin_authed') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [leads, setLeads] = useState([]);
  const [tours, setTours] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('leads'); // leads | tours

  function handleLogin() {
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true');
      setAuthed(true);
    } else {
      alert('Неверный пароль');
    }
  }

  async function loadLeads() {
    setLoading(true);
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: toursData } = await supabase.from('tours').select('id, title');
    const toursMap = {};
    (toursData ?? []).forEach((t) => (toursMap[t.id] = t.title));

    setLeads(leadsData ?? []);
    setTours(toursMap);
    setLoading(false);
  }

  useEffect(() => {
    if (authed) loadLeads();
  }, [authed]);

  async function updateStatus(leadId, newStatus) {
    // optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);
    if (error) {
      alert('Не удалось обновить статус');
      loadLeads(); // revert on failure
    }
  }

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <h2 style={{ marginBottom: 16 }}>Вход в админку</h2>
          <input
            type="password"
            placeholder="Пароль"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={styles.input}
            autoFocus
          />
          <button onClick={handleLogin} style={styles.loginBtn}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  const visibleLeads =
    filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div style={styles.page}>
      <div style={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab('leads')}
          style={tab === 'leads' ? styles.tabActive : styles.tab}
        >
          Заявки
        </button>
        <button
          type="button"
          onClick={() => setTab('tours')}
          style={tab === 'tours' ? styles.tabActive : styles.tab}
        >
          Туры
        </button>
      </div>

      {tab === 'tours' ? (
        <ToursManager />
      ) : (
        <>
          <div style={styles.header}>
            <h1 style={{ margin: 0, fontSize: 20 }}>Заявки</h1>
            <button onClick={loadLeads} style={styles.refreshBtn}>
              ↻ Обновить
            </button>
          </div>

          <div style={styles.filters}>
            <button
              onClick={() => setFilter('all')}
              style={filter === 'all' ? styles.filterBtnActive : styles.filterBtn}
            >
              Все ({leads.length})
            </button>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={filter === s ? styles.filterBtnActive : styles.filterBtn}
              >
                {STATUS_LABELS[s]} ({leads.filter((l) => l.status === s).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>Загрузка...</div>
          ) : visibleLeads.length === 0 ? (
            <div style={{ padding: 20, color: '#888' }}>Заявок нет</div>
          ) : (
            <div style={styles.list}>
              {visibleLeads.map((lead) => (
                <div key={lead.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span
                      style={{
                        ...styles.badge,
                        background: STATUS_COLORS[lead.status] ?? '#888',
                      }}
                    >
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                    <span style={styles.date}>
                      {new Date(lead.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  <div style={styles.row}>
                    <b>
                      {lead.client_name ||
                        (lead.telegram_username
                          ? `@${lead.telegram_username}`
                          : 'Без имени')}
                    </b>{' '}
                    — <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                  </div>

                  {lead.tour_id && tours[lead.tour_id] && (
                    <div style={styles.row}>Тур: {tours[lead.tour_id]}</div>
                  )}
                  {!lead.tour_id && (
                    <div style={styles.row}>Тип: индивидуальный подбор</div>
                  )}
                  {lead.travel_dates && (
                    <div style={styles.row}>Даты: {lead.travel_dates}</div>
                  )}
                  {lead.budget && (
                    <div style={styles.row}>Бюджет: {lead.budget}</div>
                  )}
                  {lead.travelers_count && (
                    <div style={styles.row}>
                      Человек: {lead.travelers_count}
                    </div>
                  )}
                  {lead.wishes && (
                    <div style={styles.comment}>«{lead.wishes}»</div>
                  )}

                  <div style={styles.statusButtons}>
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(lead.id, s)}
                        style={{
                          ...styles.statusBtn,
                          ...(lead.status === s ? styles.statusBtnActive : {}),
                        }}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    padding: 4,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabActive: {
    flex: 1,
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshBtn: {
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterBtn: {
    background: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: '#14b8a6',
    color: '#fff',
    border: '1px solid #14b8a6',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    color: '#fff',
    fontSize: 12,
    padding: '3px 10px',
    borderRadius: 12,
    fontWeight: 600,
  },
  date: { fontSize: 12, color: '#64748b' },
  row: { fontSize: 14, marginBottom: 4, color: '#cbd5e1' },
  comment: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 8,
  },
  statusButtons: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #334155',
  },
  statusBtn: {
    background: '#0f172a',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  statusBtnActive: {
    background: '#334155',
    color: '#fff',
    border: '1px solid #64748b',
  },
  loginWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
  },
  loginBox: {
    background: '#1e293b',
    padding: 32,
    borderRadius: 16,
    width: 280,
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#fff',
    marginBottom: 12,
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: 'none',
    background: '#14b8a6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
