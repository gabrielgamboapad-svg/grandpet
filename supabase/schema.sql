-- Esquema de la base de GrandPET en Supabase (proyecto "grandpet").
-- Ya está aplicado; este archivo es la referencia para reconstruirlo.

-- Admins: correos de Google con permiso de administración.
create table public.admins (
  email text primary key check (email = lower(email) and email like '%@%'),
  added_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.prevent_last_admin() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from public.admins) <= 1 then
    raise exception 'Debe quedar al menos un administrador';
  end if;
  return old;
end;
$$;
create trigger admins_keep_one before delete on public.admins
  for each row execute function public.prevent_last_admin();

alter table public.admins enable row level security;
create policy admins_select on public.admins for select to authenticated using (public.is_admin());
create policy admins_insert on public.admins for insert to authenticated with check (public.is_admin());
create policy admins_delete on public.admins for delete to authenticated using (public.is_admin());

-- Pedidos: se crean desde el carrito (con o sin sesión).
create table public.orders (
  id bigint generated always as identity primary key,
  ref text not null unique check (ref ~ '^[A-F0-9]{8}$'),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  customer jsonb not null check (jsonb_typeof(customer) = 'object' and length(customer::text) < 2000),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 60 and length(items::text) < 20000),
  subtotal numeric(10,2) not null check (subtotal >= 0 and subtotal < 1000000),
  status text not null default 'nuevo' check (status in ('nuevo','confirmado','enviado','entregado','cancelado')),
  admin_notes text check (length(admin_notes) < 1000)
);
create index orders_user_idx on public.orders (user_id);
create index orders_created_idx on public.orders (created_at desc);

alter table public.orders enable row level security;
-- ponytail: cualquiera puede crear un pedido (compra como invitado). Si llega spam, agregar captcha
-- o límite por IP con una Edge Function.
create policy orders_insert on public.orders for insert to anon, authenticated
  with check (status = 'nuevo' and admin_notes is null and (user_id is null or user_id = auth.uid()));
create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy orders_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Ediciones de productos desde el panel.
create table public.product_edits (
  handle text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and length(data::text) < 20000),
  updated_at timestamptz not null default now(),
  updated_by text default (auth.jwt() ->> 'email')
);
alter table public.product_edits enable row level security;
create policy product_edits_read on public.product_edits for select to anon, authenticated using (true);
create policy product_edits_insert on public.product_edits for insert to authenticated with check (public.is_admin());
create policy product_edits_update on public.product_edits for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy product_edits_delete on public.product_edits for delete to authenticated using (public.is_admin());

-- Promociones con fechas.
create table public.promos (
  id bigint generated always as identity primary key,
  text text not null check (length(text) between 3 and 140),
  code text check (length(code) <= 30),
  link text check (length(link) <= 200),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
alter table public.promos enable row level security;
create policy promos_read on public.promos for select to anon, authenticated using (true);
create policy promos_insert on public.promos for insert to authenticated with check (public.is_admin());
create policy promos_update on public.promos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy promos_delete on public.promos for delete to authenticated using (public.is_admin());

-- Ajustes con fechas (sección Ofertas y La Huella Dorada).
create table public.settings (
  key text primary key check (key in ('ofertas', 'huella')),
  value jsonb not null check (jsonb_typeof(value) = 'object')
);
alter table public.settings enable row level security;
create policy settings_read on public.settings for select to anon, authenticated using (true);
create policy settings_update on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reseñas por producto: solo con sesión; el admin las aprueba antes de publicarse.
create table public.reviews (
  id bigint generated always as identity primary key,
  handle text not null check (length(handle) between 1 and 200),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author text not null default 'Cliente' check (length(author) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(body) between 10 and 600),
  verified boolean not null default false,
  status text not null default 'pendiente' check (status in ('pendiente', 'publicada', 'rechazada')),
  created_at timestamptz not null default now(),
  unique (handle, user_id)
);
create index reviews_handle_idx on public.reviews (handle) where status = 'publicada';

-- Al crear: autor (nombre + inicial), usuario, estado pendiente y "compra verificada" si tiene un pedido
-- con ese producto. El cliente no puede falsear esos campos.
create or replace function public.reviews_before_insert() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  full_name text := coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '');
  parts text[] := regexp_split_to_array(trim(full_name), '\s+');
begin
  new.user_id := auth.uid();
  new.status := 'pendiente';
  new.created_at := now();
  new.author := case
    when full_name = '' then 'Cliente'
    when array_length(parts, 1) > 1 then parts[1] || ' ' || left(parts[2], 1) || '.'
    else parts[1] end;
  new.verified := exists (
    select 1 from public.orders o
    where o.user_id = auth.uid()
      and o.status <> 'cancelado'
      and o.items @> jsonb_build_array(jsonb_build_object('handle', new.handle))
  );
  return new;
end;
$$;
revoke all on function public.reviews_before_insert() from public, anon, authenticated;
create trigger reviews_set_fields before insert on public.reviews
  for each row execute function public.reviews_before_insert();

alter table public.reviews enable row level security;
create policy reviews_read_anon on public.reviews for select to anon using (status = 'publicada');
create policy reviews_read_auth on public.reviews for select to authenticated
  using (status = 'publicada' or user_id = (select auth.uid()) or public.is_admin());
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy reviews_update_admin on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy reviews_delete on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
