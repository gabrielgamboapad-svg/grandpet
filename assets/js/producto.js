/* Ficha de producto. Orden: nombre+mascota+etapa → galería → tamaño → beneficios → precio → compra+envío → acordeones. */
window.GP_READY.then(function () {
  "use strict";
  const { BY_HANDLE, COLLECTIONS, PRODUCTS, BRANDS, priceHTML, tagsHTML, img, esc, money, setMeta, wa, waOk, tel, phoneText, ICON, CFG, petLabel, initCarousel } = window.GP;
  const params = new URLSearchParams(location.search);
  const p = BY_HANDLE[params.get("p")];
  const root = document.getElementById("pdp");
  if (!p) {
    root.innerHTML = `<div class="empty section"><h1>No encontramos este producto</h1><p>Puede que ya no esté disponible.</p><a class="btn btn-primary" href="coleccion.html?c=mas-vendidos">Ver más vendidos</a></div>`;
    return;
  }

  const coll = { perro: "perro", gato: "gato", ambos: "accesorios", otros: "todo" }[p.pet];
  document.getElementById("crumbs").insertAdjacentHTML("beforeend", ` › <a href="coleccion.html?c=${coll}">${esc(COLLECTIONS[coll].title)}</a> › <span aria-current="page">${esc(p.short)}</span>`);
  const plain = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const desc = (p.benefits.join(". ") || plain(p.sections.intro)).slice(0, 155) || `${p.short} para ${petLabel[p.pet].toLowerCase()}.`;
  setMeta(`${p.short} | GrandPET®`, desc);

  const multi = p.variants.length > 1;
  // Presentaciones de menor a mayor precio; por defecto la más barata disponible, la misma del "Desde" de la tarjeta.
  const byPrice = [...p.variants].sort((a, b) => a.price - b.price);
  let v = p.variants.find((x) => String(x.id) === params.get("v")) || byPrice.find((x) => x.available) || byPrice[0];
  // Las miniaturas usan el alt de la imagen como etiqueta (p. ej. "Beneficios", "Ingredientes"); si no hay, uno genérico.
  const label = (im, i) => im.alt || (i === 0 ? "Empaque" : `Vista ${i + 1}`);
  const altFor = (im, i) => im.alt || (i === 0 ? `Empaque de ${p.title}` : `${p.title}, vista ${i + 1}`);
  const meta = p.variants.length === 1 && p.variants[0].title !== "Default Title" ? p.variants[0].title : "";
  const mainImg = (im, i) => img(im.src, { widths: [360, 540, 720, 1000], sizes: "(min-width:1024px) 560px, 92vw", alt: altFor(im, i), eager: true, w: im.w, h: im.h });

  const ACC = [
    ["ingredientes", "Ingredientes"], ["analisis", "Análisis garantizado"], ["guia", "Guía de alimentación"],
    ["uso", "Modo de uso"], ["intro", "Descripción"],
  ].filter(([k]) => p.sections[k]);

  // p.sections ya viene sanitizado por tools/build_data.py (solo etiquetas de texto, sin atributos).
  root.innerHTML = `<article class="pdp">
    <header class="pdp-head">
      <h1>${esc(p.title)}</h1>
      ${tagsHTML(p)}${meta ? `<p class="link-quiet" style="margin:8px 0 0">${esc(meta)}</p>` : ""}
      ${p.reviewCount ? `<a class="stars-link" href="#resenas">${window.GP.starsHTML(p)}</a>` : ""}
    </header>

    <div class="pdp-gallery">
      <figure class="gallery-main" id="main-img">${p.images[0] ? mainImg(p.images[0], 0) : ""}</figure>
      ${p.images.length > 1 ? `<ul class="thumbs" aria-label="Imágenes del producto">${p.images.map((im, i) => `<li><button type="button" data-img="${i}" aria-current="${i === 0}" aria-label="Ver imagen: ${esc(label(im, i))}">${img(im.src, { widths: [96, 160], sizes: "64px", w: im.w, h: im.h })}<span>${esc(label(im, i))}</span></button></li>`).join("")}</ul>` : ""}
    </div>

    <div class="pdp-info">
      ${multi ? `<fieldset class="variant-picker"><legend>${/cantidad|paquete/i.test(p.optionName) ? "Cantidad" : "Presentación"}</legend><div class="variant-options">
        ${byPrice.map((x) => `<label${x.available ? "" : ' class="agotado"'}><input type="radio" name="variant" value="${x.id}"${x.id === v.id ? " checked" : ""}><span>${esc(x.title)}${x.available ? "" : " · agotado"}</span></label>`).join("")}
      </div></fieldset>` : ""}
      ${p.benefits.length ? `<ul class="benefits" aria-label="Beneficios">${p.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      <div class="buy-box">
        <div id="price" aria-live="polite"></div>
        <p class="stock" id="stock" aria-live="polite"></p>
        <div class="buy-row">
          <div class="qty"><button type="button" data-q="-1" aria-label="Quitar uno">−</button><label class="sr-only" for="qty">Cantidad</label><input id="qty" type="number" min="1" max="99" value="1" inputmode="numeric"><button type="button" data-q="1" aria-label="Agregar uno">+</button></div>
          <button class="btn btn-primary" type="button" id="add">Agregar al carrito</button>
        </div>
        <ul class="ship-signals">
          <li>${ICON.gift}<span id="ship-note"></span></li>
          <li>${ICON.truck}<span>Entrega estimada de 1 a 5 días hábiles en toda la República; en zonas extendidas puede tardar más. <a href="politicas.html#envios">Envíos</a></span></li>
          <li>${ICON.shield}<span>Cambios y devoluciones según nuestra <a href="politicas.html#devoluciones">política</a>. Compra con tu cuenta de Google y sigue tu pedido en Mi cuenta.</span></li>
        </ul>
      </div>
    </div>

    <div class="pdp-extra">
      ${ACC.length ? `<div class="accordion">${ACC.map(([k, t], i) => `<details${i === 0 ? " open" : ""}><summary>${t}</summary><div class="acc-body">${p.sections[k]}</div></details>`).join("")}</div>` : ""}
      ${BRANDS[p.brand] ? `<div class="brand-note"><h2>Sobre ${esc(p.brand)}®</h2><p>${esc(BRANDS[p.brand])}</p><a class="link-quiet" href="coleccion.html?c=todo&amp;brand=${encodeURIComponent(p.brand)}">Ver toda la línea ${esc(p.brand)} →</a></div>` : ""}
      <h2 id="resenas">Reseñas</h2>
      <div id="reviews" class="reviews" aria-live="polite"><p class="muted">Cargando reseñas…</p></div>
      <h2>Preguntas frecuentes</h2>
      <div class="accordion">
        <details><summary>¿Hacen envíos a todo México?</summary><div class="acc-body"><p>Hacemos envíos nacionales. El envío es gratis desde ${money(CFG.freeShipping)} MXN, sujeto a cobertura. Consulta la <a href="politicas.html#envios">política de envíos</a>.</p></div></details>
        <details><summary>¿Cómo hago mi pedido?</summary><div class="acc-body"><p>Inicia sesión con tu cuenta de Google, agrega tus productos al carrito, llena tus datos de entrega y envía el pedido. Te confirmamos disponibilidad, costo de envío y forma de pago, y puedes seguir su estado en Mi cuenta.</p></div></details>
        <details><summary>¿Tienes dudas sobre qué alimento elegir?</summary><div class="acc-body"><p>${waOk ? `Escríbenos por <a href="${wa("Hola, tengo una duda sobre " + p.title)}">WhatsApp</a>` : `Llámanos al <a href="${tel}">${esc(phoneText)}</a>`} y te ayudamos a elegir según la edad y tamaño de tu mascota.</p></div></details>
      </div>
      <h2>Cambios y devoluciones</h2>
      <div class="accordion"><details><summary>Política de devoluciones</summary><div class="acc-body"><p>Revisa las condiciones en nuestra <a href="politicas.html#devoluciones">política de cambios y devoluciones</a>.</p></div></details></div>
    </div>
  </article>`;

  // Galería
  root.querySelectorAll("[data-img]").forEach((b) => b.addEventListener("click", () => {
    const i = Number(b.dataset.img);
    document.getElementById("main-img").innerHTML = mainImg(p.images[i], i);
    root.querySelectorAll("[data-img]").forEach((x) => x.setAttribute("aria-current", x === b));
  }));

  // Precio y disponibilidad según la presentación elegida (2, 4, 15 kg…)
  const add = document.getElementById("add");
  const qty = document.getElementById("qty");
  function render() {
    document.getElementById("price").innerHTML = priceHTML(p, v);
    const st = document.getElementById("stock");
    st.textContent = v.available ? "✓ Disponible" : "Agotado por ahora";
    st.className = "stock " + (v.available ? "ok" : "no");
    add.disabled = !v.available;
    add.textContent = v.available ? "Agregar al carrito" : "Agotado";
    add.dataset.add = v.id;
    add.dataset.qty = qty.value;
    shipNote();
  }
  // Costo de envío según lo que ya hay en el carrito más esta presentación y cantidad.
  function shipNote() {
    const total = GP.cart.total() + v.price * Number(qty.value || 1);
    const left = CFG.freeShipping - total;
    document.getElementById("ship-note").innerHTML = left <= 0
      ? `<strong>Envío gratis</strong> con este producto en tu pedido (sujeto a cobertura).`
      : `Envío gratis desde ${money(CFG.freeShipping)} MXN: te faltarían <strong>${money(left)}</strong>. Si no, el costo se calcula según tu código postal.`;
  }
  document.addEventListener("cart:change", shipNote);
  root.addEventListener("change", (e) => {
    if (e.target.name !== "variant") return;
    v = p.variants.find((x) => String(x.id) === e.target.value);
    const u = new URLSearchParams(location.search); u.set("v", v.id); history.replaceState(null, "", "?" + u);
    render();
  });
  const clamp = () => { qty.value = Math.min(99, Math.max(1, parseInt(qty.value, 10) || 1)); add.dataset.qty = qty.value; shipNote(); };
  qty.addEventListener("change", clamp);
  root.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => { qty.value = Number(qty.value) + Number(b.dataset.q); clamp(); }));

  // Datos estructurados Product/Offer con precio y disponibilidad reales de la tienda.
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: p.title, brand: { "@type": "Brand", name: p.brand },
    image: p.images.map((i) => i.src), description: desc,
    ...(p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } } : {}),
    offers: p.variants.map((x) => ({ "@type": "Offer", name: x.title, price: x.price.toFixed(2), priceCurrency: "MXN", sku: String(x.id),
      availability: x.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${location.origin}${location.pathname}?p=${encodeURIComponent(p.handle)}&v=${x.id}` })),
  });
  document.head.append(ld);
  render();
  reviews();

  // ---------- Reseñas: publicadas (aprobadas por el admin) y formulario con sesión de Google ----------
  async function reviews() {
    const box = document.getElementById("reviews");
    const S = CFG.supabase;
    let list = [];
    try {
      const q = `reviews?select=author,rating,body,verified,created_at&status=eq.publicada&handle=eq.${encodeURIComponent(p.handle)}&order=created_at.desc&limit=50`;
      const r = await fetch(`${S.url}/rest/v1/${q}`, { headers: { apikey: S.key } });
      if (r.ok) list = await r.json();
    } catch {}
    const star = (n) => `<span class="stars" role="img" aria-label="${n} de 5 estrellas">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`;
    const back = location.pathname.split("/").pop() + location.search;
    const cta = window.GP.account()
      ? `<button class="btn btn-secondary" type="button" id="rv-open">Escribir una reseña</button>`
      : `<a class="btn btn-secondary" href="cuenta.html?next=${encodeURIComponent(back + "#resenas")}">Inicia sesión con Google para opinar</a>`;
    box.innerHTML = `${list.length ? `<p class="reviews-sum">${window.GP.starsHTML(p)}</p>` : `<p>Aún no hay reseñas de este producto. Cuéntanos qué le pareció a tu mascota.</p>`}
      ${list.length ? `<ul class="review-list">${list.map((r) => `<li class="review">
        <div class="review-top">${star(r.rating)} <strong>${esc(r.author)}</strong>${r.verified ? ` <span class="status status-entregado">Compra verificada</span>` : ""}</div>
        <p>${esc(r.body)}</p><small class="muted">${new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</small></li>`).join("")}</ul>` : ""}
      <div id="rv-area">${cta}</div>`;
    const open = document.getElementById("rv-open");
    if (open) open.onclick = form;
  }

  function form() {
    const area = document.getElementById("rv-area");
    area.innerHTML = `<form class="order-form admin-card" id="rv-form" novalidate>
      <fieldset class="rating-input"><legend>Tu calificación *</legend>
        ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rv-${n}" value="${n}"${n === 5 ? " checked" : ""}><label for="rv-${n}" title="${n} de 5">★<span class="sr-only">${n} de 5 estrellas</span></label>`).join("")}
      </fieldset>
      <label for="rv-body">Tu opinión *</label>
      <textarea id="rv-body" name="body" rows="3" minlength="10" maxlength="600" required placeholder="¿Le gustó a tu mascota? ¿Cómo le cayó?"></textarea>
      <p class="small-print">Tu reseña se publica con tu nombre y la inicial de tu apellido después de que la revisemos. Si compraste este producto con tu cuenta, aparecerá como compra verificada.</p>
      <p class="form-error" id="rv-err" role="alert" hidden></p>
      <button class="btn btn-primary btn-small" type="submit">Enviar reseña</button></form>`;
    document.getElementById("rv-body").focus();
    document.getElementById("rv-form").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, err = document.getElementById("rv-err"), btn = f.querySelector("button[type=submit]");
      const body = f.body.value.trim();
      if (body.length < 10) { err.textContent = "Escribe al menos 10 caracteres."; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = "Enviando…";
      try {
        const auth = await window.GP.loadAuth();
        const user = await auth.user();
        if (!user) { location.href = `cuenta.html?next=${encodeURIComponent(location.pathname.split("/").pop() + location.search + "#resenas")}`; return; }
        const { error } = await auth.sb.from("reviews").insert({ handle: p.handle, rating: Number(f.rating.value), body });
        if (error) throw error;
        document.getElementById("rv-area").innerHTML = `<p class="flash ok" role="status">¡Gracias por tu reseña! La publicaremos en cuanto la revisemos.</p>`;
      } catch (x) {
        btn.disabled = false; btn.textContent = "Enviar reseña";
        err.textContent = x && x.code === "23505" ? "Ya habías opinado sobre este producto. ¡Gracias!" : "No pudimos enviar tu reseña. Intenta de nuevo en un momento.";
        err.hidden = false;
      }
    };
  }

  // Productos relacionados: misma mascota y etapa; primero otros formatos (p. ej. croqueta → húmedo, premios).
  const related = PRODUCTS.filter((x) => x !== p && (x.pet === p.pet || x.pet === "ambos" || p.pet === "ambos")
    && (!p.stage || !x.stage || x.stage === p.stage) && x.variants.some((v) => v.available))
    .sort((a, b) => (b.stage === p.stage) - (a.stage === p.stage) || (a.format === p.format) - (b.format === p.format) || a.rank - b.rank);
  const sec = document.createElement("section");
  sec.className = "section";
  sec.id = "relacionados";
  sec.dataset.title = "También te puede interesar";
  sec.dataset.limit = "10";
  sec.dataset.autoplay = "3";
  document.getElementById("main").after(sec);
  initCarousel(sec, related);
});
