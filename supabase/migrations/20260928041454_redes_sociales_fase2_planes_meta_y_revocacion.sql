-- INTEGRACIÓN CON REDES SOCIALES — FASE 2: planes definitivos, callbacks de Meta y revocación al borrar cuenta.

-- ── Planes: Premium habilitado (decisión de Daniel). Gratis y Pro sin cambios.
-- Empresas no tiene fila porque ese plan todavía no existe en public.plans
-- (la clave foránea lo impide): sin fila = sin acceso. Cuando exista, se añade
-- aquí su fila con enabled = true.
update private.social_plan_access set enabled = true, updated_at = now()
 where plan_id = 'premium' and provider = 'facebook';

-- ── Intentos de revocación en Meta al borrar una cuenta ────────────────────
-- account-delete-purge intenta revocar antes de borrar lo local. Si Meta falla,
-- se reintenta en las pasadas diarias siguientes; al llegar al tope se sigue con
-- el borrado local (nunca queda bloqueado para siempre). Sin secretos.
create table private.social_revocation_attempts (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  attempts        int not null default 0 check (attempts >= 0),
  last_error_code text check (char_length(last_error_code) <= 50),
  last_attempt_at timestamptz not null default now()
);
alter table private.social_revocation_attempts enable row level security;
revoke all on private.social_revocation_attempts from public, anon, authenticated;
grant select, insert, update, delete on private.social_revocation_attempts to service_role;

-- Registra un intento fallido y devuelve el total acumulado.
create or replace function public.social_registrar_intento_revocacion(p_user uuid, p_error_code text)
returns int language sql set search_path = '' as $$
  insert into private.social_revocation_attempts as r (user_id, attempts, last_error_code, last_attempt_at)
  values (p_user, 1, left(p_error_code, 50), now())
  on conflict (user_id) do update
    set attempts = r.attempts + 1, last_error_code = excluded.last_error_code, last_attempt_at = now()
  returning attempts;
$$;

-- ── Solicitudes de eliminación de datos enviadas por Meta ──────────────────
-- Solo lo necesario para que la persona consulte el estado con su código:
-- ni el id de Facebook ni datos personales.
create table private.social_data_deletion_requests (
  confirmation_code text primary key check (confirmation_code ~ '^[A-Za-z0-9_-]{20,64}$'),
  provider          text not null check (provider in ('facebook')),
  status            text not null default 'completed' check (status in ('completed', 'failed')),
  cuentas_afectadas int not null default 0,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);
alter table private.social_data_deletion_requests enable row level security;
revoke all on private.social_data_deletion_requests from public, anon, authenticated;
grant select, insert, update, delete on private.social_data_deletion_requests to service_role;

-- Aplica una desautorización o una eliminación de datos llegada de Meta, por
-- el id de Facebook (Meta no envía la sesión de RETADOR). NUNCA borra la cuenta
-- de RETADOR.
--  · 'desautorizar': borra tokens y Páginas; la conexión queda 'revoked' (sin
--    tokens) y se conserva el historial de publicaciones de RETADOR.
--  · 'borrar': borra tokens, Páginas, publicaciones y la conexión.
-- Devuelve los usuarios de RETADOR afectados (para auditoría).
create or replace function public.social_aplicar_evento_meta(
  p_provider text, p_external_user_id text, p_modo text, p_confirmation_code text)
returns uuid[] language plpgsql set search_path = '' as $$
declare v_usuarios uuid[];
begin
  if p_modo not in ('desautorizar', 'borrar') then
    raise exception using errcode = 'P0001', message = 'modo_invalido';
  end if;
  if p_external_user_id !~ '^[0-9]{1,32}$' then
    raise exception using errcode = 'P0001', message = 'id_externo_invalido';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('social_conn:' || p_provider || ':' || p_external_user_id, 0));

  select coalesce(array_agg(distinct user_id), '{}') into v_usuarios from public.social_connections
   where provider = p_provider and external_user_id = p_external_user_id;

  delete from private.social_tokens t using public.social_pages p, public.social_connections c
   where t.social_page_id = p.id and p.connection_id = c.id
     and c.provider = p_provider and c.external_user_id = p_external_user_id;

  if p_modo = 'borrar' then
    delete from public.social_publications
     where user_id = any (v_usuarios)
       and page_id in (select p.page_id from public.social_pages p join public.social_connections c on c.id = p.connection_id
                        where c.provider = p_provider and c.external_user_id = p_external_user_id);
    delete from public.social_connections  -- las Páginas se borran en cascada
     where provider = p_provider and external_user_id = p_external_user_id;
    insert into private.social_data_deletion_requests (confirmation_code, provider, status, cuentas_afectadas, completed_at)
    values (p_confirmation_code, p_provider, 'completed', coalesce(array_length(v_usuarios, 1), 0), now());
  else
    delete from public.social_pages p using public.social_connections c
     where p.connection_id = c.id and c.provider = p_provider and c.external_user_id = p_external_user_id;
    update public.social_connections set status = 'revoked', last_error_code = 'desautorizado_en_meta'
     where provider = p_provider and external_user_id = p_external_user_id;
  end if;
  return v_usuarios;
end $$;

-- Estado de una solicitud de eliminación (para la página pública de estado).
create or replace function public.social_estado_eliminacion(p_confirmation_code text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('status', status, 'created_at', created_at, 'completed_at', completed_at)
    from private.social_data_deletion_requests where confirmation_code = p_confirmation_code;
$$;

revoke all on function public.social_registrar_intento_revocacion(uuid, text) from public, anon, authenticated;
revoke all on function public.social_aplicar_evento_meta(text, text, text, text) from public, anon, authenticated;
revoke all on function public.social_estado_eliminacion(text) from public, anon, authenticated;
grant execute on function public.social_registrar_intento_revocacion(uuid, text) to service_role;
grant execute on function public.social_aplicar_evento_meta(text, text, text, text) to service_role;
grant execute on function public.social_estado_eliminacion(text) to service_role;

-- ── Borrado de cuenta: también el registro de intentos de revocación ───────
do $$
declare v_def text; v_marca text;
begin
  select pg_get_functiondef('public.purge_account_data(uuid)'::regprocedure) into v_def;
  v_marca := '  delete from private.social_oauth_states where user_id = p_uid;';
  if (length(v_def) - length(replace(v_def, v_marca, ''))) / length(v_marca) <> 1 then
    raise exception 'purge_account_data: punto de inserción no encontrado exactamente una vez';
  end if;
  execute replace(v_def, v_marca, v_marca || E'\n  delete from private.social_revocation_attempts where user_id = p_uid;');
end $$;
revoke all on function public.purge_account_data(uuid) from public, anon, authenticated;
