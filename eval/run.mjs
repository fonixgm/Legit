// Measures Legit? against a labelled set of messages.
//   NAN_KEY=... npm run eval                      -> eval/cases.jsonl
//   NAN_KEY=... npm run eval -- eval/other.jsonl
// One JSON object per line: { "id": "s01", "label": "scam" | "legit", "text": "...", "source": "..." }
// Requests go one at a time (NaN's limit). Writes eval/RESULTS.md.

import { readFile, writeFile } from "node:fs/promises";
import { checkMessage } from "../lib/check.js";

const file = process.argv[2] ?? "eval/cases.jsonl";
const mock = process.env.CLEF_MOCK === "1";

const cases = (await readFile(file, "utf8"))
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("//"))
  .map((l) => JSON.parse(l));

const rows = [];
for (const c of cases) {
  try {
    const r = await checkMessage(c.text);
    rows.push({ ...c, verdict: r.verdict, reason: r.headline.code, ms: r.ms });
  } catch (err) {
    rows.push({ ...c, verdict: "error", reason: String(err.message).slice(0, 60), ms: 0 });
  }
  process.stdout.write(".");
}
console.log();

const count = (label, verdict) => rows.filter((r) => r.label === label && r.verdict === verdict).length;
const total = (label) => rows.filter((r) => r.label === label).length;
const scams = total("scam");
const legits = total("legit");
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "–");

// A scam must not come out green; a legit message must not come out red.
// Yellow is reported on its own: it is "ask someone", neither a hit nor a miss.
const wrong = rows.filter(
  (r) => r.verdict === "error" || (r.label === "scam" && r.verdict === "green") || (r.label === "legit" && r.verdict === "red"),
);
const times = rows.map((r) => r.ms).filter(Boolean).sort((a, b) => a - b);
const median = times.length ? times[Math.floor(times.length / 2)] : 0;

const md = `# Results

${mock ? "> **MOCK RUN — these numbers are NOT Clef and must not be published.**\n\n" : ""}Set: \`${file}\` · ${rows.length} messages (${scams} scams, ${legits} legitimate) · median ${median} ms per message

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (${scams}) | ${count("scam", "red")} | ${count("scam", "yellow")} | ${count("scam", "green")} | ${count("scam", "error")} |
| **Legitimate** (${legits}) | ${count("legit", "red")} | ${count("legit", "yellow")} | ${count("legit", "green")} | ${count("legit", "error")} |

- Scams caught as red: **${count("scam", "red")}/${scams}** (${pct(count("scam", "red"), scams)})
- Scams missed (green): **${count("scam", "green")}/${scams}** (${pct(count("scam", "green"), scams)})
- Legitimate messages cleared as green: **${count("legit", "green")}/${legits}** (${pct(count("legit", "green"), legits)})
- False alarms (legitimate marked red): **${count("legit", "red")}/${legits}** (${pct(count("legit", "red"), legits)})

## Where it fails

${wrong.length ? wrong.map((r) => `- \`${r.id}\` (${r.label}) → ${r.verdict} · ${r.reason}`).join("\n") : "No scam came out green and no legitimate message came out red."}

## Every case

| id | label | verdict | main reason |
|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.label} | ${r.verdict} | ${r.reason} |`).join("\n")}
`;

const out = mock ? "eval/RESULTS.mock.md" : "eval/RESULTS.md";
await writeFile(out, md);
console.log(md.split("## Every case")[0]);
console.log(`Written to ${out}`);
