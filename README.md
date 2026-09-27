# Retador-Plataform-
Plataforma Retador 

## Cuenta y seguridad

### Reglas obligatorias para trabajar en la plataforma (decisión de Daniel, v240)
- Nunca se usa la cuenta de administrador ni cuentas de usuarios reales para trabajar o hacer capturas. La cuenta admin queda **sin contraseña, solo con Google**.
- Cuando haga falta entrar, se crea una **cuenta de prueba temporal** (sin datos reales, rol `user` salvo que Daniel autorice otro), se usa y **se borra al terminar la tarea**.
- Ninguna función que genere accesos, enlaces o códigos de inicio de sesión puede quedarse en el servidor: se crea para la tarea y **se borra al terminar**.
- Al final de cada tarea, el informe confirma que **no quedan cuentas de prueba, sesiones abiertas ni funciones de acceso**.
- El acceso por correo de Supabase **no se desactiva** (se sigue necesitando para revisar la plataforma).
- Para probar funciones del servidor como si fuera un usuario **no hace falta abrir sesiones**: en SQL, dentro de una transacción, `select set_config('request.jwt.claims','{"sub":"<id>","role":"authenticated"}',true); set local role authenticated;` y al final `rollback`.

### Cerrar sesión (Ajustes → Cuenta)
- **Cerrar sesión**: solo en este dispositivo (`signOut({ scope: "local" })`). Antes cerraba en todos sin avisar (es lo que hace Supabase si no se indica nada).
- **Cerrar sesión en todos los dispositivos**: con confirmación; el servidor invalida todas las sesiones de la cuenta (`signOut({ scope: "global" })`). Los otros teléfonos u ordenadores salen al abrir la app (se comprueba con el servidor al arrancar; sin conexión no se sale) y, como mucho, al caducar su acceso (≈ 1 hora).

### Eliminar cuenta (Ajustes → Cuenta → Eliminar cuenta)
- La pantalla explica qué pasa al momento, qué se borra a los 30 días y qué se conserva; pide escribir **ELIMINAR**.
- Todo lo decide el servidor (funciones `SECURITY DEFINER`), nunca el navegador:
  - `account_deletion_precheck()`: si es admin, pedidos y subastas en curso (como comprador, vendedor o mensajero), saldo de la billetera y si ya hay una eliminación pendiente.
  - `request_account_deletion('ELIMINAR')`: no deja si es **admin** ni si hay **pedidos o subastas en curso**. Si deja: guarda plan y estado de los productos, pone el plan en **Gratis**, **oculta** tienda, productos y perfil, cierra **todas** las sesiones y fija la fecha de borrado (**30 días**).
  - **Sin correo**: la fecha exacta del borrado se muestra en pantalla y se explica cómo cancelar (volver a entrar con Google antes de esa fecha).
  - `cancel_account_deletion()`: al volver a entrar aparece la pantalla "Tu cuenta está pendiente de eliminación" con **Cancelar la eliminación**, que restaura **todo**, incluido el plan anterior (Pro/Premium) y el estado de cada producto.
  - Tarea diaria `borrado-cuentas-diario` (pg_cron, 03:17 UTC) → función `account-delete-purge` → `purge_account_data(uid)`: borra perfil (queda "Usuario eliminado"), tienda, productos, subastas, archivos de Storage, favoritos, carrito, seguidores, reseñas, notificaciones, verificación, datos de cobro y el texto de sus mensajes. Los **pedidos terminados se conservan anonimizados** (sin dirección ni teléfono). La cuenta de acceso queda **anulada**: sin correo ni datos, sin identidad de Google, sin sesiones y bloqueada para siempre (si esa persona vuelve con Google, se crea una cuenta nueva vacía).
- Por qué la cuenta de acceso se anula y no se borra (modo A): 16 tablas apuntan a `auth.users` y, al borrarla, Supabase borraría en cascada pagos, liquidaciones y comisiones de la plataforma, o fallaría con compradores que tienen pedidos. Cambiar esas 16 referencias (modo B) es posible, pero **lo decide Daniel**.

### Pendiente antes de publicar en tiendas (Google Play / App Store)
- Correos con Resend (aviso de eliminación pedida, recordatorio antes del borrado y confirmación).
- Política de privacidad publicada.
- Página pública `/eliminar-cuenta/` (las tiendas piden un enlace para pedir el borrado sin instalar la app).
