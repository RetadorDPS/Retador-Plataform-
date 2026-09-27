-- ═══════════════════════════════════════════════════════════════════════════
-- INTEGRACIÓN CON REDES SOCIALES — FASE 1: borrado de cuenta.
-- Datos locales de redes sociales y archivos de social-videos al borrar una
-- cuenta. Se modifica la definición REAL vigente insertando líneas en un punto
-- exacto; si el punto no existe exactamente una vez, la migración falla y no
-- cambia nada. Lo ya publicado en Facebook NO se borra (es de la Página).
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare
  v_def text; v_marca text; v_nuevo text;
begin
  -- 1) purge_account_data: borrar credenciales y datos locales.
  select pg_get_functiondef('public.purge_account_data(uuid)'::regprocedure) into v_def;
  v_marca := '  delete from public.wallet_balances where user_id = p_uid; -- [v241] (en cero: se comprobó arriba)';
  if (length(v_def) - length(replace(v_def, v_marca, ''))) / length(v_marca) <> 1 then
    raise exception 'purge_account_data: punto de inserción no encontrado exactamente una vez';
  end if;
  v_nuevo := v_marca || E'\n'
    || E'  -- [redes sociales] Credenciales y datos locales de Facebook. La revocación en Meta la hace\n'
    || E'  -- antes account-delete-purge; lo ya publicado en Facebook NO se borra (es de la Página).\n'
    || E'  delete from private.social_tokens t using public.social_pages p where t.social_page_id = p.id and p.user_id = p_uid;\n'
    || E'  delete from public.social_publications where user_id = p_uid;\n'
    || E'  delete from public.social_pages where user_id = p_uid;\n'
    || E'  delete from public.social_connections where user_id = p_uid;\n'
    || E'  delete from private.social_oauth_states where user_id = p_uid;';
  execute replace(v_def, v_marca, v_nuevo);

  -- 2) account_purge_files: incluir el bucket privado social-videos (carpeta = id del usuario).
  select pg_get_functiondef('public.account_purge_files(uuid)'::regprocedure) into v_def;
  v_marca := 'o.bucket_id in (''avatars'',''kyc'',''product-images'',''voice-notes'')';
  if (length(v_def) - length(replace(v_def, v_marca, ''))) / length(v_marca) <> 1 then
    raise exception 'account_purge_files: punto de inserción no encontrado exactamente una vez';
  end if;
  execute replace(v_def, v_marca, 'o.bucket_id in (''avatars'',''kyc'',''product-images'',''voice-notes'',''social-videos'')');
end $$;

-- CREATE OR REPLACE conserva los permisos (service_role sigue con EXECUTE explícito).
revoke all on function public.purge_account_data(uuid) from public, anon, authenticated;
revoke all on function public.account_purge_files(uuid) from public, anon, authenticated;
