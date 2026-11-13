// The whole pipeline: Clef answers the four questions, code checks the links, rules decide.

import { askClef } from "./clef.js";
import { extractLinks, verifyByRedirect } from "./links.js";
import { decide } from "./verdict.js";

export const MAX_CHARS = 4000;

export async function checkMessage(text) {
  const started = Date.now();
  const links = extractLinks(text);
  const [clef] = await Promise.all([askClef(text.slice(0, MAX_CHARS)), verifyByRedirect(links)]);
  const result = decide(clef, links);
  return {
    ...result,
    links: links.map(({ raw, domain, kind, brand }) => ({ raw, domain, kind, brand })),
    signals: {
      asks: clef.asks,
      brand: clef.brand,
      type: clef.type,
      pressure: clef.pressure,
    },
    mock: process.env.CLEF_MOCK === "1" || undefined,
    ms: Date.now() - started,
  };
}
