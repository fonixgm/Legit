// The verdict comes from RULES over Clef's answers and the link check — never from
// generated text. Every reason is a code the UI translates.

import { BRANDS } from "./brands.js";

// Thresholds. Tune them with `npm run eval`, not by eye.
export const T = {
  asks: 0.5, // Clef thinks it asks for data / codes / money
  asksHigh: 0.8,
  calls: 0.6, // Clef thinks it tells you to call or write to a contact it gives
  brand: 0.5, // Clef is confident enough about the claimed brand
  brandHigh: 0.8,
  type: 0.6, // Clef is confident enough about the scam pattern
  pressure: 1.0, // 0..3 scale: "mild" or more
  pressureHigh: 2.0, // "strong" or more
};

// Patterns that are scams almost by definition when they also ask for something.
const RISKY_TYPES = new Set(["family", "prize", "investment", "tech_support"]);

export function decide(clef, links) {
  const red = [];
  const yellow = [];
  const add = (list, code, params = {}) => list.push({ code, ...params });

  const brandId = clef.brand.p >= T.brand && !["none"].includes(clef.brand.id) ? clef.brand.id : null;
  const known = brandId && BRANDS[brandId] ? brandId : null;
  const brandName = known ? BRANDS[known].name : null;
  const typeId = clef.type.p >= T.type && clef.type.id !== "none" ? clef.type.id : null;
  const asks = clef.asks >= T.asks;
  const pushy = clef.pressure >= T.pressure;

  const name = (id) => BRANDS[id]?.name ?? null;

  // 1. Links that are deceptive on their own, whatever the text says.
  for (const l of links) {
    if (l.kind === "homoglyph") add(red, "homoglyph", { domain: l.domain, brand: name(l.brand) });
    else if (l.kind === "unverified") add(yellow, "unverified_brand_domain", { domain: l.domain, brand: name(l.brand) });
    else if (l.kind === "lookalike") add(red, "lookalike", { domain: l.domain, brand: name(l.brand) });
    else if (l.userinfo) add(red, "hidden_destination", { domain: l.domain });
    else if (l.kind === "ip") add(asks || brandId ? red : yellow, "ip_link", { domain: l.domain });
  }

  // A page anyone can publish under the brand's domain (sites.google.com, tenant.sharepoint.com, t.me).
  for (const l of links) {
    if (l.kind === "official" && l.userContent && !l.userinfo) add(yellow, "user_content_link", { domain: l.host, brand: name(l.brand) });
  }

  // 2. The message claims a brand we know: do the links belong to it?
  const official = links.filter((l) => l.kind === "official" && !l.userinfo && !l.userContent);
  const ownLinks = known ? official.filter((l) => l.brand === known) : [];
  const foreign = links.filter((l) => l.kind === "unknown" || l.kind === "shortener");
  const allOwn = links.length > 0 && ownLinks.length === links.length;

  if (known && links.length > 0 && ownLinks.length === 0 && foreign.length > 0) {
    const onlyShort = foreign.every((l) => l.kind === "shortener");
    const code = onlyShort ? "brand_shortener" : "brand_link_mismatch";
    const strong = asks || pushy || clef.brand.p >= T.brandHigh;
    add(strong ? red : yellow, code, { brand: brandName, domain: foreign[0].domain });
  } else if (!known) {
    for (const l of foreign) {
      add(yellow, l.kind === "shortener" ? "shortener" : "unknown_link", { domain: l.domain });
    }
  }

  // 3. What Clef read in the text itself.
  if (typeId && RISKY_TYPES.has(typeId) && asks) add(red, "scam_pattern", { type: typeId });
  // "Call this number now": no link to check, so the push to call is the only trace.
  // A named brand + strong pressure + a risky pattern is red; pressure alone is a warning.
  if (clef.calls >= T.calls && !allOwn && pushy) {
    const risky = typeId && ["bank", "delivery", "account", "tech_support"].includes(typeId);
    add(known && risky && clef.pressure >= T.pressureHigh ? red : yellow, "call_pressure", { brand: brandName });
  }
  if (clef.asks >= T.asksHigh && clef.pressure >= T.pressureHigh) {
    add(allOwn ? yellow : red, "asks_under_pressure");
  }
  // A real link from the real brand excuses a normal "log in to see it".
  if (!allOwn) {
    if (asks) add(yellow, "asks_data");
    if (pushy) add(yellow, "pressure");
    // The pattern alone never changes the colour (a real bank notice is also "about a bank"):
    // it only explains a warning that is already there.
    if (typeId && (asks || pushy)) add(yellow, "scam_like", { type: typeId });
  }
  if (links.some((l) => l.idn && l.kind !== "homoglyph")) add(yellow, "idn_link");

  const dedupe = (list) => list.filter((r, i) => list.findIndex((x) => x.code === r.code && x.domain === r.domain) === i);

  if (red.length) {
    return { verdict: "red", headline: red[0], reasons: dedupe([...red, ...yellow]), brand: brandName, type: typeId, own: allOwn };
  }
  if (yellow.length) {
    return { verdict: "yellow", headline: yellow[0], reasons: dedupe(yellow), brand: brandName, type: typeId, own: allOwn };
  }
  const headline = allOwn ? { code: "official_link", brand: brandName, domain: ownLinks[0].domain } : { code: "clean" };
  return { verdict: "green", headline, reasons: [headline], brand: brandName, type: typeId, own: allOwn };
}
