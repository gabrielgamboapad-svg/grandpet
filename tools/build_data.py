"""Descarga el catálogo público de grandpet2u.com y genera data/products.js.

Uso:  python -X utf8 tools/build_data.py
Solo lee /products.json (público). No toca precios ni inventario: los copia tal cual.
"""
import json
import re
import unicodedata
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

STORE = "https://grandpet2u.com"
OUT = Path(__file__).resolve().parent.parent / "data" / "products.js"


def get(path):
    req = urllib.request.Request(STORE + path, headers={"User-Agent": "Mozilla/5.0 (catalog-sync)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


# ---------- sanitizador: solo etiquetas de texto, sin estilos ni scripts ----------
ALLOWED = {"p", "br", "b", "strong", "i", "em", "ul", "ol", "li", "table", "thead",
           "tbody", "tr", "td", "th", "h2", "h3", "h4", "h5", "h6"}
VOID = {"br"}
DROP_CONTENT = {"script", "style", "iframe", "object", "embed", "svg", "noscript"}
BLOCK = {"p", "ul", "ol", "table", "h2", "h3", "h4", "h5", "h6", "div", "h1"}


class Blocks(HTMLParser):
    """Sanitiza y separa el HTML en bloques de primer nivel."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.buf, self.depth, self.skip = [], [], 0, 0

    def flush(self):
        html = "".join(self.buf).strip()
        if re.sub(r"<[^>]+>|\s", "", html):
            self.blocks.append(html)
        self.buf = []

    def handle_starttag(self, tag, attrs):
        if tag in DROP_CONTENT:
            self.skip += 1
            return
        if self.skip:
            return
        if tag in BLOCK:
            if self.depth == 0:
                self.flush()
            self.depth += 1
        tag = "h3" if tag == "h1" else ("p" if tag == "div" else tag)
        if tag in ALLOWED:
            keep = "".join(f' {k}="{int(v)}"' for k, v in attrs
                           if k in ("colspan", "rowspan") and (v or "").isdigit())
            self.buf.append(f"<{tag}{keep}>")

    def handle_endtag(self, tag):
        if tag in DROP_CONTENT:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        t = "h3" if tag == "h1" else ("p" if tag == "div" else tag)
        if t in ALLOWED and t not in VOID:
            self.buf.append(f"</{t}>")
        if tag in BLOCK:
            self.depth = max(0, self.depth - 1)
            if self.depth == 0:
                self.flush()

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


SECTIONS = [  # (clave, palabras con las que empieza el bloque)
    ("ingredientes", ("ingredientes",)),
    ("analisis", ("analisis garantizado", "analisis")),
    ("guia", ("guia de alimentacion", "guia")),
    ("uso", ("modo de uso", "instrucciones")),
]


def split_body(body):
    p = Blocks()
    p.feed(body or "")
    p.flush()
    out, cur = {"intro": []}, "intro"
    for b in p.blocks:
        text = norm(re.sub(r"<[^>]+>", " ", b)).strip(" :*-\n")
        for key, starts in SECTIONS:
            if text.startswith(starts):
                cur = key
                break
        out.setdefault(cur, []).append(b)
    return {k: "\n".join(v) for k, v in out.items() if v}


# ---------- clasificación por texto (la tienda no usa etiquetas) ----------
BRANDS = [("kisha", "Kisha"), ("noble", "Noble"), ("carne fresca", "Carne Fresca"),
          ("natural gourmet", "Natural Gourmet"), ("back 2 nature", "Back 2 Nature"),
          ("back to nature", "Back 2 Nature"), ("beast friend", "Beast Friend"),
          ("magno", "Magno"), ("clasico", "Clásico"), ("nutrescan", "Nutrescan"),
          ("elite", "Elite"), ("shine", "Shine"), ("fresh", "Fresh"), ("tots", "Tots")]
DOG_BRANDS = {"Noble", "Carne Fresca", "Beast Friend", "Magno", "Nutrescan", "Natural Gourmet", "Back 2 Nature", "Shine"}


def classify(p):
    t = norm(f"{p['title']} {p['product_type']} {p['handle']}")
    gato = bool(re.search(r"gato|gatito|feline|felino|kitten|kisha", t))
    perro = bool(re.search(r"perro|cachorro|puppy|baby", t))
    brand = next((b for k, b in BRANDS if k in t), "GrandPET")
    if re.search(r"conejo|hamster|roedor|cuyo", t):
        pet = "otros"
    elif gato and perro:
        pet = "ambos"
    elif gato:
        pet = "gato"
    elif perro or brand in DOG_BRANDS:
        pet = "perro"
    else:
        pet = "ambos"  # contenedores, cucharas: sirven para los dos

    # Separar cachorros (perro) de gatitos (gato): corrige Kisha Kittens en "Para cachorros".
    if pet == "gato" and re.search(r"kitten|gatito", t):
        stage = "Gatito"
    elif pet == "perro" and re.search(r"cachorro|puppy|baby", t):
        stage = "Cachorro"
    elif "senior" in t:
        stage = "Senior"
    elif re.search(r"adult", t):
        stage = "Adulto"
    else:
        stage = ""

    if re.search(r"raza pequena|raza chica|minis|petit", t):
        size = "Raza pequeña"
    elif re.search(r"mediana y grande|\bgrand\b", t):
        size = "Raza mediana y grande"
    else:
        size = ""

    if " + " in p["title"]:
        fmt = "Paquete"
    elif "aderezo" in t:
        fmt = "Aderezo"
    elif re.search(r"premio|treats|vitrolero|huevo sorpresa|patitas", t):
        fmt = "Premio"
    elif re.search(r"humedo|sobre|pouch", t):
        fmt = "Húmedo"
    elif re.search(r"shampoo|arena para|arena premium|higiene", t):
        fmt = "Higiene"
    elif re.search(r"arenero|rascador|contenedor|cuchara|correa", t):
        fmt = "Accesorio"
    elif re.search(r"papilla|leche", t):
        fmt = "Especialidad"
    else:
        fmt = "Seco"
    return pet, stage, size, fmt, brand


def short_name(title):
    s = re.sub(r"^\s*grandpet\s*", "", title, flags=re.I).strip()
    return s[0].upper() + s[1:] if s else title


def main():
    products = get("/products.json?limit=250")["products"]
    best = [p["handle"] for p in get("/collections/best-selling-products/products.json?limit=250")["products"]]
    rank = {h: i for i, h in enumerate(best)}
    out = []
    for p in products:
        pet, stage, size, fmt, brand = classify(p)
        secs = split_body(p.get("body_html"))
        intro = re.findall(r"<p>(.*?)</p>", secs.get("intro", ""), flags=re.S)
        benefits = [re.sub(r"<[^>]+>", "", x).strip() for x in intro]
        benefits = [b for b in benefits if 8 < len(b) < 90 and "®" not in b
                    and norm(b) not in norm(p["title"])][:3]
        opt = p["options"][0]["name"].strip() if p["options"] else ""
        out.append({
            "handle": p["handle"],
            "title": p["title"].strip(),
            "short": short_name(p["title"]),
            "pet": pet, "stage": stage, "size": size, "format": fmt, "brand": brand,
            "rank": rank.get(p["handle"], 9999),
            "optionName": "" if opt == "Title" else opt,
            "variants": [{
                "id": v["id"], "title": v["title"].strip(),
                "price": float(v["price"]),
                "compare": float(v["compare_at_price"]) if v.get("compare_at_price") else None,
                "available": bool(v["available"]),
            } for v in p["variants"]],
            "images": [{"src": i["src"], "w": i["width"], "h": i["height"], "alt": (i.get("alt") or "").strip()}
                       for i in p["images"]],
            "benefits": benefits,
            "sections": secs,
        })
    # Self-check: gatitos nunca deben caer en "cachorros" (era el bug de Kisha Kittens).
    for x in out:
        if re.search(r"kitten", norm(x["title"])):
            assert (x["pet"], x["stage"]) == ("gato", "Gatito"), x["title"]
        if x["stage"] == "Cachorro":
            assert x["pet"] == "perro", x["title"]
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text("// Generado por tools/build_data.py — no editar a mano.\nwindow.PRODUCTS = "
                   + json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
    from collections import Counter
    print(len(out), "productos ->", OUT)
    for k in ("pet", "stage", "format", "brand"):
        print(k, dict(Counter(x[k] for x in out)))


if __name__ == "__main__":
    main()
