# Retador-Plataform-
Plataforma Retador 

**Versión de la app: v242** (fuente de verdad: `public/sw.js` → `CACHE` y `APP_VERSION_FALLBACK` en `src/shared/theme.jsx`).

## Generador de video promocional
- Versión **v8.10**. Todo lo del generador está en `src/tools/promoVideo/README.md`.
- v8.10: el video se genera en un lienzo propio (nunca el de la vista previa), nada se redibuja mientras se genera (los controles se atenúan con el aviso "Generando…" y Cancelar sigue activo), Generar no se puede lanzar dos veces y cada fotograma se comprueba. Arregla el video Cuadrado "corrido" visto en el Redmi Note 11.

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
  - `request_account_deletion('ELIMINAR')`: no deja si es **admin**, si hay **pedidos o subastas en curso** ni si queda **saldo en la billetera** (v241, decisión de Daniel: primero hay que retirarlo; la pantalla lo explica con un mensaje claro). Si deja: guarda plan y estado de los productos, pone el plan en **Gratis**, **oculta** tienda, productos y perfil, cierra **todas** las sesiones y fija la fecha de borrado (**30 días**).
  - **Sin correo**: la fecha exacta del borrado se muestra en pantalla y se explica cómo cancelar (volver a entrar con Google antes de esa fecha).
  - `cancel_account_deletion()`: al volver a entrar aparece la pantalla "Tu cuenta está pendiente de eliminación" con **Cancelar la eliminación**, que restaura **todo**, incluido el plan anterior (Pro/Premium) y el estado de cada producto.
  - Tarea diaria `borrado-cuentas-diario` (pg_cron, 03:17 UTC) → función `account-delete-purge` → primero `account_purge_files(uid)` (archivos de Storage) y después `purge_account_data(uid)`. Si en ese momento apareciera saldo en la billetera, **no se borra nada** (ni archivos ni datos) y la cuenta sigue pendiente.
  - La cuenta de acceso queda **anulada (modo A, confirmado por Daniel)**: sin correo ni datos, sin identidad de Google, sin sesiones y bloqueada para siempre (si esa persona vuelve con Google, se crea una cuenta nueva vacía).

#### Qué pasa con cada tabla a los 30 días (v241, reseñas v242)
**Se borra:**
- `products` (y sus `product_variants` con sus fotos). Excepción: un producto que aparece en un pedido de proveedor (`catalog_pro_fulfillment`) se queda como `deleted`, sin fotos, descripción, vídeo, dirección ni teléfono de recogida.
- `seller_direct_pricing`, `seller_direct_products`, `auctions` (como vendedor), `store_config`.
- Reseñas que **recibió** (v242): las de sus productos en `reviews` (también las de productos que se quedan como `deleted`) y las de su tienda en `seller_reviews`.
- `favorites`, `cart_items`, `followers`, `blocked_users`.
- Sus `notifications`, `push_subscriptions`, `push_client_log`, `push_debug_log`.
- `referral_codes`, `referrals`, `verifications`, `courier_applications`, `couriers`, `seller_payment_accounts`, `team_members`, `staff_permissions`, `wallet_balances` (en cero), `message_reactions`.
- Acceso: `auth.refresh_tokens`, `auth.sessions`, `auth.identities`, `auth.mfa_factors`, `auth.one_time_tokens`, `auth.flow_state`, `auth.audit_log_entries`.
- Storage: todos sus archivos en `avatars`, `kyc`, `product-images` y `voice-notes`, y sus páginas de `share-cache` (perfil y productos).

**Se anonimiza:**
- `profiles`: nombre "Usuario eliminado"; correo, foto, edad, país, ciudad, biografía, usuario, país y provincia de la tienda vacíos; datos de vendedor vacíos; sin verificación; plan Gratis; rol `user`.
- `auth.users`: correo `eliminado+<id>@retador.invalid`, sin teléfono, sin contraseña, sin metadatos, bloqueada para siempre.
- `orders`: como comprador, sin dirección de envío ni teléfono de entrega; como vendedor, sin instrucciones de pago; sin foto. `order_items`: sin foto.
- `messages`: texto "Mensaje eliminado" (sin notas de voz ni adjuntos); `conversations.last_message` igual.
- Avisos de otras personas (`notifications`): su nombre pasa a "Usuario eliminado" y las vistas previas de sus mensajes a "Mensaje eliminado".
- `reports`: el nombre del denunciado pasa a "Usuario eliminado". `wallet_topup_requests.reference` y `plan_requests.evidence_urls` vacíos.

**Se conserva (sin datos personales, por contabilidad):**
- Reseñas que **escribió** sobre otros vendedores o productos (v242, decisión de Daniel): `reviews` y `seller_reviews` se quedan con su puntuación y su texto, firmadas como "Usuario eliminado", sin foto ni enlace a su perfil (salen del perfil anonimizado). Así las medias de los demás vendedores no cambian (probado con cuentas temporales: vendedor 2,5 / 2 valoraciones antes y después).
- `orders` y `order_items`, `payment_transactions` (solo enlace y caducidad del pago), `payouts`, `seller_commission_ledger`, `platform_cost_recovery`, `wallet_ledger`, `bids`, `audit_log`.
- `conversations` (la otra persona las sigue viendo, con "Mensaje eliminado"), las denuncias que hizo esa persona y la fila de `account_deletions` (estado `borrada` con el resumen del borrado).
- Por qué la cuenta de acceso se anula y no se borra (modo A): 16 tablas apuntan a `auth.users` y, al borrarla, Supabase borraría en cascada pagos, liquidaciones y comisiones de la plataforma, o fallaría con compradores que tienen pedidos. Cambiar esas 16 referencias (modo B) es posible, pero **lo decide Daniel**.

### Pendiente para una próxima tarea
- Error de lint en `src/screens/Marketplace.jsx` (línea 546): usa la regla `react-hooks/exhaustive-deps`, que no está en la configuración de ESLint. No afecta a la app; no se ha tocado.
- **Nota media de los productos que no se actualiza** (encontrado en v242, fallo anterior, no se ha tocado): el cálculo automático `recalc_product_rating` (al escribir o borrar una reseña de producto) intenta guardar `products.rating` / `reviews_count`, pero la protección `protect_product_metrics` lo devuelve al valor anterior porque no activa `app.bypass_product_guard`. Resultado: los productos muestran 0 aunque tengan reseñas (hoy 1 producto real con una reseña de 5 estrellas muestra 0). Las valoraciones de **vendedor** (`seller_rating`) sí se calculan bien. Arreglo propuesto (lo decide Daniel): activar esa marca dentro de `recalc_product_rating` y recalcular una vez todos los productos.

### Pendiente antes de publicar en tiendas (Google Play / App Store)
- Correos con Resend (aviso de eliminación pedida, recordatorio antes del borrado y confirmación).
- Política de privacidad publicada.
- Página pública `/eliminar-cuenta/` (las tiendas piden un enlace para pedir el borrado sin instalar la app).
