// ═════════════════════════════════════════════════════════════════════════════
// Video pendiente de publicar mientras el vendedor conecta Facebook.
//
// El OAuth de Meta saca la app de la pantalla (la ventana principal va a
// facebook.com) y el video terminado vive solo en memoria: se perdería. Justo
// antes de salir se guarda aquí (IndexedDB, mismo dominio) y al volver se
// recupera UNA vez y se borra. Reglas:
//  · un único registro (el último video), asociado al usuario;
//  · caduca a los 30 min; lo caducado se borra al arrancar la app;
//  · se borra al recuperarlo o si al final no se sale hacia Meta;
//  · solo el archivo y los datos de la publicación: nunca tokens ni secretos.
// Si el navegador no deja usar IndexedDB (modo privado, almacenamiento lleno,
// o una PWA de iPhone que vuelve en Safari con otro almacenamiento), no se
// guarda nada y al volver se pide generar el video de nuevo.
// ═════════════════════════════════════════════════════════════════════════════
const BD = "retador-facebook";
const ALMACEN = "video-pendiente";
const CLAVE = "ultimo";
const CADUCA_MS = 30 * 60 * 1000;

function abrir() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("sin IndexedDB")); return; }
    const pet = indexedDB.open(BD, 1);
    pet.onupgradeneeded = () => { if (!pet.result.objectStoreNames.contains(ALMACEN)) pet.result.createObjectStore(ALMACEN); };
    pet.onsuccess = () => resolve(pet.result);
    pet.onerror = () => reject(pet.error || new Error("IndexedDB"));
  });
}
async function operar(modo, fn) {
  const bd = await abrir();
  try {
    return await new Promise((resolve, reject) => {
      const tx = bd.transaction(ALMACEN, modo);
      const r = fn(tx.objectStore(ALMACEN));
      tx.oncomplete = () => resolve(r && "result" in r ? r.result : undefined);
      tx.onerror = () => reject(tx.error || new Error("IndexedDB"));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB"));
    });
  } finally { bd.close(); }
}

// Guarda el video y los datos de la publicación. Devuelve true si quedó guardado.
export async function guardarVideoPendiente(usuarioId, datos) {
  if (!usuarioId || !(datos?.video?.blob instanceof Blob)) return false;
  try {
    await operar("readwrite", (s) => s.put({ usuarioId, t: Date.now(), ...datos }, CLAVE));
    return true;
  } catch (_e) { return false; }
}

// Recupera el video de ESTE usuario si no caducó, y lo borra (se usa una vez).
export async function recuperarVideoPendiente(usuarioId) {
  try {
    const r = await operar("readonly", (s) => s.get(CLAVE));
    await borrarVideoPendiente();
    if (!r || r.usuarioId !== usuarioId || Date.now() - Number(r.t) > CADUCA_MS || !(r.video?.blob instanceof Blob)) return null;
    return r;
  } catch (_e) { return null; }
}

export async function borrarVideoPendiente() {
  try { await operar("readwrite", (s) => s.delete(CLAVE)); } catch (_e) { /* nada que borrar */ }
}

// Al arrancar la app: si quedó un video caducado (no se volvió de Meta), se borra.
export async function limpiarVideoCaducado() {
  try {
    if (typeof indexedDB === "undefined") return;
    // Si la base ni existe (lo normal), no se crea solo para mirar.
    if (indexedDB.databases && !(await indexedDB.databases()).some((d) => d.name === BD)) return;
    const r = await operar("readonly", (s) => s.get(CLAVE));
    if (r && Date.now() - Number(r.t) > CADUCA_MS) await borrarVideoPendiente();
  } catch (_e) { /* sin IndexedDB */ }
}
