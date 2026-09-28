# Migraciones de la integración con redes sociales

Estos archivos son **copias exactas, byte a byte**, del SQL que Supabase tiene
registrado como aplicado en producción (`supabase_migrations.schema_migrations`).
El nombre de cada archivo es `<version>_<nombre>` tal como aparece en ese historial.

**No se vuelven a ejecutar**: ya están aplicados. Sirven de registro reproducible.

Para comprobar que un archivo sigue siendo idéntico a lo aplicado, compara su MD5
local (`md5sum archivo.sql`) con el de la base:

```sql
select version || '_' || name, md5(statements[1])
  from supabase_migrations.schema_migrations
 where name like 'redes_sociales%'
 order by version;
```

Las migraciones anteriores del proyecto (antes de esta integración) solo existen
en el historial de Supabase; no se copiaron aquí.
