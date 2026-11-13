// Validates the measurement set before spending Clef calls on it.
//   npm run eval:check                      -> eval/cases.jsonl
// Fails on: bad JSON, missing fields, duplicate ids or texts, a live link that was not neutralised,
// personal data patterns (phones, IBANs, e-mails) and a set that is not 30 scams + 30 legitimate.

import { readFile } from "node:fs/promises";

const file = process.argv[2] ?? "eval/cases.jsonl";
const WANT = 30;
const problems = [];
const warn = (id, msg) => problems.push(`${id}: ${msg}`);

const lines = (await readFile(file, "utf8")).split("\n").filter((l) => l.trim() && !l.startsWith("//"));
const cases = [];
lines.forEach((l, i) => {
  try {
    cases.push(JSON.parse(l));
  } catch {
    warn(`line ${i + 1}`, "not valid JSON");
  }
});

const ids = new Set();
const texts = new Set();
for (const c of cases) {
  const id = c.id ?? "(no id)";
  if (!c.id || !["scam", "legit"].includes(c.label) || typeof c.text !== "string" || !c.text.trim() || !c.source) {
    warn(id, 'needs id, label ("scam"|"legit"), text and source');
    continue;
  }
  if (ids.has(c.id)) warn(id, "duplicate id");
  ids.add(c.id);
  const key = c.text.trim().toLowerCase();
  if (texts.has(key)) warn(id, "duplicate text");
  texts.add(key);
  // Scam links must be neutralised: hxxp:// and [.] (the runner undoes it before parsing).
  if (c.label === "scam" && /https?:\/\/[^\s]+/i.test(c.text)) warn(id, "live link in a scam: write hxxps:// and [.]");
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(c.text)) warn(id, "looks like an e-mail address: anonymise it");
  if (/\b[A-Z]{2}\d{2}(?:\s?\d{4}){3,}/.test(c.text)) warn(id, "looks like an IBAN: anonymise it");
  if (/(?<!\d)(?:\+?\d[\s.-]?){9,}(?!\d)/.test(c.text.replace(/\*\d{4}/g, ""))) warn(id, "looks like a phone number: anonymise it");
}

const n = (label) => cases.filter((c) => c.label === label).length;
if (n("scam") !== WANT) problems.push(`set: ${n("scam")} scams, expected ${WANT}`);
if (n("legit") !== WANT) problems.push(`set: ${n("legit")} legitimate, expected ${WANT}`);

if (problems.length) {
  console.error(`${file}: ${problems.length} problem(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`${file}: OK · ${n("scam")} scams + ${n("legit")} legitimate`);
