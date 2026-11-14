// Measures Legit? against a labelled set of messages, with and without Clef.
//   NAN_KEY=... npm run eval                      -> eval/cases.jsonl
//   NAN_KEY=... npm run eval -- eval/other.jsonl
//   LEGIT_URL=https://... npm run eval            -> measures the deployed app
//   npm run eval                                  -> baseline only (no key needed)
// One JSON object per line: { "id": "s01", "label": "scam" | "legit", "text": "...", "source": "..." }
// Two arms over the same messages, same link check, same rules:
//   baseline  keyword guesses instead of Clef (lib/mock.js)  -> shows what Clef adds
//   clef      the real thing (needs NAN_KEY)
// Requests go one at a time (NaN's limit). Writes eval/RESULTS.md.

import { readFile, writeFile } from "node:fs/promises";
import { checkMessage } from "../lib/check.js";

const file = process.argv[2] ?? "eval/cases.jsonl";
const mock = process.env.CLEF_MOCK === "1";
const hasClef = mock || Boolean(process.env.NAN_KEY) || Boolean(process.env.LEGIT_URL);

const cases = (await readFile(file, "utf8"))
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("//"))
  .map((l) => JSON.parse(l));

// LEGIT_URL=https://... measures the DEPLOYED app (same code, the server's key) instead of
// calling Clef from here. It paces itself under the per-visitor rate limit.
const remote = process.env.LEGIT_URL?.replace(/\/$/, "");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function checkRemote(text) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${remote}/api/check`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (!data.cached) await pause(5200);
      return data;
    }
    if (res.status !== 429 && res.status !== 503) throw new Error(`HTTP ${res.status} ${data.detail ?? data.error ?? ""}`);
    await pause(((data.retryAfter ?? 3) + 1) * 1000);
  }
  throw new Error("still busy after retries");
}

async function runArm(baseline) {
  const rows = [];
  for (const c of cases) {
    try {
      const r = !baseline && remote ? await checkRemote(c.text) : await checkMessage(c.text, { baseline });
      rows.push({ ...c, verdict: r.verdict, reason: r.headline.code, ms: r.ms });
    } catch (err) {
      rows.push({ ...c, verdict: "error", reason: String(err.message).slice(0, 60), ms: 0 });
    }
    process.stdout.write(".");
  }
  console.log();
  return rows;
}

const arms = { baseline: await runArm(true) };
if (hasClef) arms.clef = await runArm(false);

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "–");

function summarize(rows) {
  const count = (label, verdict) => rows.filter((r) => r.label === label && r.verdict === verdict).length;
  const total = (label) => rows.filter((r) => r.label === label).length;
  const scams = total("scam");
  const legits = total("legit");
  // A scam must not come out green; a legit message must not come out red.
  // Yellow is reported on its own: it is "ask someone", neither a hit nor a miss.
  const wrong = rows.filter(
    (r) => r.verdict === "error" || (r.label === "scam" && r.verdict === "green") || (r.label === "legit" && r.verdict === "red"),
  );
  const times = rows.map((r) => r.ms).filter(Boolean).sort((a, b) => a - b);
  return {
    rows, wrong, scams, legits, count,
    median: times.length ? times[Math.floor(times.length / 2)] : 0,
  };
}

const S = Object.fromEntries(Object.entries(arms).map(([k, rows]) => [k, summarize(rows)]));
const first = S.clef ?? S.baseline;

const line = (name, s) => {
  const { count, scams, legits } = s;
  return `| ${name} | ${count("scam", "red")}/${scams} (${pct(count("scam", "red"), scams)}) | ${count("scam", "green")}/${scams} (${pct(count("scam", "green"), scams)}) | ${count("legit", "green")}/${legits} (${pct(count("legit", "green"), legits)}) | ${count("legit", "red")}/${legits} (${pct(count("legit", "red"), legits)}) | ${count("scam", "error") + count("legit", "error")} |`;
};

const table = (s) => `| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (${s.scams}) | ${s.count("scam", "red")} | ${s.count("scam", "yellow")} | ${s.count("scam", "green")} | ${s.count("scam", "error")} |
| **Legitimate** (${s.legits}) | ${s.count("legit", "red")} | ${s.count("legit", "yellow")} | ${s.count("legit", "green")} | ${s.count("legit", "error")} |`;

const fails = (s) =>
  s.wrong.length
    ? s.wrong.map((r) => `- \`${r.id}\` (${r.label}) → ${r.verdict} · ${r.reason}`).join("\n")
    : "No scam came out green and no legitimate message came out red.";

const verdictOf = (arm, id) => arms[arm].find((r) => r.id === id)?.verdict ?? "–";

const md = `# Results

${mock ? "> **MOCK RUN — the \"clef\" rows are NOT Clef and must not be published.**\n\n" : ""}Set: \`${file}\` · ${cases.length} messages (${first.scams} scams, ${first.legits} legitimate) · date ${new Date().toISOString().slice(0, 10)}

## With and without Clef

| Arm | Scams caught (red) | Scams missed (green) | Legit cleared (green) | False alarms (legit red) | Errors |
|---|---|---|---|---|---|
${Object.entries(S).map(([k, s]) => line(k === "clef" ? (mock ? "clef (MOCK)" : "clef") : "baseline (no Clef)", s)).join("\n")}

${hasClef ? "" : "_No \`NAN_KEY\`: only the baseline ran. These numbers say nothing about Clef._\n"}
\`baseline\` = same link check and same rules, but keyword guesses (\`lib/mock.js\`) instead of Clef. What \`clef\` gains over it is what the model adds.
${S.clef ? `\nMedian latency with Clef: ${S.clef.median} ms per message.\n` : ""}
${Object.entries(S).map(([k, s]) => `## ${k}\n\n${table(s)}\n\n### Where it fails\n\n${fails(s)}`).join("\n\n")}

## Every case

| id | label | ${Object.keys(arms).join(" | ")} |
|---|---|${Object.keys(arms).map(() => "---").join("|")}|
${cases.map((c) => `| ${c.id} | ${c.label} | ${Object.keys(arms).map((a) => verdictOf(a, c.id)).join(" | ")} |`).join("\n")}
`;

// cases.jsonl -> RESULTS.md, cases-v2.jsonl -> RESULTS-v2.md: one report per set, never overwritten by another set.
const tag = (file.match(/cases(-[\w]+)?\.jsonl$/)?.[1]) ?? (file.endsWith("cases.jsonl") ? "" : "-" + file.replace(/^.*\//, "").replace(/\.jsonl$/, ""));
const out = mock ? `eval/RESULTS${tag}.mock.md` : hasClef ? `eval/RESULTS${tag}.md` : `eval/RESULTS${tag}.baseline.md`;
await writeFile(out, md);
console.log(md.split("## Every case")[0]);
console.log(`Written to ${out}`);
