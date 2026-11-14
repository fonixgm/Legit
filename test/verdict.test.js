import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../lib/verdict.js";
import { extractLinks } from "../lib/links.js";
import { buildQuestions, readAnswers, ClefError, BRAND_QUESTIONS } from "../lib/clef.js";

// Clef answers are faked here on purpose: these tests pin the RULES, not the model.
const clef = (o = {}) => ({
  asks: 0.05,
  calls: 0.05,
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

test("brand's name on an unlisted country domain = yellow, not red", () => {
  const r = run(clef({ brand: { id: "netflix", p: 0.9 } }), "Netflix: nueva temporada https://www.netflix.co/title/1");
  assert.equal(r.verdict, "yellow");
  assert.equal(r.headline.code, "unverified_brand_domain");
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
      calls: { type: "noul", noul: 0.2 },
      brand_online: { type: "choice", choice: "amazon", probabilities: { amazon: 0.93, none: 0.07 }, confidence: 0.9 },
      brand_money: { type: "choice", choice: "other", probabilities: { other: 0.6, none: 0.4 }, confidence: 0.5 },
      scam_type: { type: "choice", choice: "account", probabilities: { account: 0.7 }, confidence: 0.6 },
      pressure: { type: "score", score: 2.6, confidence: 0.7 },
    },
  });
  assert.deepEqual(a, { asks: 0.94, calls: 0.2, brand: { id: "amazon", p: 0.93 }, type: { id: "account", p: 0.7 }, pressure: 2.6, pressureConfidence: 0.7 });
  const q = buildQuestions();
  for (const k of [...BRAND_QUESTIONS, "scam_type"]) assert.ok(Object.keys(q[k].criteria).length <= 26, k);
});

test("result says whether every link is the claimed brand's (the web's third question)", () => {
  const own = run(clef({ brand: { id: "amazon", p: 0.95 } }), "https://www.amazon.com/orders");
  assert.equal(own.own, true);
  const foreign = run(clef({ asks: 0.9, brand: { id: "amazon", p: 0.95 } }), "https://secure-login.xyz/a");
  assert.equal(foreign.own, false);
  assert.equal(run(clef(), "hola").own, false);
});

test("a missing or malformed Clef answer is an error, never a green verdict", () => {
  const ok = {
    asks: { noul: 0.1 }, calls: { noul: 0.1 }, scam_type: { choice: "none" }, pressure: { score: 0 }, brand_online: { choice: "none" }, brand_money: { choice: "none" },
  };
  for (const bad of [{}, null, undefined, { answers: {} }, { answers: { ...ok, asks: undefined } }, { answers: { ...ok, calls: undefined } }, { answers: { ...ok, pressure: { score: "high" } } }, { answers: { ...ok, scam_type: {} } }]) {
    assert.throws(() => readAnswers(bad), ClefError);
  }
  assert.doesNotThrow(() => readAnswers({ answers: ok }));
});

test("pages anyone can publish on a brand's domain never clear a message", () => {
  // Calm, no pressure, asks for a login: with a truly official link this would be green.
  const calm = clef({ asks: 0.9, brand: { id: "microsoft", p: 0.95 }, pressure: 0.2 });
  assert.equal(run(calm, "https://www.microsoft.com/account").verdict, "green");
  for (const url of ["https://contoso-hr.sharepoint.com/doc", "https://sites.google.com/view/verifica", "https://t.me/soporte_bot"]) {
    const r = run({ ...calm, brand: { id: url.includes("google") ? "google" : url.includes("t.me") ? "telegram" : "microsoft", p: 0.95 } }, url);
    assert.notEqual(r.verdict, "green", url);
    assert.ok(r.reasons.some((x) => x.code === "user_content_link"), url);
    assert.equal(r.own, false, url);
  }
});

test("'call this number now' from a named bank with strong pressure = red, even with no link", () => {
  const r = run(clef({ calls: 0.9, brand: { id: "bbva", p: 0.85 }, type: { id: "bank", p: 0.9 }, pressure: 2.3 }), "BBVA: cargo de 899 EUR. Llama ya al 912 345 678.");
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "call_pressure");
});

test("a calm reminder with a phone number is not a warning", () => {
  const r = run(clef({ calls: 0.9, pressure: 0.6 }), "Recordatorio: cita el martes. Si no puedes, llama al 900 123 456.");
  assert.equal(r.verdict, "green");
});

test("a call request with pressure but no named brand is only yellow", () => {
  const r = run(clef({ calls: 0.9, pressure: 2.3 }), "Llame urgentemente al 912 345 678.");
  assert.equal(r.verdict, "yellow");
  assert.equal(r.headline.code, "call_pressure");
});

test("Spanish and Latin American brands: official domains clear, look-alikes do not", () => {
  const off = (u) => extractLinks(u)[0];
  assert.equal(off("https://www.bancsabadell.com/x").kind, "official");
  assert.equal(off("https://www.unicajabanco.es").brand, "unicaja");
  assert.equal(off("https://sede.agenciatributaria.gob.es/").brand, "aeat");
  assert.equal(off("https://www.ruralvia.com").brand, "cajarural");
  for (const [u, b] of [["https://bancsabadell-seguridad.com", "sabadell"], ["https://laboral-kutxa-online.top", "laboralkutxa"], ["https://dgt-multas-pago.com", "dgt"], ["https://nequi-verifica.co", "nequi"], ["https://agenciatributaria-devolucion.info", "aeat"]]) {
    const l = off(u);
    assert.equal(l.kind, "lookalike", u);
    assert.equal(l.brand, b, u);
  }
});

test("every brand group fits in one Clef choice question", () => {
  const q = buildQuestions();
  for (const k of BRAND_QUESTIONS) assert.ok(Object.keys(q[k].criteria).length <= 26, k);
  assert.ok(BRAND_QUESTIONS.length >= 4);
});
