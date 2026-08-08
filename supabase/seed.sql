-- Seed: insert agency + sample categories/tours
-- Replace CHAT_ID_МЕНЕДЖЕРА before running
-- Agency UUID is printed in Notices — put it into VITE_AGENCY_ID

do $$
declare
  v_agency_id uuid;
  v_sea uuid;
  v_europe uuid;
  v_exotic uuid;
begin
  insert into agencies (name, telegram_manager_chat_id)
  values ('Тестовое агентство', 'CHAT_ID_МЕНЕДЖЕРА')
  returning id into v_agency_id;

  insert into tour_categories (agency_id, name, slug, sort_order)
  values (v_agency_id, 'Море', 'sea', 1)
  returning id into v_sea;

  insert into tour_categories (agency_id, name, slug, sort_order)
  values (v_agency_id, 'Европа', 'europe', 2)
  returning id into v_europe;

  insert into tour_categories (agency_id, name, slug, sort_order)
  values (v_agency_id, 'Экзотика', 'exotic', 3)
  returning id into v_exotic;

  insert into tours (
    agency_id, category_id, title, destination, description,
    price_from, currency, duration_days, image_url
  ) values
  (
    v_agency_id, v_sea,
    'Анталья · All Inclusive',
    'Турция, Анталья',
    '7 ночей в 5★ отеле у моря. Перелёт, трансфер и страховка включены.',
    699, 'EUR', 8,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  ),
  (
    v_agency_id, v_europe,
    'Прага выходного дня',
    'Чехия, Прага',
    '3 дня в центре города: отель 4★, завтраки, пешеходная экскурсия.',
    289, 'EUR', 3,
    'https://images.unsplash.com/photo-1541849546-216549ae45b1?w=800'
  ),
  (
    v_agency_id, v_exotic,
    'Мальдивы · романтический отдых',
    'Мальдивы',
    'Водная вилла, завтраки, трансфер на гидросамолёте. Идеально для двоих.',
    1890, 'EUR', 7,
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800'
  ),
  (
    v_agency_id, v_sea,
    'Хургада · семейный отдых',
    'Египет, Хургада',
    '10 дней all inclusive, аквапарк и детский клуб. Прямой перелёт.',
    820, 'EUR', 11,
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
  );

  raise notice 'Agency ID (put into VITE_AGENCY_ID): %', v_agency_id;
end $$;
