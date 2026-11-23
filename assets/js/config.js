// Ajustes del sitio. Este es el ÚNICO lugar donde se cambian teléfono, envío y promociones.
window.GP_CONFIG = {
  // Teléfono para llamadas (enlaces tel:), 10 dígitos. Es el que publica grandpet.com.
  phone: "3521440509",

  // WhatsApp que recibe los pedidos del carrito (wa.me/52...), 10 dígitos. Mientras diga
  // PHONE_PRINCIPAL, el botón de pedido queda desactivado.
  whatsapp: "PHONE_PRINCIPAL",

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
