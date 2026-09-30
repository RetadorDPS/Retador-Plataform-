-- Redes sociales, fase 3: publicación de VARIAS fotos en un solo post de Facebook.
--
-- Cambio mínimo y compatible (no toca ni reescribe filas existentes):
--  1) publication_type admite también 'photos' (las filas antiguas siguen valiendo).
--  2) Columna nueva `media` (jsonb, nula): la lista de fotos de una publicación
--     'photos' → [{ product_id, foto_indice, facebook_photo_id? }]. Las
--     publicaciones antiguas quedan con media = null.
--
-- No hace falta tocar social_reservar_publicacion (inserta p_type tal cual) ni el
-- índice social_publications_en_curso: una publicación 'photos' se reserva con
-- product_id nulo y ese índice ya ignora las filas sin producto, así que varios
-- productos en una misma publicación nunca la bloquean.

alter table public.social_publications
  drop constraint social_publications_publication_type_check;
alter table public.social_publications
  add constraint social_publications_publication_type_check
  check (publication_type in ('link', 'photo', 'photos', 'video', 'reel'));

alter table public.social_publications
  add column media jsonb
  check (media is null or (jsonb_typeof(media) = 'array' and jsonb_array_length(media) between 1 and 10));

comment on column public.social_publications.media is
  'Solo publication_type = photos: [{product_id, foto_indice, facebook_photo_id}] en el orden publicado.';
