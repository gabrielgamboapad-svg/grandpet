/* GrandPET — JS compartido: header/footer, promos, carrito, tarjetas, carrusel y búsqueda. Sin librerías. */

// Las demás páginas esperan a esta promesa (window.GP_READY.then(...)) para usar window.GP.
let gpReady;
window.GP_READY = new Promise((r) => (gpReady = r));

// Lo que edita el admin en Supabase (precios, disponibilidad, textos, promociones y fechas) se aplica
// antes de pintar. Si la base no responde en 2.5 s, la página sigue con los datos locales.
async function loadRemote() {
  const S = window.GP_CONFIG.supabase;
  if (!S) return;
  const get = (path) => fetch(`${S.url}/rest/v1/${path}`, { headers: { apikey: S.key } }).then((r) => (r.ok ? r.json() : []));
  // Copia sin ediciones (para "Restablecer" en el panel) y lista completa incluyendo ocultos.
  window.PRODUCTS_BASE = JSON.parse(JSON.stringify(window.PRODUCTS || []));
  window.PRODUCTS_ALL = window.PRODUCTS || [];
  try {
    const [edits, promos, settings, reviews] = await Promise.race([
      Promise.all([get("product_edits?select=handle,data"), get("promos?select=text,code,link,start_date,end_date"), get("settings?select=key,value"),
        get("reviews?select=handle,rating&status=eq.publicada")]),
      new Promise((_, no) => setTimeout(() => no(new Error("tiempo agotado")), 2500)),
    ]);
    const by = Object.fromEntries((window.PRODUCTS || []).map((p) => [p.handle, p]));
    edits.forEach(({ handle, data }) => {
      const p = by[handle];
      if (!p || !data) return;
      if (typeof data.short === "string" && data.short.trim()) p.short = data.short.trim();
      if (Array.isArray(data.benefits)) p.benefits = data.benefits.filter((b) => typeof b === "string" && b.trim());
      if (data.hidden === true) p.hidden = true;
      p.variants.forEach((v) => {
        const e = data.variants && data.variants[v.id];
        if (!e) return;
        if (typeof e.price === "number" && e.price >= 0) v.price = e.price;
        if (e.compare === null || typeof e.compare === "number") v.compare = e.compare;
        if (typeof e.available === "boolean") v.available = e.available;
      });
    });
    // Promedio de estrellas y número de reseñas publicadas por producto.
    const agg = {};
    reviews.forEach((r) => { const a = (agg[r.handle] ||= { n: 0, sum: 0 }); a.n++; a.sum += r.rating; });
    Object.entries(agg).forEach(([h, a]) => { if (by[h]) { by[h].rating = Math.round((a.sum / a.n) * 10) / 10; by[h].reviewCount = a.n; } });
    window.PRODUCTS = (window.PRODUCTS || []).filter((p) => !p.hidden);
    const C = window.GP_CONFIG;
    C.promos = [...(C.promos || []), ...promos.map((x) => ({ text: x.text, code: x.code, link: x.link, start: x.start_date, end: x.end_date }))];
    settings.forEach((x) => { if (x.value && x.value.start && x.value.end) C[x.key] = x.value; });
  } catch (e) {
    console.warn("GrandPET: sin datos de Supabase, uso los locales.", e.message);
  }
}

(async function () {
  "use strict";
  await loadRemote();
  const CFG = window.GP_CONFIG;
  const PRODUCTS = window.PRODUCTS || [];
  const BY_HANDLE = Object.fromEntries(PRODUCTS.map((p) => [p.handle, p]));
  const BY_VARIANT = {};
  PRODUCTS.forEach((p) => p.variants.forEach((v) => (BY_VARIANT[v.id] = { p, v })));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- utilidades ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const today = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const inRange = (r) => { const d = today(); d.setHours(0, 0, 0, 0); return !!r && new Date(r.start + "T00:00:00") <= d && d <= new Date(r.end + "T00:00:00"); };
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const phoneDigits = digits(CFG.phone);
  const waDigits = digits(CFG.whatsapp);
  const waOk = waDigits.length === 10;
  const tel = phoneDigits.length === 10 ? `tel:+52${phoneDigits}` : "#contacto";
  const wa = (msg) => (waOk ? `https://wa.me/52${waDigits}` + (msg ? `?text=${encodeURIComponent(msg)}` : "") : "#contacto");
  const phoneText = phoneDigits.length === 10 ? phoneDigits.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2 $3") : CFG.phone;
  const waText = waOk ? waDigits.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2 $3") : "";

  // Marcas: textos tomados de grandpet.com.
  const BRANDS = {
    "Natural Gourmet": "0% granos y sin sabores, colores ni conservadores artificiales. Una dieta rica en carne, frutos del bosque, vegetales y grasas de alta calidad, como la naturaleza la proporciona.",
    "Back 2 Nature": "Alimento holístico, libre de granos y gluten, con proteínas de alto valor biológico como cordero, salmón, cerdo, pavo y pescado. Sin saborizantes, colorantes ni conservadores artificiales.",
    "Carne Fresca": "Contiene carne que no ha sido congelada: proteínas de alto valor biológico y alta digestibilidad. Enriquecido con hierbas funcionales y con menos de 30% de carbohidratos (arroz y avena).",
    Magno: "Contiene carne que no ha sido congelada, con proteínas de alta digestibilidad que cubren sus requerimientos con menor cantidad de alimento, y hierbas funcionales para su digestión.",
    Noble: "Alimento premium, con amor del bueno: una combinación de ingredientes que da vitalidad y un sistema inmune saludable, con alta digestibilidad y bajas grasas saturadas.",
    Kisha: "Porque su ronroneo, incondicionalidad y suavidad nos conquistan: alimento hecho con amor que ayuda a mantener sano a tu gato.",
  };

  // Imagen responsiva: las fotos de producto están en cdn.shopify.com, que acepta &width=.
  function img(src, { widths = [240, 360, 480, 720], sizes = "50vw", alt = "", eager = false, w = 1, h = 1 } = {}) {
    if (!src) return "";
    const u = (x) => src + (src.includes("?") ? "&" : "?") + "width=" + x;
    return `<img src="${esc(u(widths[1] || widths[0]))}" srcset="${widths.map((x) => esc(u(x)) + " " + x + "w").join(", ")}" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  // ---------- precios: "Hoy/antes" solo con descuento real; "Desde" si depende del tamaño ----------
  // Siempre el mismo formato: "Hoy $X · Antes $Y · Ahorras Z%". "Antes" solo si la tienda trae un precio
  // anterior mayor al actual (compare_at_price). Sin variante elegida y con varios precios, se muestra la
  // presentación más barata y se dice cuál es ("Desde $X · Presentación: 2 Kg").
  function priceHTML(p, v) {
    let from = false;
    if (!v) {
      const prices = p.variants.map((x) => x.price);
      from = Math.min(...prices) !== Math.max(...prices);
      v = from ? p.variants.reduce((a, b) => (b.price < a.price ? b : a)) : p.variants[0];
    }
    const disc = v.compare && v.compare > v.price;
    const off = disc ? Math.round((1 - v.price / v.compare) * 100) : 0;
    const kind = /cantidad|paquete/i.test(p.optionName) ? "Cantidad" : "Presentación"; // la tienda usa Peso, Opciones, Size…
    const size = from && v.title !== "Default Title" ? `<span class="price-size">${kind}: ${esc(v.title)}</span>` : "";
    return `<div class="price"><span class="price-now"><small>${from ? "Desde" : disc ? "Hoy" : ""}</small>${money(v.price)}</span>${disc
      ? `<span class="price-was"><span class="sr-only">Precio anterior: </span>Antes ${money(v.compare)}</span><span class="price-off">Ahorras ${off}%</span>` : ""}${size}</div>`;
  }
  const petLabel = { perro: "Perro", gato: "Gato", ambos: "Perro y gato", otros: "Pequeñas especies" };
  function tagsHTML(p) {
    const t = [`<span class="tag tag-${p.pet}">${petLabel[p.pet]}</span>`];
    if (p.stage) t.push(`<span class="tag">${esc(p.stage)}</span>`);
    if (p.size) t.push(`<span class="tag">${esc(p.size)}</span>`);
    return `<div class="tags">${t.join("")}</div>`;
  }
  const url = (p) => `producto.html?p=${encodeURIComponent(p.handle)}`;
  // Estrellas solo con reseñas publicadas (aprobadas por el admin).
  function starsHTML(p) {
    if (!p.reviewCount) return "";
    const full = Math.round(p.rating);
    return `<span class="stars" role="img" aria-label="${p.rating} de 5 estrellas, ${p.reviewCount} ${p.reviewCount === 1 ? "reseña" : "reseñas"}">${"★".repeat(full)}${"☆".repeat(5 - full)} <small>${p.rating} (${p.reviewCount})</small></span>`;
  }
  // Carga supabase-js y auth.js solo cuando hacen falta (p. ej. escribir una reseña).
  function loadAuth() {
    if (window.GP_AUTH) return window.GP_AUTH;
    const add = (src, attrs = {}) => new Promise((ok, no) => {
      const s = Object.assign(document.createElement("script"), { src, onload: ok, onerror: () => no(new Error("No se pudo cargar " + src)) });
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
      document.head.append(s);
    });
    return add("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js", {
      integrity: "sha384-rwykjmWNwVxboyFmvK9OXN0wj9hnMHA2aAHtits54DuACyCq0M2PrSNxhRb+hvXT", crossorigin: "anonymous" })
      .then(() => add("assets/js/auth.js")).then(() => window.GP_AUTH);
  }

  function cardHTML(p, { eager = false } = {}) {
    const single = p.variants.length === 1;
    const avail = p.variants.some((v) => v.available);
    const im = p.images[0];
    const btn = !avail
      ? `<span class="soldout">Agotado</span>`
      : single
        ? `<button class="btn btn-primary btn-small btn-block" type="button" data-add="${p.variants[0].id}" aria-label="Agregar ${esc(p.short)} al carrito">Agregar</button>`
        : `<a class="btn btn-secondary btn-small btn-block" href="${url(p)}" tabindex="-1" aria-hidden="true">Ver producto</a>`;
    const stars = starsHTML(p);
    return `<article class="card">
      <div class="card-media">${img(im && im.src, { alt: `Empaque de ${p.short}`, eager, w: (im && im.w) || 1, h: (im && im.h) || 1, sizes: "(min-width:1024px) 280px, (min-width:700px) 40vw, 75vw" })}</div>
      <div class="card-body">${tagsHTML(p)}<h3 class="card-title"><a href="${url(p)}">${esc(p.short)}</a></h3>${stars}${priceHTML(p)}${btn}</div>
    </article>`;
  }

  // ---------- colecciones (filtradas desde los datos) ----------
  const disc = (p) => p.variants.some((v) => v.compare && v.compare > v.price);
  const COLLECTIONS = {
    "mas-vendidos": { title: "Más vendidos", sort: "rank", test: () => true, desc: "Los alimentos y premios GrandPET más comprados por familias en todo México: Carne Fresca, Kisha, Noble, Natural Gourmet y más." },
    perro: { title: "Perro", test: (p) => p.pet === "perro" || p.pet === "ambos", desc: "Croquetas, alimento húmedo, premios y accesorios para perro de todas las etapas y tamaños. Marcas GrandPET con envío nacional." },
    gato: { title: "Gato", test: (p) => p.pet === "gato" || p.pet === "ambos", desc: "Alimento seco y húmedo para gato y gatito, arena y accesorios. Kisha, Natural Gourmet Feline y Back 2 Nature Feline." },
    premios: { title: "Premios", test: (p) => p.format === "Premio", desc: "Premios naturales y deshidratados para perro: patas de pollo, tráquea, tímpano, fémur y más de Beast Friend y Natural Gourmet." },
    humedo: { title: "Alimento húmedo", test: (p) => p.format === "Húmedo", desc: "Sobres de alimento húmedo para perro y gato en piezas sueltas o paquetes de 10 y 40: Noble, Kisha, Carne Fresca, Natural Gourmet." },
    accesorios: { title: "Accesorios", test: (p) => p.format === "Accesorio" || p.format === "Higiene", desc: "Contenedores croqueteros herméticos, areneros, rascadores, shampoo y arena para gato GrandPET Elite, Shine y Kisha." },
    ofertas: { title: "Ofertas", test: disc, desc: "Productos GrandPET con precio rebajado por tiempo limitado. Alimento y premios para perro y gato con descuento real." },
    cachorros: { title: "Para cachorros", test: (p) => p.pet === "perro" && p.stage === "Cachorro", desc: "Alimento para perro cachorro: croquetas, sobres, papillas y sustituto de leche para sus primeros meses." },
    gatitos: { title: "Para gatitos", test: (p) => p.pet === "gato" && p.stage === "Gatito", desc: "Alimento para gatito: Kisha Kittens y Back 2 Nature Feline Kittens, nutrición completa desde el destete." },
    paquetes: { title: "Paquetes de ahorro", test: (p) => p.format === "Paquete", desc: "Paquetes GrandPET que combinan croquetas con sobres, premios o contenedor para ahorrar en cada compra." },
    todo: { title: "Todos los productos", test: () => true, desc: "Catálogo completo GrandPET: alimento seco y húmedo, premios, aderezos y accesorios para perros y gatos." },
  };
  function collection(key, limit) {
    const c = COLLECTIONS[key] || COLLECTIONS.todo;
    let list = PRODUCTS.filter(c.test);
    if (c.sort === "rank") list = list.slice().sort((a, b) => a.rank - b.rank);
    return limit ? list.slice(0, limit) : list;
  }

  // ---------- carrito (localStorage: solo id de variante y cantidad; precios siempre de los datos) ----------
  const KEY = "gp_cart";
  const cart = {
    read() {
      try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter((l) => BY_VARIANT[l.id] && l.qty > 0); } catch { return []; }
    },
    write(lines) { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} updateCount(); document.dispatchEvent(new CustomEvent("cart:change")); },
    add(id, qty = 1) {
      id = Number(id);
      const lines = cart.read();
      const l = lines.find((x) => x.id === id);
      if (l) l.qty = Math.min(99, l.qty + qty); else lines.push({ id, qty: Math.min(99, qty) });
      cart.write(lines);
    },
    set(id, qty) { cart.write(cart.read().map((l) => (l.id === Number(id) ? { ...l, qty: Math.min(99, qty) } : l)).filter((l) => l.qty > 0)); },
    items() { return cart.read().map((l) => ({ ...l, ...BY_VARIANT[l.id] })); },
    total() { return cart.items().reduce((s, l) => s + l.v.price * l.qty, 0); },
    count() { return cart.read().reduce((s, l) => s + l.qty, 0); },
    clear() { cart.write([]); },
  };
  function updateCount() {
    const n = cart.count();
    document.querySelectorAll(".cart-count").forEach((el) => { el.textContent = n; el.hidden = !n; });
    document.querySelectorAll("[data-cart-link]").forEach((el) => el.setAttribute("aria-label", `Carrito, ${n} ${n === 1 ? "producto" : "productos"}`));
  }
  function shipProgressHTML(total = cart.total()) {
    const goal = CFG.freeShipping;
    const left = Math.max(0, goal - total);
    const pct = Math.min(100, Math.round((total / goal) * 100));
    const msg = left > 0 ? `Te faltan <strong>${money(left)}</strong> para envío gratis` : "¡Tu pedido tiene envío gratis!";
    return `<div class="ship-progress"><p>${msg}</p><div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div><small>Envío gratis desde ${money(goal)} MXN, sujeto a cobertura.</small></div>`;
  }

  // Confirmación visual: arriba a la derecha, bajo el header; no tapa precio ni botón.
  let toastTimer;
  function toast(id, qty) {
    const { p, v } = BY_VARIANT[id];
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.append(el); }
    const im = p.images[0];
    el.innerHTML = `<div class="toast-row">${im ? img(im.src, { widths: [96, 144], sizes: "48px" }) : ""}<p>Agregado al carrito: ${qty} × ${esc(p.short)}${v.title !== "Default Title" ? " · " + esc(v.title) : ""}</p>
      <button class="icon-btn toast-close" type="button" aria-label="Cerrar aviso">✕</button></div>${shipProgressHTML()}
      <a class="btn btn-primary btn-small btn-block" href="carrito.html">Ver carrito</a>`;
    el.hidden = false;
    el.querySelector(".toast-close").onclick = () => (el.hidden = true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 6000);
    el.onmouseenter = el.onfocusin = () => clearTimeout(toastTimer);
  }
  // Comprar requiere sesión: sin sesión se guarda el producto pendiente y se pide iniciar sesión;
  // al volver (ya con sesión) se agrega solo. La base de datos también rechaza pedidos sin sesión.
  const PENDING = "gp_pending_add";
  const here = () => location.pathname.split("/").pop() + location.search;
  const loginUrl = () => `cuenta.html?next=${encodeURIComponent(here() || "index.html")}`;
  function askLogin(id, qty) {
    try { sessionStorage.setItem(PENDING, JSON.stringify({ id: Number(id), qty, from: here() })); } catch {}
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.append(el); }
    el.innerHTML = `<div class="toast-row"><p>Inicia sesión con tu cuenta de Google para comprar. Te regresamos aquí y agregamos el producto a tu carrito.</p>
      <button class="icon-btn toast-close" type="button" aria-label="Cerrar aviso">✕</button></div>
      <a class="btn btn-primary btn-small btn-block" href="${loginUrl()}">Continuar con Google</a>`;
    el.hidden = false;
    el.querySelector(".toast-close").onclick = () => (el.hidden = true);
    clearTimeout(toastTimer);
    el.querySelector("a").focus();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b || b.disabled) return;
    const qty = Number(b.dataset.qty || 1);
    if (!account()) return askLogin(b.dataset.add, qty);
    cart.add(b.dataset.add, qty);
    toast(Number(b.dataset.add), qty);
  });

  // ---------- header, promos y footer (una sola fuente para todas las páginas) ----------
  const ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke-linecap="round"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z"/></svg>',
  };
  // Nombre de quien inició sesión (lo guarda supabase-js en localStorage); "" si no hay sesión.
  function account() {
    try {
      const ref = new URL(CFG.supabase.url).hostname.split(".")[0];
      const s = JSON.parse(localStorage.getItem(`sb-${ref}-auth-token`) || "null");
      const u = s && s.user;
      if (!u || (s.expires_at && s.expires_at * 1000 < Date.now() - 7 * 864e5)) return "";
      return (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name) || u.email || "Mi cuenta").split(" ")[0];
    } catch { return ""; }
  }
  const NAV = [["perro", "Perro"], ["gato", "Gato"], ["premios", "Premios"], ["humedo", "Alimento húmedo"], ["accesorios", "Accesorios"]];
  // Páginas de la empresa (contenido de grandpet.com). La Huella Dorada solo aparece mientras esté vigente.
  const CORP = () => [["nosotros.html", "Nosotros"], ["marcas.html", "Marcas"],
    ...(inRange(CFG.huella) ? [["promociones.html", "La Huella Dorada"]] : []), ["contacto.html", "Contacto"]];
  const currentC = new URLSearchParams(location.search).get("c");

  function searchHTML(id) {
    return `<form class="search" role="search" action="coleccion.html" data-search>
      <label class="sr-only" for="${id}">Buscar productos</label>${ICON.search}
      <input id="${id}" name="q" type="search" placeholder="Buscar croquetas, premios, Kisha…" autocomplete="off"
        role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list">
      <div class="search-results" id="${id}-list" role="listbox" aria-label="Sugerencias" hidden></div></form>`;
  }

  function renderChrome() {
    const promos = (CFG.promos || []).filter(inRange);
    const promoHTML = promos.map((p) => `<div class="promo-bar" role="note">${esc(p.text)}${p.code ? ` · Código <code>${esc(p.code)}</code>` : ""} · Válido hasta el ${fmtDate(p.end)}${p.link ? ` · <a href="${esc(p.link)}">Ver más</a>` : ""}</div>`).join("");
    const ofertas = inRange(CFG.ofertas);
    const page = location.pathname.split("/").pop() || "index.html";
    const cur = (href) => (href === page ? ' aria-current="page"' : "");
    const corp = CORP().map(([href, t]) => `<li class="nav-corp"><a href="${href}"${cur(href)}>${t}</a></li>`).join("");
    const navItems = `<li><a href="index.html"${page === "index.html" ? ' aria-current="page"' : ""}>Inicio</a></li>`
      + NAV.map(([k, t]) => `<li><a href="coleccion.html?c=${k}"${currentC === k ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")
      + (ofertas ? `<li class="nav-ofertas"><a href="coleccion.html?c=ofertas"${currentC === "ofertas" ? ' aria-current="page"' : ""}>Ofertas</a></li>` : "")
      + `<li class="nav-sep" role="separator"></li>${corp}`
      + `<li class="nav-corp"><a href="${account() ? "cuenta.html" : loginUrl()}"${page === "cuenta.html" ? ' aria-current="page"' : ""}>${account() ? `Mi cuenta (${esc(account())})` : "Iniciar sesión"}</a></li>`;
    const h = document.getElementById("site-header");
    if (h) {
      h.outerHTML = `${promoHTML}<div class="topbar"><div class="wrap">
        <nav aria-label="GrandPET"><ul>${CORP().map(([href, t]) => `<li><a href="${href}"${cur(href)}>${t}</a></li>`).join("")}</ul></nav>
        <a href="${tel}">Llámanos ${esc(phoneText)}</a></div></div>
      <header class="site-header"><div class="wrap">
        <div class="header-row">
          <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menú">${ICON.menu}</button>
          <a class="logo" href="index.html"><img src="assets/img/logo-grandpet.webp" alt="GrandPET, inicio" width="220" height="203"></a>
          <nav class="main-nav" id="main-nav" aria-label="Principal"><ul>${navItems}</ul></nav>
          <div class="header-search">${searchHTML("q-desk")}</div>
          <div class="header-actions">
            ${account()
              ? `<a class="icon-btn" href="cuenta.html" aria-label="Mi cuenta">${ICON.user}<span class="account-label">${esc(account())}</span></a>`
              : `<a class="btn btn-secondary btn-small header-login" href="${loginUrl()}">${ICON.user}<span class="lbl-long">Iniciar sesión</span><span class="lbl-short">Entrar</span></a>`}
            <a class="icon-btn" href="carrito.html" data-cart-link aria-label="Carrito">${ICON.cart}<span class="cart-count" hidden>0</span></a>
          </div>
        </div>
        <div class="search-row">${searchHTML("q-mob")}</div>
      </div></header>`;
      const t = document.querySelector(".menu-toggle");
      const nav = document.getElementById("main-nav");
      t.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        t.setAttribute("aria-expanded", open);
        t.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); t.setAttribute("aria-expanded", false); t.focus(); }
      });
    }
    const f = document.getElementById("site-footer");
    if (f) {
      f.outerHTML = `<footer class="site-footer" id="contacto"><div class="wrap">
        <div class="footer-grid">
          <div><h2>GrandPET®</h2><p>Empresa familiar 100% mexicana, fundada y ubicada en Guanajuato. Nuestra misión: mejorar la calidad de vida de las mascotas para crear felicidad.</p>
            <p><a href="nosotros.html">Conoce GrandPET</a></p><ul>${CORP().filter(([h]) => h !== "nosotros.html").map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
          <div><h2>Compra</h2><ul>${NAV.map(([k, t]) => `<li><a href="coleccion.html?c=${k}">${t}</a></li>`).join("")}<li><a href="coleccion.html?c=paquetes">Paquetes de ahorro</a></li></ul></div>
          <div><h2>Ayuda</h2><ul>
            <li><a href="${tel}">Llámanos: ${esc(phoneText)}</a></li>
            <li><a href="mailto:${CFG.email}">${esc(CFG.email)}</a></li>
            ${waOk ? `<li><a href="${wa("Hola, tengo una pregunta sobre GrandPET")}">WhatsApp: ${esc(waText)}</a></li>` : ""}
            <li><a href="politicas.html#compras-sitio">Cómo comprar</a></li>
            <li><a href="politicas.html#envios">Política de envíos</a></li>
            <li><a href="politicas.html#devoluciones">Cambios y devoluciones</a></li>
            <li><a href="politicas.html#privacidad">Aviso de privacidad</a></li>
            <li><a href="politicas.html#terminos">Términos y condiciones</a></li></ul></div>
        </div>
        <p class="footer-legal">© ${new Date().getFullYear()} GrandPET®. Certificado FSSC 22000 (sistema de gestión de seguridad alimentaria), certificado MEXF-0028. Envíos nacionales · Envío gratis desde ${money(CFG.freeShipping)} MXN, sujeto a cobertura.</p>
      </div></footer>
      ${waOk ? `<a class="wa-float" href="${wa("Hola, tengo una pregunta sobre GrandPET")}" aria-label="Escríbenos por WhatsApp">${ICON.wa}</a>` : ""}`;
    }
    document.querySelectorAll("[data-phone]").forEach((a) => { a.href = tel; a.textContent = phoneText; });
    document.querySelectorAll("[data-whatsapp]").forEach((a) => { a.href = wa(a.dataset.whatsapp); });
    updateCount();
  }

  // ---------- búsqueda predictiva con sinónimos ----------
  const SYN = [
    ["croqueta", "seco", "alimento seco", "kibble"],
    ["cachorro", "puppy", "baby", "perrito"],
    ["gato", "felino", "feline", "michi"],
    ["gatito", "kitten"],
    ["perro", "canino", "dog"],
    ["humedo", "sobre", "pouch", "lata"],
    ["premio", "treat", "snack", "golosina"],
    ["arena", "arenero"],
  ];
  const HAY = PRODUCTS.map((p) => {
    let h = norm([p.title, petLabel[p.pet], p.stage, p.size, p.format, p.brand, p.format === "Seco" ? "croqueta alimento seco" : ""].join(" "));
    SYN.forEach((g) => { if (g.some((w) => h.includes(w))) h += " " + g.join(" "); });
    return h;
  });
  const stem = (t) => (t.length > 4 ? t.replace(/(es|s)$/, "") : t); // croquetas→croqueta, sobres→sobre
  function search(q) {
    const toks = norm(q).split(/\s+/).filter((t) => t.length > 1).map(stem);
    if (!toks.length) return [];
    return PRODUCTS.filter((p, i) => toks.every((t) => HAY[i].includes(t))).sort((a, b) => a.rank - b.rank);
  }
  const noResultsHTML = (q) => `<p class="muted">No encontramos “${esc(q)}”. Prueba con:</p>
    <div class="chips">${[["perro", "Perro"], ["gato", "Gato"], ["premios", "Premios"], ["humedo", "Alimento húmedo"], ["cachorros", "Cachorros"]].map(([k, t]) => `<a class="chip" href="coleccion.html?c=${k}">${t}</a>`).join("")}</div>
    <p class="muted">¿Buscas algo específico? ${waOk ? `<a href="${wa("Hola, busco: " + q)}">Pregúntanos por WhatsApp</a>` : `<a href="${tel}">Llámanos al ${esc(phoneText)}</a>`}</p>`;

  function initSearch(form) {
    const input = form.querySelector("input");
    const list = form.querySelector(".search-results");
    let sel = -1, timer;
    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); sel = -1; input.removeAttribute("aria-activedescendant"); };
    const render = () => {
      const q = input.value.trim();
      if (q.length < 2) return close();
      const r = search(q).slice(0, 6);
      list.innerHTML = r.length
        ? r.map((p, i) => `<a role="option" id="${list.id}-${i}" href="${url(p)}" aria-selected="false">${p.images[0] ? img(p.images[0].src, { widths: [96, 144], sizes: "48px" }) : ""}<span><strong>${esc(p.short)}</strong><br><small>${petLabel[p.pet]}${p.stage ? " · " + esc(p.stage) : ""} · ${money(Math.min(...p.variants.map((v) => v.price)))}</small></span></a>`).join("")
          + `<a role="option" id="${list.id}-${r.length}" href="coleccion.html?q=${encodeURIComponent(q)}" aria-selected="false"><span>Ver todos los resultados de “${esc(q)}”</span></a>`
        : noResultsHTML(q);
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      sel = -1;
    };
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 120); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") return close();
      const opts = [...list.querySelectorAll('[role="option"]')];
      if (!opts.length || list.hidden || !["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
      if (e.key === "Enter") { if (sel >= 0) { e.preventDefault(); location.href = opts[sel].href; } return; }
      e.preventDefault();
      sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute("aria-selected", i === sel));
      input.setAttribute("aria-activedescendant", opts[sel].id);
      opts[sel].scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("click", (e) => { if (!form.contains(e.target)) close(); });
  }

  // ---------- carrusel: CSS scroll-snap + JS mínimo ----------
  // Uso: <section data-carousel data-collection="perro" data-title="Para perro" data-limit="10" [data-autoplay="4"] [data-eager]></section>
  // o GP.initCarousel(seccion, listaDeProductos) para una lista propia (p. ej. relacionados).
  function initCarousel(sec, list) {
    const key = sec.dataset.collection || "todo";
    const limit = Number(sec.dataset.limit || 10);
    const eager = sec.hasAttribute("data-eager");
    const items = list ? list.slice(0, limit) : collection(key, limit);
    if (!items.length) return sec.remove();
    const title = sec.dataset.title || COLLECTIONS[key].title;
    const id = "c-" + (sec.id || key);
    const secs = Number(sec.dataset.autoplay || 0);
    const auto = secs && !reduceMotion;
    sec.setAttribute("role", "region");
    sec.setAttribute("aria-roledescription", "carrusel");
    sec.setAttribute("aria-label", title);
    sec.innerHTML = `<div class="wrap">
      <div class="carousel-head"><h2 id="${id}-t">${esc(title)}</h2>
        <div class="carousel-controls">${auto ? `<button class="arrow play" type="button" aria-pressed="false" aria-label="Pausar desplazamiento automático de ${esc(title)}">❚❚</button>` : ""}
        <div class="carousel-arrows"><button class="arrow" type="button" data-dir="-1" aria-label="Productos anteriores de ${esc(title)}">◀</button><button class="arrow" type="button" data-dir="1" aria-label="Más productos de ${esc(title)}">▶</button></div></div></div>
      <ul class="track" tabindex="0" aria-labelledby="${id}-t">${items.map((p, i) => `<li>${cardHTML(p, { eager: eager && i < 2 })}</li>`).join("")}</ul>
      ${list ? "" : `<p><a class="link-quiet" href="coleccion.html?c=${key}">Ver todo: ${esc(title)} →</a></p>`}</div>`;
    const track = sec.querySelector(".track");
    const [prev, next] = sec.querySelectorAll("[data-dir]");
    const step = () => (track.querySelector("li")?.offsetWidth || 200) + 14;
    const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    const go = (dir) => track.scrollBy({ left: dir * Math.max(step(), track.clientWidth - step() * 0.5), behavior: reduceMotion ? "auto" : "smooth" });
    const sync = () => { prev.disabled = track.scrollLeft <= 2; next.disabled = atEnd(); };
    prev.onclick = () => go(-1);
    next.onclick = () => go(1);
    track.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    addEventListener("resize", sync);
    sync();
    track.addEventListener("keydown", (e) => {
      if (e.target !== track) return;
      if (e.key === "ArrowRight") { e.preventDefault(); track.scrollBy({ left: step() }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: -step() }); }
    });

    // Arrastre con mouse en escritorio (en táctil el deslizamiento es nativo).
    let down = null, moved = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = { x: e.clientX, left: track.scrollLeft }; moved = false;
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add("dragging"); }
      if (moved) track.scrollLeft = down.left - dx;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = null;
      if (moved) {
        track.classList.remove("dragging"); // al volver el snap, el navegador encaja en la tarjeta más cercana
        setTimeout(() => (moved = false), 0);
      }
    });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());

    // Rueda: lo horizontal (trackpad, Shift+rueda) es nativo. La rueda vertical mueve el carrusel solo en
    // escritorio y solo mientras haya hacia dónde moverse; en los extremos sigue el scroll de la página.
    track.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey || !matchMedia("(min-width:1024px)").matches) return;
      if ((track.scrollLeft <= 2 && e.deltaY < 0) || (atEnd() && e.deltaY > 0)) return;
      e.preventDefault();
      track.scrollBy({ left: e.deltaY, behavior: "auto" });
    }, { passive: false });

    // Desplazamiento automático (data-autoplay="segundos"). Se pausa con hover, foco o toque (y se reanuda
    // al soltar), con el botón ❚❚ de forma permanente, y no corre con prefers-reduced-motion ni fuera de pantalla.
    if (auto) {
      let hold = false, stopped = false, visible = true, touchTimer;
      const pauseBtn = sec.querySelector(".play");
      const setStopped = (v) => {
        stopped = v;
        pauseBtn.setAttribute("aria-pressed", v);
        pauseBtn.textContent = v ? "▶" : "❚❚";
        pauseBtn.setAttribute("aria-label", `${v ? "Reanudar" : "Pausar"} desplazamiento automático de ${title}`);
      };
      pauseBtn.onclick = () => setStopped(!stopped);
      sec.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hold = true; });
      sec.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hold = false; });
      sec.addEventListener("focusin", (e) => { if (e.target !== pauseBtn) hold = true; });
      sec.addEventListener("focusout", () => (hold = false));
      sec.addEventListener("touchstart", () => { hold = true; clearTimeout(touchTimer); }, { passive: true });
      sec.addEventListener("touchend", () => { touchTimer = setTimeout(() => (hold = false), 5000); }, { passive: true });
      new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(track);
      setInterval(() => {
        if (hold || stopped || !visible || document.hidden) return;
        if (atEnd()) track.scrollTo({ left: 0 }); else track.scrollBy({ left: step() });
      }, Math.max(2, secs) * 1000); // nunca más rápido que cada 2 s
    }
  }

  // ---------- meta helpers ----------
  function setMeta(title, desc) {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.append(m); }
    m.content = desc;
    const og = document.querySelector('meta[property="og:title"]');
    if (og) og.content = title;
    const ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.content = desc;
  }

  window.GP = { CFG, PRODUCTS, BY_HANDLE, COLLECTIONS, collection, cart, cardHTML, priceHTML, tagsHTML, img, money, esc, norm, search, noResultsHTML, shipProgressHTML, setMeta, petLabel, tel, wa, waOk, phoneText, ICON, url, BRANDS, initCarousel, inRange, fmtDate, starsHTML, loadAuth, account, loginUrl };

  renderChrome();
  document.querySelectorAll("[data-search]").forEach(initSearch);
  document.querySelectorAll("[data-carousel]").forEach((s) => initCarousel(s));
  addEventListener("storage", (e) => { if (e.key === KEY) { updateCount(); document.dispatchEvent(new CustomEvent("cart:change")); } });
  // ---------- Animaciones de entrada (≈3 s por sección): sube y aparece, elementos escalonados,
  // rastro de huellitas y barra bajo el título. Solo con JS y sin "reducir movimiento". ----------
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("anim");
    const SEL = ".hero, .page-hero, main > section, main .section, .coll-head, .coll-layout > section, .pdp-head, .pdp-gallery, .pdp-info, .pdp-extra, .brand-hero, .brand-intro, .line-group, .account-page, .cart-layout, .policy, .contact-layout, .login-card, body > section.section";
    const ITEMS = ".card, .cat, .brand-card, .info-card, .logo-card, .line-card, .review, .order, .about-points li, .values li, .steps li, .guide fieldset, .trust li, .cart-item, .cards-3 > li, .cards-4 > li";
    const PAW = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="16" rx="5" ry="4.2"/><circle cx="6.2" cy="9.6" r="2.2"/><circle cx="10" cy="6.2" r="2.2"/><circle cx="14" cy="6.2" r="2.2"/><circle cx="17.8" cy="9.6" r="2.2"/></svg>';
    // Banner por sección: el título (y su subtítulo) pasan a una franja de color con la foto de un
    // producto de la sección y figuras decorativas. Colores alternados; se arma al aparecer.
    let theme = 0;
    function bannerize(sec) {
      if (sec.dataset.banner || sec.closest(".sec-banner")) return;
      const h = sec.matches(".coll-head") ? sec.querySelector(":scope > h1")
        : sec.querySelector(":scope > .wrap > h2, :scope > .wrap > .carousel-head > h2, :scope > h2, :scope > .wrap > header > h2");
      if (!h || h.closest(".hero-card, .guide, .about, .cta-band, .huella-band")) return;
      sec.dataset.banner = "1";
      const im = sec.querySelector(".card-media img, .cat-media img, .brand-media img, .line-media img, .logo-media img, .round-img, .page-hero-img")
        || (sec.matches(".coll-head") && document.querySelector("#grid .card-media img"));
      const src = im && (im.currentSrc || im.getAttribute("src"));
      const sub = h.nextElementSibling && h.nextElementSibling.matches("p.section-sub, .coll-head > p") ? h.nextElementSibling : null;
      const b = document.createElement("div");
      b.className = `sec-banner sb-t${theme++ % 4}`;
      b.innerHTML = `<div class="sb-text"></div><div class="sb-art" aria-hidden="true"><span class="sb-dot d1"></span><span class="sb-dot d2"></span><span class="sb-dot d3"></span>${src ? `<img src="${esc(src)}" alt="" decoding="async">` : PAW}</div><span class="sb-shine" aria-hidden="true"></span>`;
      h.before(b);
      b.querySelector(".sb-text").append(h);
      if (sub) b.querySelector(".sb-text").append(sub);
    }

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      bannerize(e.target);
      e.target.classList.add("rv-in");
      e.target.querySelectorAll(ITEMS).forEach((it, i) => it.style.setProperty("--i", Math.min(i, 9)));
      // Rastro de huellitas, solo en bloques grandes con título.
      if (e.target.querySelector("h1, h2") && e.target.offsetHeight > 160 && !e.target.querySelector(":scope > .paws")) {
        const paws = document.createElement("div");
        paws.className = "paws";
        paws.setAttribute("aria-hidden", "true");
        paws.innerHTML = PAW.repeat(5);
        if (getComputedStyle(e.target).position === "static") e.target.style.position = "relative"; // sin romper sticky
        e.target.prepend(paws);
        setTimeout(() => paws.remove(), 3200);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    // Al terminar, se quita la animación para que no quede ninguna transformación (sticky/fixed).
    const done = (e) => { if (e.target === e.currentTarget && e.animationName === "rv-up") e.target.classList.add("rv-done"); };
    const watch = (el) => { el.classList.add("rv"); el.addEventListener("animationend", done); io.observe(el); };
    const tag = (root) => root.querySelectorAll && root.querySelectorAll(SEL).forEach((el) => { if (!el.classList.contains("rv")) watch(el); });
    tag(document);
    // Red de seguridad: lo que ya quedó arriba o dentro de la pantalla (scroll muy rápido o salto
    // con un enlace #) se muestra aunque el observador no lo haya visto.
    let ticking = false;
    const sweep = () => {
      ticking = false;
      document.querySelectorAll(".rv:not(.rv-in)").forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) { bannerize(el); el.classList.add("rv-in"); io.unobserve(el); }
      });
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; setTimeout(sweep, 250); } }, { passive: true });
    setTimeout(sweep, 1500);
    // Las páginas pintan secciones después (carruseles, ficha, reseñas): también se animan.
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.matches(SEL) && !n.classList.contains("rv")) watch(n);
      tag(n);
    }))).observe(document.body, { childList: true, subtree: true });
  }

  // Producto que se quiso agregar antes de iniciar sesión: se agrega al volver.
  try {
    const pend = JSON.parse(sessionStorage.getItem(PENDING) || "null");
    if (pend && account() && BY_VARIANT[pend.id]) {
      sessionStorage.removeItem(PENDING);
      cart.add(pend.id, pend.qty || 1);
      toast(pend.id, pend.qty || 1);
    }
  } catch {}
  gpReady(window.GP);
})();
