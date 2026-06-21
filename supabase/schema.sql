-- ============================================================================
-- Aban's 2nd birthday — Supabase schema
-- ============================================================================
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Public site, no auth. Everyone may READ all tables. The ONLY thing the public
-- may write is the `reserved` column of `wishlist` (claim / release a gift).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Single row of event details (date is localized; address is shared).
create table if not exists public.event_info (
  id       int primary key default 1,
  address  text not null,
  en_date  text not null,
  nl_date  text not null,
  fa_date  text not null,
  constraint event_info_single_row check (id = 1)
);

-- Party activities (ordered, localized title + description).
create table if not exists public.party_info (
  id        bigint generated always as identity primary key,
  position  int  not null default 0,
  emoji     text not null,
  en_title  text not null,
  en_desc   text not null,
  nl_title  text not null,
  nl_desc   text not null,
  fa_title  text not null,
  fa_desc   text not null
);

-- Gift wishlist (ordered, localized name, claimable `reserved` flag).
create table if not exists public.wishlist (
  id        text primary key,
  position  int     not null default 0,
  emoji     text    not null,
  en_name   text    not null,
  nl_name   text    not null,
  fa_name   text    not null,
  reserved  boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.event_info enable row level security;
alter table public.party_info enable row level security;
alter table public.wishlist   enable row level security;

drop policy if exists "public read event"    on public.event_info;
drop policy if exists "public read party"     on public.party_info;
drop policy if exists "public read wishlist"  on public.wishlist;
drop policy if exists "public reserve gift"   on public.wishlist;

create policy "public read event"   on public.event_info for select using (true);
create policy "public read party"    on public.party_info for select using (true);
create policy "public read wishlist" on public.wishlist   for select using (true);

-- Allow anonymous UPDATE on wishlist rows. Column-level grants below ensure
-- only the `reserved` column can actually be changed.
create policy "public reserve gift"  on public.wishlist
  for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Column-level privileges (the real lock — only `reserved` is writable)
-- ---------------------------------------------------------------------------
revoke all on public.event_info, public.party_info, public.wishlist
  from anon, authenticated;

grant select on public.event_info, public.party_info, public.wishlist
  to anon, authenticated;

grant update (reserved) on public.wishlist to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (so reservations sync live across visitors)
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.wishlist;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Seed data  (owner can edit these rows later in the Table Editor)
-- ---------------------------------------------------------------------------
insert into public.event_info (id, address, en_date, nl_date, fa_date)
values (
  1,
  '12 Tulip Lane, 1011 AB Amsterdam',
  'Sunday, July 13 · 2:00 pm',
  'Zondag 13 juli · 14:00 uur',
  'یکشنبه ۱۳ ژوئیه · ساعت ۲ بعدازظهر'
)
on conflict (id) do nothing;

insert into public.party_info (position, emoji, en_title, en_desc, nl_title, nl_desc, fa_title, fa_desc)
values
  (1, '🏊', 'Splash pool',       'Out back in the garden, bring swimwear',
            'Zwembad',           'Achter in de tuin, neem zwemkleding mee',
            'استخر آب‌بازی',      'توی حیاط پشتی، لباس شنا بیار'),
  (2, '🌈', 'Play-dough corner', 'Squish, roll and shape colorful play dough — aprons provided.',
            'Kleihoek',          'Kneden, rollen en vormen met kleurrijke klei — schortjes aanwezig.',
            'گوشهٔ خمیربازی',     'با خمیربازی رنگی ورز بده و شکل بساز — پیش‌بند داریم.'),
  (3, '🍔', 'BBQ & cold drinks', 'For the grown-ups — with tasty snacks for the kids too.',
            'BBQ & koude drankjes','Voor de volwassenen — en lekkere snacks voor de kleintjes.',
            'باربیکیو و نوشیدنی خنک','برای بزرگ‌ترها — و خوراکی‌های خوشمزه برای بچه‌ها.'),
  (4, '🎶', 'Singing & dancing', 'Sing along and show off your best moves with the little ones.',
            'Zingen & dansen',   'Zing mee en laat je beste moves zien met de kleintjes.',
            'آواز و رقص',         'با بچه‌ها بخون و برقص و قشنگ‌ترین حرکاتت رو نشون بده.')
on conflict do nothing;

insert into public.wishlist (id, position, emoji, en_name, nl_name, fa_name, reserved)
values
  ('beach-toys',     1, '🏖️', 'Beach toy set',          'Strandspeelset',                 'Beach toy set',               false),
  ('towel-poncho',   2, '🦖', 'Towel poncho (2-3 years)','Badponcho / handdoek (2-3 jaar)','Towel poncho (2-3 years)',     false),
  ('magnet-tiles',   3, '🧲', 'Magnet tiles',           'Magnetische tegels',             'Magnet tiles',                false),
  ('igor-sandals',   4, '🩴', 'Igor sandals (size 21)', 'Igor sandalen (maat 21)',        'Igor sandals (size 21)',      false),
  ('play-tent',      5, '⛺', 'Play tent',              'Speeltent',                      'Play tent',                   false),
  ('train',          6, '🚂', 'Train',                  'Trein',                          'Train',                       false),
  ('flamingo-ring',  7, '🦩', 'Flamingo swimming ring (kids)','Flamingo zwemband (kinderen)','Flamingo swimming ring (kids)',false),
  ('finger-paint',   8, '🎨', 'Finger paint',           'Vingerverf',                     'Finger paint',                false)
on conflict (id) do nothing;
