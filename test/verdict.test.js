import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../lib/verdict.js";
import { extractLinks } from "../lib/links.js";
import { buildQuestions, readAnswers } from "../lib/clef.js";

// Clef answers are faked here on purpose: these tests pin the RULES, not the model.
const clef = (o = {}) => ({
  asks: 0.05,
  brand: { id: "none", p: 0.9 },
  type: { id: "none", p: 0.9 },
  pressure: 0.2,
  ...o,
});
const run = (c, text = "") => decide(c, extractLinks(text));

test("asks for data + claims a brand + link is not the brand's = red", () => {
  const r = run(clef({ asks: 0.9, brand: { id: "bbva", p: 0.9 }, type: { id: "bank", p: 0.8 }, pressure: 2.5 }), "https://clientes-verificacion.com/x");
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "brand_link_mismatch");
  assert.equal(r.headline.brand, "BBVA");
});

test("look-alike link is red even if Clef sees nothing", () => {
  const r = run(clef(), "https://amazon-prime-renew.top");
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "lookalike");
});

test("legit notification from the brand with its own link = green", () => {
  const r = run(clef({ asks: 0.6, brand: { id: "amazon", p: 0.95 }, pressure: 0.4 }), "https://www.amazon.com/orders");
  assert.equal(r.verdict, "green");
  assert.equal(r.headline.code, "official_link");
});

test("legit notification without links = green", () => {
  const r = run(clef({ brand: { id: "bbva", p: 0.9 } }), "BBVA: compra de 23,90 EUR.");
  assert.equal(r.verdict, "green");
});

test("brand message linking to another known brand (carrier) is not a mismatch", () => {
  const r = run(clef({ brand: { id: "amazon", p: 0.9 } }), "Your Amazon order ships with UPS: https://www.ups.com/track?n=1");
  assert.notEqual(r.verdict, "red");
});

test("relative in trouble asking for money, no link = red", () => {
  const r = run(clef({ asks: 0.85, type: { id: "family", p: 0.8 }, pressure: 1.8 }));
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "scam_pattern");
});

test("unknown link with nothing else = yellow", () => {
  assert.equal(run(clef(), "mira esto https://recetas-de-la-abuela.example.org/tarta").verdict, "yellow");
});

test("brand + shortener + request = red", () => {
  const r = run(clef({ asks: 0.8, brand: { id: "dhl", p: 0.9 }, type: { id: "delivery", p: 0.9 } }), "DHL: pay customs bit.ly/3abc");
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "brand_shortener");
});

test("readAnswers parses the documented Clef response shape", () => {
  const a = readAnswers({
    answers: {
      asks: { type: "noul", noul: 0.94 },
      brand_online: { type: "choice", choice: "amazon", probabilities: { amazon: 0.93, none: 0.07 }, confidence: 0.9 },
      brand_money: { type: "choice", choice: "other", probabilities: { other: 0.6, none: 0.4 }, confidence: 0.5 },
      scam_type: { type: "choice", choice: "account", probabilities: { account: 0.7 }, confidence: 0.6 },
      pressure: { type: "score", score: 2.6, confidence: 0.7 },
    },
  });
  assert.deepEqual(a, { asks: 0.94, brand: { id: "amazon", p: 0.93 }, type: { id: "account", p: 0.7 }, pressure: 2.6, pressureConfidence: 0.7 });
  assert.equal(readAnswers({}).brand.id, "none");
  const q = buildQuestions();
  for (const k of ["brand_online", "brand_money", "scam_type"]) assert.ok(Object.keys(q[k].criteria).length <= 26, k);
});
