-- Optional seed: the nine placeholder experiments.
--
-- This is `supabase/seed.sql`, the Supabase convention for seed data, and NOT a
-- migration — it is not part of the schema history and you can skip it. It exists
-- because the field pages read experiments from the database now, so without it
-- `/fisika`, `/kimia` and `/biologi` go from nine cards to none until the author
-- publishes something.
--
-- These are the same nine that used to live in `content/experiments.json`,
-- imported here as **published** so the site looks the same as it did. They have
-- no materials, steps or concepts: those are the author's to write, and opening
-- one in the editor will require at least one step before it saves.
--
-- Idempotent — `on conflict (slug) do nothing` — so running it twice is safe, and
-- re-running it will not resurrect an experiment that was deleted on purpose.

insert into public.experiments
  (slug, field_slug, title, hook, difficulty, est_minutes, order_index, status, published_at)
values
  ('balon-roket', 'fisika', 'Balon Roket',
   'Tiup balon, lalu lepaskan. Balonnya terbang sendiri! Kenapa bisa begitu?',
   'mudah', 10, 1, 'published', now()),
  ('pelangi-air', 'fisika', 'Pelangi Air',
   'Kamu bisa membuat pelangi di dalam rumah. Hanya perlu air dan cahaya.',
   'sedang', 15, 2, 'published', now()),
  ('jembatan-kertas', 'fisika', 'Jembatan Kertas',
   'Kertas itu tipis. Tapi bisa kuat menahan buku. Rahasianya ada di bentuknya.',
   'sedang', 20, 3, 'published', now()),
  ('slime-ajaib', 'kimia', 'Slime Ajaib',
   'Campur dua bahan, aduk, dan jadilah slime kenyal. Kamu bisa membuatnya sendiri!',
   'mudah', 20, 1, 'published', now()),
  ('gunung-meletus', 'kimia', 'Gunung Meletus',
   'Bikin gunung berapi di meja makan. Busanya meluap seperti lava!',
   'mudah', 15, 2, 'published', now()),
  ('tinta-rahasia', 'kimia', 'Tinta Rahasia',
   'Tulis pesan rahasia dengan air lemon. Pesannya hilang, lalu muncul lagi.',
   'sedang', 15, 3, 'published', now()),
  ('daun-bernapas', 'biologi', 'Daun Bernapas',
   'Daun ternyata bernapas. Kamu bisa melihat gelembungnya di dalam air.',
   'sedang', 20, 1, 'published', now()),
  ('bunga-berwarna', 'biologi', 'Bunga Berwarna',
   'Beri bunga putih air berwarna. Kelopaknya berganti warna sendiri.',
   'mudah', 30, 2, 'published', now()),
  ('sidik-jari', 'biologi', 'Sidik Jari',
   'Setiap orang punya sidik jari yang berbeda. Bahkan kamu dan aku!',
   'mudah', 15, 3, 'published', now())
on conflict (slug) do nothing;
