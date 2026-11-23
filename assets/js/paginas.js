/* Páginas de la empresa: marcas, detalle de marca, La Huella Dorada y contacto. */
(function () {
  "use strict";
  const GP = window.GP;
  const { esc, img, money, BY_HANDLE, PRODUCTS, CFG, setMeta, initCarousel, url } = GP;
  const $ = (id) => document.getElementById(id);
  const MARCAS = window.MARCAS || [];
  const local = (name, alt, w = 480, h = 768, lazy = true) => `<img src="assets/img/${name}.webp" alt="${esc(alt)}" width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ""} decoding="async">`;
  const hasPage = (m) => m.intro.length || m.groups.length;
  const shopLink = (m) => `coleccion.html?c=todo&amp;brand=${encodeURIComponent(m.store)}`;
  const logoOf = (m, lazy = true) => (m.logo ? local(m.logo, `Logotipo ${m.name}`, 320, 320, lazy) : `<span class="logo-text">${esc(m.name)}®</span>`);

  // ---------- marcas.html ----------
  const grid = $("logo-grid");
  if (grid) {
    grid.innerHTML = MARCAS.map((m) => {
      const href = hasPage(m) ? `marca.html?m=${m.slug}` : m.store ? shopLink(m) : "";
      const n = m.store ? PRODUCTS.filter((p) => p.brand === m.store).length : 0;
      return `<li class="logo-card">
        <div class="logo-media">${logoOf(m)}</div>
        <h2>${href ? `<a href="${href}">${esc(m.name)}®</a>` : `${esc(m.name)}®`}</h2>
        <p>${esc(m.tagline)}</p>
        <p class="logo-meta">${esc(m.pet)}${n ? ` · ${n} ${n === 1 ? "producto" : "productos"} en tienda` : ""}</p>
      </li>`;
    }).join("");
  }

  // ---------- marca.html?m=slug ----------
  const box = $("marca");
  if (box) {
    const m = MARCAS.find((x) => x.slug === new URLSearchParams(location.search).get("m"));
    if (!m) {
      box.innerHTML = `<div class="empty section"><h1>No encontramos esta marca</h1><a class="btn btn-primary" href="marcas.html">Ver todas las marcas</a></div>`;
    } else {
      $("crumb").textContent = m.name;
      setMeta(`${m.name}® | GrandPET®`, `${m.name}®: ${m.tagline} ${m.intro[0] || ""}`.slice(0, 158));
      const line = (l) => {
        const p = l.handle && BY_HANDLE[l.handle];
        const pic = l.img ? local(l.img, `Empaque ${m.name} ${l.name}`)
          : p && p.images[0] ? img(p.images[0].src, { widths: [240, 360, 480], sizes: "(min-width:1024px) 220px, 40vw", alt: `Empaque ${p.short}`, w: p.images[0].w, h: p.images[0].h }) : "";
        const from = p ? Math.min(...p.variants.map((v) => v.price)) : 0;
        return `<li class="line-card">
          <div class="line-media">${pic}</div>
          <div class="line-body">
            <h3>${esc(l.name)}</h3>
            ${l.recipe ? `<p class="line-recipe">${esc(l.recipe)}</p>` : ""}
            <p>${esc(l.desc)}</p>
            ${l.benefits ? `<ul class="benefits">${l.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            ${l.sizes ? `<p class="line-sizes">Presentaciones: ${esc(l.sizes)}</p>` : ""}
            ${p ? `<div class="line-buy"><span class="price-now"><small>${p.variants.length > 1 ? "Desde" : "Hoy"}</small>${money(from)}</span><a class="btn btn-primary btn-small" href="${url(p)}">Ver producto</a></div>` : ""}
          </div></li>`;
      };
      box.innerHTML = `<header class="brand-hero">
          <div class="brand-hero-logo">${logoOf(m, false)}</div>
          <div><h1>${esc(m.name)}®</h1><p class="hero-sub">${esc(m.tagline)}</p>
          ${m.store ? `<a class="btn btn-primary" href="${shopLink(m)}">Comprar ${esc(m.name)}</a>` : ""}</div>
        </header>
        ${m.intro.length ? `<div class="brand-intro">${m.intro.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
        ${m.groups.map((g) => `<section class="section line-group"><h2>${esc(g.title)}</h2><ul class="lines">${g.lines.map(line).join("")}</ul></section>`).join("")}`;
      // Carrusel con todo lo que hay de la marca en la tienda.
      const list = PRODUCTS.filter((p) => p.brand === m.store).sort((a, b) => a.rank - b.rank);
      if (list.length) {
        const sec = document.createElement("section");
        Object.assign(sec, { className: "section", id: "marca-tienda" });
        Object.assign(sec.dataset, { title: `${m.name}® en la tienda`, limit: "12", autoplay: "4" });
        $("main").after(sec);
        initCarousel(sec, list);
      }
    }
  }

  // ---------- promociones.html: visible solo en vigencia ----------
  if ($("promo-on") && !GP.inRange(CFG.huella)) {
    $("promo-on").hidden = true;
    $("promo-off").hidden = false;
  }

  // ---------- contacto.html ----------
  const form = $("contact-form");
  if (form) {
    $("c-address").textContent = CFG.address;
    $("c-map").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CFG.address);
    $("c-email").href = "mailto:" + CFG.email;
    $("c-email").textContent = CFG.email;
    const tipo = $("f-tipo");
    if (location.hash === "#distribuidor") tipo.value = "distribuidor";
    const sync = () => form.querySelectorAll("[data-show]").forEach((el) => {
      const on = el.dataset.show.split(" ").includes(tipo.value);
      el.hidden = !on;
      el.querySelectorAll("input, select, textarea").forEach((i) => (i.disabled = !on));
    });
    tipo.addEventListener("change", sync);
    sync();
    // Máximo 3 marcas, como en grandpet.com.
    form.addEventListener("change", (e) => {
      if (e.target.name !== "marca") return;
      const checked = form.querySelectorAll('input[name="marca"]:checked');
      form.querySelectorAll('input[name="marca"]').forEach((c) => (c.disabled = !c.checked && checked.length >= 3));
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $("contact-error");
      const bad = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
      if (bad) {
        err.textContent = `Revisa el campo “${form.querySelector(`label[for="${bad.id}"]`).textContent.replace(" *", "")}”.`;
        err.hidden = false;
        bad.focus();
        return;
      }
      err.hidden = true;
      const fd = new FormData(form);
      const label = tipo.options[tipo.selectedIndex].text;
      const rows = [
        ["Asunto", label], ["Nombre", `${fd.get("nombre")} ${fd.get("apellidos") || ""}`.trim()], ["Compañía", fd.get("empresa")],
        ["Correo", fd.get("correo")], ["Teléfono", fd.get("telefono")], ["Código postal", fd.get("cp")],
        ["Marcas de interés", fd.getAll("marca").join(", ")], ["Volumen mensual (toneladas)", fd.get("volumen")],
        ["Tipo de cliente", fd.get("cliente")], ["Talla y etapa", fd.get("etapa")], ["Necesidad especial", fd.get("necesidad")],
      ].filter(([, v]) => v);
      const body = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nMensaje:\n${fd.get("mensaje")}`;
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(`Contacto web: ${label} - ${fd.get("nombre")}`)}&body=${encodeURIComponent(body)}`;
      if (!form.querySelector(".form-ok")) form.insertAdjacentHTML("beforeend", `<p class="form-ok" role="status">Abrimos tu aplicación de correo con el mensaje listo. Si no se abrió, escríbenos a <a href="mailto:${CFG.email}">${esc(CFG.email)}</a>.</p>`);
    });
  }
})();
