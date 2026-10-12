# Postavljanje na cPanel (instrukcije.playworld.rs)

Paket za upload je `deploy/instrukcije-cpanel.zip` (oko 22 MB). Sve je već izgrađeno (build) i sadrži sve što treba, tako da na serveru **nije potrebno** pokretati `npm install` ni build.

Vrednosti za podešavanje (lozinka za admin, tajni ključ...) su u `deploy/ENV-VALUES.txt`. Taj fajl ostaje samo kod Vas.

## 0. Šta Vam treba
- cPanel sa opcijom **Setup Node.js App** (u sekciji „Software“).
- Node.js verzija **22.13 ili novija** (preporučeno 22.x ili 24.x). Ako imate samo 20, pogledajte „Problemi“ na dnu.
- Subdomen `instrukcije.playworld.rs` (već ste ga napravili).

## 1. Priprema foldera
1. Otvorite **File Manager**. Kliknite **Settings** (gore desno) i uključite **Show Hidden Files (dotfiles)**.
2. U home folderu (`/home/VAS_USER`, **ne** u `public_html`) napravite dva foldera:
   - `instrukcije-app` (ovde ide aplikacija),
   - `instrukcije-data` (ovde se čuva baza i uploadovane slike; mora da preživi svako ažuriranje).

## 2. Upload aplikacije
1. Uđite u `instrukcije-app` i kliknite **Upload**. Izaberite `instrukcije-cpanel.zip`.
2. Kad se upload završi, desni klik na zip → **Extract** → izvucite u `instrukcije-app`.
3. Proverite da su u `instrukcije-app` fajlovi `app.js`, `server.js`, `package.json` i folderi `.next`, `node_modules`, `public`.
4. Obrišite zip fajl (nije više potreban).

## 3. Pravljenje Node.js aplikacije
1. cPanel → **Setup Node.js App** → **Create Application**.
2. Popunite:
   - **Node.js version:** najviša dostupna, najmanje 22.13.
   - **Application mode:** Production.
   - **Application root:** `instrukcije-app`
   - **Application URL:** izaberite `instrukcije.playworld.rs` (polje posle domena ostavite prazno).
   - **Application startup file:** `app.js`
3. Kliknite **Create**.

## 4. Promenljive okruženja
Na istoj stranici, u delu **Environment variables**, dodajte (kliknite **Add Variable** za svaku) vrednosti iz `deploy/ENV-VALUES.txt`:

| Ime | Vrednost |
|---|---|
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD_HASH` | cela linija iz fajla (počinje sa `scrypt:`) |
| `SESSION_SECRET` | dugačak niz iz fajla |
| `DATA_DIR` | `/home/VAS_USER/instrukcije-data` (zamenite `VAS_USER` pravim imenom cPanel naloga) |
| `NEXT_PUBLIC_SITE_URL` | `https://instrukcije.playworld.rs` |

Kliknite **Save**.

> **Ne klikćite „Run NPM Install“.** Paket već sadrži sve potrebne biblioteke, a ta opcija bi ih zamenila.

## 5. Pokretanje
1. Kliknite **Restart** (ili **Start**) na stranici aplikacije.
2. Otvorite https://instrukcije.playworld.rs. Treba da vidite izbor naloga.
3. Proverite https://instrukcije.playworld.rs/en (engleska verzija) i https://instrukcije.playworld.rs/admin (prijava lozinkom iz `ENV-VALUES.txt`).

## 6. HTTPS
cPanel → **SSL/TLS Status** → pronađite `instrukcije.playworld.rs` → **Run AutoSSL**. Kada dobije sertifikat, sajt radi preko https.

## 7. Prvi koraci u adminu
1. Prijavite se na `/admin`.
2. Pregledajte kartice Pravila, Završni ekran, Promocije i Podešavanja (važno: **pravni tekst pravila** treba da odobri vlasnik/pravnik).
3. Za svaki jezik (SR/EN) kliknite **Pregled nacrta**, pa **Objavi**.

## Ažuriranje kasnije
1. Na računaru: `npm run build:cpanel` (pravi novi `deploy/instrukcije-cpanel.zip`).
2. Uploadujte zip u `instrukcije-app`, **Extract** (pristanite na prepisivanje fajlova), obrišite zip.
3. Setup Node.js App → **Restart**.

Baza i slike su u `instrukcije-data` i ostaju netaknuti. Za bekap kopirajte taj folder.

## Problemi
- **Stranica pokazuje grešku ili „Incomplete response“:** otvorite `instrukcije-app/stderr.log` (ili log iz Setup Node.js App). Najčešći uzroci su pogrešan `DATA_DIR` (folder ne postoji) ili nepodešen `SESSION_SECRET`.
- **Prijava u admin ne radi:** proverite da je `ADMIN_PASSWORD_HASH` kopiran u celini (bez razmaka na početku/kraju) i da ste kliknuli **Restart** posle izmene promenljivih.
- **Hosting nudi samo Node 20:** aplikacija koristi ugrađeni `node:sqlite` (Node 22+), a na starijem Node-u automatski prelazi na `better-sqlite3`. U tom slučaju u cPanel **Terminal**-u: `source /home/VAS_USER/nodevenv/instrukcije-app/20/bin/activate && cd ~/instrukcije-app && npm install better-sqlite3 --no-save`, pa Restart.
- **Upload slike u adminu javlja grešku:** hosting ima premalo memorije ili nema Linux binarne datoteke za `sharp`. Javite mi tekst greške iz `stderr.log`.
