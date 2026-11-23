/* Portada: selector guiado (mascota → etapa → formato) y tarjetas de marcas. */
(function () {
  "use strict";
  const { PRODUCTS, BRANDS, img, esc } = window.GP;

  // ---------- selector guiado: solo ofrece opciones con productos reales ----------
  const PETS = [["perro", "Perro"], ["gato", "Gato"]];
  const STAGES = { perro: ["Cachorro", "Adulto", "Senior"], gato: ["Gatito", "Adulto", "Senior"] };
  const FORMATS = [["Seco", "Croqueta"], ["Húmedo", "Alimento húmedo"], ["Premio", "Premios"]];
  const form = document.getElementById("guide");
  const steps = form.querySelector(".guide-steps");
  const go = document.getElementById("guide-go");
  const state = { pet: "perro", stage: "", format: "" };

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
    go.textContent = `Ver ${n} ${n === 1 ? "recomendación" : "recomendaciones"}`;
  }
  form.addEventListener("change", (e) => {
    state[e.target.name] = e.target.value;
    const name = e.target.name;
    render();
    form.querySelector(`input[name="${name}"]:checked`)?.focus(); // conserva el foco al repintar
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  render();

  // ---------- marcas (textos de grandpet.com, foto del producto más vendido de cada una) ----------
  const order = ["Natural Gourmet", "Carne Fresca", "Noble", "Back 2 Nature", "Magno", "Kisha"];
  document.getElementById("brands").innerHTML = order.map((b) => {
    const top = PRODUCTS.filter((p) => p.brand === b && p.images[0]).sort((x, y) => x.rank - y.rank)[0];
    const im = top && top.images[0];
    return `<li class="brand-card">
      <div class="brand-media">${im ? img(im.src, { widths: [240, 360], sizes: "(min-width:1024px) 180px, 40vw", w: im.w, h: im.h }) : ""}</div>
      <div><h3>${esc(b)}®</h3><p>${esc(BRANDS[b])}</p>
      <a class="link-quiet" href="coleccion.html?c=todo&amp;brand=${encodeURIComponent(b)}">Ver productos ${esc(b)} →</a></div></li>`;
  }).join("");
})();
