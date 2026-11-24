/* Panel de administración: pedidos, productos, promociones y administradores.
   La base (RLS + is_admin()) es la que protege los datos; esta página solo muestra la interfaz. */
window.GP_AUTH.then(async (auth) => {
  "use strict";
  const { esc, money } = window.GP;
  const sb = auth.sb;
  const $ = (s, r = document) => r.querySelector(s);
  const box = $("#admin");
  const STATUS = [["nuevo", "Nuevo"], ["confirmado", "Confirmado"], ["enviado", "Enviado"], ["entregado", "Entregado"], ["cancelado", "Cancelado"]];
  const fecha = (iso) => new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const flash = (el, text, ok = true) => { el.textContent = text; el.className = ok ? "flash ok" : "flash err"; el.hidden = false; setTimeout(() => (el.hidden = true), 4000); };

  const user = await auth.user();
  if (location.search.includes("code=")) history.replaceState(null, "", location.pathname);
  if (!user) {
    box.innerHTML = `<section class="login-card"><h1>Panel de administración</h1><p>Inicia sesión con la cuenta de Google autorizada.</p>
      <button class="btn btn-primary btn-block" type="button" id="login">Continuar con Google</button></section>`;
    $("#login").onclick = () => auth.signIn();
    return;
  }
  if (!(await auth.isAdmin())) {
    box.innerHTML = `<section class="login-card"><h1>Sin permiso</h1><p>La cuenta <strong>${esc(user.email)}</strong> no es administradora. Pide a un administrador que te agregue.</p>
      <a class="btn btn-secondary" href="cuenta.html">Ir a Mi cuenta</a></section>`;
    return;
  }

  const TABS = [["pedidos", "Pedidos"], ["productos", "Productos"], ["promos", "Promociones"], ["admins", "Administradores"]];
  box.innerHTML = `<header class="account-head"><div><h1>Administración</h1><p class="muted">${esc(user.email)}</p></div>
      <button class="btn btn-secondary btn-small" type="button" id="logout">Cerrar sesión</button></header>
    <div class="tabs" role="tablist" aria-label="Secciones del panel">${TABS.map(([k, t], i) => `<button role="tab" type="button" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t}</button>`).join("")}</div>
    ${TABS.map(([k], i) => `<section role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}"${i ? " hidden" : ""}></section>`).join("")}`;
  $("#logout").onclick = () => auth.signOut();

  const loaded = {};
  const show = (k) => {
    TABS.forEach(([t]) => {
      const on = t === k;
      $(`#tab-${t}`).setAttribute("aria-selected", on);
      $(`#tab-${t}`).tabIndex = on ? 0 : -1;
      $(`#panel-${t}`).hidden = !on;
    });
    if (!loaded[k]) { loaded[k] = true; ({ pedidos, productos, promos, admins })[k](); }
  };
  const tablist = $(".tabs");
  tablist.addEventListener("click", (e) => { const b = e.target.closest("[role=tab]"); if (b) show(b.id.slice(4)); });
  tablist.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const tabs = [...tablist.children];
    const i = tabs.indexOf(document.activeElement);
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    n.focus(); show(n.id.slice(4));
  });

  // ======================= Pedidos =======================
  async function pedidos() {
    const P = $("#panel-pedidos");
    P.innerHTML = `<div class="admin-tools">
        <label>Estado <select id="o-status"><option value="">Todos</option>${STATUS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
        <label class="grow">Buscar <input id="o-q" type="search" placeholder="Pedido, nombre o teléfono"></label>
        <button class="btn btn-secondary btn-small" type="button" id="o-reload">Actualizar</button>
      </div><p class="flash" id="o-flash" hidden></p><div id="o-list"><p class="muted">Cargando pedidos…</p></div>`;
    let rows = [];
    const load = async () => {
      const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) { $("#o-list").innerHTML = `<p class="form-error">No se pudieron cargar los pedidos: ${esc(error.message)}</p>`; return; }
      rows = data; draw();
    };
    const draw = () => {
      const st = $("#o-status").value, q = $("#o-q").value.trim().toLowerCase();
      const list = rows.filter((o) => (!st || o.status === st) && (!q || [o.ref, o.customer.nombre, o.customer.telefono].join(" ").toLowerCase().includes(q)));
      $("#o-status").querySelectorAll("option").forEach((op) => { const n = op.value ? rows.filter((o) => o.status === op.value).length : rows.length; op.textContent = `${op.value ? STATUS.find((s) => s[0] === op.value)[1] : "Todos"} (${n})`; });
      $("#o-list").innerHTML = list.length ? `<ul class="orders">${list.map((o) => {
        const c = o.customer, tel = String(c.telefono || "").replace(/\D/g, "");
        return `<li class="order" data-id="${o.id}">
          <div class="order-top"><strong>#${esc(o.ref)}</strong><span class="muted">${fecha(o.created_at)}</span>
            <label class="sr-only" for="st-${o.id}">Estado del pedido ${esc(o.ref)}</label>
            <select id="st-${o.id}" data-status>${STATUS.map(([v, t]) => `<option value="${v}"${v === o.status ? " selected" : ""}>${t}</option>`).join("")}</select></div>
          <p><strong>${esc(c.nombre)}</strong>${c.email ? ` · ${esc(c.email)}` : ""}<br>
            <a href="tel:+52${esc(tel)}">${esc(c.telefono)}</a> · <a href="https://wa.me/52${esc(tel)}" rel="noopener" target="_blank">WhatsApp</a><br>
            ${esc(c.calle)}, Col. ${esc(c.colonia)}, C.P. ${esc(c.cp)}, ${esc(c.ciudad)}, ${esc(c.estado)}${c.notas ? `<br><em>Notas: ${esc(c.notas)}</em>` : ""}</p>
          <ul class="order-items">${o.items.map((i) => `<li>${esc(i.qty)} × ${esc(i.title)}${i.variant ? ` (${esc(i.variant)})` : ""} — ${money(i.price * i.qty)}</li>`).join("")}</ul>
          <p class="order-total">Subtotal: <strong>${money(Number(o.subtotal))}</strong>${o.user_id ? " · Cliente con cuenta" : " · Invitado"}</p>
          <label for="nt-${o.id}">Notas internas</label>
          <div class="note-row"><textarea id="nt-${o.id}" rows="2" maxlength="900" data-notes>${esc(o.admin_notes || "")}</textarea><button class="btn btn-secondary btn-small" type="button" data-save-notes>Guardar nota</button></div>
        </li>`;
      }).join("")}</ul>` : `<p class="empty">No hay pedidos con ese filtro.</p>`;
    };
    $("#o-status").onchange = draw;
    $("#o-q").oninput = draw;
    $("#o-reload").onclick = load;
    P.addEventListener("change", async (e) => {
      if (!e.target.matches("[data-status]")) return;
      const li = e.target.closest("[data-id]"), id = Number(li.dataset.id);
      const { error } = await sb.from("orders").update({ status: e.target.value }).eq("id", id);
      if (error) return flash($("#o-flash"), "No se pudo cambiar el estado: " + error.message, false);
      rows.find((o) => o.id === id).status = e.target.value;
      flash($("#o-flash"), "Estado actualizado.");
    });
    P.addEventListener("click", async (e) => {
      if (!e.target.matches("[data-save-notes]")) return;
      const li = e.target.closest("[data-id]"), id = Number(li.dataset.id), notes = $("[data-notes]", li).value.trim();
      const { error } = await sb.from("orders").update({ admin_notes: notes || null }).eq("id", id);
      if (error) return flash($("#o-flash"), "No se pudo guardar la nota: " + error.message, false);
      rows.find((o) => o.id === id).admin_notes = notes;
      flash($("#o-flash"), "Nota guardada.");
    });
    load();
  }

  // ======================= Productos =======================
  async function productos() {
    const P = $("#panel-productos");
    const ALL = window.PRODUCTS_ALL, BASE = Object.fromEntries(window.PRODUCTS_BASE.map((p) => [p.handle, p]));
    let edits = {};
    P.innerHTML = `<div class="admin-tools"><label class="grow">Buscar producto <input id="p-q" type="search" placeholder="Nombre o marca"></label>
      <label class="check"><input type="checkbox" id="p-edited"> Solo editados</label></div>
      <p class="small-print">Los cambios se guardan en la base y se ven en la tienda al recargar. "Restablecer" vuelve a los datos de la tienda original.</p>
      <p class="flash" id="p-flash" hidden></p><ul class="admin-list" id="p-list"></ul>`;
    const load = async () => {
      const { data } = await sb.from("product_edits").select("handle,data,updated_at,updated_by");
      edits = Object.fromEntries((data || []).map((r) => [r.handle, r]));
      draw();
    };
    const range = (p) => { const a = p.variants.map((v) => v.price); const lo = Math.min(...a), hi = Math.max(...a); return lo === hi ? money(lo) : `${money(lo)} – ${money(hi)}`; };
    const draw = () => {
      const q = window.GP.norm($("#p-q").value.trim()), only = $("#p-edited").checked;
      const list = ALL.filter((p) => (!q || window.GP.norm(`${p.title} ${p.brand}`).includes(q)) && (!only || edits[p.handle]));
      $("#p-list").innerHTML = list.map((p) => `<li class="admin-row">
        ${p.images[0] ? window.GP.img(p.images[0].src, { widths: [96], sizes: "48px", w: p.images[0].w, h: p.images[0].h }) : "<span></span>"}
        <div class="grow"><strong>${esc(p.short)}</strong><br><span class="muted">${esc(p.brand)} · ${range(p)}</span>
          ${edits[p.handle] ? ` <span class="status status-confirmado">Editado</span>` : ""}${p.hidden ? ` <span class="status status-cancelado">Oculto</span>` : ""}</div>
        <button class="btn btn-secondary btn-small" type="button" data-edit="${esc(p.handle)}">Editar</button></li>`).join("") || `<li class="muted">Sin resultados.</li>`;
    };
    $("#p-q").oninput = draw;
    $("#p-edited").onchange = draw;
    P.addEventListener("click", (e) => { const b = e.target.closest("[data-edit]"); if (b) open(b.dataset.edit); });

    const dlg = $("#editor");
    function open(handle) {
      const p = ALL.find((x) => x.handle === handle);
      dlg.innerHTML = `<form method="dialog" class="order-form" id="ed-form">
        <h2 id="editor-t">${esc(p.title)}</h2>
        <label for="ed-short">Nombre corto (tarjetas)</label><input id="ed-short" maxlength="120" value="${esc(p.short)}">
        <label for="ed-ben">Beneficios (uno por renglón, máximo 3)</label><textarea id="ed-ben" rows="3" maxlength="400">${esc(p.benefits.join("\n"))}</textarea>
        <table class="ed-table"><thead><tr><th scope="col">Presentación</th><th scope="col">Precio</th><th scope="col">Precio anterior</th><th scope="col"><abbr title="Disponible">Disp.</abbr></th></tr></thead><tbody>
        ${p.variants.map((v) => `<tr data-v="${v.id}"><th scope="row">${esc(v.title === "Default Title" ? "Única" : v.title)}</th>
          <td><input type="number" min="0" step="0.01" required aria-label="Precio ${esc(v.title)}" data-price value="${v.price}"></td>
          <td><input type="number" min="0" step="0.01" aria-label="Precio anterior ${esc(v.title)}" data-compare value="${v.compare ?? ""}" placeholder="Sin descuento"></td>
          <td><input type="checkbox" aria-label="Disponible ${esc(v.title)}" data-avail${v.available ? " checked" : ""}></td></tr>`).join("")}
        </tbody></table>
        <label class="check"><input type="checkbox" id="ed-hidden"${p.hidden ? " checked" : ""}> Ocultar este producto en la tienda</label>
        <p class="form-error" id="ed-err" hidden></p>
        <div class="ed-actions">
          ${edits[handle] ? `<button class="btn btn-secondary btn-small" type="button" id="ed-reset">Restablecer</button>` : ""}
          <button class="btn btn-secondary btn-small" type="button" id="ed-cancel">Cancelar</button>
          <button class="btn btn-primary btn-small" type="submit" id="ed-save">Guardar</button>
        </div></form>`;
      dlg.showModal();
      $("#ed-cancel", dlg).onclick = () => dlg.close();
      $("#ed-form", dlg).onsubmit = async (e) => {
        e.preventDefault();
        const err = $("#ed-err", dlg);
        const variants = {};
        for (const tr of dlg.querySelectorAll("[data-v]")) {
          const price = Number($("[data-price]", tr).value), cmpRaw = $("[data-compare]", tr).value, compare = cmpRaw === "" ? null : Number(cmpRaw);
          if (!(price >= 0) || $("[data-price]", tr).value === "") { err.textContent = "Revisa los precios."; err.hidden = false; return; }
          if (compare !== null && compare <= price) { err.textContent = "El precio anterior debe ser mayor al precio actual (o déjalo vacío)."; err.hidden = false; return; }
          variants[tr.dataset.v] = { price, compare, available: $("[data-avail]", tr).checked };
        }
        const data = { short: $("#ed-short", dlg).value.trim(), benefits: $("#ed-ben", dlg).value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3), hidden: $("#ed-hidden", dlg).checked, variants };
        const { error } = await sb.from("product_edits").upsert({ handle, data, updated_at: new Date().toISOString(), updated_by: user.email });
        if (error) { err.textContent = "No se pudo guardar: " + error.message; err.hidden = false; return; }
        // Reflejar en la lista sin recargar.
        p.short = data.short || p.short; p.benefits = data.benefits; p.hidden = data.hidden;
        p.variants.forEach((v) => Object.assign(v, variants[v.id]));
        dlg.close(); await load(); flash($("#p-flash"), "Producto guardado. Se verá en la tienda al recargar.");
      };
      const reset = $("#ed-reset", dlg);
      if (reset) reset.onclick = async () => {
        const { error } = await sb.from("product_edits").delete().eq("handle", handle);
        if (error) { $("#ed-err", dlg).textContent = "No se pudo restablecer: " + error.message; $("#ed-err", dlg).hidden = false; return; }
        const b = BASE[handle];
        Object.assign(p, { short: b.short, benefits: b.benefits, hidden: false });
        p.variants.forEach((v) => Object.assign(v, b.variants.find((x) => x.id === v.id)));
        dlg.close(); await load(); flash($("#p-flash"), "Producto restablecido.");
      };
    }
    load();
  }

  // ======================= Promociones y fechas =======================
  async function promos() {
    const P = $("#panel-promos");
    P.innerHTML = `<p class="flash" id="pr-flash" hidden></p>
      <h2>Banners de promoción</h2><p class="small-print">Se muestran arriba del sitio solo entre las fechas indicadas y desaparecen solos al vencer.</p>
      <ul class="admin-list" id="pr-list"></ul>
      <form class="order-form admin-card" id="pr-form"><h3>Nueva promoción</h3>
        <label for="pr-text">Texto *</label><input id="pr-text" required minlength="3" maxlength="140" placeholder="10% en tu primera compra">
        <div class="form-2"><div><label for="pr-code">Código (opcional)</label><input id="pr-code" maxlength="30"></div>
          <div><label for="pr-link">Enlace (opcional)</label><input id="pr-link" maxlength="200" placeholder="coleccion.html?c=ofertas"></div></div>
        <div class="form-2"><div><label for="pr-start">Inicia *</label><input id="pr-start" type="date" required></div>
          <div><label for="pr-end">Termina *</label><input id="pr-end" type="date" required></div></div>
        <button class="btn btn-primary btn-small" type="submit">Agregar promoción</button></form>
      <h2>Fechas de secciones</h2>
      <form class="order-form admin-card" id="st-form">
        <fieldset class="form-group"><legend>Sección "Ofertas" del menú</legend><div class="form-2">
          <div><label for="of-start">Inicia</label><input id="of-start" type="date" required></div><div><label for="of-end">Termina</label><input id="of-end" type="date" required></div></div></fieldset>
        <fieldset class="form-group"><legend>La Huella Dorada</legend><div class="form-2">
          <div><label for="hu-start">Inicia</label><input id="hu-start" type="date" required></div><div><label for="hu-end">Termina</label><input id="hu-end" type="date" required></div></div></fieldset>
        <button class="btn btn-primary btn-small" type="submit">Guardar fechas</button></form>`;
    const load = async () => {
      const [{ data: pr }, { data: st }] = await Promise.all([sb.from("promos").select("*").order("start_date", { ascending: false }), sb.from("settings").select("*")]);
      const today = new Date().toISOString().slice(0, 10);
      const badge = (x) => (x.end_date < today ? ["status-cancelado", "Vencida"] : x.start_date > today ? ["status-nuevo", "Programada"] : ["status-entregado", "Activa"]);
      $("#pr-list").innerHTML = (pr || []).map((x) => `<li class="admin-row"><div class="grow"><strong>${esc(x.text)}</strong>${x.code ? ` · código <code>${esc(x.code)}</code>` : ""}<br>
        <span class="muted">${esc(x.start_date)} al ${esc(x.end_date)}</span> <span class="status ${badge(x)[0]}">${badge(x)[1]}</span></div>
        <button class="btn btn-secondary btn-small" type="button" data-del="${x.id}">Eliminar</button></li>`).join("") || `<li class="muted">No hay promociones.</li>`;
      const S = Object.fromEntries((st || []).map((r) => [r.key, r.value]));
      if (S.ofertas) { $("#of-start").value = S.ofertas.start; $("#of-end").value = S.ofertas.end; }
      if (S.huella) { $("#hu-start").value = S.huella.start; $("#hu-end").value = S.huella.end; }
    };
    $("#pr-form").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.checkValidity()) return f.reportValidity();
      if ($("#pr-end").value < $("#pr-start").value) return flash($("#pr-flash"), "La fecha de fin debe ser igual o posterior al inicio.", false);
      const { error } = await sb.from("promos").insert({ text: $("#pr-text").value.trim(), code: $("#pr-code").value.trim() || null, link: $("#pr-link").value.trim() || null, start_date: $("#pr-start").value, end_date: $("#pr-end").value });
      if (error) return flash($("#pr-flash"), "No se pudo agregar: " + error.message, false);
      f.reset(); await load(); flash($("#pr-flash"), "Promoción agregada.");
    };
    P.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b || !confirm("¿Eliminar esta promoción? No se puede deshacer.")) return;
      const { error } = await sb.from("promos").delete().eq("id", Number(b.dataset.del));
      if (error) return flash($("#pr-flash"), "No se pudo eliminar: " + error.message, false);
      await load(); flash($("#pr-flash"), "Promoción eliminada.");
    });
    $("#st-form").onsubmit = async (e) => {
      e.preventDefault();
      const pairs = [["ofertas", "#of-start", "#of-end"], ["huella", "#hu-start", "#hu-end"]];
      if (pairs.some(([, a, b]) => $(b).value < $(a).value)) return flash($("#pr-flash"), "Revisa las fechas: el fin no puede ser antes del inicio.", false);
      for (const [k, a, b] of pairs) {
        const { error } = await sb.from("settings").update({ value: { start: $(a).value, end: $(b).value } }).eq("key", k);
        if (error) return flash($("#pr-flash"), "No se pudieron guardar las fechas: " + error.message, false);
      }
      flash($("#pr-flash"), "Fechas guardadas.");
    };
    load();
  }

  // ======================= Administradores =======================
  async function admins() {
    const P = $("#panel-admins");
    P.innerHTML = `<p class="flash" id="ad-flash" hidden></p><p class="small-print">Quien esté en esta lista puede entrar a este panel iniciando sesión con su cuenta de Google.</p>
      <ul class="admin-list" id="ad-list"></ul>
      <form class="order-form admin-card" id="ad-form"><label for="ad-email">Agregar correo de Google</label>
        <div class="note-row"><input id="ad-email" type="email" required maxlength="120" placeholder="persona@gmail.com"><button class="btn btn-primary btn-small" type="submit">Agregar</button></div></form>`;
    const load = async () => {
      const { data, error } = await sb.from("admins").select("*").order("added_at");
      if (error) { $("#ad-list").innerHTML = `<li class="form-error">${esc(error.message)}</li>`; return; }
      $("#ad-list").innerHTML = data.map((a) => `<li class="admin-row"><div class="grow"><strong>${esc(a.email)}</strong>${a.email === (user.email || "").toLowerCase() ? " (tú)" : ""}</div>
        <button class="btn btn-secondary btn-small" type="button" data-rm="${esc(a.email)}">Quitar</button></li>`).join("");
    };
    $("#ad-form").onsubmit = async (e) => {
      e.preventDefault();
      if (!e.target.checkValidity()) return e.target.reportValidity();
      const { error } = await sb.from("admins").insert({ email: $("#ad-email").value.trim().toLowerCase() });
      if (error) return flash($("#ad-flash"), error.code === "23505" ? "Ese correo ya es administrador." : "No se pudo agregar: " + error.message, false);
      e.target.reset(); await load(); flash($("#ad-flash"), "Administrador agregado.");
    };
    P.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-rm]");
      if (!b || !confirm(`¿Quitar a ${b.dataset.rm} como administrador?`)) return;
      const { error } = await sb.from("admins").delete().eq("email", b.dataset.rm);
      if (error) return flash($("#ad-flash"), /al menos un/.test(error.message) ? "Debe quedar al menos un administrador." : "No se pudo quitar: " + error.message, false);
      await load(); flash($("#ad-flash"), "Administrador quitado.");
      if (b.dataset.rm === (user.email || "").toLowerCase()) location.href = "cuenta.html";
    });
    load();
  }

  show("pedidos");
});
