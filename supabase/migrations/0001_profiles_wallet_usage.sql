-- Vibely — Aşama 1: kimlik, profil, cüzdan ve konuşma süresi sayacı.
--
-- Bu dosyayı Supabase panelinde SQL Editor'e yapıştırıp çalıştır.
-- Tek seferliktir; tekrar çalıştırmak güvenlidir (IF NOT EXISTS / OR REPLACE).

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- profiles — auth.users'a bağlı herkese açık profil bilgisi.
-- Hesap silme talebinde satır silinmez, deleted_at işaretlenir; yoksa geçmiş
-- odalar ve mesajlar kırılır. Apple hesap silme özelliğini zorunlu tutuyor.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      citext unique not null,
  display_name  text not null,
  avatar_url    text,
  country       text,
  locale        text not null default 'en' check (locale in ('en', 'tr')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- ---------------------------------------------------------------------------
-- wallets — jeton bakiyesi. İstemci BURAYA ASLA YAZAMAZ, sadece okur.
-- Bakiye yalnızca aşağıdaki güvenli fonksiyonlar ve Edge Function'lar üzerinden
-- değişir. Bu kural gevşetilirse biri konsoldan kendine 100 bin jeton yazar.
-- ---------------------------------------------------------------------------
create table if not exists public.wallets (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  jeton_balance integer not null default 0 check (jeton_balance >= 0),
  updated_at    timestamptz not null default now()
);

-- transactions — değişmez muhasebe defteri. Her jeton hareketi buraya düşer,
-- satır güncellenmez veya silinmez. İtiraz/iade durumunda tek doğru kaynak bu.
create table if not exists public.transactions (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  delta      integer not null,
  reason     text not null check (reason in (
                'purchase', 'ad_reward', 'invite_reward', 'signup_bonus',
                'spend_time', 'spend_game', 'refund', 'admin_adjust')),
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- call_usage — günlük konuşma süresi. Günde bir satır.
-- Haftalık toplam bu satırların toplamıdır, ayrı tablo tutmaya gerek yok.
-- ---------------------------------------------------------------------------
create table if not exists public.call_usage (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  day           date not null default current_date,
  used_seconds  integer not null default 0 check (used_seconds >= 0),
  bonus_seconds integer not null default 0 check (bonus_seconds >= 0),
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Yeni kullanıcı kaydolunca profil ve cüzdanı otomatik oluştur.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  -- Kayıt formundan gelen kullanıcı adı yoksa e-postadan türet, çakışırsa sonuna sayı ekle.
  base_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  if length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 8);
  end if;
  while exists (select 1 from public.profiles where username = base_username) loop
    base_username := left(base_username, 16) || floor(random() * 1000)::text;
  end loop;

  insert into public.profiles (id, username, display_name, locale)
  values (
    new.id,
    base_username,
    coalesce(new.raw_user_meta_data ->> 'display_name', base_username),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  );
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- record_call_seconds — konuşma süresini işler.
-- İstemci call_usage'a doğrudan yazamaz; yalnızca bu fonksiyonu çağırır ve
-- fonksiyon sadece çağıranın kendi satırını, dar bir aralıkta artırabilir.
-- ---------------------------------------------------------------------------
create or replace function public.record_call_seconds(seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  -- Tek çağrıda en fazla 2 dakika; aksi halde istemci saatlerce süreyi tek seferde atlayabilir.
  if seconds is null or seconds <= 0 or seconds > 120 then
    raise exception 'seconds out of range';
  end if;

  insert into public.call_usage (user_id, day, used_seconds)
  values (auth.uid(), current_date, seconds)
  on conflict (user_id, day)
  do update set used_seconds = public.call_usage.used_seconds + excluded.used_seconds;
end;
$$;

-- call_time_status — istemcinin limit ekranını göstermek için okuduğu özet.
create or replace function public.call_time_status()
returns table (daily_used integer, daily_bonus integer, weekly_used integer, weekly_bonus integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select used_seconds  from public.call_usage where user_id = auth.uid() and day = current_date), 0),
    coalesce((select bonus_seconds from public.call_usage where user_id = auth.uid() and day = current_date), 0),
    coalesce((select sum(used_seconds)::integer  from public.call_usage
              where user_id = auth.uid() and day >= date_trunc('week', current_date)::date), 0),
    coalesce((select sum(bonus_seconds)::integer from public.call_usage
              where user_id = auth.uid() and day >= date_trunc('week', current_date)::date), 0);
$$;

-- ---------------------------------------------------------------------------
-- updated_at otomatiği
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists wallets_touch on public.wallets;
create trigger wallets_touch before update on public.wallets
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — her tablo kapalı başlar, izinler tek tek açılır.
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.wallets      enable row level security;
alter table public.transactions enable row level security;
alter table public.call_usage   enable row level security;

-- profiles: giriş yapmış herkes silinmemiş profilleri görebilir (arkadaş arama için),
-- ama yalnızca kendi satırını güncelleyebilir. Satır ekleme trigger'ın işi.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (deleted_at is null);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- wallets / transactions / call_usage: sadece kendi satırını OKUMA.
-- Bilinçli olarak hiçbir insert/update/delete politikası yok: yazma yalnızca
-- security definer fonksiyonlar ve service_role (Edge Functions) üzerinden.
drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists call_usage_select_own on public.call_usage;
create policy call_usage_select_own on public.call_usage
  for select to authenticated using (user_id = auth.uid());

grant execute on function public.record_call_seconds(integer) to authenticated;
grant execute on function public.call_time_status() to authenticated;
