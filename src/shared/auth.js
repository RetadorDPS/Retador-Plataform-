import { supabase } from "./supabase.js";

// ── AUTENTICACIÓN REAL (Supabase Auth con Google) ────────────────────────────
// URL pública de la app (a donde Google devuelve tras el login).
export const APP_URL = "https://retadordps.github.io/Retador-Plataform-/";

// Entrar / registrarse con Google (una sola opción, sin cambiar de cuenta).
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: APP_URL },
  });
}

// Cerrar sesión (se usa desde el perfil). Al cerrar, la app vuelve al inicio sola.
export async function signOutUser() {
  await supabase.auth.signOut();
}

// Convierte la sesión de Supabase + el perfil en el objeto "user" que usa la app.
export async function loadSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
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
  return {
    id: au.id,
    email: au.email,
    name: profile?.full_name || au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split("@")[0] : "Usuario"),
    avatar: profile?.avatar_url || au.user_metadata?.avatar_url || null,
    plan: profile?.plan || "gratis",
    role: profile?.role || "user",
    verified: profile?.is_verified || false,
    verifiedSince: profile?.verified_since || null,
    profile,
  };
}
