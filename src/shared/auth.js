import { supabase } from "./supabase.js";

// ── AUTENTICACIÓN REAL (Supabase Auth con Google) ────────────────────────────
// URL pública de la app (a donde Google devuelve tras el login).
export const APP_URL = "https://retadormarketplace.es/";

// Entrar / registrarse con Google (una sola opción, sin cambiar de cuenta).
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: APP_URL },
  });
}

// Cerrar sesión SOLO en este dispositivo. Al cerrar, la app vuelve al inicio sola.
// (Sin indicar nada, Supabase cierra en TODOS los dispositivos; por eso se pide
// "local" aquí y el cierre global tiene su propio botón en Ajustes → Cuenta.)
export async function signOutUser() {
  await supabase.auth.signOut({ scope: "local" });
}

// Cerrar sesión en TODOS los dispositivos: el servidor invalida todas las
// sesiones de esta cuenta (móvil, ordenador, etc.), incluida esta.
export async function signOutEverywhere() {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    // Aunque falle en el servidor, esta pantalla sí se cierra.
    await supabase.auth.signOut({ scope: "local" });
    throw error;
  }
}

// Convierte la sesión de Supabase + el perfil en el objeto "user" que usa la app.
export async function loadSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  // Si la sesión se cerró en el servidor ("Cerrar sesión en todos los
  // dispositivos", eliminación de cuenta o cuenta bloqueada), este teléfono lo
  // detecta al abrir la app y sale. Sin conexión NO se sale: solo con una
  // respuesta clara del servidor.
  try {
    const { error } = await supabase.auth.getUser();
    if (error && (error.status === 401 || ["session_not_found", "user_not_found", "user_banned"].includes(error.code))) {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }
  } catch (e) { /* sin red: se sigue con la sesión guardada */ }
  const au = session.user;
  let profile = null;
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", au.id).single();
    profile = data;
  } catch (e) { /* si el perfil aún no está, seguimos con datos de Google */ }
  // Si el perfil no existe todavía, lo creamos con los datos de Google. Así los
  // DEMÁS usuarios pueden ver tu nombre y foto (la pantalla de vendedor lee esta
  // tabla). Solo se crea si falta: nunca pisa un perfil ya existente.
  if (!profile) {
    try {
      const row = {
        id: au.id,
        full_name: au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split("@")[0] : "Usuario"),
        avatar_url: au.user_metadata?.avatar_url || null,
      };
      const { data: created } = await supabase.from("profiles").insert(row).select().single();
      if (created) profile = created;
    } catch (e) { /* si RLS no lo permite, la app sigue funcionando igual */ }
  }
  // ¿Tiene una eliminación de cuenta pendiente? (solo puede ver la suya).
  let pendingDeletion = null;
  try {
    const { data: del } = await supabase.from("account_deletions")
      .select("scheduled_for, prev_plan").eq("user_id", au.id).eq("status", "pendiente").maybeSingle();
    if (del) pendingDeletion = { date: del.scheduled_for, prevPlan: del.prev_plan };
  } catch (e) { /* si falla la consulta, la app sigue como siempre */ }
  return {
    id: au.id,
    email: au.email,
    pendingDeletion,
    name: profile?.full_name || au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split("@")[0] : "Usuario"),
    avatar: profile?.avatar_url || au.user_metadata?.avatar_url || null,
    plan: profile?.plan || "gratis",
    role: profile?.role || "user",
    verified: profile?.is_verified || false,
    verifiedSince: profile?.verified_since || null,
    suspended: profile?.is_suspended || false,
    profile,
  };
}
