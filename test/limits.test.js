import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, rateLimiter, resultCache } from "../lib/limits.js";
import { inTurn } from "../lib/clef.js";

test("rate limit: N per window per visitor, then it frees up", () => {
  const allow = rateLimiter({ max: 3, windowMs: 1000 });
  assert.ok(allow("a", 0).ok && allow("a", 10).ok && allow("a", 20).ok);
  const blocked = allow("a", 30);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfter, 1);
  assert.ok(allow("b", 30).ok, "another visitor is not affected");
  assert.ok(allow("a", 1001).ok, "the oldest hit left the window");
});

test("client ip comes from the first forwarded address", () => {
  assert.equal(clientIp({ headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }), "203.0.113.7");
  assert.equal(clientIp({ headers: {} }), "unknown");
});

test("result cache: same text answers once, expires, and is bounded", () => {
  const cache = resultCache({ ttlMs: 100, max: 2 });
  cache.set("hola", { verdict: "green" }, 0);
  assert.deepEqual(cache.get("hola", 50), { verdict: "green" });
  assert.equal(cache.get("hola", 200), null);
  cache.set("a", 1, 0); cache.set("b", 2, 0); cache.set("c", 3, 0);
  assert.equal(cache.get("a", 1), null);
  assert.equal(cache.get("c", 1), 3);
});

test("clef queue runs one at a time and refuses when the line is full", async () => {
  let running = 0, peak = 0;
  const job = () => inTurn(async () => {
    running++; peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5));
    running--;
    return "ok";
  });
  const results = await Promise.allSettled(Array.from({ length: 20 }, job));
  assert.equal(peak, 1);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 15);
  assert.equal(results.filter((r) => r.status === "rejected")[0].reason.status, 429);
  assert.equal(await job(), "ok", "the line drains and accepts work again");
});
