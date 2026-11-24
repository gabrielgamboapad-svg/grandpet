/* Sesión con Google (Supabase Auth). Se carga en cuenta.html, admin.html y carrito.html, después de
   supabase-js y app.js. Las páginas usan: window.GP_AUTH.then((auth) => ...). */
window.GP_AUTH = window.GP_READY.then((GP) => {
  "use strict";
  const S = GP.CFG.supabase;
  const sb = window.supabase.createClient(S.url, S.key, {
    auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
  });

  GP.auth = {
    sb,
    async user() {
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    },
    signIn() {
      // Vuelve a la misma página (sin #) después de elegir la cuenta de Google.
      const back = location.href.split("#")[0];
      return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back } });
    },
    async signOut() {
      await sb.auth.signOut();
      location.reload();
    },
    async isAdmin() {
      const { data, error } = await sb.rpc("is_admin");
      return !error && data === true;
    },
    name(u) {
      return (u && u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || (u && u.email) || "";
    },
  };
  return GP.auth;
});
