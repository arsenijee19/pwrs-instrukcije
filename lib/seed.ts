import manifest from "../content/assets-manifest.json";
import type { Lang } from "./i18n";
import type { Content, GuideType, Marker, Step, StepImage } from "./types";

type AssetName = keyof typeof manifest;

type Pos = Omit<Marker, "id" | "label"> & { label?: string };
function img(name: AssetName, alt: string, markers?: Pos[], caption = ""): StepImage {
  const m = manifest[name];
  const list: Pos[] = markers ?? ((m as { markers?: Pos[] }).markers ?? []);
  return {
    src: m.src, w: m.w, h: m.h, alt, caption,
    ...((m as { maxW?: number }).maxW ? { maxW: (m as { maxW?: number }).maxW } : {}),
    markers: list.map((k, i) => ({ id: `${name}-m${i}`, label: "", ...k })),
  };
}
const pdfOf = (name: AssetName) => ({ sourcePdf: manifest[name].pdf, sourcePage: manifest[name].page });

function step(id: string, p: Partial<Step> & Pick<Step, "title" | "body">): Step {
  return {
    id, kind: "step", purchase: "both", images: [], level: "none", warning: "", support: false,
    published: true, sourcePdf: "", sourcePage: null, placeholder: "", ...p,
  };
}

const SUPPORT = "https://support.playworld.rs";

/* ------------------------------------------------------------------ PS4 */
type X = (sr: string, en: string) => string;
const mk = (lang: Lang): X => (sr, en) => (lang === "en" ? en : sr);

function ps4(kind: "primary" | "secondary", lang: Lang): Step[] {
  const x = mk(lang);
  const P = kind === "primary";
  const t = (s: string) => `ps4-${kind}-${s}`;
  const KEEP = x(
    "Molimo Vas da podatke dobijenog naloga ostavite nepromenjenim. Promena email adrese, lozinke ili drugih podešavanja može uticati na pristup kupljenim igrama i pravilno funkcionisanje naloga.",
    "Please leave the details of the account you received unchanged. Changing the email address, password or other settings may affect access to the games you purchased and the proper functioning of the account.");
  const CODE_HELP = x(
    "Ukoliko nijedan od dostavljenih verifikacionih kodova ne funkcioniše ili ste iskoristili sve dostupne kodove, slobodno kontaktirajte našu podršku. Naš tim će Vam pomoći da dobijete novi kod i nastavite aktivaciju.",
    "If none of the verification codes we sent you work, or you have used all of the available codes, please contact our support team. We will help you get a new code and continue the activation.");
  const CODE_BODY = x(
    "Konzola može da zatraži kod za dodatnu proveru identiteta (2-step verification).\n\nU poruci koju ste dobili od nas, ispod podataka za prijavu, nalazi se nekoliko verifikacionih kodova. Upišite bilo koji **jedan** od njih. Kod unosite direktno na konzoli.",
    "The console may ask for a code for an additional identity check (2-step verification).\n\nIn the message we sent you, below the sign-in details, you will find several verification codes. Enter any **one** of them. You enter the code directly on the console.");
  const SIGN_IN_BODY = x(
    "U polja koja se prikažu upišite email adresu i lozinku iz poruke koju ste dobili uz porudžbinu, a zatim izaberite **Sign In**.\n\nPodatke za prijavu upisujete isključivo na konzoli, a ne na ovom sajtu.",
    "In the fields that appear, enter the email address and password from the message you received with your order, then select **Sign In**.\n\nYou enter the sign-in details only on the console, never on this website.");
  const ACC = x("naloga koji ste dobili od nas", "the account we sent you");
  return [
    step(t("power"), {
      title: x("Uključite konzolu i kontroler", "Turn on the console and the controller"),
      body: x("Uključite PS4 konzolu, a zatim pritisnite dugme sa PlayStation znakom na sredini kontrolera. Time povezujete kontroler sa konzolom i možete da nastavite sa podešavanjem.",
        "Turn on your PS4 console, then press the button with the PlayStation logo in the middle of the controller. This connects the controller to the console so you can continue with the setup."),
      images: [img("ps4-power", "PS4 home screen: Press the PS button to use the controller")],
      ...pdfOf("ps4-power"),
    }),
    step(t("new-user"), {
      title: x("Izaberite opciju New User", "Select the New User option"),
      body: x("Na ekranu na kome konzola pita ko koristi kontroler izaberite opciju **New User** (znak plus).\n\nOva opcija Vam omogućava da dodate nalog koji ste dobili od nas. Nije potrebno da samostalno kreirate novi PlayStation nalog.",
        "On the screen where the console asks who is using the controller, select **New User** (the plus sign).\n\nThis option lets you add the account we sent you. You do not need to create a new PlayStation account yourself."),
      images: [img("ps4-new-user", "PS4 user selection screen, New User option")],
      ...pdfOf("ps4-new-user"),
    }),
    step(t("agreement"), {
      title: x("Prihvatite uslove korišćenja", "Accept the terms of use"),
      body: x("Konzola će prikazati Sony ugovor o korišćenju na engleskom jeziku. Da biste nastavili, izaberite opciju **Accept**.",
        "The console will show Sony's user agreement. To continue, select **Accept**."),
      images: [img("ps4-agreement", "PS4 User Agreement, Accept button")],
      ...pdfOf("ps4-agreement"),
    }),
    step(t("sign-in-manually"), {
      title: x("Izaberite opciju Sign In Manually", "Select the Sign In Manually option"),
      body: x("Na sledećem ekranu izaberite opciju **Sign In Manually**, kojom se prijavljujete ručnim upisom email adrese i lozinke.\n\nMolimo Vas da ne birate opciju Create an Account, jer nalog već imate.",
        "On the next screen, select **Sign In Manually**, which lets you sign in by typing your email address and password.\n\nPlease do not select Create an Account, because you already have an account."),
      images: [img("ps4-sign-in-manually", "PS4 Sign In to PlayStation Network, Sign In Manually option")],
      ...pdfOf("ps4-sign-in-manually"),
    }),
    step(t("sign-in"), {
      title: x("Upišite podatke za prijavu", "Enter your sign-in details"),
      body: SIGN_IN_BODY, level: "critical", warning: KEEP,
      images: [img("ps4-sign-in-form", "PS4 sign-in form: Sign-In ID and Password fields")],
      ...pdfOf("ps4-sign-in-form"),
    }),
    step(t("2fa"), {
      title: x("Upišite verifikacioni kod", "Enter the verification code"),
      body: CODE_BODY, level: "important", warning: CODE_HELP, support: true,
      images: [img("ps4-2step", "PS4 2-step verification screen, Enter Code field")],
      ...pdfOf("ps4-2step"),
    }),
    P
      ? step(t("activate"), {
          title: x("Aktivirajte konzolu kao Primary PS4", "Activate the console as your Primary PS4"),
          body: x("Konzola će Vas pitati da li želite da ovaj nalog aktivirate kao glavni (Primary) na ovoj konzoli. Izaberite opciju **Activate**.\n\nUkoliko se prikaže ekran „Activate as Your Primary PS4“, izaberite opciju **Change to This PS4**.",
            "The console will ask whether you want to activate this account as the main (Primary) one on this console. Select **Activate**.\n\nIf the \"Activate as Your Primary PS4\" screen appears, select **Change to This PS4**."),
          level: "important",
          warning: x("Ovaj korak je potreban kako biste igre kasnije mogli da igrate sa svog ličnog profila.", "This step is required so that you can later play games from your own personal profile."),
          images: [img("ps4-activate-primary", "PS4 Activate as Your Primary PS4, Change to This PS4 button")],
          ...pdfOf("ps4-activate-primary"),
        })
      : step(t("do-not-activate"), {
          title: x("Izaberite opciju Do Not Activate", "Select the Do Not Activate option"),
          body: x("Konzola će Vas pitati da li želite da aktivirate ovaj nalog kao glavni (Primary) PS4. Na prikazanom ekranu potrebno je da izaberete opciju **Do Not Activate**.",
            "The console will ask whether you want to activate this account as the main (Primary) PS4. On the screen shown, you need to select **Do Not Activate**."),
          level: "critical",
          warning: x("Ovo je veoma važno za Vaš tip naloga. Molimo Vas da NIKADA ne birate opciju Activate, jer aktivacija opcije Primary može uticati na njegovo pravilno funkcionisanje.",
            "This is very important for your account type. Please NEVER select Activate, because activating the Primary option can affect the proper functioning of the account."),
          images: [img("ps4-activate-secondary", "PS4 activation screen, Do Not Activate button")],
          ...pdfOf("ps4-activate-secondary"),
        }),
    step(t("download-game"), {
      purchase: "game",
      title: x("Pronađite kupljenu igru i pokrenite preuzimanje", "Find the game you bought and start the download"),
      body: x("Ostanite prijavljeni na nalog koji ste dobili od nas. Otvorite **Library**, zatim izaberite **Purchased**.\n\nU listi pronađite igru koju ste kupili i izaberite **Download** da biste pokrenuli preuzimanje.",
        "Stay signed in to the account we sent you. Open **Library**, then select **Purchased**.\n\nFind the game you bought in the list and select **Download** to start the download."),
      level: "important",
      warning: x("Preuzimanje igre se uvek pokreće sa naloga koji ste dobili od nas.", "The game is always downloaded from the account we sent you."),
      images: [
        img("ps4-library-start", "PS4 home menu, Library icon"),
        img("ps4-library-purchased", "PS4 Library, Purchased category"),
      ],
      sourcePdf: "PS4 Primary.pdf", sourcePage: 9,
    }),
    step(t("download-plus"), {
      purchase: "ps_plus",
      title: x("Otvorite PlayStation Plus i preuzmite igru", "Open PlayStation Plus and download a game"),
      body: x("Ostanite prijavljeni na nalog koji ste dobili od nas. Otvorite **PlayStation Plus** i uđite u katalog igara.\n\nIzaberite igru koju želite da igrate i pokrenite **Download**.", "Stay signed in to the account we sent you. Open **PlayStation Plus** and enter the game catalog.\n\nChoose the game you want to play and start **Download**.") +
        (P ? x("\n\nČim preuzimanje počne, možete da pređete na svoj lični nalog dok se igra preuzima.", "\n\nAs soon as the download starts, you can switch to your own account while the game downloads.")
           : x("\n\nKada se preuzimanje završi, igru pokrećete sa istog naloga.", "\n\nWhen the download is finished, you launch the game from the same account.")),
      level: "important",
      warning: x("Igre iz pretplate se uvek preuzimaju sa naloga koji ste dobili od nas.", "Games from the subscription are always downloaded from the account we sent you."),
      images: [
        img("ps4-psplus-bar", "PS4 main menu, PlayStation Plus icon"),
        img("ps4-psplus-home", "PS4 home screen"),
      ],
      sourcePdf: "PS4 Primary.pdf", sourcePage: 10,
    }),
    P
      ? step(t("play"), {
          title: x("Pređite na svoj lični nalog i igrajte", "Switch to your own account and play"),
          body: x("Kada se igra preuzme, prebacite se na **svoj lični profil** i igrajte sa njega.\n\n- Nalog koji ste dobili od nas ostaje na konzoli i nije potrebno da ga brišete.\n- Na taj nalog se vraćate samo ukoliko je potrebno ponovo preuzeti igru.\n- Za igranje internet konekcija nije obavezna, ali je potrebna za online funkcije.",
            "When the game has downloaded, switch to **your own personal profile** and play from it.\n\n- The account we sent you stays on the console and you do not need to delete it.\n- You only go back to that account if you need to download the game again.\n- An internet connection is not required to play, but it is needed for online features."),
          level: "important",
          warning: x("Nalog koji ste dobili od nas služi isključivo za preuzimanje. Igru igrate sa svog ličnog naloga.", "The account we sent you is used only for downloading. You play the game from your own account."),
          sourcePdf: "PS4 Primary.pdf", sourcePage: 11,
        })
      : step(t("play"), {
          title: x("Igrajte sa naloga koji ste dobili od nas", "Play from the account we sent you"),
          body: x("Kada se igra preuzme, igrajte je **sa istog naloga** sa kog ste je preuzeli.\n\n- Nalog koji ste dobili ne brišite sa konzole.\n- Za igranje je **potrebna internet konekcija**.\n- Nalog nemojte aktivirati kao Primary PS4.",
            "When the game has downloaded, play it **from the same account** you downloaded it from.\n\n- Do not delete the account you received from the console.\n- An **internet connection is required** to play.\n- Do not activate the account as a Primary PS4."),
          level: "important",
          warning: x("Za Vaš tip naloga igra se pokreće sa naloga koji ste dobili od nas, a ne sa ličnog profila.", "For your account type the game is launched from the account we sent you, not from your personal profile."),
          sourcePdf: "PS4 Secondary.pdf", sourcePage: 11,
        }),
    step(t("final"), { kind: "final", title: x("Kraj", "Done"), body: "", support: true }),
  ];
}

function ps5(kind: "primary" | "secondary", lang: Lang): Step[] {
  const x = mk(lang);
  const P = kind === "primary";
  const t = (s: string) => `ps5-${kind}-${s}`;
  const KEEP = x(
    "Molimo Vas da podatke dobijenog naloga ostavite nepromenjenim. Promena email adrese, lozinke ili drugih podešavanja može uticati na pristup kupljenim igrama i pravilno funkcionisanje naloga.",
    "Please leave the details of the account you received unchanged. Changing the email address, password or other settings may affect access to the games you purchased and the proper functioning of the account.");
  const CODE_HELP = x(
    "Ukoliko nijedan od dostavljenih verifikacionih kodova ne funkcioniše ili ste iskoristili sve dostupne kodove, slobodno kontaktirajte našu podršku. Naš tim će Vam pomoći da dobijete novi kod i nastavite aktivaciju.",
    "If none of the verification codes we sent you work, or you have used all of the available codes, please contact our support team. We will help you get a new code and continue the activation.");
  const CODE_BODY = x(
    "Konzola traži kod za dodatnu proveru identiteta (2-Step Verification).\n\nU poruci koju ste dobili od nas, ispod podataka za prijavu, nalazi se nekoliko verifikacionih kodova. Upišite bilo koji **jedan** od njih. Kod unosite direktno na konzoli.",
    "The console asks for a code for an additional identity check (2-Step Verification).\n\nIn the message we sent you, below the sign-in details, you will find several verification codes. Enter any **one** of them. You enter the code directly on the console.");
  const SIGN_IN_BODY = x(
    "U polja koja se prikažu upišite email adresu i lozinku iz poruke koju ste dobili uz porudžbinu, a zatim izaberite **Sign In**.\n\nPodatke za prijavu upisujete isključivo na konzoli, a ne na ovom sajtu.",
    "In the fields that appear, enter the email address and password from the message you received with your order, then select **Sign In**.\n\nYou enter the sign-in details only on the console, never on this website.");
  return [
    step(t("switch-user"), {
      title: x("Otvorite profil i izaberite Switch User", "Open your profile and select Switch User"),
      body: x("Na početnom ekranu konzole izaberite sličicu profila u gornjem desnom uglu. Otvoriće se meni u kome treba da izaberete opciju **Switch User**.",
        "On the console home screen, select the profile picture in the top right corner. A menu will open, where you need to select **Switch User**."),
      images: [
        img("ps5-profile-icon", "PS5 home screen, profile icon at the top right"),
        img("ps5-switch-user", "PS5 profile menu, Switch User option"),
      ],
      sourcePdf: "PS5 Primary.pdf", sourcePage: 2,
    }),
    step(t("add-user"), {
      title: x("Izaberite opciju Add User", "Select the Add User option"),
      body: x("Na ekranu „Welcome Back to PlayStation“ izaberite krug sa znakom plus, odnosno opciju **Add User**.",
        "On the \"Welcome Back to PlayStation\" screen, select the circle with the plus sign, which is the **Add User** option."),
      level: "important",
      warning: x("Molimo Vas da izaberete Add User, a ne prijavu kao gost.", "Please select Add User, not a guest sign-in."),
      images: [img("ps5-welcome-add-user", "PS5 Welcome Back to PlayStation, Add User option")],
      ...pdfOf("ps5-welcome-add-user"),
    }),
    step(t("get-started"), {
      title: x("Obavezno izaberite GET STARTED", "You must select GET STARTED"),
      body: x("Izaberite opciju **GET STARTED** (dodavanje korisnika na ovu PS5 konzolu).\n\nNa taj način se nalog trajno čuva na konzoli i ostaje dostupan i nakon gašenja ili restartovanja.",
        "Select **GET STARTED** (adding a user to this PS5 console).\n\nThis way the account is saved permanently on the console and stays available even after shutting down or restarting."),
      level: "critical",
      warning: x("Molimo Vas da NIKAKO ne birate opcije Sign In and Play, Quick Play ni Play as a One-Time Guest. Tada se nalog neće trajno sačuvati na konzoli, a može se potrošiti i jednokratni verifikacioni kod, zbog čega bi Vam bio potreban novi od naše podrške.",
        "Please do NOT select Sign In and Play, Quick Play or Play as a One-Time Guest. In that case the account will not be saved on the console, and a one-time verification code may be used up, so you would need a new one from our support."),
      support: true,
      images: [img("ps5-get-started", "PS5 Add User screen: Get Started is the correct choice, Guest and Quick Play are wrong")],
      ...pdfOf("ps5-get-started"),
    }),
    step(t("license"), {
      title: x("Prihvatite Sony ugovor", "Accept the Sony agreement"),
      body: x("Ukoliko se prikaže ugovor o korišćenju sistemskog softvera (License Agreement), označite polje **I Agree**, a zatim izaberite **Confirm**.\n\nAko se ovaj ekran ne pojavi, jednostavno nastavite na sledeći korak.",
        "If the system software License Agreement appears, tick **I Agree**, then select **Confirm**.\n\nIf this screen does not appear, simply continue to the next step."),
      images: [img("ps5-license", "PS5 System Software License Agreement, I Agree and Confirm")],
      ...pdfOf("ps5-license"),
    }),
    step(t("sign-in"), {
      title: x("Upišite podatke za prijavu", "Enter your sign-in details"),
      body: SIGN_IN_BODY + x("\n\nMolimo Vas da ne birate opciju Create an Account, jer nalog već imate.", "\n\nPlease do not select Create an Account, because you already have an account."),
      level: "critical", warning: KEEP,
      images: [img("ps5-sign-in", "PS5 Sign In screen, Sign-in ID and Password fields")],
      ...pdfOf("ps5-sign-in"),
    }),
    step(t("2fa"), {
      title: x("Upišite verifikacioni kod", "Enter the verification code"),
      body: CODE_BODY, level: "important", warning: CODE_HELP, support: true,
      images: [img("ps5-2step", "PS5 2-Step Verification, Verification code field")],
      ...pdfOf("ps5-2step"),
    }),
    step(t("your-information"), {
      title: x("Popunite First Name i Last Name", "Fill in First Name and Last Name"),
      body: x("Ukoliko se prikaže ekran **Your Information**, konzola traži ime i prezime.\n\nU oba polja možete upisati **bilo koji tekst**, na primer „Play“ i „World“. Nije potrebno da unosite pravo ime i prezime, važno je samo da polja ne ostanu prazna. Zatim izaberite **Next**.",
        "If the **Your Information** screen appears, the console asks for a first and last name.\n\nIn both fields you can enter **any text**, for example \"Play\" and \"World\". You do not need to enter your real name, it is only important that the fields are not left empty. Then select **Next**."),
      level: "info",
      warning: x("Ovo je uobičajeni deo prve prijave na konzoli. Ostale podatke naloga i dalje ne menjate.", "This is a normal part of the first sign-in on a console. You still do not change any other account details."),
      images: [img("ps5-your-information", "PS5 Your Information screen with First name and Last name fields")],
      ...pdfOf("ps5-your-information"),
    }),
    step(t("privacy"), {
      title: x("Završite podešavanja privatnosti", "Complete the privacy settings"),
      body: x("Konzola će ponuditi nekoliko profila privatnosti. Izaberite bilo koji od ponuđenih i potvrdite pritiskom na dugme **X** na kontroleru. Nastavite da pritiskate **X** i pratite sledeće ekrane do kraja.\n\nUkoliko se pojavi **Apply**, izaberite **Apply**. Ako se prikaže korak **Limited Data Collection**, završite ga prema ponuđenim opcijama.",
        "The console will offer several privacy profiles. Choose any of them and confirm by pressing the **X** button on the controller. Keep pressing **X** and follow the next screens to the end.\n\nIf **Apply** appears, select **Apply**. If a **Limited Data Collection** step appears, complete it using the options offered."),
      level: "info",
      warning: x("Redosled ekrana može se neznatno razlikovati u zavisnosti od verzije softvera konzole. Pratite ono što je prikazano na Vašem ekranu.", "The order of the screens may differ slightly depending on your console software version. Simply follow what is shown on your screen."),
      images: [img("ps5-privacy-profiles", "PS5 Adjust Privacy Settings by Choosing a Profile: Social and Open, Team Player, Friend Focused, Solo and Focused, Customize Settings")],
      ...pdfOf("ps5-privacy-profiles"),
    }),
    P
      ? step(t("console-sharing"), {
          title: x("Console Sharing and Offline Play: izaberite Enable", "Console Sharing and Offline Play: select Enable"),
          body: x("Konzola će Vas pitati da li želite da uključite opciju **Console Sharing and Offline Play**. Na prikazanom ekranu izaberite **Enable**.",
            "The console will ask whether you want to turn on **Console Sharing and Offline Play**. On the screen shown, select **Enable**."),
          level: "important",
          warning: x("Za Vaš tip naloga ova opcija mora biti uključena kako biste igre mogli da igrate sa svog ličnog profila. Molimo Vas da je kasnije ne isključujete.",
            "For your account type this option must be turned on so that you can play games from your own personal profile. Please do not turn it off later."),
          images: [img("ps5-console-sharing-primary", "PS5 Console Sharing and Offline Play, Enable button")],
          ...pdfOf("ps5-console-sharing-primary"),
        })
      : step(t("console-sharing"), {
          title: x("Console Sharing and Offline Play: izaberite Don't Enable", "Console Sharing and Offline Play: select Don't Enable"),
          body: x("Konzola će Vas pitati da li želite da uključite opciju **Console Sharing and Offline Play**. Na prikazanom ekranu potrebno je da izaberete **Don't Enable**.",
            "The console will ask whether you want to turn on **Console Sharing and Offline Play**. On the screen shown, you need to select **Don't Enable**."),
          level: "critical",
          warning: x("Ovo je veoma važno za Vaš tip naloga. Molimo Vas da NIKAKO ne birate opciju Enable, jer uključivanje Console Sharing opcije može uticati na pravilno funkcionisanje naloga.",
            "This is very important for your account type. Please do NOT select Enable, because turning on Console Sharing can affect the proper functioning of the account."),
          images: [img("ps5-console-sharing-secondary", "PS5 Console Sharing and Offline Play, Don't Enable button")],
          ...pdfOf("ps5-console-sharing-secondary"),
        }),
    step(t("do-this-later"), {
      title: x("Preskočite ponude za dodatnu zaštitu", "Skip the offers for additional protection"),
      body: x("Tokom podešavanja konzola može ponuditi dodatne opcije zaštite naloga. Molimo Vas da ništa od toga ne uključujete.\n\n- Ako se prikaže **Secure Your Account**, izaberite **OK**.\n- Ako se prikaže **Add Mobile Number**, izaberite **Do This Later**.",
        "During setup the console may offer additional account protection options. Please do not turn any of them on.\n\n- If **Secure Your Account** appears, select **OK**.\n- If **Add Mobile Number** appears, select **Do This Later**."),
      level: "important",
      warning: x("Molimo Vas da ne dodajete broj telefona, ne menjate podešavanja 2FA i ne unosite dodatne podatke za oporavak naloga.",
        "Please do not add a phone number, do not change the 2FA settings and do not enter any additional account recovery details."),
      images: [
        img("ps5-secure-account", "PS5 Secure Your Account, OK button"),
        img("ps5-add-mobile", "PS5 Add Mobile Number, Do This Later option"),
      ],
      sourcePdf: "PS5 Primary.pdf", sourcePage: 11,
    }),
    step(t("download-game"), {
      purchase: "game",
      title: x("Pronađite kupljenu igru i pokrenite preuzimanje", "Find the game you bought and start the download"),
      body: x("Ostanite prijavljeni na nalog koji ste dobili od nas. Otvorite **Game Library**, zatim **Your Collection**.\n\nPronađite igru koju ste kupili i izaberite **Download** da biste pokrenuli preuzimanje.",
        "Stay signed in to the account we sent you. Open **Game Library**, then **Your Collection**.\n\nFind the game you bought and select **Download** to start the download."),
      level: "important",
      warning: x("Preuzimanje igre se uvek pokreće sa naloga koji ste dobili od nas.", "The game is always downloaded from the account we sent you."),
      images: [
        img("ps5-home-library", "PS5 home screen, Game Library icon"),
        img("ps5-game-library", "PS5 Game Library, Your Collection tab"),
        img("ps5-game-download", "PS5 game page, Download button"),
      ],
      sourcePdf: "PS5 Primary.pdf", sourcePage: 12,
    }),
    step(t("download-plus"), {
      purchase: "ps_plus",
      title: x("Otvorite PlayStation Plus i preuzmite igru", "Open PlayStation Plus and download a game"),
      body: x("Ostanite prijavljeni na nalog koji ste dobili od nas. Otvorite **PlayStation Plus** i uđite u katalog igara.\n\nIzaberite igru koju želite da igrate i pokrenite **Download**.", "Stay signed in to the account we sent you. Open **PlayStation Plus** and enter the game catalog.\n\nChoose the game you want to play and start **Download**.") +
        (P ? x("\n\nČim preuzimanje počne, možete da pređete na svoj lični nalog dok se igra preuzima.", "\n\nAs soon as the download starts, you can switch to your own account while the game downloads.")
           : x("\n\nKada se preuzimanje završi, igru pokrećete sa istog naloga.", "\n\nWhen the download is finished, you launch the game from the same account.")),
      level: "important",
      warning: x("Igre iz pretplate se uvek preuzimaju sa naloga koji ste dobili od nas.", "Games from the subscription are always downloaded from the account we sent you."),
      images: [
        img("ps5-psplus-tile", "PS5 home screen, PlayStation Plus icon"),
        img("ps5-psplus-catalog", "PS5 PlayStation Plus game catalog"),
      ],
      sourcePdf: "PS5 Primary.pdf", sourcePage: 13,
    }),
    P
      ? step(t("play"), {
          title: x("Pređite na svoj lični nalog i igrajte", "Switch to your own account and play"),
          body: x("Kada se igra preuzme, prebacite se na **svoj lični profil** i igrajte sa njega.\n\n- Nalog koji ste dobili od nas ostaje na konzoli i nije potrebno da ga brišete.\n- Na taj nalog se vraćate samo ukoliko je potrebno ponovo preuzeti igru.\n- Za igranje internet konekcija nije obavezna, ali je potrebna za online funkcije.",
            "When the game has downloaded, switch to **your own personal profile** and play from it.\n\n- The account we sent you stays on the console and you do not need to delete it.\n- You only go back to that account if you need to download the game again.\n- An internet connection is not required to play, but it is needed for online features."),
          level: "important",
          warning: x("Nalog koji ste dobili od nas služi isključivo za preuzimanje. Igru igrate sa svog ličnog naloga.", "The account we sent you is used only for downloading. You play the game from your own account."),
          sourcePdf: "PS5 Primary.pdf", sourcePage: 14,
        })
      : step(t("play"), {
          title: x("Igrajte sa naloga koji ste dobili od nas", "Play from the account we sent you"),
          body: x("Kada se igra preuzme, igrajte je **sa istog naloga** sa kog ste je preuzeli.\n\n- Nalog koji ste dobili ne brišite sa konzole.\n- Za igranje je **potrebna internet konekcija**.\n- Opciju Console Sharing and Offline Play nemojte uključivati.",
            "When the game has downloaded, play it **from the same account** you downloaded it from.\n\n- Do not delete the account you received from the console.\n- An **internet connection is required** to play.\n- Do not turn on Console Sharing and Offline Play."),
          level: "important",
          warning: x("Za Vaš tip naloga igra se pokreće sa naloga koji ste dobili od nas, a ne sa ličnog profila.", "For your account type the game is launched from the account we sent you, not from your personal profile."),
          sourcePdf: "PS5 Secondary.pdf", sourcePage: 14,
        }),
    step(t("final"), { kind: "final", title: x("Kraj", "Done"), body: "", support: true }),
  ];
}

const SHOP = "https://www.playworld.rs";

export function defaultContent(lang: Lang = "sr"): Content {
  const x = mk(lang);
  return {
    settings: {
      supportUrl: SUPPORT,
      siteUrl: "https://instrukcije.playworld.rs",
      supportLabel: x("Potreban Vam je dodatni verifikacioni kod ili pomoć? Javite nam se na support.playworld.rs.",
        "Need an additional verification code or help? Contact us at support.playworld.rs."),
      shopUrl: SHOP,
      shopLabel: x("PlayWorld prodavnica", "PlayWorld shop"),
    },
    terms: {
      title: x("Pravila korišćenja", "Terms of use"),
      intro: x("Molimo Vas da pre početka pročitate nekoliko jednostavnih pravila. Ona štite Vaš nalog i omogućavaju nam da Vam pružimo podršku ukoliko Vam zatreba.",
        "Before you begin, please read a few simple rules. They protect your account and allow us to support you if you need help."),
      highlights: [
        { title: x("Podaci naloga", "Account details"), text: x("Molimo Vas da podatke dobijenog naloga ostavite nepromenjenim. Promena email adrese, lozinke ili drugih podešavanja može uticati na pristup kupljenim igrama i pravilno funkcionisanje naloga.", "Please leave the details of the account you received unchanged. Changing the email address, password or other settings may affect access to the games you purchased and the proper functioning of the account."), for: "all", console: "all" },
        { title: x("Bezbednosna podešavanja", "Security settings"), text: x("Bezbednosna podešavanja naloga potrebno je ostaviti nepromenjenim. Molimo Vas da ne dodajete broj telefona, ne menjate podešavanja dvofaktorske autentifikacije (2FA) i ne unosite dodatne podatke za oporavak naloga.", "The security settings of the account must be left unchanged. Please do not add a phone number, do not change two-factor authentication (2FA) settings and do not enter any additional account recovery details."), for: "all", console: "all" },
        { title: x("Jedna konzola", "One console"), text: x("Nalog je namenjen korišćenju na jednoj konzoli. Ukoliko želite da ga prebacite na drugu konzolu ili ustupite drugoj osobi, prvo se obratite našoj podršci.", "The account is intended for use on a single console. If you would like to move it to another console or hand it over to another person, please contact our support first."), for: "all", console: "all" },
        { title: x("Nalog ostaje na konzoli", "The account stays on the console"), text: x("Molimo Vas da dobijeni nalog ne brišete sa konzole, čak ni nakon što se igra preuzme. Nalog je potreban kako bi preuzete igre ostale dostupne.", "Please do not delete the account you received from the console, even after the game has downloaded. The account is needed for the downloaded games to remain available."), for: "all", console: "all" },
      ],
      rules: [
        { title: x("Podaci dobijenog naloga", "Details of the account you received"), text: x("Zabranjeno je menjanje podataka dobijenog naloga: email adrese, lozinke, Online ID-a, postojećeg profila i ostalih podataka. Izuzetak su isključivo koraci inicijalne aktivacije koje ovaj vodič traži, na primer popunjavanje polja First Name i Last Name kada se taj ekran pojavi.", "Changing the details of the account you received is not allowed: the email address, password, Online ID, existing profile and other data. The only exceptions are the initial activation steps this guide asks for, for example filling in First Name and Last Name when that screen appears."), for: "all", console: "all" },
        { title: x("Bezbednosna podešavanja", "Security settings"), text: x("Zabranjeno je menjanje bezbednosnih podešavanja: dodavanje broja telefona, uključivanje, isključivanje ili menjanje dvofaktorske autentifikacije (2FA), metoda za oporavak naloga i sigurnosnih kontakata.", "Changing security settings is not allowed: adding a phone number, turning two-factor authentication (2FA) on, off or changing it, account recovery methods and security contacts."), for: "all", console: "all" },
        { title: x("Prenos i ustupanje naloga", "Transferring and handing over the account"), text: x("Nalog se koristi na jednoj konzoli. Prijava na drugoj konzoli, prenos, ustupanje ili preprodaja naloga nisu dozvoljeni bez prethodnog odobrenja PlayWorld podrške. Podatke za pristup nalogu molimo Vas da ne delite sa trećim licima.", "The account is used on a single console. Signing in on another console, transferring, handing over or reselling the account is not allowed without the prior approval of PlayWorld support. Please do not share the access details with third parties."), for: "all", console: "all" },
        { title: "Console Sharing and Offline Play", text: x("Za Vaš tip naloga nije dozvoljeno uključivati opciju Console Sharing and Offline Play. Prilikom podešavanja potrebno je da izaberete Don't Enable.", "For your account type, turning on Console Sharing and Offline Play is not allowed. During setup you need to select Don't Enable."), for: "secondary", console: "ps5" },
        { title: x("Aktivacija konzole kao Primary PS4", "Activating the console as a Primary PS4"), text: x("Za Vaš tip naloga nije dozvoljeno aktivirati dobijeni nalog kao Primary PS4. Prilikom podešavanja potrebno je da izaberete Do Not Activate.", "For your account type, activating the account you received as a Primary PS4 is not allowed. During setup you need to select Do Not Activate."), for: "secondary", console: "ps4" },
        { title: "Console Sharing and Offline Play", text: x("Za Vaš tip naloga ova opcija se uključuje (Enable), kako je navedeno u vodiču. Molimo Vas da je kasnije samostalno ne isključujete.", "For your account type this option is turned on (Enable), as stated in the guide. Please do not turn it off later on your own."), for: "primary", console: "ps5" },
        { title: x("Aktivacija konzole", "Console activation"), text: x("Za Vaš tip naloga aktivaciju konzole ostavite onako kako je navedeno u vodiču. Molimo Vas da je samostalno ne prebacujete niti isključujete.", "For your account type, leave the console activation as stated in the guide. Please do not move or disable it on your own."), for: "primary", console: "ps4" },
        { title: x("Nalog ostaje na konzoli", "The account stays on the console"), text: x("Dobijeni nalog nemojte brisati sa konzole, ni nakon što se igra preuzme.", "Do not delete the account you received from the console, even after the game has downloaded."), for: "all", console: "all" },
        { title: x("Licenca, plaćanje i kupovine", "License, payment and purchases"), text: x("Nemojte menjati podešavanja licence i deljenja, podatke za plaćanje, niti obavljati kupovine preko dobijenog naloga. Molimo Vas da ne menjate ništa što može poremetiti funkcionisanje naloga ili pristup njemu.", "Do not change license and sharing settings or payment details, and do not make purchases through the account you received. Please do not change anything that could disrupt the functioning of the account or access to it."), for: "all", console: "all" },
        { title: x("Gde se igra", "Where you play"), text: x("Igre preuzimate preko naloga koji ste dobili od nas, a igrate ih sa svog ličnog naloga. Dobijeni nalog koristite samo za preuzimanje.", "You download games through the account we sent you, and play them from your own personal account. Use the account you received only for downloading."), for: "primary", console: "all" },
        { title: x("Gde se igra", "Where you play"), text: x("Igre preuzimate i igrate na nalogu koji ste dobili od nas. Za igranje je potrebna internet konekcija.", "You download and play games on the account we sent you. An internet connection is required to play."), for: "secondary", console: "all" },
        { title: x("Garancija i podrška", "Warranty and support"), text: x("PlayWorld pruža podršku u skladu sa uslovima kupovine. Problemi nastali kršenjem ovih pravila ne spadaju u ugovorenu podršku i garanciju, u meri u kojoj to zakon dozvoljava. Ovo ne utiče na Vaša zakonska prava kao potrošača.", "PlayWorld provides support in accordance with the terms of purchase. Problems caused by breaking these rules are not covered by the agreed support and warranty, to the extent permitted by law. This does not affect your statutory rights as a consumer."), for: "all", console: "all" },
      ],
      checkbox: x("Pročitao/la sam i prihvatam pravila korišćenja.", "I have read and accept the terms of use."),
      button: x("Prihvatam i nastavljam", "Accept and continue"),
    },
    final: {
      title: x("Uspešno ste završili instrukcije!", "You have successfully completed the instructions!"),
      supportTitle: x("Potreban Vam je dodatni verifikacioni kod ili pomoć? Javite nam se na support.playworld.rs.", "Need an additional verification code or help? Contact us at support.playworld.rs."),
      supportButton: x("Kontaktirajte podršku", "Contact support"),
      primary: x("Igre preuzimate preko naloga koji ste dobili od nas, a igrate ih sa svog ličnog naloga. Dobijeni nalog ostaje na konzoli.", "You download games through the account we sent you and play them from your own personal account. The account you received stays on the console."),
      secondary: x("Igre preuzimate i igrate sa naloga koji ste dobili od nas. Za igranje je potrebna internet konekcija.", "You download and play games from the account we sent you. An internet connection is required to play."),
      secondaryPs4: x("Molimo Vas da dobijeni nalog ne aktivirate kao Primary PS4.", "Please do not activate the account you received as a Primary PS4."),
      secondaryPs5: x("Molimo Vas da ne uključujete opciju Console Sharing and Offline Play.", "Please do not turn on Console Sharing and Offline Play."),
      psPlus: x("Igre iz pretplate uvek preuzimate sa naloga koji ste dobili od nas. Važe ista pravila kao i za Vaš tip naloga.", "You always download subscription games from the account we sent you. The same rules apply as for your account type."),
      common: x("Molimo Vas da ne menjate podatke naloga, podešavanja 2FA i broj telefona, da nalog ne prebacujete na drugu konzolu bez našeg odobrenja i da ga ne brišete sa konzole.", "Please do not change the account details, 2FA settings or phone number, do not move the account to another console without our approval and do not delete it from the console."),
    },
    promos: [
      { id: "shop-home", title: x("Otkrijte još PlayStation igara!", "Discover more PlayStation games!"), text: x("Na PlayWorld.rs možete pronaći veliki izbor digitalnih igara, PlayStation pretplata i dodatnog sadržaja za Vašu konzolu.", "At PlayWorld.rs you can find a large selection of digital games, PlayStation subscriptions and additional content for your console."), image: "", button: x("Pogledajte ponudu igara", "Browse the games"), url: SHOP, enabled: true, placements: ["home"] },
      { id: "shop-final", title: x("Spremni za novu avanturu?", "Ready for a new adventure?"), text: x("Hvala Vam što ste ukazali poverenje PlayWorld timu! Ukoliko želite da proširite svoju kolekciju, posetite našu prodavnicu i pogledajte aktuelnu ponudu digitalnih igara i pretplata.", "Thank you for trusting the PlayWorld team! If you would like to expand your collection, visit our shop and see the current selection of digital games and subscriptions."), image: "", button: x("Istražite PlayWorld ponudu", "Explore the PlayWorld offer"), url: SHOP, enabled: true, placements: ["final"] },
      { id: "shop-steps", title: x("PlayStation igre i pretplate", "PlayStation games and subscriptions"), text: x("Pogledajte ponudu digitalnih igara i pretplata u PlayWorld prodavnici.", "Browse digital games and subscriptions in the PlayWorld shop."), image: "", button: x("Pogledajte ponudu", "Browse the offer"), url: SHOP, enabled: false, placements: ["steps"] },
    ],
    guides: {
      "ps4-primary": ps4("primary", lang),
      "ps4-secondary": ps4("secondary", lang),
      "ps5-primary": ps5("primary", lang),
      "ps5-secondary": ps5("secondary", lang),
    },
  };
}
export type { GuideType };
