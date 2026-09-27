-- INTEGRACIÓN CON REDES SOCIALES — FASE 1: índices para las claves foráneas nuevas
-- (aviso del asesor de rendimiento de Supabase).
create index social_pages_connection_user on public.social_pages (connection_id, user_id);
create index social_publications_product_id on public.social_publications (product_id) where product_id is not null;
create index social_publications_social_page_id on public.social_publications (social_page_id) where social_page_id is not null;
