-- ═══════════════════════════════════════════════════════════════════════════
-- INTEGRACIÓN CON REDES SOCIALES — FASE 1 (base de datos y seguridad)
--
-- Conexión de Páginas de Facebook para publicar desde RETADOR. El login de
-- RETADOR sigue siendo Google; Facebook es solo una conexión externa.
--
-- Reglas de seguridad de esta migración:
--  · Los tokens de Página viven SOLO en private.social_tokens, cifrados con
--    AES-256-GCM en la Edge Function (la llave SOCIAL_TOKEN_KEY nunca entra a
--    la base). El esquema "private" no está expuesto por la API.
--  · Los estados OAuth se guardan como hash SHA-256, nunca en texto plano.
--  · El navegador solo LEE (RLS del dueño) conexiones, Páginas y publicaciones
--    propias. Nunca escribe: todo lo escribe una Edge Function.
--  · En este proyecto todo lo nuevo en "public" nace con permisos para anon y
--    authenticated (default privileges), y toda función nace ejecutable por
--    PUBLIC: por eso cada objeto revoca explícitamente lo que no corresponde.
--  · Las funciones auxiliares son SECURITY INVOKER y solo las ejecuta
--    service_role (que ya tiene BYPASSRLS). No hace falta SECURITY DEFINER.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Esquema privado ─────────────────────────────────────────────────────────
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- updated_at automático (solo para las tablas de esta integración).
create or replace function private.social_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.social_touch_updated_at() from public, anon, authenticated;

-- ── Acceso por plan (ÚNICO lugar que decide qué plan puede usar cada red) ───
-- Sin fila = sin acceso. Para habilitar Premium basta cambiar enabled; para
-- un plan de empresas, primero debe existir en public.plans y luego se añade
-- aquí su fila. No cambia la lógica general de planes.
create table private.social_plan_access (
  plan_id    text not null references public.plans(id) on update cascade on delete cascade,
  provider   text not null check (provider in ('facebook')),
  enabled    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (plan_id, provider)
);
alter table private.social_plan_access enable row level security;
revoke all on private.social_plan_access from public, anon, authenticated;
grant select, insert, update, delete on private.social_plan_access to service_role;

insert into private.social_plan_access (plan_id, provider, enabled) values
  ('gratis',  'facebook', false),
  ('pro',     'facebook', true),
  ('premium', 'facebook', false);  -- preparado, todavía sin habilitar

-- ── Conexiones (una por usuario y red) ──────────────────────────────────────
create table public.social_connections (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  provider               text not null check (provider in ('facebook')),
  external_user_id       text not null check (external_user_id ~ '^[0-9]{1,32}$'),
  external_name          text check (char_length(external_name) <= 200),
  scopes_granted         text[] not null default '{}',
  scopes_rejected        text[] not null default '{}',
  status                 text not null default 'active'
                           check (status in ('active', 'expired', 'revoked', 'replaced')),
  data_access_expires_at timestamptz,
  last_error_code        text check (char_length(last_error_code) <= 50),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id, provider),
  unique (id, user_id)
);
-- Una misma cuenta de Facebook solo puede estar ACTIVA en una cuenta de RETADOR.
create unique index social_connections_externo_activo
  on public.social_connections (provider, external_user_id) where status = 'active';
create trigger social_connections_updated_at before update on public.social_connections
  for each row execute function private.social_touch_updated_at();

-- ── Páginas de cada conexión ────────────────────────────────────────────────
create table public.social_pages (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null,
  user_id       uuid not null,
  page_id       text not null check (page_id ~ '^[0-9]{1,32}$'),
  page_name     text not null check (char_length(page_name) between 1 and 200),
  picture_url   text check (char_length(picture_url) <= 2000),
  tasks         text[] not null default '{}',
  is_default    boolean not null default false,
  status        text not null default 'active' check (status in ('active', 'no_access', 'revoked')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- La Página nunca puede quedar con un dueño distinto al de su conexión.
  foreign key (connection_id, user_id)
    references public.social_connections (id, user_id) on delete cascade,
  unique (connection_id, page_id),
  unique (id, user_id),
  check (not is_default or status = 'active')
);
create unique index social_pages_una_predeterminada
  on public.social_pages (connection_id) where is_default;
create index social_pages_user_id on public.social_pages (user_id);
create trigger social_pages_updated_at before update on public.social_pages
  for each row execute function private.social_touch_updated_at();

-- ── Tokens de Página (SOLO backend, cifrados) ───────────────────────────────
-- token_ciphertext = salida de AES-256-GCM (incluye la etiqueta de 16 bytes).
-- token_iv = nonce aleatorio de 12 bytes, distinto en cada cifrado.
-- key_version permite rotar SOCIAL_TOKEN_KEY sin perder los tokens existentes.
create table private.social_tokens (
  id               uuid primary key default gen_random_uuid(),
  social_page_id   uuid not null unique references public.social_pages(id) on delete cascade,
  token_ciphertext bytea not null check (octet_length(token_ciphertext) between 17 and 4096),
  token_iv         bytea not null check (octet_length(token_iv) = 12),
  key_version      smallint not null default 1 check (key_version > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table private.social_tokens enable row level security;
revoke all on private.social_tokens from public, anon, authenticated;
grant select, insert, update, delete on private.social_tokens to service_role;
create trigger social_tokens_updated_at before update on private.social_tokens
  for each row execute function private.social_touch_updated_at();

-- ── Estados OAuth de un solo uso ────────────────────────────────────────────
-- return_to es una CLAVE de destino permitido, nunca una URL (sin redirecciones
-- abiertas). La pantalla traduce la clave a su sección.
create table private.social_oauth_states (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  provider   text not null check (provider in ('facebook')),
  state_hash text not null unique check (state_hash ~ '^[0-9a-f]{64}$'),
  return_to  text not null default 'ajustes'
               check (return_to in ('ajustes', 'herramienta-video', 'producto')),
  expires_at timestamptz not null default now() + interval '10 minutes',
  created_at timestamptz not null default now(),
  used_at    timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '15 minutes')
);
alter table private.social_oauth_states enable row level security;
revoke all on private.social_oauth_states from public, anon, authenticated;
grant select, insert, update, delete on private.social_oauth_states to service_role;
create index social_oauth_states_pendientes
  on private.social_oauth_states (user_id, provider) where used_at is null;
create index social_oauth_states_expira on private.social_oauth_states (expires_at);

-- ── Publicaciones ───────────────────────────────────────────────────────────
create table public.social_publications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  social_page_id    uuid references public.social_pages(id) on delete set null,
  page_id           text not null check (page_id ~ '^[0-9]{1,32}$'),  -- copia para historial y límite
  product_id        uuid references public.products(id) on delete set null,
  publication_type  text not null check (publication_type in ('link', 'photo', 'video', 'reel')),
  idempotency_key   uuid not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'processing', 'published', 'failed')),
  message           text check (char_length(message) <= 5000),
  facebook_post_id  text check (char_length(facebook_post_id) <= 100),
  facebook_video_id text check (char_length(facebook_video_id) <= 100),
  permalink         text check (char_length(permalink) <= 2000),
  storage_path      text check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.mp4$'),
  error_code        text check (char_length(error_code) <= 50),
  error_message     text check (char_length(error_message) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz,
  -- Un reintento del cliente con la misma clave nunca crea otra publicación.
  unique (user_id, idempotency_key),
  check (storage_path is null or split_part(storage_path, '/', 1) = user_id::text)
);
-- Límite por hora (usuario + Página de Facebook, sobrevive a reconexiones).
create index social_publications_limite
  on public.social_publications (user_id, page_id, created_at desc);
-- El mismo producto no puede tener dos publicaciones EN CURSO del mismo tipo en la misma Página.
create unique index social_publications_en_curso
  on public.social_publications (page_id, product_id, publication_type)
  where status in ('pending', 'processing') and product_id is not null;
create trigger social_publications_updated_at before update on public.social_publications
  for each row execute function private.social_touch_updated_at();

-- ── RLS y permisos de las tablas visibles para el dueño ─────────────────────
alter table public.social_connections  enable row level security;
alter table public.social_pages        enable row level security;
alter table public.social_publications enable row level security;

revoke all on public.social_connections, public.social_pages, public.social_publications
  from public, anon, authenticated;
grant select on public.social_connections, public.social_pages, public.social_publications
  to authenticated;
grant select, insert, update, delete
  on public.social_connections, public.social_pages, public.social_publications to service_role;

create policy "dueño ve su conexión social" on public.social_connections
  for select to authenticated using (user_id = (select auth.uid()));
create policy "dueño ve sus páginas sociales" on public.social_pages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "dueño ve sus publicaciones sociales" on public.social_publications
  for select to authenticated using (user_id = (select auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIONES AUXILIARES — SECURITY INVOKER, solo service_role (Edge Functions)
-- ═══════════════════════════════════════════════════════════════════════════

-- Comprobación CENTRAL de plan y estado de la cuenta. Todas las Edge Functions
-- de redes sociales pasan por aquí; nunca se confía en lo que diga el navegador.
create or replace function public.social_plan_permite(p_user uuid, p_provider text)
returns jsonb language sql stable set search_path = '' as $$
  select case
    when pr.id is null                         then jsonb_build_object('permitido', false, 'motivo', 'sin_perfil')
    when coalesce(pr.is_suspended, false)      then jsonb_build_object('permitido', false, 'motivo', 'cuenta_suspendida', 'plan', pr.plan)
    when exists (select 1 from public.account_deletions d
                  where d.user_id = p_user and d.status = 'pendiente')
                                               then jsonb_build_object('permitido', false, 'motivo', 'eliminacion_pendiente', 'plan', pr.plan)
    when coalesce(pl.active, false) and coalesce(a.enabled, false)
                                               then jsonb_build_object('permitido', true, 'plan', pr.plan)
    else jsonb_build_object('permitido', false, 'motivo', 'plan_no_permitido', 'plan', pr.plan)
  end
  from (select 1) x
  left join public.profiles pr on pr.id = p_user
  left join public.plans pl on pl.id = pr.plan
  left join private.social_plan_access a on a.plan_id = pr.plan and a.provider = p_provider;
$$;

-- Crea un state (solo su hash). Máximo 5 pendientes por usuario y red; la
-- comprobación es atómica (candado por usuario) para que varias pestañas o
-- dispositivos a la vez no se salten el tope.
create or replace function public.social_crear_state(
  p_user uuid, p_provider text, p_state_hash text, p_return_to text)
returns timestamptz language plpgsql set search_path = '' as $$
declare v_permiso jsonb; v_pendientes int; v_expira timestamptz;
begin
  v_permiso := public.social_plan_permite(p_user, p_provider);
  if not (v_permiso->>'permitido')::boolean then
    raise exception using errcode = 'P0001', message = coalesce(v_permiso->>'motivo', 'plan_no_permitido');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('social_state:' || p_user::text || ':' || p_provider, 0));
  delete from private.social_oauth_states
   where user_id = p_user and provider = p_provider and (used_at is not null or expires_at <= now());
  select count(*) into v_pendientes from private.social_oauth_states
   where user_id = p_user and provider = p_provider;
  if v_pendientes >= 5 then
    raise exception using errcode = 'P0001', message = 'demasiados_intentos';
  end if;
  insert into private.social_oauth_states (user_id, provider, state_hash, return_to)
  values (p_user, p_provider, p_state_hash, coalesce(p_return_to, 'ajustes'))
  returning expires_at into v_expira;
  return v_expira;
end $$;

-- Consume el state de forma ATÓMICA (una sola sentencia UPDATE). Si ya se usó,
-- caducó o no existe, no devuelve filas. Dos llamadas simultáneas con el mismo
-- state: la segunda espera el candado de la fila y ya no la encuentra libre.
create or replace function public.social_consumir_state(p_state_hash text, p_provider text)
returns table (user_id uuid, return_to text) language sql set search_path = '' as $$
  update private.social_oauth_states s
     set used_at = now()
   where s.state_hash = p_state_hash and s.provider = p_provider
     and s.used_at is null and s.expires_at > now()
  returning s.user_id, s.return_to;
$$;

-- Guarda la conexión y sus Páginas (con token cifrado) en UNA transacción.
-- p_paginas: [{page_id, page_name, picture_url, tasks[], token_ciphertext (base64),
--              token_iv (base64), key_version}]
-- Solo se guardan Páginas con la tarea CREATE_CONTENT. Devuelve SOLO datos públicos.
create or replace function public.social_guardar_conexion(
  p_user uuid, p_provider text, p_external_user_id text, p_external_name text,
  p_scopes_granted text[], p_scopes_rejected text[], p_data_access_expires_at timestamptz,
  p_paginas jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_permiso jsonb; v_conn uuid; v_pag jsonb; v_page uuid; v_ids text[] := '{}';
begin
  v_permiso := public.social_plan_permite(p_user, p_provider);
  if not (v_permiso->>'permitido')::boolean then
    raise exception using errcode = 'P0001', message = coalesce(v_permiso->>'motivo', 'plan_no_permitido');
  end if;
  if jsonb_typeof(p_paginas) is distinct from 'array' then
    raise exception using errcode = 'P0001', message = 'paginas_invalidas';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('social_conn:' || p_provider || ':' || p_external_user_id, 0));

  -- Si esta cuenta de Facebook estaba activa en OTRA cuenta de RETADOR, esa
  -- conexión queda reemplazada y sus tokens se borran.
  delete from private.social_tokens t
   using public.social_pages p, public.social_connections c
   where t.social_page_id = p.id and p.connection_id = c.id
     and c.provider = p_provider and c.external_user_id = p_external_user_id
     and c.user_id <> p_user and c.status = 'active';
  update public.social_pages p set status = 'revoked', is_default = false
    from public.social_connections c
   where p.connection_id = c.id and c.provider = p_provider
     and c.external_user_id = p_external_user_id and c.user_id <> p_user and c.status = 'active';
  update public.social_connections set status = 'replaced'
   where provider = p_provider and external_user_id = p_external_user_id
     and user_id <> p_user and status = 'active';

  insert into public.social_connections as c
    (user_id, provider, external_user_id, external_name, scopes_granted, scopes_rejected,
     status, data_access_expires_at, last_error_code)
  values (p_user, p_provider, p_external_user_id, left(p_external_name, 200),
          coalesce(p_scopes_granted, '{}'), coalesce(p_scopes_rejected, '{}'),
          'active', p_data_access_expires_at, null)
  on conflict (user_id, provider) do update
    set external_user_id = excluded.external_user_id, external_name = excluded.external_name,
        scopes_granted = excluded.scopes_granted, scopes_rejected = excluded.scopes_rejected,
        status = 'active', data_access_expires_at = excluded.data_access_expires_at,
        last_error_code = null
  returning c.id into v_conn;

  for v_pag in select * from jsonb_array_elements(p_paginas) loop
    continue when not (coalesce(v_pag->'tasks', '[]'::jsonb) ? 'CREATE_CONTENT');
    insert into public.social_pages as sp
      (connection_id, user_id, page_id, page_name, picture_url, tasks, status)
    values (v_conn, p_user, v_pag->>'page_id', left(v_pag->>'page_name', 200),
            left(v_pag->>'picture_url', 2000),
            array(select jsonb_array_elements_text(v_pag->'tasks')), 'active')
    on conflict (connection_id, page_id) do update
      set page_name = excluded.page_name, picture_url = excluded.picture_url,
          tasks = excluded.tasks, status = 'active'
    returning sp.id into v_page;

    insert into private.social_tokens as t (social_page_id, token_ciphertext, token_iv, key_version)
    values (v_page, decode(v_pag->>'token_ciphertext', 'base64'), decode(v_pag->>'token_iv', 'base64'),
            coalesce((v_pag->>'key_version')::smallint, 1))
    on conflict (social_page_id) do update
      set token_ciphertext = excluded.token_ciphertext, token_iv = excluded.token_iv,
          key_version = excluded.key_version;
    v_ids := v_ids || (v_pag->>'page_id');
  end loop;

  -- Páginas que ya no llegaron (o sin CREATE_CONTENT): sin acceso y sin token.
  delete from private.social_tokens t using public.social_pages p
   where t.social_page_id = p.id and p.connection_id = v_conn and not (p.page_id = any (v_ids));
  update public.social_pages set status = 'no_access', is_default = false
   where connection_id = v_conn and not (page_id = any (v_ids)) and status <> 'no_access';

  -- Siempre una predeterminada si hay alguna activa.
  if not exists (select 1 from public.social_pages where connection_id = v_conn and is_default) then
    update public.social_pages set is_default = true
     where id = (select id from public.social_pages
                  where connection_id = v_conn and status = 'active'
                  order by page_name, page_id limit 1);
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'page_id', page_id, 'page_name', page_name,
                                        'picture_url', picture_url, 'is_default', is_default)
                     order by page_name)
      from public.social_pages where connection_id = v_conn and status = 'active'), '[]'::jsonb);
end $$;

-- Elige la Página predeterminada (atómico: quita la anterior y pone la nueva).
create or replace function public.social_elegir_predeterminada(p_user uuid, p_social_page_id uuid)
returns boolean language plpgsql set search_path = '' as $$
declare v_conn uuid;
begin
  select connection_id into v_conn from public.social_pages
   where id = p_social_page_id and user_id = p_user and status = 'active';
  if v_conn is null then return false; end if;
  update public.social_pages set is_default = false where connection_id = v_conn and is_default and id <> p_social_page_id;
  update public.social_pages set is_default = true where id = p_social_page_id;
  return true;
end $$;

-- Desconecta: borra tokens, marca Páginas y conexión como revocadas. Devuelve
-- el id externo para que la Edge Function revoque también en Meta.
create or replace function public.social_desconectar(p_user uuid, p_provider text)
returns text language plpgsql set search_path = '' as $$
declare v_conn uuid; v_ext text;
begin
  select id, external_user_id into v_conn, v_ext from public.social_connections
   where user_id = p_user and provider = p_provider;
  if v_conn is null then return null; end if;
  delete from private.social_tokens t using public.social_pages p
   where t.social_page_id = p.id and p.connection_id = v_conn;
  update public.social_pages set status = 'revoked', is_default = false where connection_id = v_conn;
  update public.social_connections set status = 'revoked' where id = v_conn;
  return v_ext;
end $$;

-- Entrega el token CIFRADO (nunca en claro: la base no tiene la llave) solo si
-- el plan lo permite, la Página es del usuario, está activa, la conexión está
-- activa y tiene CREATE_CONTENT.
create or replace function public.social_obtener_token(p_user uuid, p_social_page_id uuid)
returns table (page_id text, token_ciphertext text, token_iv text, key_version smallint)
language plpgsql stable set search_path = '' as $$
declare v_permiso jsonb;
begin
  v_permiso := public.social_plan_permite(p_user, 'facebook');
  if not (v_permiso->>'permitido')::boolean then
    raise exception using errcode = 'P0001', message = coalesce(v_permiso->>'motivo', 'plan_no_permitido');
  end if;
  return query
    select p.page_id, encode(t.token_ciphertext, 'base64'), encode(t.token_iv, 'base64'), t.key_version
      from public.social_pages p
      join public.social_connections c on c.id = p.connection_id and c.user_id = p.user_id
      join private.social_tokens t on t.social_page_id = p.id
     where p.id = p_social_page_id and p.user_id = p_user
       and p.status = 'active' and c.status = 'active'
       and 'CREATE_CONTENT' = any (p.tasks);
end $$;

-- Reserva una publicación aplicando, en UNA transacción con candado por
-- usuario+Página: idempotencia, plan, propiedad, producto propio y el límite
-- de 5 publicaciones por hora (ventana móvil con el reloj de la BASE, no del
-- navegador). Devuelve la fila (sin secretos) o el motivo del rechazo.
create or replace function public.social_reservar_publicacion(
  p_user uuid, p_social_page_id uuid, p_product_id uuid, p_type text,
  p_idempotency_key uuid, p_message text, p_storage_path text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_permiso jsonb; v_page_id text; v_usadas int; v_primera timestamptz;
  v_fila public.social_publications; c_limite constant int := 5;
begin
  v_permiso := public.social_plan_permite(p_user, 'facebook');
  if not (v_permiso->>'permitido')::boolean then
    return jsonb_build_object('ok', false, 'motivo', coalesce(v_permiso->>'motivo', 'plan_no_permitido'));
  end if;

  select p.page_id into v_page_id
    from public.social_pages p
    join public.social_connections c on c.id = p.connection_id and c.user_id = p.user_id
   where p.id = p_social_page_id and p.user_id = p_user
     and p.status = 'active' and c.status = 'active' and 'CREATE_CONTENT' = any (p.tasks);
  if v_page_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'pagina_no_disponible');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('social_pub:' || p_user::text || ':' || v_page_id, 0));

  -- Reintento con la misma clave: se devuelve la publicación existente.
  select * into v_fila from public.social_publications
   where user_id = p_user and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok', true, 'reutilizada', true, 'publicacion', jsonb_build_object(
      'id', v_fila.id, 'status', v_fila.status, 'publication_type', v_fila.publication_type,
      'permalink', v_fila.permalink, 'error_code', v_fila.error_code));
  end if;

  if p_product_id is not null and not exists (
      select 1 from public.products where id = p_product_id and seller_id = p_user and status = 'active') then
    return jsonb_build_object('ok', false, 'motivo', 'producto_no_disponible');
  end if;
  if p_storage_path is not null and split_part(p_storage_path, '/', 1) <> p_user::text then
    return jsonb_build_object('ok', false, 'motivo', 'archivo_no_permitido');
  end if;

  select count(*), min(created_at) into v_usadas, v_primera
    from public.social_publications
   where user_id = p_user and page_id = v_page_id and created_at > now() - interval '1 hour';
  if v_usadas >= c_limite then
    return jsonb_build_object('ok', false, 'motivo', 'limite_por_hora', 'limite', c_limite,
                              'reintentar_despues', v_primera + interval '1 hour');
  end if;

  begin
    insert into public.social_publications
      (user_id, social_page_id, page_id, product_id, publication_type, idempotency_key,
       status, message, storage_path)
    values (p_user, p_social_page_id, v_page_id, p_product_id, p_type, p_idempotency_key,
            'pending', p_message, p_storage_path)
    returning * into v_fila;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'motivo', 'publicacion_en_curso');
  end;

  return jsonb_build_object('ok', true, 'reutilizada', false, 'restantes', c_limite - v_usadas - 1,
    'publicacion', jsonb_build_object('id', v_fila.id, 'status', v_fila.status,
                                      'publication_type', v_fila.publication_type));
end $$;

-- Permisos de las funciones: NADIE salvo service_role.
revoke all on function public.social_plan_permite(uuid, text) from public, anon, authenticated;
revoke all on function public.social_crear_state(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.social_consumir_state(text, text) from public, anon, authenticated;
revoke all on function public.social_guardar_conexion(uuid, text, text, text, text[], text[], timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.social_elegir_predeterminada(uuid, uuid) from public, anon, authenticated;
revoke all on function public.social_desconectar(uuid, text) from public, anon, authenticated;
revoke all on function public.social_obtener_token(uuid, uuid) from public, anon, authenticated;
revoke all on function public.social_reservar_publicacion(uuid, uuid, uuid, text, uuid, text, text) from public, anon, authenticated;

grant execute on function public.social_plan_permite(uuid, text) to service_role;
grant execute on function public.social_crear_state(uuid, text, text, text) to service_role;
grant execute on function public.social_consumir_state(text, text) to service_role;
grant execute on function public.social_guardar_conexion(uuid, text, text, text, text[], text[], timestamptz, jsonb) to service_role;
grant execute on function public.social_elegir_predeterminada(uuid, uuid) to service_role;
grant execute on function public.social_desconectar(uuid, text) to service_role;
grant execute on function public.social_obtener_token(uuid, uuid) to service_role;
grant execute on function public.social_reservar_publicacion(uuid, uuid, uuid, text, uuid, text, text) to service_role;

-- ── Bucket privado para videos que se publicarán ────────────────────────────
-- Estructura {user_id}/{uuid}.mp4. Solo sube quien tiene una conexión activa,
-- a su propia carpeta, sin sobrescribir (no hay política de UPDATE). Meta lo
-- descarga con una URL firmada de duración limitada que crea el backend.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-videos', 'social-videos', false, 52428800, array['video/mp4'])
on conflict (id) do nothing;

create policy "social-videos subir a mi carpeta con conexion activa" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'social-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.mp4$'
    and exists (select 1 from public.social_connections c
                 where c.user_id = (select auth.uid()) and c.status = 'active'));
create policy "social-videos leer mis archivos" on storage.objects
  for select to authenticated using (
    bucket_id = 'social-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "social-videos borrar mis archivos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'social-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── Limpieza diaria de estados OAuth viejos ─────────────────────────────────
select cron.schedule('limpieza-estados-oauth-sociales', '41 4 * * *',
  $$delete from private.social_oauth_states where expires_at < now() - interval '1 day'$$);
