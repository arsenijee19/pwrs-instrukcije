# Postavljanje na cPanel (instrukcije.playworld.rs)

Paket `deploy/instrukcije-cpanel.zip` je **kompletan**: aplikacija je već izgrađena, a podešavanja (admin lozinka, tajni ključ) su unutra u `config.env`. Ne treba ništa da se unosi, instalira ni gradi na serveru.

Admin lozinka za `/admin` je u `deploy/ENV-VALUES.txt` (samo kod Vas).

## Postavljanje (5 minuta)

1. **File Manager** → home folder (`/home/VAS_USER`, ne `public_html`) → **New Folder** → `instrukcije-app`.
2. Uđite u `instrukcije-app` → **Upload** `instrukcije-cpanel.zip` → desni klik na zip → **Extract** → obrišite zip.
   (Uključite *Settings → Show Hidden Files*, da vidite folder `.next`.)
3. **Setup Node.js App** → **Create Application**:
   - Node.js version: najviša dostupna (najmanje 22.13)
   - Application mode: Production
   - Application root: `instrukcije-app`
   - Application URL: `instrukcije.playworld.rs`
   - Application startup file: `app.js`
   - **Create**
4. Kliknite **Restart** i otvorite https://instrukcije.playworld.rs.

To je sve. Ne klikćite „Run NPM Install“ i ne dodajte promenljive okruženja.

Opciono: **SSL/TLS Status** → **Run AutoSSL** za `instrukcije.playworld.rs`, ako https još nije aktivan.

## Gde su podaci
Baza i uploadovane slike su u `instrukcije-app/data`. Ažuriranje ih ne dira (zip ne sadrži taj folder). Za bekap kopirajte `data`.

## Ažuriranje
1. Na računaru: `npm run build:cpanel` → novi `deploy/instrukcije-cpanel.zip`.
2. Upload u `instrukcije-app`, **Extract** (prepišite postojeće fajlove), obrišite zip.
3. Setup Node.js App → **Restart**.

## Problemi
- **Greška ili prazna stranica:** pogledajte `instrukcije-app/stderr.log`.
- **Prijava u admin ne radi:** lozinka je u `deploy/ENV-VALUES.txt`. Posle izmene fajla `config.env` uradite Restart.
- **Hosting nudi samo Node 20:** u cPanel Terminal-u: `source /home/VAS_USER/nodevenv/instrukcije-app/20/bin/activate && cd ~/instrukcije-app && npm install better-sqlite3 --no-save`, pa Restart.
- **Promena lozinke:** `npm run admin:hash -- "nova-lozinka"` na računaru, pa vrednost `ADMIN_PASSWORD_HASH=...` upišite u `config.env` na serveru i uradite Restart.
