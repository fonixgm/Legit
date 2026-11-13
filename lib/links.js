// What Clef cannot know: is the link really the brand's?
// Extracts every link from a message and checks its registrable domain.

import { domainToUnicode } from "node:url";
import { parse } from "tldts";
import { BRANDS, DOMAIN_TO_BRAND, SHORTENERS } from "./brands.js";

// Test sets carry neutralised links (hxxp://evil[.]com). Undo that before parsing.
export function refang(text) {
  return text
    .replace(/hxxp(s?):\/\//gi, "http$1://")
    .replace(/\s?[\[\(]\s?(?:\.|dot)\s?[\]\)]\s?/gi, ".");
}

const TRIM_START = /^[\s"'«“‘(<\[¡¿]+/u;
const TRIM_END = /[\s"'»”’)>\].,;:!?…]+$/u;
const BARE_DOMAIN = /^(?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]{2,}(?:[/?#].*)?$/u;

function candidates(text) {
  const out = [];
  for (const raw of refang(text).split(/\s+/)) {
    const token = raw.replace(TRIM_START, "").replace(TRIM_END, "");
    if (!token) continue;
    if (/^https?:\/\//i.test(token)) out.push({ raw: token, href: token });
    else if (/^www\./i.test(token)) out.push({ raw: token, href: "http://" + token });
    else if (token.includes("@")) continue; // e-mail address, not a link
    else if (BARE_DOMAIN.test(token)) {
      // "5.30", "23.90": times and prices, not hosts (WHATWG would read them as IPs).
      if (!/\p{L}/u.test(token.split(/[/?#]/)[0])) continue;
      const hasPath = /[/?#]/.test(token);
      // "gracias.No me llames" -> missing space after a full stop, not a domain.
      if (!hasPath && /\.\p{Lu}/u.test(token)) continue;
      out.push({ raw: token, href: "http://" + token, bare: true });
    }
  }
  return out;
}

const SCRIPTS = [
  ["latin", /\p{Script=Latin}/u],
  ["cyrillic", /\p{Script=Cyrillic}/u],
  ["greek", /\p{Script=Greek}/u],
  ["armenian", /\p{Script=Armenian}/u],
];

// One label mixing Latin with Cyrillic/Greek/Armenian letters is the classic homograph trick.
function mixedScript(unicodeHost) {
  return unicodeHost.split(".").some((label) => {
    const found = SCRIPTS.filter(([, re]) => re.test(label)).length;
    return found > 1;
  });
}

// Letters swapped for look-alike digits: amaz0n, paypa1, netf1ix...
const LEET = { 0: "o", 1: "l", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b" };
const unleet = (s) => s.replace(/[0134578]/g, (c) => LEET[c]);
// Fold accents so "amazón" still reads as "amazon".
const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "");

// Does this (non-official) hostname pretend to be a known brand?
function imitatedBrand(unicodeHost) {
  const host = fold(unicodeHost.toLowerCase());
  const variants = [host, unleet(host)];
  for (const v of variants) {
    const tokens = v.split(/[.\-_]/);
    const squashed = v.replace(/[.\-_]/g, "");
    for (const [id, b] of Object.entries(BRANDS)) {
      for (const k of b.keywords) {
        if (k.length <= 5 ? tokens.includes(k) : v.includes(k) || squashed.includes(k)) return id;
      }
    }
  }
  return null;
}

export function analyzeLink({ raw, href, bare }) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const info = parse(url.hostname);
  if (info.isIp) {
    return { raw, host: url.hostname, domain: url.hostname, kind: "ip", brand: null };
  }
  // Without a scheme we only trust real, registered public suffixes.
  if (!info.domain || !info.isIcann) return bare ? null : { raw, host: url.hostname, domain: url.hostname, kind: "unknown", brand: null };

  const domain = info.domain; // registrable domain: amazon.com.account-check.xyz -> account-check.xyz
  const unicodeHost = domainToUnicode(url.hostname) || url.hostname;
  const link = {
    raw,
    host: unicodeHost,
    domain: domainToUnicode(domain) || domain,
    kind: "unknown",
    brand: null,
    // http://amazon.com@evil.xyz really goes to evil.xyz
    userinfo: Boolean(url.username),
    idn: /[^\x00-\x7f]/.test(unicodeHost),
  };

  const owner = DOMAIN_TO_BRAND.get(domain);
  if (owner) {
    link.kind = "official";
    link.brand = owner;
    link.userinfo = false; // user@amazon.com still goes to amazon.com
  } else if (SHORTENERS.has(domain)) {
    link.kind = "shortener";
  } else if (mixedScript(unicodeHost)) {
    link.kind = "homoglyph";
    link.brand = imitatedBrand(unicodeHost);
  } else {
    const fake = imitatedBrand(unicodeHost);
    if (fake) {
      link.kind = "lookalike";
      link.brand = fake;
    }
  }
  return link;
}

export function extractLinks(text) {
  const seen = new Set();
  const links = [];
  for (const c of candidates(text)) {
    const link = analyzeLink(c);
    if (!link || seen.has(link.host)) continue;
    seen.add(link.host);
    links.push(link);
  }
  return links.slice(0, 10);
}
