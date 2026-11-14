// Protection for a public endpoint that spends a shared key. Everything lives in memory, per
// server instance: good enough to stop one visitor (or one script) from starving the rest.

import { createHash } from "node:crypto";

// ---- Per-visitor rate limit: a sliding window of timestamps per IP.
export function rateLimiter({ max = 12, windowMs = 60_000, maxKeys = 5000 } = {}) {
  const hits = new Map();
  return function allow(key, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
    }
    recent.push(now);
    hits.delete(key); // re-insert so the Map stays ordered by last use
    hits.set(key, recent);
    if (hits.size > maxKeys) hits.delete(hits.keys().next().value);
    return { ok: true };
  };
}

export function clientIp(req) {
  const fwd = req.headers?.["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first || req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

// ---- Short-lived result cache. During a demo many people check the same message (the
// examples, a text passed around a chat): answer those once. Keyed by a hash of the text —
// the message itself is never kept — and forgotten after a few minutes.
export function resultCache({ ttlMs = 5 * 60_000, max = 300 } = {}) {
  const store = new Map();
  const keyOf = (text) => createHash("sha256").update(text).digest("base64");
  return {
    get(text, now = Date.now()) {
      const key = keyOf(text);
      const hit = store.get(key);
      if (!hit) return null;
      if (now - hit.at > ttlMs) {
        store.delete(key);
        return null;
      }
      return hit.value;
    },
    set(text, value, now = Date.now()) {
      const key = keyOf(text);
      store.delete(key);
      store.set(key, { at: now, value });
      if (store.size > max) store.delete(store.keys().next().value);
    },
  };
}
