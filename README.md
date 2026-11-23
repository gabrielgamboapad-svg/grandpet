# GrandPET — sitio web

Sitio estático (HTML + CSS + JS sin librerías) con el catálogo público de grandpet2u.com.
El pago, las cuentas de cliente y las políticas siguen en Shopify: "Continuar al pago" abre el checkout
nativo de Shopify (se puede comprar como invitado) y "Mi cuenta" lleva a `grandpet2u.com/account`.

## Ver en local
```
python -m http.server 8080
```
Abrir http://localhost:8080

## Ajustes (un solo archivo)
`assets/js/config.js`: teléfono (`PHONE_PRINCIPAL`), monto de envío gratis, fechas de la sección Ofertas y banners de promoción con fecha de inicio y fin.

## Actualizar productos y precios
```
python -X utf8 tools/build_data.py
```
Vuelve a generar `data/products.js` desde `grandpet2u.com/products.json`. No modifica nada en Shopify.

## Carruseles de la portada
En `index.html`, cada `<section data-carousel>` se configura con `data-title`, `data-collection`
(`perro`, `gato`, `premios`, `humedo`, `accesorios`, `ofertas`, `cachorros`, `gatitos`, `paquetes`,
`mas-vendidos`, `todo`), `data-limit` y `data-autoplay="6"` (opcional, apagado por defecto).
