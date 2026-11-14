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
  lure: 0.7, // Clef thinks it invites to gamble or promises easy money
  via: 0.6, // Clef thinks it sends you to a link or web page to do it
  newNumber: 0.7, // Clef thinks the sender says they have a new or temporary number
  onlyCode: 0.8, // Clef thinks it only delivers a verification code
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
  // A message that only delivers a verification code "asks" for nothing.
  const codeOnly = (clef.onlyCode ?? 0) >= T.onlyCode && links.length === 0;
  const asks = clef.asks >= T.asks && !codeOnly;
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
    // A brand link that forwards to another address (google.com/url?q=...).
    if (l.kind === "official" && l.redirect && !l.userinfo) add(yellow, "redirect_link", { domain: l.host, brand: name(l.brand) });
  }

  // 2. The message claims a brand we know: do the links belong to it?
  const official = links.filter((l) => l.kind === "official" && !l.userinfo && !l.userContent && !l.redirect);
  const ownLinks = known ? official.filter((l) => l.brand === known) : [];
  // A brand link that forwards elsewhere (google.com/url?q=...) works like a shortener: it hides where you land.
  const isRedirect = (l) => l.kind === "official" && l.redirect && !l.userinfo;
  const foreign = links.filter((l) => l.kind === "unknown" || l.kind === "shortener" || isRedirect(l));
  const allOwn = links.length > 0 && ownLinks.length === links.length;

  if (known && links.length > 0 && ownLinks.length === 0 && foreign.length > 0) {
    const code = foreign.every(isRedirect) ? "brand_redirect" : foreign.every((l) => l.kind === "shortener" || isRedirect(l)) ? "brand_shortener" : "brand_link_mismatch";
    const strong = asks || pushy || clef.brand.p >= T.brandHigh;
    add(strong ? red : yellow, code, { brand: brandName, domain: foreign[0].domain });
  } else if (!known) {
    for (const l of foreign) {
      if (isRedirect(l)) continue;
      // No brand is being claimed, so there is nothing to impersonate: a link to a widely
      // visited site is not a warning by itself (what the text asks for still is, below).
      if (l.kind === "unknown" && l.popular) continue;
      add(yellow, l.kind === "shortener" ? "shortener" : "unknown_link", { domain: l.domain });
    }
  }

  // Gambling and easy-money lures ("50 giros gratis, juega ya en casino-suerte.club") ask for
  // nothing in the text: the trap is the site. Clef spots the lure; the link check says the
  // site is nobody known. A widely visited site (a licensed bookmaker) or the brand's own
  // link does not count. Raffles and real promotions are not lures (checked 15 Nov).
  const lureLink = links.find(
    (l) => (l.kind === "unknown" && !l.popular) || l.kind === "shortener" || (l.kind === "official" && l.userContent),
  );
  if (clef.lure >= T.lure && !known && lureLink) add(red, "lure_link", { domain: lureLink.domain });

  // A bank, courier, public body or account notice that sends you to a link to pay, verify or
  // update, when the code cannot see a link of theirs: none in the text (hidden, written out
  // in words, or removed) or one that is nobody known. Real notices that send you to a link
  // carry the brand's own link, which the code recognises; ones that send you to the app
  // do not count (Clef is asked which).
  // The pattern counts here even when Clef is only fairly sure of it (0.4): this rule also
  // needs a request through a link that the code cannot match to the sender.
  const riskyKind = clef.type.p >= 0.4 && ["bank", "delivery", "account", "tech_support"].includes(clef.type.id);
  const sendsAway = (clef.via ?? 0) >= T.via;
  const unseen = links.length === 0;
  const unknownSite = links.some((l) => (l.kind === "unknown" && !l.popular) || l.kind === "shortener");
  if (sendsAway && (unseen || (unknownSite && !known)) && !allOwn && (known || riskyKind)) {
    const strong = clef.asks >= T.asksHigh || clef.pressure >= T.pressureHigh || (asks && clef.pressure >= 1.5) || (asks && riskyKind && pushy);
    add(strong ? red : yellow, unseen ? "unseen_link" : "pattern_link", { brand: brandName, domain: unseen ? undefined : links.find((l) => l.kind !== "official")?.domain });
  }

  // 3. What Clef read in the text itself.
  if (typeId && RISKY_TYPES.has(typeId) && asks) add(red, "scam_pattern", { type: typeId });
  // "Hi mum, my phone broke, this is my new number, write to me": the opening move of the
  // relative-in-trouble scam asks for nothing yet (the money comes later, in the chat).
  // A real relative can also change number, so this warns and says "call the number you
  // already have"; it turns red only once it asks for money (scam_pattern above).
  if (typeId === "family" && !asks && (clef.calls >= T.calls || (clef.newNumber ?? 0) >= T.newNumber)) add(yellow, "family_new_contact");
  // "Call this number now": no link to check, so the push to call is the only trace.
  // A named brand + strong pressure + a risky pattern is red; pressure alone is a warning.
  const riskyCall = typeId && ["bank", "delivery", "account", "tech_support"].includes(typeId);
  if (clef.calls >= T.calls && !allOwn && pushy) {
    add(known && riskyCall && clef.pressure >= T.pressureHigh ? red : yellow, "call_pressure", { brand: brandName });
  } else if (clef.calls >= T.calls && !allOwn && known && riskyCall) {
    // "BBVA: cargo de 899 EUR. Si no lo reconoces llama al 912…" without obvious rush: the
    // number in the message is the trap. Warn and send them to the official number.
    add(yellow, "call_number", { brand: brandName });
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
  const knownSite = links.find((l) => l.popular);
  const headline = allOwn
    ? { code: "official_link", brand: brandName, domain: ownLinks[0].domain }
    : knownSite
      ? { code: "known_site", domain: knownSite.domain }
      : { code: "clean" };
  return { verdict: "green", headline, reasons: [headline], brand: brandName, type: typeId, own: allOwn };
}
