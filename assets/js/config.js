// Ajustes del sitio. Este es el ÚNICO lugar donde se cambian teléfono, envío y promociones.
window.GP_CONFIG = {
  // Tienda Shopify: checkout, cuentas de cliente y políticas viven ahí.
  store: "https://grandpet2u.com",

  // Teléfono principal, 10 dígitos sin espacios (ej. 4771234567). Se usa en header, footer,
  // ficha de producto, carrito, enlaces tel: y WhatsApp (wa.me/52...).
  phone: "PHONE_PRINCIPAL",

  // Envío gratis desde este monto (MXN), sujeto a cobertura.
  freeShipping: 999,

  // "Ofertas" es una sección temporal: el enlace del menú solo aparece entre estas fechas.
  ofertas: { start: "2026-11-01", end: "2026-12-31" },

  // Banners de promoción. Cada uno se muestra solo entre start y end (inclusive) y desaparece al vencer.
  // Ejemplo:
  // { text: "10% en tu primera compra", code: "BIENVENIDO10", link: "coleccion.html?c=ofertas",
  //   start: "2026-12-01", end: "2026-12-24" },
  promos: [],
};
