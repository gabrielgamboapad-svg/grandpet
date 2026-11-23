# GrandPET — sitio web

Sitio estático (HTML + CSS + JS sin librerías), todo dentro de la misma página: catálogo, filtros,
búsqueda, ficha de producto, carrito y políticas. El pedido se cierra por WhatsApp: el cliente llena
sus datos de entrega en el carrito y se abre WhatsApp con el pedido completo. Sin registro ni cuentas.

## Ver en local
```
python -m http.server 8080
```
Abrir http://localhost:8080

## Ajustes (un solo archivo)
`assets/js/config.js`: teléfono/WhatsApp (`PHONE_PRINCIPAL`; sin él, el botón de pedido queda desactivado),
monto de envío gratis, fechas de la sección Ofertas y banners de promoción con fecha de inicio y fin.

## Actualizar productos, precios y políticas
```
python -X utf8 tools/build_data.py
```
Regenera `data/products.js` y `data/policies.js` a partir de la información pública de grandpet2u.com.

## Carruseles de la portada
En `index.html`, cada `<section data-carousel>` se configura con `data-title`, `data-collection`
(`perro`, `gato`, `premios`, `humedo`, `accesorios`, `ofertas`, `cachorros`, `gatitos`, `paquetes`,
`mas-vendidos`, `todo`), `data-limit` y `data-autoplay="6"` (opcional, apagado por defecto).

## Publicación
GitHub Pages publica la rama `main` automáticamente.
