import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { defaultContent } from "../lib/seed";
import { ContentSchema, GUIDE_TYPES, PRODUCTS, type GuideType, type Product, type Step } from "../lib/types";

const c = defaultContent();
const path_ = (g: GuideType, p: Product): Step[] =>
  c.guides[g].filter((s) => s.published && (s.purchase === "both" || s.purchase === p));
const text = (s: Step) => `${s.title}\n${s.body}\n${s.warning}`;

test("sadržaj prolazi validaciju šeme", () => {
  assert.equal(ContentSchema.safeParse(c).success, true);
});

test("svih 8 putanja (4 tipa x 2 proizvoda) ima korake i završni ekran na kraju", () => {
  for (const g of GUIDE_TYPES) for (const p of PRODUCTS) {
    const s = path_(g, p);
    assert.ok(s.length >= 9, `${g}/${p}`);
    assert.equal(s.at(-1)!.kind, "final");
    assert.equal(s.filter((x) => x.kind === "final").length, 1);
  }
});

test("PS5: GET STARTED je zaseban kritičan korak u obe putanje sa linkom podrške", () => {
  for (const g of ["ps5-primary", "ps5-secondary"] as const) {
    const s = c.guides[g].find((x) => /GET STARTED/.test(x.title))!;
    assert.ok(s);
    assert.equal(s.level, "critical");
    assert.match(s.warning, /NIKAKO/);
    assert.match(s.warning, /Quick Play/);
    assert.ok(s.support);
    assert.ok(s.images[0].markers.some((m) => m.type === "target"));
    assert.ok(s.images[0].markers.some((m) => m.type === "forbidden"));
  }
});

test("PS5 ima First/Last Name, Privacy/Apply/Limited Data Collection i Do This Later", () => {
  for (const g of ["ps5-primary", "ps5-secondary"] as const) {
    const all = c.guides[g].map(text).join("\n");
    assert.match(all, /First Name i Last Name/);
    assert.match(all, /bilo koji tekst/);
    assert.match(all, /Limited Data Collection/);
    assert.match(all, /Apply/);
    assert.match(all, /Do This Later/);
  }
});

test("Console Sharing: Primary = Enable, Secondary = Don't Enable", () => {
  const p = c.guides["ps5-primary"].find((s) => s.id.endsWith("console-sharing"))!;
  const s = c.guides["ps5-secondary"].find((x) => x.id.endsWith("console-sharing"))!;
  assert.match(p.title, /izaberite Enable$/);
  assert.match(s.title, /Don't Enable$/);
  assert.match(s.warning, /NIKAKO ne birate opciju Enable/);
  assert.ok(p.images[0].src.includes("primary") && s.images[0].src.includes("secondary"));
});

test("PS4: Primary = Activate/Change to This PS4, Secondary = Do Not Activate", () => {
  assert.match(c.guides["ps4-primary"].map(text).join("\n"), /Change to This PS4/);
  assert.doesNotMatch(c.guides["ps4-primary"].map(text).join("\n"), /Do Not Activate/);
  const sec = c.guides["ps4-secondary"].map(text).join("\n");
  assert.match(sec, /Do Not Activate/);
  assert.match(sec, /NIKADA ne birate opciju Activate/i);
});

test("Primary = igra sa ličnog; Secondary = sa dobijenog uz internet (bez greške iz PS5 Secondary.pdf str. 14)", () => {
  for (const g of GUIDE_TYPES) {
    const play = c.guides[g].find((s) => s.id.endsWith("-play"))!;
    if (g.endsWith("primary")) {
      assert.match(play.body, /ličn/i);
      assert.doesNotMatch(play.body, /potrebna internet konekcija/);
    } else {
      assert.match(play.body, /sa istog naloga/);
      assert.match(play.body, /potrebna internet konekcija/);
      assert.doesNotMatch(play.body, /svog ličnog|nije obavezan|nije neophodna/i);
    }
  }
  const sec = c.guides["ps5-secondary"].map(text).join("\n");
  assert.doesNotMatch(sec, /svog ličnog|Internet konekcija Vam nije/i);
});

test("nijedan korak ne sugeriše dodavanje telefona, promenu 2FA/lozinke ni brisanje naloga", () => {
  for (const g of GUIDE_TYPES) for (const s of c.guides[g]) {
    const t = text(s);
    for (const line of t.split(/[.\n]/)) {
      if (/(?<!\bne\s)(?<!\bNe\s)(dodajte|unesite|promenite|izmenite|obrišite|izbrišite)\s+(broj telefona|2FA|lozinku nalog)/.test(line)) assert.fail(line);
    }
  }
});

test("link ka podršci je na 2FA koracima i GET STARTED, a završni ekran ima https://support.playworld.rs", () => {
  assert.equal(c.settings.supportUrl, "https://support.playworld.rs");
  for (const g of GUIDE_TYPES) {
    assert.ok(c.guides[g].find((s) => s.id.endsWith("-2fa"))!.support, g);
    assert.ok(c.guides[g].at(-1)!.support);
  }
  assert.match(c.final.supportTitle, /support\.playworld\.rs/);
});

test("proizvod-specifični koraci: igra vs PS Plus", () => {
  for (const g of GUIDE_TYPES) {
    assert.ok(path_(g, "game").some((s) => s.id.endsWith("download-game")));
    assert.ok(!path_(g, "game").some((s) => s.id.endsWith("download-plus")));
    assert.ok(path_(g, "ps_plus").some((s) => s.id.endsWith("download-plus")));
    assert.ok(!path_(g, "ps_plus").some((s) => s.id.endsWith("download-game")));
  }
});

test("pravila: Secondary i Primary dobijaju različito pravilo, bez apsolutnog isključenja zakonskih prava", () => {
  const rules = c.terms.rules;
  assert.ok(rules.some((r) => r.for === "secondary" && /Console Sharing/.test(r.text)));
  assert.ok(rules.some((r) => r.for === "primary"));
  const all = JSON.stringify(c.terms);
  assert.doesNotMatch(all, /nema reklamacije|ni pod kojim uslovima/i);
  assert.match(all, /zakonska prava/);
});

test("svaka referencirana slika postoji na disku (800 i 1600)", () => {
  const seen = new Set<string>();
  for (const g of GUIDE_TYPES) for (const s of c.guides[g]) for (const im of s.images) seen.add(im.src);
  for (const src of seen) for (const w of [800, 1600]) {
    assert.ok(fs.existsSync(path.join("public", `${src}-${w}.webp`)), `${src}-${w}.webp`);
  }
});

test("svaka slika ima alt opis", () => {
  for (const g of GUIDE_TYPES) for (const s of c.guides[g]) for (const im of s.images) assert.ok(im.alt.length > 5, im.src);
});

test("PS5 vodiči i pravila ne pominju PS4; PS4 vodiči ne pominju PS5", () => {
  for (const g of ["ps5-primary", "ps5-secondary"] as const) {
    const all = c.guides[g].map(text).join("\n");
    assert.doesNotMatch(all, /PS4/, g);
    for (const r of c.terms.rules.filter((r) => r.console === "ps5" || r.console === "all")) assert.doesNotMatch(r.text, /PS4/, r.title);
  }
  for (const g of ["ps4-primary", "ps4-secondary"] as const) assert.doesNotMatch(c.guides[g].map(text).join("\n"), /PS5/, g);
});

test("Primary i Secondary pravila su razdvojena po tipu i konzoli", () => {
  const pick = (kind: string, cons: string) => c.terms.rules.filter((r) => (r.for === "all" || r.for === kind) && (r.console === "all" || r.console === cons));
  const txt = (a: typeof c.terms.rules) => a.map((r) => r.title + " " + r.text).join("\n");
  assert.match(txt(pick("secondary", "ps5")), /Don't Enable/);
  assert.doesNotMatch(txt(pick("secondary", "ps5")), /Do Not Activate/);
  assert.match(txt(pick("secondary", "ps4")), /Do Not Activate/);
  assert.match(txt(pick("primary", "ps5")), /Enable/);
  assert.doesNotMatch(txt(pick("primary", "ps5")), /Don't Enable/);
});

test("promocije: podrazumevano za početnu i završnu, bez izmišljenih cena", () => {
  const on = c.promos.filter((p) => p.enabled);
  assert.ok(on.some((p) => p.placements.includes("home")));
  assert.ok(on.some((p) => p.placements.includes("final")));
  for (const p of c.promos) { assert.match(p.url, /^https:\/\/www\.playworld\.rs/); assert.doesNotMatch(p.title + p.text, /\d+\s?(RSD|din|%|€)/i); }
  assert.equal(c.settings.shopUrl, "https://www.playworld.rs");
});

test("u tekstovima nema crtica (em/en dash)", () => {
  assert.doesNotMatch(JSON.stringify(c), /[—–]/);
});

const en = defaultContent("en");
test("engleska verzija: ista struktura, bez srpskih slova, bez crtica", () => {
  assert.equal(ContentSchema.safeParse(en).success, true);
  for (const g of GUIDE_TYPES) {
    assert.deepEqual(en.guides[g].map((s) => s.id), c.guides[g].map((s) => s.id), g);
    assert.deepEqual(en.guides[g].map((s) => s.images.map((i) => i.src)), c.guides[g].map((s) => s.images.map((i) => i.src)), g);
  }
  const all = JSON.stringify(en);
  assert.doesNotMatch(all, /[čćžšđČĆŽŠĐ]/);
  assert.doesNotMatch(all, /[—–]/);
  assert.equal(en.settings.supportUrl, "https://support.playworld.rs");
  assert.match(en.final.supportTitle, /support\.playworld\.rs/);
});

test("engleska verzija: poslovna pravila su ista (Enable/Don't Enable, Activate/Do Not Activate, GET STARTED)", () => {
  const t = (g: GuideType) => en.guides[g].map(text).join("\n");
  assert.match(t("ps5-primary"), /select Enable/);
  assert.match(t("ps5-secondary"), /Don't Enable/);
  assert.match(t("ps5-secondary"), /do NOT select Enable/);
  assert.match(t("ps4-primary"), /Change to This PS4/);
  assert.match(t("ps4-secondary"), /NEVER select Activate/);
  for (const g of ["ps5-primary", "ps5-secondary"] as const) {
    const s = en.guides[g].find((x) => /GET STARTED/.test(x.title))!;
    assert.equal(s.level, "critical");
    assert.match(s.warning, /Quick Play/);
    assert.ok(s.support);
    assert.doesNotMatch(t(g), /PS4/);
  }
  assert.match(en.guides["ps5-primary"].find((s) => /your-information/.test(s.id))!.body, /any text/);
});
