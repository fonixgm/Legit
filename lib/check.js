// The whole pipeline: Clef answers the four questions, code checks the links, rules decide.

import { askClef } from "./clef.js";
import { extractLinks, verifyByRedirect } from "./links.js";
import { decide } from "./verdict.js";

export const MAX_CHARS = 4000;
// A screenshot, as the page sends it: a JPEG/PNG/WebP data URL, small enough for NaN's 4 MB
// request limit (and Vercel's 4.5 MB body limit) with room to spare.
export const MAX_IMAGE_CHARS = 3_000_000;
export const isImageDataUrl = (s) =>
  typeof s === "string" && s.length <= MAX_IMAGE_CHARS && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);

// `baseline: true` runs the same pipeline without Clef (keyword guesses), to measure what Clef adds.
export async function checkMessage(text, { baseline = false, image } = {}) {
  const started = Date.now();
  if (image) {
    const clef = await askClef("", { baseline, image });
    const links = linksSeenByClef(clef);
    return summary(decide(clef, links), clef, links, started, baseline, true);
  }
  const links = extractLinks(text);
  const [clef] = await Promise.all([askClef(text.slice(0, MAX_CHARS), { baseline }), verifyByRedirect(links)]);
  return summary(decide(clef, links), clef, links, started, baseline, false);
}

// A screenshot gives the code no address to check. Clef says whether there is a link and
// whether it looks wrong; that becomes one link the same rules understand, with no domain.
export const IMAGE_LINK = { has: 0.5, odd: 0.5 };
export function linksSeenByClef(clef) {
  if (!(clef.hasLink >= IMAGE_LINK.has)) return [];
  const known = clef.brand.id !== "none" && clef.brand.id !== "other" && clef.brand.p >= 0.5 ? clef.brand.id : null;
  if (clef.linkOdd >= IMAGE_LINK.odd) return [{ raw: "", domain: null, kind: "unknown", brand: null, fromImage: true }];
  // Looks normal: the brand's own link if it claims a brand, otherwise an ordinary site.
  if (known) return [{ raw: "", domain: null, kind: "official", brand: known, fromImage: true }];
  return [{ raw: "", domain: null, kind: "unknown", brand: null, popular: true, fromImage: true }];
}

function summary(result, clef, links, started, baseline, fromImage) {
  return {
    ...result,
    links: links.map(({ raw, domain, kind, brand, popular }) => ({ raw, domain, kind, brand, popular: popular || undefined })),
    signals: {
      asks: clef.asks,
      calls: clef.calls,
      lure: clef.lure,
      brand: clef.brand,
      type: clef.type,
      pressure: clef.pressure,
      ...(fromImage ? { hasLink: clef.hasLink, linkOdd: clef.linkOdd } : {}),
    },
    image: fromImage || undefined,
    mock: (!baseline && process.env.CLEF_MOCK === "1") || undefined,
    ms: Date.now() - started,
  };
}
