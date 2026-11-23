/* GrandPET — JS compartido: header/footer, promos, carrito, tarjetas, carrusel y búsqueda. Sin librerías. */
(function () {
  "use strict";
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
  function priceHTML(p, v) {
    if (!v) {
      const prices = p.variants.map((x) => x.price);
      const min = Math.min(...prices);
      if (min !== Math.max(...prices)) return `<div class="price"><span class="price-now"><small>Desde</small>${money(min)}</span></div>`;
      v = p.variants[0];
    }
    if (v.compare && v.compare > v.price) {
      const off = Math.round((1 - v.price / v.compare) * 100);
      return `<div class="price"><span class="price-now"><small>Hoy</small>${money(v.price)}</span><span class="price-was"><span class="sr-only">Precio anterior: </span>antes ${money(v.compare)}</span><span class="price-off">Ahorras ${off}%</span></div>`;
    }
    return `<div class="price"><span class="price-now">${money(v.price)}</span></div>`;
  }
  const petLabel = { perro: "Perro", gato: "Gato", ambos: "Perro y gato", otros: "Pequeñas especies" };
  function tagsHTML(p) {
    const t = [`<span class="tag tag-${p.pet}">${petLabel[p.pet]}</span>`];
    if (p.stage) t.push(`<span class="tag">${esc(p.stage)}</span>`);
    if (p.size) t.push(`<span class="tag">${esc(p.size)}</span>`);
    return `<div class="tags">${t.join("")}</div>`;
  }
  const url = (p) => `producto.html?p=${encodeURIComponent(p.handle)}`;

  function cardHTML(p, { eager = false } = {}) {
    const single = p.variants.length === 1;
    const avail = p.variants.some((v) => v.available);
    const im = p.images[0];
    const btn = !avail
      ? `<span class="soldout">Agotado</span>`
      : single
        ? `<button class="btn btn-primary btn-small btn-block" type="button" data-add="${p.variants[0].id}" aria-label="Agregar ${esc(p.short)} al carrito">Agregar</button>`
        : `<a class="btn btn-secondary btn-small btn-block" href="${url(p)}" tabindex="-1" aria-hidden="true">Ver producto</a>`;
    // ponytail: la tienda no expone reseñas; cuando existan, llenar p.rating en los datos y se pintan solas.
    const stars = p.rating ? `<span class="stars" aria-label="${p.rating} de 5 estrellas">${"★".repeat(Math.round(p.rating))}</span>` : "";
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
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b || b.disabled) return;
    const qty = Number(b.dataset.qty || 1);
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
  const NAV = [["perro", "Perro"], ["gato", "Gato"], ["premios", "Premios"], ["humedo", "Alimento húmedo"], ["accesorios", "Accesorios"]];
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
    const navItems = NAV.map(([k, t]) => `<li><a href="coleccion.html?c=${k}"${currentC === k ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")
      + (ofertas ? `<li class="nav-ofertas"><a href="coleccion.html?c=ofertas"${currentC === "ofertas" ? ' aria-current="page"' : ""}>Ofertas</a></li>` : "");
    const h = document.getElementById("site-header");
    if (h) {
      h.outerHTML = `${promoHTML}<header class="site-header"><div class="wrap">
        <div class="header-row">
          <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menú">${ICON.menu}</button>
          <a class="logo" href="index.html" aria-label="GrandPET, inicio">Grand<span>PET</span></a>
          <nav class="main-nav" id="main-nav" aria-label="Principal"><ul>${navItems}</ul></nav>
          <div class="header-search">${searchHTML("q-desk")}</div>
          <div class="header-actions">
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
            <p><a href="https://grandpet.com/acerca/">Conoce GrandPET</a></p></div>
          <div><h2>Compra</h2><ul>${NAV.map(([k, t]) => `<li><a href="coleccion.html?c=${k}">${t}</a></li>`).join("")}<li><a href="coleccion.html?c=paquetes">Paquetes de ahorro</a></li></ul></div>
          <div><h2>Ayuda</h2><ul>
            <li><a href="${tel}">Llámanos: ${esc(phoneText)}</a></li>
            ${waOk ? `<li><a href="${wa("Hola, tengo una pregunta sobre GrandPET")}">WhatsApp: ${esc(waText)}</a></li>` : ""}
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
      }, Math.max(3, secs) * 1000);
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

  window.GP = { CFG, PRODUCTS, BY_HANDLE, COLLECTIONS, collection, cart, cardHTML, priceHTML, tagsHTML, img, money, esc, norm, search, noResultsHTML, shipProgressHTML, setMeta, petLabel, tel, wa, waOk, phoneText, ICON, url, BRANDS, initCarousel };

  renderChrome();
  document.querySelectorAll("[data-search]").forEach(initSearch);
  document.querySelectorAll("[data-carousel]").forEach((s) => initCarousel(s));
  addEventListener("storage", (e) => { if (e.key === KEY) { updateCount(); document.dispatchEvent(new CustomEvent("cart:change")); } });
})();
