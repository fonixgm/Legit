// The whole pipeline: Clef answers the four questions, code checks the links, rules decide.

import { askClef } from "./clef.js";
import { extractLinks, verifyByRedirect } from "./links.js";
import { decide } from "./verdict.js";

export const MAX_CHARS = 4000;

// `baseline: true` runs the same pipeline without Clef (keyword guesses), to measure what Clef adds.
export async function checkMessage(text, { baseline = false, source = "text" } = {}) {
  const started = Date.now();
  const links = extractLinks(text);
  const [clef] = await Promise.all([askClef(text.slice(0, MAX_CHARS), { baseline, source }), verifyByRedirect(links)]);
  const result = decide(clef, links);
  return {
    ...result,
    links: links.map(({ raw, domain, kind, brand, popular }) => ({ raw, domain, kind, brand, popular: popular || undefined })),
    signals: {
      asks: clef.asks,
      calls: clef.calls,
      brand: clef.brand,
      type: clef.type,
      pressure: clef.pressure,
    },
    mock: (!baseline && process.env.CLEF_MOCK === "1") || undefined,
    ms: Date.now() - started,
  };
}
