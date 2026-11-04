-- Tabel RSVP (hadir / tidak hadir)
create table rsvp (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  hadir boolean not null,
  jumlah_pax int default 0,          -- total termasuk diri sendiri
  kategori text,                      -- 'sendiri' | 'pasangan' | 'keluarga'
  checked_in boolean default false,
  created_at timestamptz default now()
);

-- Tabel doa/ucapan (terhubung taman bunga)
create table doa (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  pesan text not null,
  sumber text default 'rsvp',         -- 'rsvp' | 'checkin'
  bunga text,                          -- jenis bunga
  created_at timestamptz default now()
);

-- Tabel foto photobooth
create table photos (
  id uuid primary key default gen_random_uuid(),
  nama text,
  image_url text not null,
  template text,
  created_at timestamptz default now()
);

-- View: total pax terpakai
create or replace view total_pax as
  select coalesce(sum(jumlah_pax),0) as terpakai
  from rsvp where hadir = true;

-- RLS (Row Level Security) — buka akses anon untuk demo
alter table rsvp enable row level security;
alter table doa enable row level security;
alter table photos enable row level security;

create policy "allow anon insert rsvp" on rsvp for insert to anon with check (true);
create policy "allow anon select rsvp" on rsvp for select to anon using (true);
create policy "allow anon update rsvp" on rsvp for update to anon using (true);

create policy "allow anon insert doa" on doa for insert to anon with check (true);
create policy "allow anon select doa" on doa for select to anon using (true);

create policy "allow anon insert photos" on photos for insert to anon with check (true);
create policy "allow anon select photos" on photos for select to anon using (true);

-- Storage bucket untuk foto
insert into storage.buckets (id, name, public) values ('photobooth', 'photobooth', true)
  on conflict do nothing;

create policy "allow anon upload photobooth"
  on storage.objects for insert to anon
  with check (bucket_id = 'photobooth');

create policy "allow public read photobooth"
  on storage.objects for select to anon
  using (bucket_id = 'photobooth');
