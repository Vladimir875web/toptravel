/** Demo catalog when Supabase env is not configured */

export const demoCategories = [
  { id: 'c1', name: 'Море', slug: 'sea', sort_order: 1 },
  { id: 'c2', name: 'Европа', slug: 'europe', sort_order: 2 },
  { id: 'c3', name: 'Экзотика', slug: 'exotic', sort_order: 3 },
]

export const demoTours = [
  {
    id: 't1',
    category_id: 'c1',
    title: 'Анталья · All Inclusive',
    destination: 'Турция, Анталья',
    description:
      '7 ночей в 5★ отеле у моря. Перелёт, трансфер и страховка включены. Идеально для семьи или пары.',
    price_from: 699,
    currency: 'EUR',
    duration_days: 8,
    image_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    is_active: true,
  },
  {
    id: 't2',
    category_id: 'c2',
    title: 'Прага выходного дня',
    destination: 'Чехия, Прага',
    description:
      '3 дня в центре города: отель 4★, завтраки, пешеходная экскурсия по Старому городу.',
    price_from: 289,
    currency: 'EUR',
    duration_days: 3,
    image_url:
      'https://images.unsplash.com/photo-1541849546-216549ae45b1?w=800&q=80',
    is_active: true,
  },
  {
    id: 't3',
    category_id: 'c3',
    title: 'Мальдивы · романтика',
    destination: 'Мальдивы',
    description:
      'Водная вилла, завтраки, трансфер на гидросамолёте. Тишина, бирюзовая вода и закаты вдвоём.',
    price_from: 1890,
    currency: 'EUR',
    duration_days: 7,
    image_url:
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    is_active: true,
  },
  {
    id: 't4',
    category_id: 'c1',
    title: 'Хургада · семейный отдых',
    destination: 'Египет, Хургада',
    description:
      '10 дней all inclusive, аквапарк и детский клуб. Прямой перелёт и встреча в аэропорту.',
    price_from: 820,
    currency: 'EUR',
    duration_days: 11,
    image_url:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    is_active: true,
  },
]
