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
          <li>${ICON.shield}<span>Cambios y devoluciones según nuestra <a href="politicas.html#devoluciones">política</a>. Sin registro: confirmas tu pedido por WhatsApp.</span></li>
        </ul>
      </div>
    </div>

    <div class="pdp-extra">
      ${ACC.length ? `<div class="accordion">${ACC.map(([k, t], i) => `<details${i === 0 ? " open" : ""}><summary>${t}</summary><div class="acc-body">${p.sections[k]}</div></details>`).join("")}</div>` : ""}
      ${BRANDS[p.brand] ? `<div class="brand-note"><h2>Sobre ${esc(p.brand)}®</h2><p>${esc(BRANDS[p.brand])}</p><a class="link-quiet" href="coleccion.html?c=todo&amp;brand=${encodeURIComponent(p.brand)}">Ver toda la línea ${esc(p.brand)} →</a></div>` : ""}
      <h2 id="resenas">Reseñas</h2>
      <div class="accordion"><details><summary>Opiniones de clientes</summary><div class="acc-body"><p>Aún no hay reseñas de este producto.</p></div></details></div>
      <h2>Preguntas frecuentes</h2>
      <div class="accordion">
        <details><summary>¿Hacen envíos a todo México?</summary><div class="acc-body"><p>Hacemos envíos nacionales. El envío es gratis desde ${money(CFG.freeShipping)} MXN, sujeto a cobertura. Consulta la <a href="politicas.html#envios">política de envíos</a>.</p></div></details>
        <details><summary>¿Cómo hago mi pedido?</summary><div class="acc-body"><p>Agrega tus productos al carrito, llena tus datos de entrega y envía el pedido por WhatsApp. Te confirmamos disponibilidad, costo de envío y forma de pago. No necesitas crear una cuenta.</p></div></details>
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
    offers: p.variants.map((x) => ({ "@type": "Offer", name: x.title, price: x.price.toFixed(2), priceCurrency: "MXN", sku: String(x.id),
      availability: x.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${location.origin}${location.pathname}?p=${encodeURIComponent(p.handle)}&v=${x.id}` })),
  });
  document.head.append(ld);
  render();

  // Productos relacionados: misma mascota y etapa; primero otros formatos (p. ej. croqueta → húmedo, premios).
  const related = PRODUCTS.filter((x) => x !== p && (x.pet === p.pet || x.pet === "ambos" || p.pet === "ambos")
    && (!p.stage || !x.stage || x.stage === p.stage) && x.variants.some((v) => v.available))
    .sort((a, b) => (b.stage === p.stage) - (a.stage === p.stage) || (a.format === p.format) - (b.format === p.format) || a.rank - b.rank);
  const sec = document.createElement("section");
  sec.className = "section";
  sec.id = "relacionados";
  sec.dataset.title = "También te puede interesar";
  sec.dataset.limit = "10";
  sec.dataset.autoplay = "6";
  document.getElementById("main").after(sec);
  initCarousel(sec, related);
});
