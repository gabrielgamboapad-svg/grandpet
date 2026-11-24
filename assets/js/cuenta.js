/* Mi cuenta: inicio de sesión con Google y "Mis pedidos". */
window.GP_AUTH.then(async (auth) => {
  "use strict";
  const { esc, money } = window.GP;
  const box = document.getElementById("cuenta");
  const STATUS = { nuevo: "Recibido", confirmado: "Confirmado", enviado: "Enviado", entregado: "Entregado", cancelado: "Cancelado" };
  const google = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"/></svg>';

  // Quita ?code= de la barra después de volver de Google.
  const user = await auth.user();
  if (location.search.includes("code=")) history.replaceState(null, "", location.pathname);

  if (!user) {
    box.innerHTML = `<section class="login-card">
      <h1>Mi cuenta</h1>
      <p>Inicia sesión con tu cuenta de Google para ver tus pedidos y llenar tus datos más rápido.</p>
      <button class="btn btn-google btn-block" type="button" id="login">${google} Continuar con Google</button>
      <p class="small-print">No necesitas una cuenta para comprar: también puedes pedir como invitado desde el <a href="carrito.html">carrito</a>.</p>
      <p class="form-error" id="login-error" role="alert" hidden></p>
    </section>`;
    document.getElementById("login").onclick = async () => {
      const { error } = await auth.signIn();
      if (error) {
        const e = document.getElementById("login-error");
        e.textContent = "No pudimos abrir el inicio de sesión con Google. Intenta de nuevo en un momento.";
        e.hidden = false;
      }
    };
    return;
  }

  const admin = await auth.isAdmin();
  box.innerHTML = `<header class="account-head">
      <div><h1>Hola, ${esc(auth.name(user).split(" ")[0])}</h1><p class="muted">${esc(user.email || "")}</p></div>
      <div class="account-actions">
        ${admin ? `<a class="btn btn-primary btn-small" href="admin.html">Panel de administración</a>` : ""}
        <button class="btn btn-secondary btn-small" type="button" id="logout">Cerrar sesión</button>
      </div>
    </header>
    <section aria-labelledby="mis-t"><h2 id="mis-t">Mis pedidos</h2><div id="mis-pedidos"><p class="muted">Cargando pedidos…</p></div></section>`;
  document.getElementById("logout").onclick = () => auth.signOut();

  const { data, error } = await auth.sb.from("orders").select("ref,created_at,items,subtotal,status")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const list = document.getElementById("mis-pedidos");
  if (error) { list.innerHTML = `<p class="form-error">No pudimos cargar tus pedidos. Recarga la página.</p>`; return; }
  if (!data.length) {
    list.innerHTML = `<div class="empty"><p>Aún no tienes pedidos con esta cuenta.</p><a class="btn btn-primary" href="index.html">Ir a la tienda</a></div>`;
    return;
  }
  list.innerHTML = `<ul class="orders">${data.map((o) => `<li class="order">
      <div class="order-top"><strong>Pedido #${esc(o.ref)}</strong><span class="status status-${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span></div>
      <p class="muted">${new Date(o.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>
      <ul class="order-items">${o.items.map((i) => `<li>${esc(i.qty)} × ${esc(i.title)}${i.variant ? ` (${esc(i.variant)})` : ""}</li>`).join("")}</ul>
      <p class="order-total">Total: <strong>${money(Number(o.subtotal))}</strong></p></li>`).join("")}</ul>`;
});
