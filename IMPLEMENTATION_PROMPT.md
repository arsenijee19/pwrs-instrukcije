# PlayWorld.rs — master implementacioni prompt za instrukcije.playworld.rs

> **Uloga:** Ponašaj se kao senior full-stack engineer, UX/UI designer, product designer i QA lead. Na osnovu ove specifikacije izgradi kvalitetnu, funkcionalnu, spremnu za produkciju veb-aplikaciju za kupce PlayWorld.rs. Ovo je implementacioni zadatak, ne samo zadatak pravljenja mockup-a. Nemoj menjati eksplicitno dogovorena poslovna pravila.
>
> **Domen:** https://instrukcije.playworld.rs  
> **Podrška:** https://support.playworld.rs  
> **Jezik javnog interfejsa:** srpski (latinica), jasno, kratko, ljubazno, na „Vi“.  
> **Izvor istine:** ovaj dokument + četiri originalna PDF uputstva navedena ispod + dve naknadno dostavljene PS5 slike (Your Information, Adjust Privacy Settings). Ako fizički PDF-ovi/slike nisu dostupni u radnom okruženju, nemoj se pretvarati da si ih obradio; traži izvorne fajlove ili ostavi jasno označene asset zadatke. Nemoj blokirati implementaciju ostatka aplikacije.

## 1. Cilj proizvoda

Zameniti dosadašnje statične PDF instrukcije intuitivnim, mobilnim, prezentacionim vodičem kroz aktivaciju PlayStation naloga. Kupac često drži telefon u ruci i prati instrukcije dok koristi konzolu. Zato je najvažnije da vidi **jedan korak, jednu jasnu sliku, jednu kratku akciju**, i dugmad „Nazad“ / „Sledeći korak“.

**Prioriteti:** (1) nemoguće je lako izabrati pogrešnu vrstu uputstva; (2) maksimalno jasan kritični PS5 GET STARTED korak; (3) ispravna Primary/Secondary podešavanja; (4) lako čitljive slike i upozorenja; (5) jednostavan admin panel za izmene bez programiranja. Nema složenog FAQ chatbota, razgranatog dijaloga, registracije kupaca, porudžbinskog formulara ili nepotrebnih efekata.

## 2. Ulazni UX — odmah pitati ono što kupac razume

**Prvi ekran i glavni naslov, bez marketinškog uvoda koji odlaže izbor:**
**„Koji tip naloga ste odabrali prilikom kupovine?“**

Ponudi četiri velika, mobilna, jasna izbora:

1. **PS4 — Igram sa svog naloga**  
   Manja oznaka: „PS4 Primary“
2. **PS4 — Igram sa dobijenog naloga**  
   Manja oznaka: „PS4 Secondary“
3. **PS5 — Igram sa svog naloga**  
   Manja oznaka: „PS5 Primary“
4. **PS5 — Igram sa dobijenog naloga**  
   Manja oznaka: „PS5 Secondary“

Ne očekuj da kupac zna šta znači „Primary/Secondary“. U karticama koristi ljudski opis i male ikonice PS4/PS5. U objašnjenju: „Sa svog naloga“ znači da preuzima sa dobijenog, a igra na svom profilu; „sa dobijenog naloga“ znači da preuzima i igra sa isporučenog naloga. Naglasi da kupac treba da izabere **tip koji je kupio**, ne onaj koji bi naknadno želeo.

**Drugo kratko pitanje:** „Šta ste kupili?“
- **Digitalnu igru** — preuzimate kupljenu igru sa dobijenog naloga.
- **PS Plus pretplatu** — pristup pretplati i preuzimanje dostupnih igara sa dobijenog naloga, uz pravila odgovarajućeg Primary/Secondary tipa.

Obe opcije vode u jednostavan, LINEARAN vodič, ali sa prilagođenim koracima pri kraju (pronalaženje igre naspram PS Plus kataloga). Ne tražiti naslov igre, mejl, lozinku, porudžbinu, serijski broj ili 2FA kod na sajtu.

**Treći ekran, pre aktivacije:** „Pravila korišćenja“, sa sažetim upozorenjima i punim tekstom pravila; jedan obavezni checkbox: „Pročitao/la sam i prihvatam pravila korišćenja.“ Dugme „Prihvatam i nastavljam“ onemogućeno dok checkbox nije označen. **Ne beležiti** ime, IP, broj porudžbine, datum/uređaj kao dokaz prihvatanja. Nema dodatne registracije. Prihvatanje je jednostavan UX uslov za ulazak u uputstvo.

Zatim jasan korak-po-korak prikaz. Na vrhu stalno vidljiva oznaka npr. „PS5 • Sa svog naloga“ i „Korak 4 od 13“, indikator napretka, uz mogućnost povratka na izbor naloga. Posle osvežavanja preglednika zapamti korak i izbor preko lokalnog storage-a, bez slanja ličnih podataka na server; ponudi „Kreni ispočetka“.

**Direktni URL-ovi:** podržati /ps4-primary, /ps4-secondary, /ps5-primary, /ps5-secondary (i eventualne query parametre za igru/pretplatu). Povezivanje iz isporuka i sa PlayWorld.rs treba da vodi na tačan vodič; direktni link i dalje treba da prikaže koja je vrsta naloga, izbor proizvoda ako nije poznat i checkbox pravila. Kanonski početni URL je https://instrukcije.playworld.rs.

## 3. Tokovi i poslovna pravila (NE MEŠATI)

| Vrsta | Izbor na prvom ekranu | Aktivacija / deljenje licence | Sa kog profila se igra | Internet |
|---|---|---|---|---|
| PS4 Primary | PS4 — Igram sa svog naloga | Aktivirati kao Primary PS4 / „Activate“ ili „Change to This PS4“ (zavisno od ekrana) | Sa ličnog profila | Nije obavezan za samo offline igranje prema dosadašnjim instrukcijama; pojedine online funkcije zahtevaju mrežu |
| PS4 Secondary | PS4 — Igram sa dobijenog naloga | „Do Not Activate“ / ne aktivirati kao Primary PS4 | Samo sa dobijenog naloga | Potreban |
| PS5 Primary | PS5 — Igram sa svog naloga | „Enable“ za Console Sharing and Offline Play | Sa ličnog profila | Nije obavezan za samo offline igranje prema dosadašnjim instrukcijama; pojedine online funkcije zahtevaju mrežu |
| PS5 Secondary | PS5 — Igram sa dobijenog naloga | **„Don't Enable“**, nikako „Enable“ za Console Sharing and Offline Play | Samo sa dobijenog naloga | Potreban |

**Svaka igra/PS Plus sadržaj prvo se pronalazi i započinje preuzimanje sa dobijenog naloga.** Primary kupac zatim prelazi na lični nalog i tamo igra; dobijeni nalog ostaje na konzoli. Secondary kupac koristi dobijeni nalog za preuzimanje i igranje; dobijeni nalog ostaje na konzoli. Ne dozvoliti da copy-paste tekst iz druge vrste naloga dovede do suprotnog uputstva.

Posebno: **PS5 Secondary.pdf ima grešku na strani 14**, gde su greškom ubačena Primary pravila („igrajte sa ličnog naloga“, „internet nije potreban“). To **nikako ne kopirati**. Ispravno je Secondary = **dobijeni nalog + ne uključivati Console Sharing + internet je potreban**; sam PDF na ranijoj strani objašnjava igranje sa dobijenog naloga.

## 4. PS5 — NAJVAŽNIJI ekran: GET STARTED

Ovaj korak mora biti zaseban, sa krupnim realnim screenshotom, oznakom „KRITIČNO“, izrazito jasnim vizuelnim označavanjem pravog izbora. Prikazuje se OBAVEZNO u obe PS5 putanje, pre unošenja podataka.

**Naslov:** „Obavezno izaberite GET STARTED“
**Primarni tekst:** „Izaberite **GET STARTED** (dodavanje korisnika na ovu PS5 konzolu).“
**Upozorenje:** „**NIKAKO ne birajte Sign In as Guest / Quick Play / Play as a One-Time Guest.** Tako se nalog neće trajno sačuvati na konzoli. Možete potrošiti jednokratni verifikacioni kod, pa ćete morati da kontaktirate našu podršku za novi.“
Vizuelno izdvojiti tačno dugme GET STARTED; pogrešnu opciju označiti jasnim znakom zabrane, bez prekrajanja značenja izvornog PS5 UI-ja. Dodatni link „Potreban mi je novi kod“ vodi na https://support.playworld.rs.
Ne skrivati upozorenje u sitnom tekstu. I na koraku „Add User“ jasno razlikovati „Add User“ od gosta.

## 5. Nedostajući PS5 koraci koje OBAVEZNO dodati

### 5.1 „Your Information“ — First Name / Last Name

Korisnik je dostavio referentnu sliku ekrana „Your Information“, sa poljima First name i Last name. Ovo je korak prve prijave, ne formular našeg sajta.

**Naslov:** „Popunite First Name i Last Name“
**Tekst:** „U oba polja unesite **bilo koji tekst** — nije neophodno da upisujete pravo ime i prezime. Važno je samo da polja ne ostanu prazna. Zatim izaberite Next.“
Ne zahtevati naziv kupljene igre. Primeri su opciono jednostavni (npr. „Play“ i „World“). Ovo početno popunjavanje kroz konzolni čarobnjak nije dozvola da kupac kasnije menja podatke naloga.

### 5.2 Privacy Settings / Limited Data Collection / Apply

Korisnik je dostavio screenshot „Adjust Privacy Settings by Choosing a Profile“ sa opcijama poput „Social and Open“, „Team Player“, „Friend Focused“, „Solo and Focused“ i „Customize Settings“.

**Naslov:** „Završite podešavanja privatnosti“
**Tekst:** „Odaberite ponuđenu opciju i potvrdite pritiskom na **X** na kontroleru. Nastavite da pritiskate X i pratite sledeće ekrane do završetka. Ako se pojavi **Apply**, izaberite Apply. Ako se pojavi korak **Limited Data Collection**, završite ga prema ponuđenim opcijama.“
Ne zahtevati specifičan privatni profil kada to nije poslovni uslov. Ne prikazivati ovo kao zasebnu autorizaciju da se u budućnosti menjaju podešavanja naloga. Tok i redosled mogu neznatno da zavise od verzije PS5 softvera; postojeće snimke koristiti kao referencu, bez nagađanja naziva dugmadi koji nisu na prikazanoj verziji.

### 5.3 Ponude dodatnih bezbednosnih podešavanja

Ako tokom inicijalnog PS5 podešavanja izađe ponuda za dodavanje broja telefona ili nova sigurnosna podešavanja, **ne dodavati telefon, ne menjati 2FA i ne menjati postavke za oporavak**. Na postojećem PDF screenshotu „Add Mobile Number“ postoji „Do This Later“; u odgovarajućoj varijanti uputiti kupca na **Do This Later**, bez nezavisnog menjanja naloga.

## 6. Osnovni sadržaj koraka — izvuci iz originalnih PDF-ova

**Izvorni dokumenti (ukupno četiri):**
- PS4 Primary.pdf — 13 strana
- PS4 Secondary.pdf — 13 strana
- PS5 Primary.pdf — 16 strana
- PS5 Secondary.pdf — 16 strana

PDF dokumenti sadrže stvarne screenshotove PlayStation ekrana, strelice, dosadašnji redosled koraka, uputstva za aktivaciju, opis preuzimanja igara/pretplata, pravila i garanciju. Koristi ih kao osnovu, **nemoj jednostavno prikazivati cele PDF stranice**. Izvuci deo ekrana konzole i dodaj čiste HTML naslove, tekstove, napomene i vizuelne markere kao nezavisne komponente.

**PS4 Primary/Secondary — potrebni koraci (odvojene pravilne varijante):**
1. Početni PS4 ekran — uključiti kontroler/PS dugme.
2. Izabrati „New User“.
3. Prihvatiti Sony sistemske uslove na konzoli („Accept“).
4. Izabrati „Sign In Manually“, ne kreirati nov nalog.
5. Uneti email i lozinku dobijene uz porudžbinu **direktno na konzoli**, ne na našem sajtu.
6. Ako je zatražena 2-Step Verification, uneti **jedan od isporučenih verifikacionih/backup kodova** iz poruke uz podatke za prijavu, direktno na konzoli. Kod može biti jednokratan; za problem ili novi kod kontaktirati podršku.
7. **PS4 Primary:** aktivirati konzolu („Activate“ ili „Change to This PS4“ ako je to ponuđena forma); **PS4 Secondary:** odabrati „Do Not Activate“, nikada ne aktivirati Primary na dobijenom nalogu.
8. Grananje isključivo po kupovini: **Igra** — Library / Purchased / pronaći kupljenu igru / započeti Download; **PS Plus** — ući u odgovarajuću PS Plus sekciju/katalog i započeti preuzimanje dostupne igre sa dobijenog naloga.
9. **Primary:** vratiti se na lični nalog, koristiti lični nalog za igranje; **Secondary:** ostati na dobijenom nalogu i igrati tamo.
10. Završni ekran i najvažnija pravila.

**PS5 Primary/Secondary — potrebni koraci (odvojene pravilne varijante):**
1. Na početnom ekranu otvoriti ikonu profila i „Switch User“.
2. Izabrati „Add User“.
3. **KRITIČNO:** „GET STARTED“; ne Guest / Quick Play (izdvojen ekran i upozorenje opisani gore).
4. Prihvatiti Sony sistemski ugovor ako se pojavi.
5. Ručno uneti email/lozinku iz isporuke na konzoli.
6. Uneti jedan isporučeni 2FA verifikacioni/backup kod kad ga PlayStation zatraži; ako nedostaje, podrška.
7. Dopunski ekran „Your Information“ — oba polja First Name / Last Name popuniti bilo kojim tekstom i Next (ako se pojavi).
8. „Privacy Settings“ / „Limited Data Collection“ / „Apply“ — pratiti ponuđene ekrane i potvrditi X (ako se pojavi).
9. **PS5 Primary:** Console Sharing and Offline Play → „Enable“; **PS5 Secondary:** „Don't Enable“. Korak izvući iz ispravne PDF slike odgovarajućeg tipa; upozorenje mora biti vidljivo.
10. Ako PS5 nudi dodavanje telefona ili menjanje sigurnosnih opcija — ne dodavati, odložiti („Do This Later“) kada je ponuđeno.
11. **Igra:** Game Library → Your Collection → pronaći kupljenu igru → Download. **PS Plus:** otvoriti PlayStation Plus/odgovarajući katalog, započeti preuzimanje sa dobijenog naloga.
12. **Primary:** preći na lični nalog i igrati sa njega; **Secondary:** igrati isključivo sa dobijenog naloga, uz internet.
13. Završni ekran i najvažnija pravila.

**Važno:** ovo je sadržajni raspored, ne tvrdnja da je broj/prisustvo svih Sony UI ekrana identično na svakoj verziji konzole. Za svaki PDF proveri tačan vizuelni redosled i prilagodi ga po tipu naloga. Možeš imati zasebne kratke slajdove za dodatne ekrane, ali nemoj unositi lažne nazive ili screenshotove.

## 7. Početna pravila korišćenja — predloženi korisnički tekst

Objaviti jasna pravila u ekran „Pravila korišćenja“, pre početka vodiča. Omogućiti administrativno uređivanje punog teksta. Zadrži jednostavan srpski, bez komplikovanog pravničkog tona.

1. **Zabranjeno je menjanje podataka dobijenog naloga**: email, lozinka, Online ID, postojeći profil i ostali podaci, osim izričitih koraka inicijalne aktivacije koje vodič traži (npr. popunjavanje First Name / Last Name ako se taj ekran pojavi).
2. **Zabranjeno je menjati bezbednosna podešavanja**: dodavanje broja telefona, uključivanje/isključivanje/menjanje 2FA, backup/recovery metoda, sigurnosnih kontakata i sličnog.
3. **Zabranjen je prenos ili prijava na drugoj konzoli bez prethodnog odobrenja PlayWorld podrške**; isto važi za ustupanje ili preprodaju naloga drugome bez odobrenja. Ne deliti podatke za pristup trećim licima bez odobrenja.
4. **Secondary:** strogo je zabranjeno uključiti Console Sharing and Offline Play (PS5) odnosno aktivirati dobijeni nalog kao Primary PS4 (PS4). **Primary:** sačuvati aktivaciju prema dobijenim instrukcijama; ne prebacivati/isključivati je samostalno.
5. **Ne brisati dobijeni nalog sa konzole** i ne uklanjati ga nakon preuzimanja igre.
6. **Ne menjati podešavanja licence/deljenja, podatke za plaćanje, ne obavljati neodobrene kupovine i ne menjati ništa što može poremetiti funkcionisanje ili pristup nalogu.**
7. **Poštovati razliku Primary/Secondary**: na Primary se igra sa ličnog naloga, na Secondary sa dobijenog; kod Secondary je potreban internet.
8. **Garancija i podrška:** PlayWorld pruža podršku u skladu sa uslovima kupovine; problemi uzrokovani kršenjem pravila ne spadaju u ugovorenu podršku/garanciju u meri dozvoljenoj zakonom. **Ne pisati apsolutno „nema reklamacije/povrata novca ni pod kojim uslovima“ i ne isključivati zakonska prava potrošača.** Konačnu pravnu verziju teksta proveriti pre produkcijskog objavljivanja.

Na javnom ekranu izdvojiti najvažnije 3–4 zabrane u lako čitljive kratke kartice, a pun tekst prikazati ispod. Checkbox i „Prihvatam i nastavljam“ su jedina neophodna interakcija. Pravila ponoviti kontekstualno na kritičnim koracima i sažeto na kraju.

## 8. Tipovi upozorenja

- **Informacija (neutralno/plavo):** sledeća obična akcija.
- **Važno (žuto):** šta ne preskočiti, npr. preuzimanje se pokreće sa dobijenog naloga, ispravan profil za igranje.
- **Kritično (crveno):** PS5 GET STARTED / nikad Guest; PS5 Secondary „Don't Enable“; PS4 Secondary „Do Not Activate“; zabrana menjanja podataka.

Bez modalnih dijaloga koji blokiraju svaki običan korak. Korak treba da bude čitljiv na prvi pogled.

## 9. Završni ekran — jasno ponavljanje pravila i kontakt za dodatni kod

Po završetku: naslov **„Uspešno ste završili instrukcije!“** (ne tvrditi da aplikacija tehnički zna da je PlayStation aktivacija uspela). Prikazati karticu za odabranu konzolu, tip i proizvod, uz dinamičan sažetak:
- Primary: „Preuzimajte sa dobijenog naloga, igrajte sa svog ličnog naloga. Dobijeni nalog ostaje na konzoli.“
- Secondary: „Preuzimajte i igrajte sa dobijenog naloga. Potrebna je internet konekcija. Ne uključujte Console Sharing/Primary aktivaciju.“
- Za PS Plus: „Igre iz pretplate preuzimajte sa dobijenog naloga; važe pravila izabranog tipa naloga.“
- Sve: „Ne menjajte podatke, 2FA ili broj telefona; ne prenosite nalog bez odobrenja; ne brišite nalog sa konzole.“

**Obavezno, jasno i klikabilno:**
**„Potreban Vam je dodatni verifikacioni kod ili pomoć? Javite nam se na support.playworld.rs.“**
Dugme/link direktno na https://support.playworld.rs (nije samo tekst). Ovaj kontakt vidljiv i na 2FA i GET STARTED koracima.
Na kraju ponuditi „Ponovi instrukcije“ i „Nazad na izbor naloga“.

## 10. Slike i AI dorada (obavezan kvalitet i vernost)

- Ekstraktovati screenshotove iz sva četiri PDF-a (ne koristiti svaku stranu PDF-a kao sliku vodiča). Originali su relativno male rezolucije, s dekorativnom pozadinom, brendiranjem, strelicama i praznim prostorom.
- Izdvojiti relevantni **realni ekran konzole**, uraditi poboljšanje rezolucije, redukciju šuma, pažljiv upscale/kontrast i poravnanje. **AI dorada/upscale je dozvoljena i poželjna** da materijal bude uredan.
- **Nikada ne menjati tekst Sony menija, raspored ili značenje opcija AI halucinacijom.** Ako algoritam pokvari slova, vratiti original ili napraviti istinit screenshot nove verzije. Svaku obrađenu sliku ručno vizuelno proveriti prema PDF izvoru.
- Strelice, okviri, markeri „Kliknite ovde“ i zabrane crtati kao čiste overlay komponente po mogućstvu u veb interfejsu ili kao kontrolisane SVG oznake, tako da cilj ostane tačan na mobilnom.
- Obavezno uključiti dve slike iz razgovora: „Your Information“ (First Name/Last Name) i „Adjust Privacy Settings by Choosing a Profile“ kao polazni materijal.
- Za „Limited Data Collection“ / „Apply“ ili drugi nedostajući ekran koristiti proverenu stvarnu referencu/screenshots (ili jasno označen privremeni placeholder uz tačan tekst). Ne stvarati lažni PS5 interfejs koji može odvesti kupca na pogrešnu opciju.
- Prilagoditi slike za mobilni pregled (čitljiv tekst, tap-to-zoom), kompresovati WebP/AVIF, responsive loading i alt opise.
- Napraviti mapiranje **svaki korak → originalni PDF + broj strane → obrađeni asset**. Originalne/obrađene resurse organizovati tako da se kasnije lako zamene u adminu.
- Ako izvorni PDF-ovi i dve dopunske slike nisu prisutni u repozitorijumu, jasno navesti koje fajlove treba dodati. Ne tvrditi da su slike obrađene dok nisu.

## 11. UX/UI dizajn

Stil: **moderan PlayStation × PlayWorld**, elegantan i premium, a ne kopija PSN interfejsa niti preterani Astro Bot crtež. Tamno plava/grafitna podloga, suptilni plavi i ljubičasti akcenti, odličan kontrast, lagane animacije bez ometanja. Jasan PlayWorld identitet i veza sa playworld.rs.

- **Mobile-first**, primarno 360–430 px širine, dobro radi i na desktopu.
- Kratka naslovna rečenica i jedna velika dominantna slika po koraku.
- Sticky / lako dostupne komande „Nazad“ i „Sledeći korak“; velik touch target.
- Progres „korak X od Y“ i vidljiva vrsta naloga; bez horizontalnog skrolovanja.
- Mobilni zoom screenshotova, pristupačnost (tastatura, fokus, alt, kontrast), skeleton pri učitavanju po potrebi.
- Vodič je **linearan**: bez veštački „interaktivnog“ pitanja „Šta vidite?“ i bez mogućnosti da kupac bira alternativne komplikovane putanje.
- Ne praviti veliki broj nepotrebnih modala, pop-upova, konfeta, zvukova ili animacija.
- Prevodi naziva dugmadi u tekstu uz očuvanje originalnih Sony oznaka: GET STARTED, Don't Enable, Enable, Apply itd.
- SEO: title/description, robots/sitemap po potrebi, ispravni share linkovi. Brzo učitavanje na mobilnoj mreži.

## 12. Administratorski panel

Ruta: **/admin** sa bezbednom autentifikacijom, ne javni editor. Administrator bez programiranja može:
- videti četiri tipa naloga i njihove sekvence;
- dodavati, menjati, brisati, sakrivati i prevlačenjem menjati redosled koraka;
- uređivati naziv, kratak opis, važnost/upozorenje, izbor proizvoda i sliku/overlay svakog koraka;
- uploadovati/menjati screenshotove i pregledati izgled pre objave;
- uređivati početna pravila i završne poruke/link podrške;
- objaviti ili sačuvati nacrt, uz osnovnu potvrdu pre destruktivnih promena.

Predložena šema: guide_type (ps4-primary, ps4-secondary, ps5-primary, ps5-secondary); purchase_type (game, ps_plus, both); steps (ordered, title, body, image, warning_level, warning_text, source_pdf, source_page, published); terms; app_settings. Može se napraviti jednostavniji normalizovan model ako je održiviji.

Administracija mora imati **server-side autorizaciju**, validaciju upload-a/tipa fajla, sanitizaciju HTML/Markdown unosa, zaštitu od CSRF/XSS, sigurne sesije i rate limiting prijave. Bez hardkodiranih lozinki i bez javnog write API-ja. Slike i koraci moraju trajno ostajati posle deploy-a.

**Tehnologija:** repozitorijum je u trenutku nastanka ovog prompta bio prazan. Slobodno izabrati moderan, održiv stack; dobra opcija je **Next.js (TypeScript) + Tailwind CSS + PostgreSQL/Prisma** ili tehnički adekvatna alternativa. Ne uvoditi više servisa od potrebnog. Obezbediti README, .env.example, jednostavno lokalno pokretanje i deploy dokumentaciju. Ne postavljati tajne u git.

## 13. Struktura sadržaja i arhitektura

- Razdvojiti **content/model** od rendering logike: četiri konfiguracije uputstava, zajednički delovi, specifične napomene.
- Ne duplirati desetine zajedničkih koraka gde je moguće deliti zajednički sadržaj, ali mora biti moguće nezavisno izmeniti korak po tipu naloga.
- Kontekst vodiča je kombinacija **4 vrste naloga × 2 vrste proizvoda = 8 validnih putanja**.
- Pri otvaranju direktnog URL-a ne prikazivati instrukcije drugog tipa.
- Klikabilni domeni: https://instrukcije.playworld.rs i https://support.playworld.rs; ne koristiti zastarele kontakte iz PDF-ova kao zamenu za novi support URL.
- **Nema prikupljanja** emailova, lozinki, 2FA kodova, recovery kodova niti registracije kupaca. Sve autentikacione podatke kupac unosi isključivo na svojoj konzoli. Eventualna analitika samo privatnosno primerena i nije uslov MVP-a.

## 14. Implementacioni plan (izvrši, ne samo opiši)

1. Pregledaj repo, odaberi minimalan odgovarajući stack, podigni aplikaciju i dizajn sistem.
2. Napravi landing stranicu sa **četiri velika razumljiva izbora**; zatim pitanje Igra/PS Plus; zatim pregled pravila/checkbox.
3. Implementiraj svih osam kompletnih linearnih vodiča i sačuvani progres, uz bezbedno razdvajanje pravila.
4. Izdvoji i poboljšaj slike iz PDF-ova, ukoliko su dostupni, i dodaj tačno pozicionirane oznake.
5. Posebno implementiraj PS5 GET STARTED, First/Last Name, Privacy i dodatni kod/support.
6. Dodaj admin panel sa trajnom bazom/smeštajem slika i bezbednom autentifikacijom.
7. Testiraj na mobilnom (i desktopu), proveri slike, upozorenja, posebne rute, direktne linkove i brzinu.
8. Dokumentuj lokalno pokretanje, environment, administraciju, uređivanje koraka i produkcijski deploy.

## 15. Acceptance criteria — NE SMATRAJ GOTOVIM BEZ PROVERE

- [ ] Po otvaranju homepage-a prvo se vidi pitanje **„Koji tip naloga ste odabrali prilikom kupovine?“** i četiri razumljive opcije.
- [ ] Opcije jasno razlikuju PS4/PS5 i „igram sa svog“/„igram sa dobijenog“; Primary/Secondary su pomoćne oznake.
- [ ] Kupac bira „Digitalnu igru“ ili „PS Plus pretplatu“; dalje vidi samo relevantne završne korake.
- [ ] Pravila su PRE aktivacije i checkbox je potreban za „Nastavi“; bez prikupljanja kupčevih podataka ili evidencije o prihvatanju.
- [ ] Sva četiri vodiča imaju krupne stvarne screenshotove, čitljiv tekst, Napred/Nazad, progres i nastavak započetog vodiča.
- [ ] **PS5 Primary i Secondary** imaju zaseban, izuzetno vidljiv **GET STARTED, nikad Guest/Quick Play** korak i objašnjenje rizika jednokratnog koda.
- [ ] PS5 ima korak First Name/Last Name: **bilo koji tekst u oba polja**, ne zahtevati naziv igre.
- [ ] PS5 ima Privacy / Limited Data Collection / X / Apply u skladu sa ekranom koji se pojavi.
- [ ] PS5 Primary = **Enable**, PS5 Secondary = **Don't Enable** za Console Sharing.
- [ ] PS4 Primary = **Activate**, PS4 Secondary = **Do Not Activate** kao Primary PS4.
- [ ] Primary = igranje sa LIČNOG; Secondary = igranje sa DOBIJENOG i potreban internet.
- [ ] Greška u starom **PS5 Secondary.pdf, str. 14** je korigovana; nijedan UI tekst ne prenosi tu grešku.
- [ ] Ne sugeriše se dodavanje telefona, promena 2FA, emaila ili lozinke, niti brisanje isporučenog naloga.
- [ ] Na kraju svakog od osam tokova postoji **klikabilan i upadljiv** link **https://support.playworld.rs** za **dodatni verifikacioni kod** ili pomoć; isti link dostupan na 2FA i GET STARTED koracima.
- [ ] Admin panel stvarno radi (login, CRUD, promene redosleda, upload slike, objavljivanje) i podaci ostaju trajno sačuvani.
- [ ] Vizuelno profesionalan PlayStation-inspirisan izgled, mobilno odlično čitljiv, pristupačan, brz.
- [ ] AI-upscale ne menja sadržaj Sony dugmadi/menija; svaki screenshot proveren prema izvoru.
- [ ] README/.env.example/produkcijske instrukcije postoje; nema tajni u repozitorijumu.

## 16. Odgovor implementacionog agenta

Po završetku prikaži šta je napravljeno, gde se pokreće, uputstvo za admin pristup bez odavanja kredencijala, šta je pokriveno testovima, i **posebno spisak screenshotova koji su stvarno obrađeni naspram onih za koje originali nisu bili dostupni**. Ako nešto iz specifikacije nije ispunjeno, transparentno navedi preostali zadatak — ne označavaj ga kao završeno.

---

### Poreklo specifikacije

Ovaj prompt konsoliduje čitav razgovor o PlayWorld uputstvima, četiri isporučena PDF-a i dve slike dodatih PS5 koraka. Konačne odluke vlasnika projekta: **četiri vrste naloga; izbor razumljiv kupcu odmah na početku; izbor igra ili PS Plus; jednostavan checkbox; linearni koraci bez dijaloga; admin panel; moderan PlayStation vizuelni stil; AI dorada originalnih screenshotova; PS5 GET STARTED je apsolutni prioritet; na First/Last Name dovoljno je uneti bilo šta; Privacy može da se prođe uz X/Apply; za dodatni kod uvek uputiti na support.playworld.rs.**
