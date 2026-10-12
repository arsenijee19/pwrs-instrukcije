// Startup fajl za cPanel "Setup Node.js App" (Passenger). Pokreće Next.js standalone server.
// Podešavanja se čitaju iz config.env pored ovog fajla (promenljive okruženja iz cPanela imaju prednost).
const fs = require("fs");
const path = require("path");

try {
  const file = path.join(__dirname, "config.env");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
} catch (e) {
  console.error("config.env nije učitan:", e);
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";
// Baza i uploadovane slike su u folderu "data" pored aplikacije; ažuriranje (prepisivanje fajlova) ga ne dira.
process.env.DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
process.env.HOSTNAME = "0.0.0.0";
require("./server.js");
