import { randomBytes, scryptSync } from "node:crypto";
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Upotreba: npm run admin:hash -- "vasa-dugacka-lozinka"  (min. 10 karaktera)');
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(pw, salt, 64).toString("hex");
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${hash}`);
