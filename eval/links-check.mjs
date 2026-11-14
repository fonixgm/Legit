// Measures the link check on its own (no Clef, no key), against public lists:
//   node eval/links-check.mjs popular top-1m.csv 10000   Tranco list (rank,domain): legitimate sites flagged as imitations
//   node eval/links-check.mjs phishing online-valid.csv [after]   PhishTank feed: phishing links that pass as official
//     [after] = ISO date: only links submitted after it. Use it to check rules on links nobody looked at.
//   node eval/links-check.mjs phishing urls.txt          or one URL per line
// The lists are not kept in the repo: download them fresh (https://tranco-list.eu,
// http://data.phishtank.com/data/online-valid.csv). PhishTank allows this use; OpenPhish's
// free feed terms do not allow product development, so it is not used.

import { readFileSync } from "node:fs";
import { extractLinks } from "../lib/links.js";

const [mode, file, limit] = process.argv.slice(2);
if (!["popular", "phishing"].includes(mode) || !file) {
  console.error("usage: node eval/links-check.mjs popular <tranco.csv> [n] | phishing <online-valid.csv|urls.txt> [after]");
  process.exit(1);
}
const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);

// One CSV row, with "quoted, fields" (PhishTank URLs can contain commas).
const cells = (row) => [...row.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"'));

let items;
if (mode === "popular") items = lines.slice(0, Number(limit) || 10000).map((l) => "https://" + l.split(",")[1] + "/");
else if (lines[0].startsWith("phish_id,")) {
  const head = cells(lines[0]);
  const [u, t] = [head.indexOf("url"), head.indexOf("submission_time")];
  const rows = lines.slice(1).map(cells);
  items = rows.filter((r) => !limit || r[t] > limit).map((r) => r[u]);
  const times = rows.map((r) => r[t]).sort();
  console.log(`PhishTank feed: submitted ${times[0]} .. ${times.at(-1)}${limit ? `; keeping those after ${limit}` : ""}`);
} else items = lines;

const kinds = {};
const notable = [];
for (const url of items) {
  const link = extractLinks(url)[0];
  const kind = link ? link.kind : "not a link";
  kinds[kind] = (kinds[kind] ?? 0) + 1;
  const bad = mode === "popular" ? ["lookalike", "homoglyph"].includes(kind) : kind === "official" && !link.userContent && !link.redirect;
  if (bad) notable.push(link.domain);
}
console.log(`${items.length} ${mode === "popular" ? "popular domains" : "phishing links"}:`, kinds);
console.log(mode === "popular" ? "Flagged as imitations (should be none among real sites):" : "Passed as the brand's own link (should be none):");
console.log(notable.length ? [...new Set(notable)].join("  ") : "none");
