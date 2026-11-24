/* Carrito: progreso de envío gratis, cantidades y pedido con los datos de entrega. Comprar requiere sesión con Google. */
window.GP_READY.then(function () {
  "use strict";
  const { cart, img, esc, money, priceHTML, shipProgressHTML, CFG, url, wa, tel } = window.GP;
  const root = document.getElementById("cart");
  const KEY = "gp_cliente";
  const phoneOk = window.GP.waOk; // hay WhatsApp configurado en config.js
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const FIELDS = [
    ["nombre", "Nombre completo", "text", 'autocomplete="name" required maxlength="80"'],
    ["telefono", "Teléfono (10 dígitos)", "tel", 'autocomplete="tel-national" required inputmode="numeric" pattern="[0-9]{10}" maxlength="10"'],
    ["calle", "Calle y número", "text", 'autocomplete="address-line1" required maxlength="120"'],
    ["colonia", "Colonia", "text", 'autocomplete="address-line2" required maxlength="80"'],
    ["cp", "Código postal", "text", 'autocomplete="postal-code" required inputmode="numeric" pattern="[0-9]{5}" maxlength="5"'],
    ["ciudad", "Ciudad o municipio", "text", 'autocomplete="address-level2" required maxlength="80"'],
    ["estado", "Estado", "text", 'autocomplete="address-level1" required maxlength="40"'],
  ];

  function listHTML() {
    const items = cart.items();
    return `${shipProgressHTML(cart.total())}
      <ul class="cart-items" style="margin-top:14px">${items.map(({ id, qty, p, v }) => `<li class="cart-item">
        ${p.images[0] ? img(p.images[0].src, { widths: [144, 216], sizes: "72px", alt: `Empaque de ${p.short}`, w: p.images[0].w, h: p.images[0].h }) : "<span></span>"}
        <div>
          <h2><a href="${url(p)}&amp;v=${id}">${esc(p.short)}</a></h2>
          ${v.title !== "Default Title" ? `<p class="link-quiet" style="margin:0">${esc(v.title)}</p>` : ""}
          ${priceHTML(p, v)}
          <div class="cart-item-actions">
            <div class="qty"><button type="button" data-set="${id}" data-to="${qty - 1}" aria-label="Quitar uno de ${esc(p.short)}">−</button><label class="sr-only" for="q-${id}">Cantidad de ${esc(p.short)}</label><input id="q-${id}" data-qty="${id}" type="number" min="1" max="99" value="${qty}" inputmode="numeric"><button type="button" data-set="${id}" data-to="${qty + 1}" aria-label="Agregar uno de ${esc(p.short)}">+</button></div>
            <strong>${money(v.price * qty)}</strong>
            <button class="remove" type="button" data-set="${id}" data-to="0">Eliminar</button>
          </div>
        </div></li>`).join("")}</ul>`;
  }

  function emptyHTML() {
    return `<div class="empty"><p>Tu carrito está vacío.</p><div class="hero-ctas" style="justify-content:center">
      <a class="btn btn-primary" href="coleccion.html?c=perro">Comprar para perro</a>
      <a class="btn btn-secondary" href="coleccion.html?c=gato">Comprar para gato</a></div></div>`;
  }

  function mount() {
    if (!cart.count()) { root.innerHTML = emptyHTML(); return; }
    root.innerHTML = `<div class="cart-layout">
      <div id="cart-list">${listHTML()}</div>
      <aside class="summary" aria-label="Resumen y datos de entrega">
        <div class="summary-row"><span>Subtotal</span><span id="subtotal">${money(cart.total())}</span></div>
        <small>Te confirmamos por WhatsApp disponibilidad, costo de envío y forma de pago.</small>
        ${loginCard()}
        <form id="order" class="order-form" novalidate${window.GP.account() ? "" : " hidden"}>
          <p class="login-hint" id="login-hint">Comprando con tu cuenta de Google.</p>
          <h2>Datos de entrega</h2>
          ${FIELDS.map(([k, l, t, a]) => `<label for="f-${k}">${l}</label><input id="f-${k}" name="${k}" type="${t}" ${a} value="${esc(saved[k] || "")}">`).join("")}
          <label for="f-notas">Notas (opcional)</label><textarea id="f-notas" name="notas" rows="2" maxlength="300" placeholder="Referencias de la casa, horario…">${esc(saved.notas || "")}</textarea>
          <label class="check"><input type="checkbox" name="recordar"${saved.nombre ? " checked" : ""}> Recordar mis datos en este dispositivo para comprar más rápido</label>
          <p class="form-error" id="form-error" role="alert" hidden></p>
          <button class="btn btn-primary btn-block" type="submit">${phoneOk ? "Enviar pedido por WhatsApp" : "Enviar pedido"}</button>
          <small>${phoneOk ? "Se abrirá WhatsApp con tu pedido listo." : `Te llamaremos para confirmar tu pedido. ¿Dudas? <a href="${tel}">${esc(window.GP.phoneText)}</a>.`} Al enviar aceptas el <a href="politicas.html#privacidad">aviso de privacidad</a>.</small>
        </form>
        <small>¿Dudas? <a href="${tel}">Llámanos</a>.</small>
      </aside>
    </div>`;
    document.getElementById("order").addEventListener("submit", submit);
    sessionInfo();
  }

  // Comprar requiere sesión con Google: sin ella se muestra esto en lugar del formulario.
  function loginCard() {
    return `<div class="login-hint login-required" id="login-required"${window.GP.account() ? " hidden" : ""}>
      <p><strong>Inicia sesión para comprar.</strong> Usamos tu cuenta de Google para guardar tu pedido y que veas su estado en Mi cuenta.</p>
      <a class="btn btn-primary btn-block" href="cuenta.html?next=carrito.html">Continuar con Google</a></div>`;
  }

  // Confirma la sesión real (el token guardado pudo vencer); llena el nombre si está vacío.
  let me = null;
  async function sessionInfo() {
    const auth = window.GP_AUTH && (await window.GP_AUTH.catch(() => null));
    me = auth ? await auth.user() : null;
    const form = document.getElementById("order"), gate = document.getElementById("login-required");
    if (form) form.hidden = !me;
    if (gate) gate.hidden = !!me;
    if (!me) return;
    const hint = document.getElementById("login-hint");
    if (hint) hint.textContent = `Comprando como ${auth.name(me)}. Verás este pedido en Mi cuenta.`;
    const n = document.getElementById("f-nombre");
    if (n && !n.value) n.value = auth.name(me);
  }

  // Guarda el pedido en Supabase (lo ve el admin y, con sesión, el cliente en Mi cuenta).
  async function saveOrder(ref, d) {
    const auth = window.GP_AUTH && (await window.GP_AUTH.catch(() => null));
    if (!auth) throw new Error("sin conexión con la base");
    if (!me) throw new Error("sin sesión");
    const items = cart.items().map(({ qty, p, v }) => ({ handle: p.handle, title: p.title, variant: v.title === "Default Title" ? "" : v.title, qty, price: v.price }));
    const customer = { nombre: d.nombre, telefono: d.telefono, calle: d.calle, colonia: d.colonia, cp: d.cp, ciudad: d.ciudad, estado: d.estado, notas: d.notas || "", email: me ? me.email : "" };
    const { error } = await auth.sb.from("orders").insert({ ref, customer, items, subtotal: Math.round(cart.total() * 100) / 100, user_id: me ? me.id : null });
    if (error) throw error;
  }
  const newRef = () => [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const err = document.getElementById("form-error");
    const bad = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
    if (bad) {
      err.textContent = `Revisa el campo “${form.querySelector(`label[for="${bad.id}"]`).textContent}”.`;
      err.hidden = false;
      bad.focus();
      return;
    }
    err.hidden = true;
    const d = Object.fromEntries(new FormData(form));
    try {
      if (d.recordar) localStorage.setItem(KEY, JSON.stringify({ ...d, recordar: undefined }));
      else localStorage.removeItem(KEY);
    } catch {}

    const ref = newRef();
    const btn = form.querySelector('button[type="submit"]');

    // Sin WhatsApp configurado: el pedido queda guardado y la tienda llama para confirmarlo.
    if (!phoneOk) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
      try {
        await saveOrder(ref, d);
      } catch (x) {
        btn.disabled = false;
        btn.textContent = "Enviar pedido";
        err.textContent = "No pudimos enviar tu pedido. Revisa tu conexión e intenta de nuevo, o llámanos.";
        err.hidden = false;
        return;
      }
      cart.clear();
      root.innerHTML = `<div class="empty" role="status"><h2>¡Recibimos tu pedido #${ref}!</h2>
        <p>Te llamaremos al ${esc(d.telefono)} para confirmar disponibilidad, costo de envío y forma de pago.</p>
        ${me ? `<a class="btn btn-secondary" href="cuenta.html">Ver mis pedidos</a>` : ""} <a class="btn btn-primary" href="index.html">Seguir comprando</a></div>`;
      return;
    }

    const total = cart.total();
    const lines = cart.items().map(({ qty, p, v }) => `• ${qty} × ${p.title}${v.title !== "Default Title" ? ` (${v.title})` : ""} — ${money(v.price * qty)}`);
    const saving = saveOrder(ref, d); // se guarda mientras se abre WhatsApp
    const msg = [
      `Hola GrandPET, quiero hacer este pedido (#${ref}):`, "", ...lines, "",
      `Subtotal: ${money(total)}`,
      total >= CFG.freeShipping ? "Envío: gratis (sujeto a cobertura)" : "Envío: por confirmar",
      "", "Datos de entrega:",
      `Nombre: ${d.nombre}`, `Teléfono: ${d.telefono}`,
      `Dirección: ${d.calle}, Col. ${d.colonia}, C.P. ${d.cp}, ${d.ciudad}, ${d.estado}`,
      d.notas ? `Notas: ${d.notas}` : "",
    ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n").trim();
    const link = wa(msg);
    window.open(link, "_blank", "noopener");

    saving.catch(() => {}); // si falla, el pedido igual va completo en el mensaje de WhatsApp
    root.innerHTML = `<div class="empty" role="status"><h2>¡Listo! Abrimos WhatsApp con tu pedido #${ref}</h2>
      <p>Solo falta que presiones <strong>Enviar</strong> en WhatsApp. Te responderemos para confirmar envío y forma de pago.</p>
      <div class="hero-ctas" style="justify-content:center">
        <a class="btn btn-secondary" href="${esc(link)}" target="_blank" rel="noopener">Abrir WhatsApp de nuevo</a>
        <button class="btn btn-primary" type="button" id="done">Ya lo envié, vaciar carrito</button></div></div>`;
    document.getElementById("done").addEventListener("click", () => { cart.clear(); location.href = "index.html"; });
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (b) cart.set(b.dataset.set, Math.max(0, Number(b.dataset.to)));
  });
  root.addEventListener("change", (e) => {
    const id = e.target.dataset.qty;
    if (id) cart.set(id, Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)));
  });
  // Al cambiar cantidades solo se repinta la lista: el formulario conserva lo que ya escribió el cliente.
  document.addEventListener("cart:change", () => {
    const list = document.getElementById("cart-list");
    if (!cart.count()) return mount();
    if (!list) return;
    list.innerHTML = listHTML();
    document.getElementById("subtotal").textContent = money(cart.total());
  });
  mount();
});
