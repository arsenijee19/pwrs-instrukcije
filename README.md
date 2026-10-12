# PlayWorld instrukcije — instrukcije.playworld.rs

Mobilni, linearni vodič kroz aktivaciju PS4/PS5 naloga (4 tipa naloga × 2 proizvoda = 8 putanja) sa admin panelom.
Specifikacija: `IMPLEMENTATION_PROMPT.md` (u GitHub repozitorijumu `arsenijee19/pwrs-instrukcije`).

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · SQLite (`node:sqlite`, bez native zavisnosti) · sharp (obrada uploada) · zod.
Zahteva **Node.js ≥ 22.13**.

## Lokalno pokretanje

```bash
npm install
cp .env.example .env.local        # popunite ADMIN_PASSWORD (samo dev) ili ADMIN_PASSWORD_HASH i SESSION_SECRET
npm run dev                       # http://localhost:3000
```

| Putanja | Šta je |
|---|---|
| `/` | izbor tipa naloga (4 velike kartice) |
| `/ps4-primary`, `/ps4-secondary`, `/ps5-primary`, `/ps5-secondary` | vodič: proizvod → pravila → koraci → kraj. Opcioni `?proizvod=igra` ili `?proizvod=ps-plus` |
| `/admin` | admin panel (prijava lozinkom) |

Kupac ne ostavlja nikakve podatke. Napredak (proizvod, prihvaćena pravila, korak) čuva se **samo u sessionStorage** browsera, pa osvežavanje stranice ne gubi korak. Povratak na početnu stranicu ili novi ulazak na sajt kreće od nule, a na završnom ekranu postoji „Kreni ispočetka“. Prihvatanje pravila se ne beleži na serveru.

## Environment

| Promenljiva | Opis |
|---|---|
| `ADMIN_PASSWORD_HASH` | `scrypt:<salt>:<hash>`; generiše se sa `npm run admin:hash -- "duga-lozinka"`. **Koristiti u produkciji.** |
| `ADMIN_PASSWORD` | čista lozinka — radi **samo van produkcije** (`NODE_ENV!=production`) |
| `SESSION_SECRET` | min. 16 karaktera (`openssl rand -hex 32`); obavezno u produkciji |
| `DATA_DIR` | folder za SQLite bazu i upload slika (trajni disk). Podrazumevano `./data` |
| `NEXT_PUBLIC_SITE_URL` | javni URL (canonical, sitemap) |

## Admin panel (`/admin`)

* Karte: četiri vodiča, **Pravila**, **Završni ekran**, **Podešavanja** (URL podrške), **Verzije**.
* Po koraku: naslov, opis (`**bold**`, liste sa `- `), „prikazuje se za“ (igra / PS Plus / oba), tip upozorenja (info/važno/kritično) i tekst, link podrške, sakrij/prikaži, dupliraj, obriši (uz potvrdu), redosled prevlačenjem ili strelicama.
* Slike: upload (JPG/PNG/WebP do 10 MB; server ih re-enkodira u WebP 800/1600px), zamena, alt opis, **oznake** (zeleni „izaberite“ i crveni „zabranjeno“ okviri) crtaju se prevlačenjem preko slike.
* **Sačuvaj nacrt** → **👁 Pregled nacrta** (`/admin/preview/<tip>`) → **Objavi**. Javni sajt uvek prikazuje objavljenu verziju. Poslednjih 20 objavljenih verzija može se vratiti u nacrt.
* „Vrati nacrt na fabričke vrednosti“ vraća sadržaj iz `lib/seed.ts`.

Bezbednost: server-side sesija (HMAC potpisan, HttpOnly, SameSite=Strict, Secure u produkciji, 8 h), CSRF token + provera Origin-a na svim mutacijama, rate-limit prijave (6 pokušaja / 15 min po IP-u, trajno u SQLite-u), zod validacija celog sadržaja, tekst se renderuje bez HTML-a (nema XSS-a), upload se dekodira i re-enkodira (nema izvršnog sadržaja), nema javnog write API-ja. IP se čita iz `X-Forwarded-For` — postavite reverse proxy koji ga postavlja pouzdano.

## Jezici (SR / EN)

Srpski je na korenu (`/`, `/ps5-primary`...), engleski na `/en` (`/en/ps5-primary`...). Prekidač „EN/SR“ je na početnoj stranici i u zaglavlju vodiča. Svaki jezik ima **poseban sadržaj** (koraci, pravila, završni tekst, promocije) sa nezavisnim nacrtom, objavom i istorijom; slike i pozicije oznaka su zajedničke. UI tekstovi su u `lib/i18n.ts`, podrazumevani sadržaj u `lib/seed.ts` (`defaultContent(lang)`). U adminu se jezik bira prekidačem „SR / EN“ u zaglavlju.

## Promocije (baneri)

Kartica **Promocije** u adminu: naslov, opis, opciona slika, tekst dugmeta, https link, uključeno/isključeno i mesta prikaza (početna, tokom koraka, završna). Baneri su obični blokovi u toku stranice i nikada ne prekrivaju instrukcije. Link ka prodavnici u zaglavlju (`Podešavanja`) je uvek vidljiv i diskretan. Podrazumevano su uključeni baneri za početnu i završnu stranicu, bez cena i popusta.

## Animacije i čestice

`components/Particles.tsx` crta pozadinske čestice i blage PlayStation simbole (△ ○ ✕ □) na jednom canvasu (samo transform/alpha, pauzira se kad je tab skriven). `lib/fx.ts` izlaže `burst()` koji pokreće efekat pri prelasku na sledeći korak, izboru proizvoda, prihvatanju pravila i na završnom ekranu. Prelazi između koraka klize levo/desno, sadržaj se pojavljuje „stagger“ efektom. Sve se isključuje uz `prefers-reduced-motion`, a čestice nisu na `/admin`.

## Layout

Vodič je „app shell“: zaglavlje i podnožje su stalni redovi, a skroluje se samo srednji deo (`main`). Nema `fixed`/`sticky` elemenata koji bi preklapali sadržaj, pa se preklapanje ne može dogoditi, uključujući Safari na iOS-u (`100dvh`).

## Struktura

```
app/                 rute (javne, /admin, /api/admin/*, /media)
components/          GuideFlow (tok kupca), StepImage (zoom + oznake), admin/*
lib/seed.ts          početni sadržaj svih 8 putanja (izvor istine za fabričke vrednosti)
lib/types.ts         zod šema sadržaja
lib/db.ts, auth.ts   SQLite (nacrt/objavljeno/istorija/pokušaji prijave), sesije
content/assets-manifest.json   dimenzije i izvor svake slike
public/guide/        obrađeni screenshotovi (WebP 800/1600)
scripts/extract_assets.py      PDF → slike (pymupdf + pillow)
docs/ASSET_MAP.md    korak → PDF → strana → asset
tests/               testovi poslovnih pravila + admin API smoke test
```

Zajednički i tip-specifični koraci se grade funkcijama `ps4(kind)` / `ps5(kind)` u `lib/seed.ts`, ali se u bazi čuvaju kao nezavisni koraci po tipu naloga — izmena jednog tipa ne utiče na drugi.

## Testovi

```bash
npm run typecheck
npm test                                        # 13 testova poslovnih pravila (8 putanja, GET STARTED, Enable/Don't Enable, Activate/Do Not Activate, ...)
npm run build && npm start &                    # pa:
ADMIN_PASSWORD=<lozinka za dev> node tests/admin-smoke.mjs   # (server mora imati ADMIN_PASSWORD_HASH za istu lozinku)
```

## Obrada slika

```bash
python3 -m venv .venv && .venv/bin/pip install pymupdf pillow opencv-python-headless numpy
.venv/bin/python scripts/extract_assets.py "/putanja/do/PDF Instrukcije"
```

Skripta obrađuje **svaku sliku pojedinačno** (konfiguracija po slici je na vrhu `scripts/extract_assets.py`):

1. izvlači originalni screenshot iz PDF-a,
2. uklanja nacrtane plave/bele strelice i crvene okvire iz originala (inpainting samo tih piksela),
3. uklanja tuđa korisnička imena sa screenshotova i vraća PlayWorld avatar umesto tuđeg (kao u originalnim PDF-ovima),
4. blago čisti JPEG šum, podiže senke i izoštrava; slike uže od 1500 px prolaze kroz **x2 super-resolution** (EDSR za najmanje, LapSRN za ostale; regresioni modeli koji se skidaju u `.models/` pri prvom pokretanju), pa se skaliraju na 1600 px,
5. izvozi WebP 800/1600 px i upisuje pozicije oznaka (zeleni „izaberite“ i crveni „zabranjeno“ okviri) u `content/assets-manifest.json`.

Oznake su čist web overlay iznad slike, pa ostaju tačne na svakoj veličini ekrana. Nije korišćen generativni AI; tekst Sony menija se ne generiše niti menja.

## Deploy (produkcija)

1. Node ≥ 22.13 (ili `docker build -t pw-instrukcije .`).
2. Postavite env promenljive (vidi gore), `DATA_DIR` na **trajni volume** (baza + uploadi preživljavaju deploy).
3. `npm ci && npm run build && npm start` (port `PORT`, podrazumevano 3000) iza HTTPS reverse proxy-ja (nginx/Caddy) za `instrukcije.playworld.rs`.
4. Docker: `docker run -p 3000:3000 -v pw-data:/data --env-file .env pw-instrukcije`.
5. Backup: kopirajte `DATA_DIR` (`instrukcije.sqlite*` + `uploads/`).
6. Pre prvog objavljivanja: **pravni tekst pravila** (kartica „Pravila“) treba da pregleda vlasnik/pravnik.

## Poznata ograničenja / preostali zadaci

* **Nedostaje screenshot** ekrana „Limited Data Collection“ / „Apply“ (opisan je samo tekstom u koraku Privacy). „Your Information“ i „Adjust Privacy Settings“ su dopunske slike iz `assets-src/`.
* Nije implementirana analitika (nije uslov MVP-a).
