# GrandPET — sitio web

Sitio estático (HTML + CSS + JS sin librerías), todo dentro de la misma página: catálogo, filtros,
búsqueda, ficha de producto, carrito y políticas. El pedido se cierra por WhatsApp: el cliente llena
sus datos de entrega en el carrito y se abre WhatsApp con el pedido completo. Sin registro ni cuentas.

## Páginas
- Tienda: `index.html` (portada), `coleccion.html`, `producto.html`, `carrito.html`.
- Empresa (contenido de grandpet.com): `nosotros.html`, `marcas.html`, `marca.html?m=<marca>`,
  `promociones.html` (La Huella Dorada, visible solo en su vigencia), `contacto.html` (incluye "Únete a GrandPET"),
  `politicas.html`.
- El contenido de cada marca está en `data/marcas.js`; las imágenes de grandpet.com se bajan y optimizan con
  `python -X utf8 tools/fetch_images.py` a `assets/img/`.
- El formulario de contacto abre el correo del visitante con el mensaje listo (no hay servidor).

## Ver en local
```
python -m http.server 8080
```
Abrir http://localhost:8080

## Ajustes (un solo archivo)
`assets/js/config.js`: teléfono de llamadas, WhatsApp de pedidos (`PHONE_PRINCIPAL`; sin él, el botón de pedido queda desactivado),
monto de envío gratis, fechas de la sección Ofertas y banners de promoción con fecha de inicio y fin.

## Actualizar productos, precios y políticas
```
python -X utf8 tools/build_data.py
```
Regenera `data/products.js` y `data/policies.js` a partir de la información pública de grandpet2u.com.

## Carruseles de la portada
En `index.html`, cada `<section data-carousel>` se configura con `data-title`, `data-collection`
(`perro`, `gato`, `premios`, `humedo`, `accesorios`, `ofertas`, `cachorros`, `gatitos`, `paquetes`,
`mas-vendidos`, `todo`), `data-limit` y `data-autoplay` (segundos entre avances; se pausa con mouse, foco, toque o el botón ❚❚).

## Cuentas, pedidos y panel de admin (Supabase)
- Proyecto Supabase `grandpet` (`czgegrwqvjoiyuvclphh`). Esquema y reglas de seguridad en `supabase/schema.sql`.
- `cuenta.html`: inicio de sesión con Google y "Mis pedidos". `admin.html`: pedidos, productos, promociones y administradores.
- Cada pedido del carrito se guarda en `orders` (con o sin sesión). Sin WhatsApp configurado, la tienda llama para confirmar.
- Lo que el admin edita (precios, disponibilidad, textos, promociones y fechas) se aplica sobre `data/products.js` al cargar cada página.
- La clave de `config.js` es la *publishable* (pública por diseño). La protección real son las reglas RLS y `is_admin()`.

### Activar el inicio de sesión con Google (una sola vez)
1. Google Cloud Console → APIs y servicios → Pantalla de consentimiento de OAuth (Externo) y luego Credenciales →
   Crear ID de cliente OAuth (Aplicación web).
   - Orígenes autorizados: `https://gabrielgamboapad-svg.github.io` y `http://localhost:8080`
   - URI de redirección autorizada: `https://czgegrwqvjoiyuvclphh.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → Google: activarlo y pegar el Client ID y el Client Secret
   (el secreto solo va en Supabase, nunca en este repo).
3. Supabase → Authentication → URL Configuration:
   - Site URL: `https://gabrielgamboapad-svg.github.io/grandpet/`
   - Redirect URLs: `https://gabrielgamboapad-svg.github.io/grandpet/**` y `http://localhost:8080/**`

## Publicación
GitHub Pages publica la rama `main` automáticamente.
