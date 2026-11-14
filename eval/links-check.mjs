// Measures the link check on its own (no Clef, no key), against public lists:
//   node eval/links-check.mjs popular top-1m.csv 10000   Tranco list (rank,domain): legitimate sites flagged as imitations
//   node eval/links-check.mjs phishing feed.txt          one URL per line (e.g. OpenPhish): phishing links that pass as official
// The lists are not kept in the repo: download them fresh (https://tranco-list.eu, https://openphish.com).

import { readFileSync } from "node:fs";
import { extractLinks } from "../lib/links.js";

const [mode, file, limit] = process.argv.slice(2);
if (!["popular", "phishing"].includes(mode) || !file) {
  console.error("usage: node eval/links-check.mjs popular <tranco.csv> [n] | phishing <urls.txt>");
  process.exit(1);
}
const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);
const items = mode === "popular" ? lines.slice(0, Number(limit) || 10000).map((l) => "https://" + l.split(",")[1] + "/") : lines;

const kinds = {};
const notable = [];
for (const url of items) {
  const link = extractLinks(url)[0];
  const kind = link ? link.kind : "not a link";
  kinds[kind] = (kinds[kind] ?? 0) + 1;
  const bad = mode === "popular" ? ["lookalike", "homoglyph"].includes(kind) : kind === "official" && !link.userContent;
  if (bad) notable.push(link.domain);
}
console.log(`${items.length} ${mode === "popular" ? "popular domains" : "phishing links"}:`, kinds);
console.log(mode === "popular" ? "Flagged as imitations (should be none among real sites):" : "Passed as the brand's own link (should be none):");
console.log(notable.length ? [...new Set(notable)].join("  ") : "none");
