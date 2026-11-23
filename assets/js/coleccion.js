/* Colección / resultados de búsqueda con filtros. Estado en la URL para poder compartir el enlace. */
(function () {
  "use strict";
  const { COLLECTIONS, collection, cardHTML, search, noResultsHTML, setMeta, esc, petLabel } = window.GP;
  const params = new URLSearchParams(location.search);
  const key = params.get("c");
  const q = (params.get("q") || "").trim();
  const coll = COLLECTIONS[key] || COLLECTIONS.todo;
  const base = q ? search(q) : collection(key);

  // Encabezado y meta description única por colección (o por marca, o explicación del selector guiado).
  const brands = params.getAll("brand");
  const brand = !q && brands.length === 1 && window.GP.BRANDS[brands[0]] ? brands[0] : "";
  const FMT = { Seco: "croqueta", "Húmedo": "alimento húmedo", Premio: "premios" };
  const guide = params.get("guia") && !q
    ? `Elegiste: ${[coll.title, params.get("stage"), FMT[params.get("format")]].filter(Boolean).join(" · ")}. Estos son los productos que le quedan; puedes ajustar los filtros.`
    : "";
  const title = q ? `Resultados para “${q}”` : brand ? `${brand}®` : coll.title;
  const desc = q ? "" : guide || (brand ? window.GP.BRANDS[brand] : coll.desc);
  document.getElementById("coll-title").textContent = title;
  document.getElementById("crumb").textContent = q ? "Búsqueda" : title;
  document.getElementById("coll-desc").textContent = desc;
  setMeta(q ? `Buscar: ${q} | GrandPET®` : `${title} | GrandPET®`, q ? `Resultados de búsqueda para ${q} en GrandPET.` : (brand ? window.GP.BRANDS[brand] : coll.desc));

  // Facetas: solo se muestran las que tienen datos (2+ opciones) en esta colección.
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const FACETS = [
    ["pet", "Mascota", (p) => petLabel[p.pet]],
    ["stage", "Etapa", (p) => p.stage],
    ["size", "Tamaño", (p) => p.size],
    ["format", "Formato", (p) => p.format],
    ["brand", "Marca", (p) => p.brand],
  ];
  const form = document.getElementById("filter-form");
  let html = "";
  FACETS.forEach(([k, label, get]) => {
    const counts = {};
    base.forEach((p) => { const v = get(p); if (v) counts[v] = (counts[v] || 0) + 1; });
    const opts = Object.keys(counts).sort((a, b) => a.localeCompare(b, "es"));
    if (opts.length < 2) return;
    const sel = params.getAll(k);
    html += `<fieldset><legend>${label}</legend>${opts.map((o) => `<label><input type="checkbox" name="${k}" value="${esc(o)}"${sel.includes(o) ? " checked" : ""}> ${esc(o)} <span class="count">(${counts[o]})</span></label>`).join("")}</fieldset>`;
  });
  if (base.length > 1) {
    html += `<fieldset><legend>Precio (MXN)</legend><div class="price-range">
      <label>Desde<input type="number" name="min" inputmode="numeric" min="0" step="50" placeholder="${Math.floor(Math.min(...base.map(minPrice)))}" value="${esc(params.get("min") || "")}"></label>
      <label>Hasta<input type="number" name="max" inputmode="numeric" min="0" step="50" placeholder="${Math.ceil(Math.max(...base.map(minPrice)))}" value="${esc(params.get("max") || "")}"></label></div></fieldset>`;
  }
  if (base.some((p) => !p.variants.some((v) => v.available))) {
    html += `<fieldset><legend>Disponibilidad</legend><label><input type="checkbox" name="stock" value="1"${params.get("stock") ? " checked" : ""}> Solo disponibles</label></fieldset>`;
  }
  form.innerHTML = html;
  const sortEl = document.getElementById("sort");
  sortEl.value = params.get("sort") || "rank";

  const SORTS = {
    rank: (a, b) => a.rank - b.rank,
    "price-asc": (a, b) => minPrice(a) - minPrice(b),
    "price-desc": (a, b) => minPrice(b) - minPrice(a),
    name: (a, b) => a.short.localeCompare(b.short, "es"),
  };

  function apply() {
    const fd = new FormData(form);
    const chosen = Object.fromEntries(FACETS.map(([k]) => [k, fd.getAll(k)]));
    const min = Number(fd.get("min")) || 0;
    const max = Number(fd.get("max")) || Infinity;
    const stock = fd.get("stock");
    const list = base.filter((p) =>
      FACETS.every(([k, , get]) => !chosen[k].length || chosen[k].includes(get(p)))
      && minPrice(p) >= min && minPrice(p) <= max
      && (!stock || p.variants.some((v) => v.available)))
      .sort(SORTS[sortEl.value] || SORTS.rank);

    const grid = document.getElementById("grid");
    grid.innerHTML = list.length
      ? list.map((p, i) => `<li>${cardHTML(p, { eager: i < 2 })}</li>`).join("")
      : `<li class="empty" style="grid-column:1/-1">${q && !base.length ? noResultsHTML(q) : `<p>No hay productos con estos filtros.</p><button class="btn btn-secondary" type="button" data-clear>Limpiar filtros</button>`}</li>`;
    const n = list.length;
    document.getElementById("result-count").textContent = `${n} ${n === 1 ? "producto" : "productos"}`;
    document.getElementById("see-results").textContent = `Ver ${n} ${n === 1 ? "resultado" : "resultados"}`;

    // Refleja el estado en la URL sin recargar.
    const u = new URLSearchParams();
    if (key) u.set("c", key);
    if (q) u.set("q", q);
    for (const [k, v] of fd.entries()) if (v) u.append(k, v);
    if (sortEl.value !== "rank") u.set("sort", sortEl.value);
    history.replaceState(null, "", "?" + u);
  }

  form.addEventListener("change", apply);
  form.addEventListener("input", (e) => { if (e.target.type === "number") apply(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  sortEl.addEventListener("change", apply);
  const clear = () => { form.querySelectorAll("input").forEach((i) => (i.type === "checkbox" ? (i.checked = false) : (i.value = ""))); apply(); };
  document.getElementById("clear-filters").addEventListener("click", clear);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-clear]")) clear(); });

  // Panel de filtros en móvil, con botón fijo "Ver resultados".
  const panel = document.getElementById("filters");
  const opener = document.querySelector(".open-filters");
  const setOpen = (open) => {
    panel.classList.toggle("open", open);
    opener.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) panel.querySelector("button, input")?.focus(); else opener.focus();
  };
  if (!form.innerHTML) opener.hidden = true;
  opener.addEventListener("click", () => setOpen(true));
  panel.querySelector(".filters-close").addEventListener("click", () => setOpen(false));
  document.getElementById("see-results").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) setOpen(false); });

  apply();
})();
