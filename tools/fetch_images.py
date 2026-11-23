"""Descarga imágenes de grandpet.com y las guarda optimizadas (WebP) en assets/img/.

Uso:  python -X utf8 tools/fetch_images.py
Las descargas crudas van a una carpeta temporal; solo se escriben en el sitio las versiones convertidas.
"""
import io
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

U = "https://grandpet.com/wp-content/uploads/"
OUT = Path(__file__).resolve().parent.parent / "assets" / "img"

# nombre local: (ruta en grandpet.com, ancho máximo)
IMAGES = {
    # Logo, divisiones y certificación
    "logo-grandpet": ("2026/08/Nu3-Grandpet-logo_A.png", 360),
    "div-nutricion": ("2026/08/Logo-grandpet-nutrition.png", 320),
    "div-premios": ("2026/08/Logo-grandpet-treats-and-complements.png", 320),
    "div-salud": ("2026/08/Logo-grandpet-health-and-care.png", 320),
    "empresa-7": ("2026/08/medallon-1.png", 600),
    # Logos de marcas (catálogo)
    "logo-natural-gourmet": ("2021/08/Natural-Gourmet-2.png", 320),
    "logo-back-2-nature": ("2021/08/Back-2-Nature-1.png", 320),
    "logo-carne-fresca": ("2021/08/Carne-Fresca.png", 320),
    "logo-noble": ("2021/08/Noble.png", 320),
    "logo-kisha": ("2021/08/Kisha.png", 320),
    "logo-clasico": ("2021/08/Clásico.png", 320),
    "logo-nutrescan-natural": ("2021/08/Nutrescan-Natural.png", 320),
    "logo-beast-friend": ("2021/08/Beast-Friend.png", 320),
    "logo-nutrescan": ("2021/08/Nutrescan.png", 320),
    "logo-supercan": ("2021/08/SuperCan.png", 320),
    # Empresa
    "empresa-1": ("2026/08/Nu3-Grandpet-Image1_1.jpg", 900),
    "empresa-2": ("2020/04/Nu3-Grandpet-Image3_1.jpg", 900),
    "empresa-3": ("2020/04/Nu3-Grandpet-Image3_2.jpg", 900),
    "empresa-4": ("2020/04/Nu3-Grandpet-Image4_1.png", 600),
    "empresa-5": ("2020/04/Nu3-Grandpet-Image4_2.png", 600),
    "empresa-6": ("2020/04/Nu3-Grandpet-Image4_3.png", 600),
    "fssc": ("2026/08/Nu3-Grandpet-Producto2_1.png", 360),
    # La Huella Dorada
    "huella-titulo": ("2026/10/asset_txt_huelladorada.webp", 700),
    "huella-arte": ("2026/10/asset_huelladorada_3.webp", 700),
    # Back 2 Nature
    "b2n-puppy-sb": ("2020/07/Render-Back-2-Nature-Puppy-SB.png", 480),
    "b2n-puppy-mlb": ("2020/07/Render-Back-2-Nature-Puppy-MLB.png", 480),
    "b2n-adult-sb": ("2020/07/Render-Back-2-Nature-Adult-SB.png", 480),
    "b2n-adult-mlb": ("2020/07/Render-Back-2-Nature-Adult-MLB.png", 480),
    "b2n-hsa": ("2020/07/Render-Back-2-Nature-HSA.png", 480),
    "b2n-fl": ("2020/07/Render-Back-2-Nature-FL.png", 480),
    "b2n-cp": ("2020/07/Render-Back-2-Nature-CP.png", 480),
    # Noble
    "noble-cachorro": ("2020/07/Render-Noble-Cachorro.png", 480),
    "noble-adulto-rp": ("2020/07/Render-Noble-Adulto-RazaPequeña.png", 480),
    "noble-adulto-rmg": ("2020/07/Render-Noble-Adulto-RazaML.png", 480),
    # Carne Fresca
    "cf-puppy": ("2020/07/Render-Carne-Fresca-Puppy-Care.png", 480),
    "cf-minis": ("2020/07/Render-Carne-Fresca-Minis.png", 480),
    "cf-force": ("2020/07/Render-Carne-Fresca-Force.png", 480),
    # Natural Gourmet
    "ng-baby": ("2025/01/NG-BABY.png", 480),
    "ng-petit": ("2025/01/ng-petit.png", 480),
    "ng-grand": ("2025/01/NG-GRAND-1.png", 480),
    "ng-cordero": ("2025/01/ng-cordero.png", 480),
    "ng-baby-cordero": ("2025/01/ng-babyc.png", 480),
    "ng-feline": ("2021/05/Render-Natural-Gourmet-Feline-1.png", 480),
    "ng-humedo-carne": ("2021/05/Render-Natural-Gourmet-Meatandberries.png", 480),
    "ng-humedo-pescado": ("2021/05/Render-Natural-Gourmet-Fishonfinehierbs.png", 480),
    "ng-leche": ("2021/05/Render-Sustituto-de-Leche.png", 480),
    "ng-papilla": ("2021/05/Render-Papilla-para-cachorro.png", 480),
    "ng-premios": ("2021/06/Render-Natural-Gourmet-Treats-1.png", 480),
    # Kisha
    "kisha-adulto": ("2024/05/dt_kisha_adulto-1.png", 560),
    "kisha-cachorro": ("2024/05/dt_kisha_cachorro-1.png", 560),
}


def download(path):
    """Algunos nombres con acento están guardados en forma NFD en el servidor: se prueban ambas."""
    import unicodedata
    last = None
    for form in ("NFC", "NFD"):
        url = U + urllib.parse.quote(unicodedata.normalize(form, path))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site-build)"})
            return urllib.request.urlopen(req, timeout=30).read()
        except Exception as e:
            last = e
    raise last


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    raw = Path(tempfile.mkdtemp(prefix="gp-raw-"))
    missing = []
    for name, (path, width) in IMAGES.items():
        try:
            data = download(path)
            (raw / Path(path).name).write_bytes(data)
            im = Image.open(io.BytesIO(data))
            im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
            if im.width > width:
                im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
            im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
            print(f"{name}.webp  {im.width}x{im.height}")
        except Exception as e:  # una imagen que falle no detiene las demás
            missing.append(f"{name}: {e}")
    if missing:
        print("\nNo se pudieron descargar:\n" + "\n".join(missing))


if __name__ == "__main__":
    main()
