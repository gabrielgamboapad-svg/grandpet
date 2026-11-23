/* Carrito: progreso de envío gratis, cantidades y salida al checkout nativo de Shopify (invitado permitido). */
(function () {
  "use strict";
  const { cart, img, esc, money, priceHTML, shipProgressHTML, CFG, url, wa, tel } = window.GP;
  const root = document.getElementById("cart");

  function render() {
    const items = cart.items();
    if (!items.length) {
      root.innerHTML = `<div class="empty"><p>Tu carrito está vacío.</p><div class="hero-ctas" style="justify-content:center">
        <a class="btn btn-primary" href="coleccion.html?c=perro">Comprar para perro</a>
        <a class="btn btn-secondary" href="coleccion.html?c=gato">Comprar para gato</a></div></div>`;
      return;
    }
    const total = cart.total();
    root.innerHTML = `<div class="cart-layout">
      <div>
        ${shipProgressHTML(total)}
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
          </div></li>`).join("")}</ul>
      </div>
      <aside class="summary" aria-label="Resumen del pedido">
        <div class="summary-row"><span>Subtotal</span><span>${money(total)}</span></div>
        <small>El envío se calcula en el checkout según tu código postal.</small>
        <a class="btn btn-primary btn-block" href="${esc(cart.checkoutUrl())}">Continuar al pago</a>
        <p class="login-hint"><a href="${CFG.store}/account/login">Inicia sesión</a> para comprar más rápido y ver tus pedidos. No es obligatorio: también puedes comprar como invitado.</p>
        <small>¿Dudas? <a href="${tel}">Llámanos</a> o escríbenos por <a href="${wa("Hola, tengo una duda con mi pedido")}">WhatsApp</a>.</small>
      </aside>
    </div>`;
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (b) cart.set(b.dataset.set, Math.max(0, Number(b.dataset.to)));
  });
  root.addEventListener("change", (e) => {
    const id = e.target.dataset.qty;
    if (id) cart.set(id, Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)));
  });
  document.addEventListener("cart:change", render);
  render();
})();
