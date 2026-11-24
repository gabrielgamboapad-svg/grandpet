/* Portada: selector guiado (mascota → etapa → formato) y tarjetas de marcas. */
window.GP_READY.then(function () {
  "use strict";
  const { PRODUCTS, BRANDS, img, esc } = window.GP;

  // ---------- selector guiado: solo ofrece opciones con productos reales ----------
  const PETS = [["perro", "Perro"], ["gato", "Gato"]];
  const STAGES = { perro: ["Cachorro", "Adulto", "Senior"], gato: ["Gatito", "Adulto", "Senior"] };
  const FORMATS = [["Seco", "Croqueta"], ["Húmedo", "Alimento húmedo"], ["Premio", "Premios"]];
  const form = document.getElementById("guide");
  const steps = form.querySelector(".guide-steps");
  const go = document.getElementById("guide-go");
  const state = { pet: "perro", stage: "", format: "Seco" }; // arranca en croqueta: lo más buscado, menos resultados

  const match = (p, s = state) => (p.pet === s.pet || p.pet === "ambos")
    && (!s.stage || p.stage === s.stage) && (!s.format || p.format === s.format);
  const chip = (name, value, label, checked, n) => `<label class="guide-chip"><input type="radio" name="${name}" value="${esc(value)}"${checked ? " checked" : ""}><span>${esc(label)}${n != null ? ` <small>(${n})</small>` : ""}</span></label>`;

  function render() {
    const stages = STAGES[state.pet].filter((st) => PRODUCTS.some((p) => match(p, { ...state, stage: st, format: "" })));
    if (state.stage && !stages.includes(state.stage)) state.stage = "";
    const formats = FORMATS.filter(([f]) => PRODUCTS.some((p) => match(p, { ...state, format: f })));
    if (state.format && !formats.some(([f]) => f === state.format)) state.format = "";
    steps.innerHTML = `
      <fieldset><legend><span class="step-n">1</span> ¿Para quién es?</legend><div class="guide-opts">${PETS.map(([v, t]) => chip("pet", v, t, state.pet === v)).join("")}</div></fieldset>
      <fieldset><legend><span class="step-n">2</span> ¿En qué etapa está?</legend><div class="guide-opts">${chip("stage", "", "Cualquiera", !state.stage)}${stages.map((s) => chip("stage", s, s, state.stage === s)).join("")}</div></fieldset>
      <fieldset><legend><span class="step-n">3</span> ¿Qué buscas?</legend><div class="guide-opts">${chip("format", "", "Todo", !state.format)}${formats.map(([v, t]) => chip("format", v, t, state.format === v, PRODUCTS.filter((p) => match(p, { ...state, format: v })).length)).join("")}</div></fieldset>`;
    const n = PRODUCTS.filter((p) => match(p)).length;
    const u = new URLSearchParams({ c: state.pet });
    if (state.stage) u.set("stage", state.stage);
    if (state.format) u.set("format", state.format);
    u.set("guia", "1");
    go.href = "coleccion.html?" + u;
    go.textContent = `Ver ${n} ${label(n)}`;
  }
  // "12 croquetas para perro adulto", "2 productos para gatito", etc.
  function label(n) {
    const what = { Seco: ["croqueta", "croquetas"], "Húmedo": ["alimento húmedo", "alimentos húmedos"], Premio: ["premio", "premios"] }[state.format] || ["producto", "productos"];
    const who = state.stage === "Gatito" ? "gatito" : `${state.pet}${state.stage ? " " + state.stage.toLowerCase() : ""}`;
    return `${what[n === 1 ? 0 : 1]} para ${who}`;
  }
  form.addEventListener("change", (e) => {
    state[e.target.name] = e.target.value;
    const name = e.target.name;
    render();
    form.querySelector(`input[name="${name}"]:checked`)?.focus(); // conserva el foco al repintar
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  render();

  // ---------- marcas: logo de grandpet.com + texto de la marca, enlace a su página ----------
  const MARCAS = window.MARCAS || [];
  const order = ["natural-gourmet", "carne-fresca", "noble", "back-2-nature", "magno", "kisha"];
  document.getElementById("brands").innerHTML = order.map((slug) => {
    const m = MARCAS.find((x) => x.slug === slug);
    const top = PRODUCTS.filter((p) => p.brand === m.store && p.images[0]).sort((x, y) => x.rank - y.rank)[0];
    const media = m.logo ? `<img src="assets/img/${m.logo}.webp" alt="" width="320" height="320" loading="lazy" decoding="async">`
      : top ? img(top.images[0].src, { widths: [240, 360], sizes: "(min-width:1024px) 180px, 40vw", w: top.images[0].w, h: top.images[0].h }) : "";
    return `<li class="brand-card">
      <div class="brand-media${m.logo ? " is-logo" : ""}">${media}</div>
      <div><h3><a href="marca.html?m=${m.slug}">${esc(m.name)}®</a></h3><p>${esc(BRANDS[m.store] || m.tagline)}</p>
      <a class="link-quiet" href="marca.html?m=${m.slug}">Conoce ${esc(m.name)} →</a></div></li>`;
  }).join("");

  // ---------- Compra por categoría: foto del más vendido y cuántos productos hay ----------
  const CATS = [["perro", "Para perro"], ["gato", "Para gato"], ["premios", "Premios"], ["humedo", "Alimento húmedo"], ["paquetes", "Paquetes de ahorro"], ["accesorios", "Accesorios"]];
  document.getElementById("cats").innerHTML = CATS.map(([k, t]) => {
    const list = window.GP.collection(k);
    const top = list.filter((p) => p.images[0]).sort((a, b) => a.rank - b.rank)[0];
    return `<li><a class="cat" href="coleccion.html?c=${k}">
      <span class="cat-media">${top ? img(top.images[0].src, { widths: [160, 240], sizes: "(min-width:1024px) 120px, 25vw", w: top.images[0].w, h: top.images[0].h }) : ""}</span>
      <span class="cat-text"><strong>${t}</strong><small>Ver los ${list.length} →</small></span></a></li>`;
  }).join("");

  // ---------- La Huella Dorada: solo mientras esté vigente ----------
  if (!window.GP.inRange(window.GP.CFG.huella)) document.getElementById("huella-banner")?.remove();
});
