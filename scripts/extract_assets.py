#!/usr/bin/env python3
"""
PDF -> obrađeni screenshotovi za vodič.

    python3 -m venv .venv && .venv/bin/pip install pymupdf pillow opencv-python-headless numpy
    .venv/bin/python scripts/extract_assets.py "/putanja/do/PDF Instrukcije"

Za svaku sliku (jednu po jednu, vidi CONFIG):
  1. izvlači originalni screenshot iz PDF-a,
  2. uklanja ugrađene (nacrtane) strelice, okvire i tuđa korisnička imena (inpainting samo tih piksela),
  3. vraća PlayWorld avatar tamo gde je original imao tuđi avatar,
  4. blago čisti JPEG šum, ujednačava ton i izoštrava,
  5. izvozi WebP 800/1600 px i upisuje manifest sa pozicijama oznaka (u procentima).
Tekst Sony menija se NE generiše i ne menja (nema generativnog AI-a).
"""
import hashlib, io, json, sys
from pathlib import Path
import cv2, numpy as np, pymupdf
from PIL import Image

# asset -> (pdf, strana, redni broj screenshot slike na strani)
ASSETS = {
    "ps4-power": ("PS4 Primary", 2, 1), "ps4-new-user": ("PS4 Primary", 3, 1), "ps4-agreement": ("PS4 Primary", 4, 1),
    "ps4-sign-in-manually": ("PS4 Primary", 5, 1), "ps4-sign-in-form": ("PS4 Primary", 6, 1), "ps4-2step": ("PS4 Primary", 7, 1),
    "ps4-activate-primary": ("PS4 Primary", 8, 1), "ps4-activate-secondary": ("PS4 Secondary", 8, 1),
    "ps4-library-start": ("PS4 Primary", 9, 1), "ps4-library-purchased": ("PS4 Primary", 9, 2),
    "ps4-psplus-bar": ("PS4 Primary", 10, 1), "ps4-psplus-home": ("PS4 Primary", 10, 2),
    "ps5-profile-icon": ("PS5 Primary", 2, 1), "ps5-switch-user": ("PS5 Primary", 3, 1), "ps5-welcome-add-user": ("PS5 Primary", 4, 1),
    "ps5-get-started": ("PS5 Primary", 5, 1), "ps5-license": ("PS5 Primary", 6, 1), "ps5-sign-in": ("PS5 Primary", 7, 1),
    "ps5-2step": ("PS5 Primary", 8, 1), "ps5-privacy": ("PS5 Primary", 9, 1),
    "ps5-console-sharing-primary": ("PS5 Primary", 10, 1), "ps5-console-sharing-secondary": ("PS5 Secondary", 10, 1),
    "ps5-secure-account": ("PS5 Primary", 11, 1), "ps5-add-mobile": ("PS5 Primary", 11, 2),
    "ps5-game-library": ("PS5 Primary", 12, 1), "ps5-game-download": ("PS5 Primary", 12, 2), "ps5-home-library": ("PS5 Primary", 12, 3),
    "ps5-psplus-tile": ("PS5 Primary", 13, 1), "ps5-psplus-catalog": ("PS5 Primary", 13, 2),
}

EXTRA_MARKERS = {  # u procentima
    "ps5-your-information": [dict(type="target", label="First name", x=8.5, y=27, w=41, h=12),
                             dict(type="target", label="Last name", x=50.5, y=27, w=42, h=12)],
}
BLUE, WHITE, RED = "blue", "white", "red"
# CONFIG po slici: erase = [(vrsta, (x0,y0,x1,y1) ili poligon, prag?)], plain = oblasti za običan inpaint,
# markers = [(tip, (x0,y0,x1,y1), natpis)] u pikselima izvorne slike, tone = (gamma, kontrast)
CONFIG = {
    "ps4-power": dict(erase=[("poly", [(858, 742), (900, 775), (893, 800), (928, 893), (902, 900), (868, 805), (852, 800)])],
                      markers=[("target", (815, 695, 905, 770), "PS dugme")]),
    "ps4-new-user": dict(erase=[(WHITE, (545, 568, 745, 658), 200)], plain=[(1020, 640, 1255, 690)], avatar="ps4",
                         copy=[(694, 440, 712, 540, 694, 560), (694, 440, 712, 540, 694, 540)],
                         markers=[("target", (700, 372, 972, 768), "New User")]),
    "ps4-agreement": dict(erase=[(WHITE, (1450, 745, 1595, 850), 200)], markers=[("target", (988, 853, 1424, 940), "Accept")]),
    "ps4-sign-in-manually": dict(erase=[(WHITE, (690, 605, 900, 770), 190)], copy=[(560, 724, 700, 746, 700, 724)], markers=[("target", (210, 731, 842, 807), "Sign In Manually")]),
    "ps4-sign-in-form": dict(erase=[(WHITE, (295, 235, 500, 372), 180), (WHITE, (1485, 440, 1630, 570), 180), (WHITE, (1478, 683, 1668, 762), 180), (WHITE, (30, 325, 460, 640), 175)],
                             markers=[("target", (460, 415, 1472, 502), "Email"), ("target", (460, 558, 1472, 642), "Lozinka"), ("target", (460, 692, 1472, 775), "Sign In")]),
    "ps4-2step": dict(erase=[], markers=[("target", (508, 520, 1308, 606), "Kod")]),
    "ps4-activate-primary": dict(erase=[(RED, (915, 775, 1335, 872), None)], markers=[("target", (925, 785, 1327, 863), "Izaberite")]),
    "ps4-activate-secondary": dict(erase=[(WHITE, (285, 625, 545, 780), 205)],
                                   markers=[("target", (473, 738, 842, 805), "Do Not Activate"), ("forbidden", (895, 738, 1267, 806), "NE")]),
    "ps4-library-start": dict(erase=[], markers=[("target", (254, 178, 608, 604), "Library")]),
    "ps4-library-purchased": dict(erase=[(WHITE, (252, 405, 500, 552), 200), (WHITE, (236, 416, 262, 440), 215)], plain=[(70, 335, 175, 362), (825, 555, 995, 592)],
                                  markers=[("target", (38, 368, 252, 422), "Purchased")]),
    "ps4-psplus-bar": dict(erase=[], markers=[("target", (0, 2, 170, 136), "PlayStation Plus")]),
    "ps4-psplus-home": dict(erase=[(WHITE, (50, 38, 140, 92), 200)], plain=[(485, 12, 680, 50)],
                            markers=[("target", (10, 8, 64, 54), "PlayStation Plus")]),
    "ps5-profile-icon": dict(erase=[(BLUE, (1935, 106, 2092, 455), None)], markers=[("target", (2018, 20, 2096, 100), "Profil")]),
    "ps5-switch-user": dict(erase=[(BLUE, (1480, 550, 1620, 640), None)], plain=[(1230, 125, 1385, 165)],
                            markers=[("target", (1215, 494, 1896, 597), "Switch User")]),
    "ps5-welcome-add-user": dict(erase=[(BLUE, (720, 280, 850, 410), None)], plain=[(905, 785, 1205, 850)], avatar="ps5",
                                 markers=[("target", (365, 360, 775, 775), "Add User")]),
    "ps5-get-started": dict(erase=[], markers=[("target", (62, 592, 725, 687), "GET STARTED"), ("forbidden", (800, 174, 1492, 711), "NE")]),
    "ps5-license": dict(erase=[(BLUE, (1235, 691, 1470, 819), None), (BLUE, (1681, 721, 1812, 912), None)],
                        markers=[("target", (1425, 830, 1610, 893), "I Agree"), ("target", (1235, 925, 1800, 1010), "Confirm")]),
    "ps5-sign-in": dict(erase=[(BLUE, (19, 250, 212, 381), None), (BLUE, (19, 560, 212, 691), None), (BLUE, (44, 775, 238, 900), None)],
                        markers=[("target", (170, 320, 910, 430), "Email"), ("target", (170, 485, 910, 600), "Lozinka"), ("target", (200, 670, 910, 770), "Sign In")]),
    "ps5-2step": dict(erase=[(BLUE, (1277, 704, 1448, 810), None), (BLUE, (366, 871, 598, 954), None)],
                      markers=[("target", (560, 575, 1290, 705), "Kod"), ("target", (650, 865, 1180, 970), "OK")]),
    "ps5-privacy": dict(erase=[(BLUE, (310, 185, 398, 340), None)], markers=[]),
    "ps5-console-sharing-primary": dict(erase=[(BLUE, (1005, 424, 1275, 596), None)], markers=[("target", (655, 590, 1030, 670), "ENABLE")]),
    "ps5-console-sharing-secondary": dict(erase=[(BLUE, (35, 410, 280, 590), None)],
                                          markers=[("target", (260, 544, 568, 627), "DON'T ENABLE"), ("forbidden", (592, 544, 924, 627), "NE")]),
    "ps5-secure-account": dict(erase=[(BLUE, (310, 710, 520, 855), None)], markers=[("target", (515, 825, 1030, 905), "OK")]),
    "ps5-add-mobile": dict(erase=[(BLUE, (1356, 794, 1550, 928), None)], markers=[("target", (1425, 955, 1750, 1040), "Do This Later")]),
    "ps5-game-library": dict(erase=[(BLUE, (350, 155, 455, 335), None)], markers=[("target", (300, 100, 500, 160), "Your Collection")]),
    "ps5-game-download": dict(erase=[(BLUE, (55, 535, 205, 665), None)], markers=[("target", (150, 645, 495, 722), "Download")]),
    "ps5-home-library": dict(erase=[(BLUE, (1075, 158, 1165, 265), None)], markers=[("target", (1005, 85, 1115, 175), "Game Library")]),
    "ps5-psplus-tile": dict(erase=[(BLUE, (390, 222, 535, 305), None)], plain=[(340, 232, 745, 282)], markers=[("target", (145, 105, 335, 295), "PlayStation Plus")]),
    "ps5-psplus-catalog": dict(erase=[], markers=[]),
}

def page_images(doc, page):
    out = []
    for im in doc[page - 1].get_images(full=True):
        info = doc.extract_image(im[0]); w, h = info["width"], info["height"]
        rect = doc[page - 1].get_image_rects(im[0])[0]
        if (w, h) == (1280, 720) and rect.width >= 959: continue
        if w == h and w in (270, 1080): continue
        out.append(info["image"])
    return out

def avatar_images(src):
    """PlayWorld avatari iz PDF-a (kao u originalnim uputstvima)."""
    d4 = pymupdf.open(Path(src) / "PS4 Primary.pdf"); d5 = pymupdf.open(Path(src) / "PS5 Primary.pdf")
    p4 = d4.extract_image([i for i in d4[2].get_images(full=True) if d4.extract_image(i[0])["width"] == 798][0][0])["image"]
    p5 = d5.extract_image([i for i in d5[3].get_images(full=True) if d5.extract_image(i[0])["width"] == 1080][0][0])["image"]
    return {"ps4": cv2.imdecode(np.frombuffer(p4, np.uint8), 1), "ps5": cv2.imdecode(np.frombuffer(p5, np.uint8), 1)}

def region_mask(shape, kind, box, thr, im):
    m = np.zeros(shape[:2], np.uint8)
    if kind == "poly":
        cv2.fillPoly(m, [np.array(box, np.int32)], 255); return m
    x0, y0, x1, y1 = box
    roi = im[y0:y1, x0:x1].astype(int); b, g, r = roi[..., 0], roi[..., 1], roi[..., 2]
    if kind == BLUE: sel = (b > 110) & (b - r > 35) & (b - g > 15) & (r < 165)
    elif kind == WHITE: sel = roi.min(axis=2) > thr
    else: sel = (r > 150) & (g < 90) & (b < 90)
    m[y0:y1, x0:x1][sel] = 255
    return m

def place_avatar(im, which, av):
    h, w = im.shape[:2]
    if which == "ps4":      # tile PS4 "New User" slike (druga pločica)
        x, y, s = 1007, 375, 266
        art = cv2.resize(av, (s, s), interpolation=cv2.INTER_AREA); im[y:y + s, x:x + s] = art
    else:                   # krug PS5 "Welcome back"
        cx, cy, r = 1058, 566, 150
        hh, ww = av.shape[:2]; c = int(min(hh, ww) * 0.27)   # samo unutrašnji krug sa logotipom
        av = av[hh // 2 - c:hh // 2 + c, ww // 2 - c:ww // 2 + c]
        r = r + 4
        art = cv2.resize(av, (2 * r, 2 * r), interpolation=cv2.INTER_AREA)
        mask = np.zeros((2 * r, 2 * r), np.float32); cv2.circle(mask, (r, r), r - 1, 1.0, -1, cv2.LINE_AA)
        roi = im[cy - r:cy + r, cx - r:cx + r].astype(np.float32)
        im[cy - r:cy + r, cx - r:cx + r] = (art * mask[..., None] + roi * (1 - mask[..., None])).astype(np.uint8)
    return im

MODEL_URLS = {
    "edsr": "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb",
    "lapsrn": "https://raw.githubusercontent.com/fannymonori/TF-LapSRN/master/export/LapSRN_x2.pb",
}
_SR = {}

def upscale2x(im, name):
    """x2 super-resolution (regresioni modeli, ne generativni): EDSR za male slike, LapSRN za ostale. Rezultat se keširira."""
    import urllib.request
    cache = Path(".models/sr-cache"); cache.mkdir(parents=True, exist_ok=True)
    cf = cache / f"{name}-{hashlib.md5(im.tobytes()).hexdigest()[:12]}.png"
    if cf.exists(): return cv2.imread(str(cf))
    algo = "edsr" if im.shape[0] * im.shape[1] < 450_000 else "lapsrn"
    if algo not in _SR:
        path = Path(".models"); path.mkdir(exist_ok=True)
        f = path / Path(MODEL_URLS[algo]).name
        if not f.exists(): urllib.request.urlretrieve(MODEL_URLS[algo], f)
        sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(str(f)); sr.setModel(algo, 2); _SR[algo] = sr
    print(f"  upscale {name}: {im.shape[1]}x{im.shape[0]} ({algo})", flush=True)
    out = _SR[algo].upsample(im); cv2.imwrite(str(cf), out); return out

def enhance(im):
    im = cv2.fastNlMeansDenoisingColored(im, None, 2.5, 2.5, 5, 15)
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)
    l = lab[..., 0].astype(np.float32) / 255.0
    l = np.clip((l ** 0.92 - 0.5) * 1.06 + 0.5, 0, 1)             # blago podizanje senki + kontrast
    lab[..., 0] = (l * 255).astype(np.uint8)
    im = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    blur = cv2.GaussianBlur(im, (0, 0), 1.4)
    return cv2.addWeighted(im, 1.45, blur, -0.45, 0)               # unsharp

def main(src, out_dir="public/guide", manifest="content/assets-manifest.json", mapfile="docs/ASSET_MAP.md"):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.webp"): old.unlink()
    docs = {n: pymupdf.open(Path(src) / f"{n}.pdf") for n in ("PS4 Primary", "PS4 Secondary", "PS5 Primary", "PS5 Secondary")}
    avatars = avatar_images(src)
    man, rows = {}, []
    for name, (pdf, page, idx) in ASSETS.items():
        raw = page_images(docs[pdf], page)[idx - 1]
        im = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
        H, W = im.shape[:2]; cfg = CONFIG[name]; W0, H0 = W, H
        if cfg.get("avatar"): im = place_avatar(im, cfg["avatar"], avatars[cfg["avatar"]])
        mask = np.zeros((H, W), np.uint8)
        for kind, box, thr in [(k, b, t) if k != "poly" else (k, b, None) for k, b, t in
                               [(e[0], e[1], e[2] if len(e) > 2 else None) for e in cfg["erase"]]]:
            mask |= region_mask(im.shape, kind, box, thr, im)
        mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=4)
        for x0, y0, x1, y1 in cfg.get("plain", []): mask[y0:y1, x0:x1] = 255
        if mask.any(): im = cv2.inpaint(im, mask, 6, cv2.INPAINT_TELEA)
        for sx0, sy0, sx1, sy1, dx, dy in cfg.get("copy", []):
            im[dy:dy + (sy1 - sy0), dx:dx + (sx1 - sx0)] = im[sy0:sy1, sx0:sx1].copy()
        im = enhance(im)
        if W < 1500:
            im = upscale2x(im, name)
            blur = cv2.GaussianBlur(im, (0, 0), 1.0); im = cv2.addWeighted(im, 1.25, blur, -0.25, 0)
        OW, OH = im.shape[1], im.shape[0]
        pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
        tag = hashlib.sha1(im.tobytes()).hexdigest()[:8]; fname = f"{name}-{tag}"
        for target in (800, 1600):
            t = min(target, OW)
            r = pil if t == OW else pil.resize((t, round(OH * t / OW)), Image.LANCZOS)
            r.save(out / f"{fname}-{target}.webp", "WEBP", quality=86, method=6)
        w1600 = min(1600, OW); H = OH; W = OW
        pct = lambda b: dict(x=round(b[0] / W0 * 100, 1), y=round(b[1] / H0 * 100, 1), w=round((b[2] - b[0]) / W0 * 100, 1), h=round((b[3] - b[1]) / H0 * 100, 1))
        man[name] = {"src": f"/guide/{fname}", "w": w1600, "h": round(H * w1600 / W), "sha": hashlib.sha1(raw).hexdigest()[:8],
                     "pdf": f"{pdf}.pdf", "page": page,
                     "markers": [dict(type=t, label=l, **pct(b)) for t, b, l in cfg["markers"]]}
        rows.append(f"| `{name}` | {pdf}.pdf | {page} | {W0}×{H0} | `public/guide{man[name]['src'][6:]}-{{800,1600}}.webp` |")
    for f in sorted(Path("assets-src").glob("*")):   # dopunske slike dostavljene van PDF-a
        name = f.stem
        bgr = cv2.imread(str(f)); srcw = bgr.shape[1]
        if srcw < 1500:
            # Sitne JPEG slike: neuronski upscale pojačava JPEG artefakte, pa je čišći put denoise + Lanczos x2 + unsharp.
            bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 4, 4, 5, 15)
            bgr = cv2.resize(bgr, (srcw * 2, bgr.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
            bgr = cv2.addWeighted(bgr, 1.7, cv2.GaussianBlur(bgr, (0, 0), 1.4), -0.7, 0)
        img = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)); W, H = img.size
        fname = f"{name}-{hashlib.sha1(bgr.tobytes()).hexdigest()[:8]}"
        for target in (800, 1600):
            t = min(target, W); (img if t == W else img.resize((t, round(H * t / W)), Image.LANCZOS)).save(out / f"{fname}-{target}.webp", "WEBP", quality=90, method=6)
        w1600 = min(1600, W)
        man[name] = {"src": f"/guide/{fname}", "w": w1600, "h": round(H * w1600 / W), "sha": hashlib.sha1(f.read_bytes()).hexdigest()[:8],
                     "pdf": f"(dopunska slika) {f.name}", "page": 0, "maxW": srcw,
                     "markers": EXTRA_MARKERS.get(name, [])}
        rows.append(f"| `{name}` | dopunska slika `assets-src/{f.name}` | , | {W}×{H} | `public/guide/{fname}-{{800,1600}}.webp` |")
    Path(manifest).write_text(json.dumps(man, indent=1))
    Path(mapfile).write_text("# Mapa izvora slika\n\nGenerisano skriptom `scripts/extract_assets.py`. Originalni screenshotovi iz PDF-a; "
        "uklonjene su nacrtane strelice i tuđa imena, bez generativnog AI-a.\n\n| Asset | Izvorni PDF | Strana | Izvorna veličina | Obrađeni fajl |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n")
    print(f"OK: {len(man)} slika")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "PDF Instrukcije")
