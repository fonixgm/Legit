// POST /api/check  { "text": "..." }  ->  verdict JSON
// Runs on the server so the NaN key never reaches the browser.
// The message is not stored and not logged (only its verdict is remembered for a few
// minutes, under a hash of the text: see lib/limits.js).

import { checkMessage, MAX_CHARS } from "../lib/check.js";
import { ClefError } from "../lib/clef.js";
import { clientIp, rateLimiter, resultCache } from "../lib/limits.js";

const allow = rateLimiter({ max: 12, windowMs: 60_000 }); // per visitor
const cache = resultCache();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ error: "empty" });
  if (text.length > MAX_CHARS) return res.status(413).json({ error: "too_long", max: MAX_CHARS });

  const source = req.body?.source === "screenshot" ? "screenshot" : "text";
  const cacheKey = `${source}\n${text}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  const turn = allow(clientIp(req));
  if (!turn.ok) {
    res.setHeader("Retry-After", String(turn.retryAfter));
    return res.status(429).json({ error: "slow_down", retryAfter: turn.retryAfter });
  }

  try {
    const result = await checkMessage(text, { source });
    cache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (err) {
    const status = err instanceof ClefError ? err.status : 0;
    // Log the failure, never the message.
    console.error("check failed:", status, err?.name, err instanceof ClefError ? err.message : "");
    if (status === 429) {
      res.setHeader("Retry-After", "3");
      return res.status(503).json({ error: "busy" });
    }
    // `detail` says why without leaking anything: missing key, Clef's HTTP status or a timeout.
    let detail = err?.name === "TimeoutError" ? "timeout" : "internal";
    if (err instanceof ClefError) detail = status === 500 ? "no_key" : `clef_${status}`;
    const body = { error: "unavailable", detail };
    if (status === 400) body.message = err.message.slice(0, 300); // Clef explains what is wrong with the request
    return res.status(502).json(body);
  }
}
