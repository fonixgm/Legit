import { test } from "node:test";
import { decide } from "../lib/verdict.js";
import assert from "node:assert/strict";
import { extractLinks, refang, verifyByRedirect } from "../lib/links.js";

const one = (text) => {
  const links = extractLinks(text);
  assert.equal(links.length, 1, `expected 1 link in: ${text} -> ${JSON.stringify(links)}`);
  return links[0];
};

test("official domain, including subdomains and country sites", () => {
  assert.deepEqual(pick(one("Track it: https://www.amazon.es/gp/your-orders")), { domain: "amazon.es", kind: "official", brand: "amazon" });
  assert.equal(one("login.microsoftonline.com/common").kind, "official");
});

test("brand name with an unlisted country ending is unverified, not an imitation", () => {
  assert.equal(one("https://www.amazon.cl/ofertas").kind, "official");
  const l = one("https://www.netflix.co/login");
  assert.equal(l.kind, "unverified");
  assert.equal(l.brand, "netflix");
  assert.equal(one("https://amazon-cl.com").kind, "lookalike");
});

test("brand as a subdomain of someone else's domain is not official", () => {
  const l = one("https://amazon.com.account-check.xyz/login");
  assert.equal(l.domain, "account-check.xyz");
  assert.equal(l.kind, "lookalike");
  assert.equal(l.brand, "amazon");
});

test("look-alikes: hyphens, digits for letters, squashed names", () => {
  assert.equal(one("http://bbva-seguridad-clientes.com/x").brand, "bbva");
  assert.equal(one("https://paypa1.com/signin").kind, "lookalike");
  assert.equal(one("https://secure-amaz0n.co/a").brand, "amazon");
  assert.equal(one("https://wells-fargo-alerts.net").brand, "wellsfargo");
});

test("misspelt brand names are imitations", () => {
  assert.equal(one("https://mcirosfot.com/login").brand, "microsoft");
  assert.equal(one("https://micorsoft-support.net").brand, "microsoft");
  assert.equal(one("https://netfilx.com").brand, "netflix");
  assert.equal(one("https://secure.paypla.com/x").brand, "paypal");
  assert.equal(one("https://amazing-deals.com").kind, "unknown");
  assert.equal(one("https://googol.org").kind, "unknown");
});

test("an unlisted brand domain that redirects to the official site becomes official", async () => {
  const reply = (status, location) => ({ status, headers: new Headers(location ? { location } : {}) });
  const good = extractLinks("https://www.netflix.co/login");
  await verifyByRedirect(good, async () => reply(301, "https://www.netflix.com/co/"));
  assert.equal(good[0].kind, "official");

  const parked = extractLinks("https://www.netflix.co/login");
  await verifyByRedirect(parked, async () => reply(200));
  assert.equal(parked[0].kind, "unverified");

  const elsewhere = extractLinks("https://www.netflix.co/login");
  await verifyByRedirect(elsewhere, async () => reply(302, "https://parking-ads.example.com/"));
  assert.equal(elsewhere[0].kind, "unverified");
});

test("short keywords only match whole tokens", () => {
  assert.equal(one("https://purchase-groups.com/cart").kind, "unknown");
  assert.equal(one("https://pineapple.com").kind, "unknown");
  assert.equal(one("https://ups-redelivery.info").brand, "ups");
});

test("shorteners and IPs", () => {
  assert.equal(one("mira bit.ly/3xYz").kind, "shortener");
  assert.equal(one("http://185.12.44.9/bank").kind, "ip");
});

test("homoglyph: Cyrillic letters inside a Latin name", () => {
  const l = one("https://аmazon.com/login"); // first letter is Cyrillic а
  assert.equal(l.kind, "homoglyph");
});

test("userinfo trick points at the real host", () => {
  const l = one("http://amazon.com@evil-site.xyz/pay");
  assert.equal(l.domain, "evil-site.xyz");
  assert.equal(l.userinfo, true);
});

test("neutralised links are understood", () => {
  assert.equal(refang("hxxps://evil[.]com/a"), "https://evil.com/a");
  assert.equal(one("hxxps://netflix-billing[.]top/pay").brand, "netflix");
});

test("plain text is not mistaken for links", () => {
  assert.equal(extractLinks("Hola mamá.Estoy bien, llego a las 5.30. Escribe a ana@gmail.com").length, 0);
  assert.equal(extractLinks("Your code is 482913. Never share it.").length, 0);
});

function pick({ domain, kind, brand }) {
  return { domain, kind, brand };
}

test("homograph domains in Cyrillic, Greek or Armenian are caught and name the brand they imitate", () => {
  const cases = [
    ["https://pаypal.com/login", "paypal"], // one Cyrillic а
    ["https://аррӏе.com/id", "apple"], // аррӏе: all Cyrillic, no mixing
    ["https://xn--80ak6aa92e.com/", "apple"], // the same, written in punycode
    ["https://gοοgle.com", "google"], // Greek ο
    ["https://саіхаbank.com", "caixabank"], // саіха + Latin bank
    ["https://nеtflix-аccount.com", "netflix"],
  ];
  for (const [url, brand] of cases) {
    const [l] = extractLinks(url);
    assert.equal(l.kind, "homoglyph", url);
    assert.equal(l.brand, brand, url);
  }
});

test("real non-Latin domains are not homographs", () => {
  for (const url of ["https://пример.рф", "https://яндекс.рф/путь", "https://ελληνικά.gr"]) {
    const [l] = extractLinks(url);
    assert.notEqual(l?.kind, "homoglyph", url);
  }
});

test("a Cyrillic homograph of the claimed bank is red", () => {
  const r = decide(
    { asks: 0.9, calls: 0.05, brand: { id: "caixabank", p: 0.9 }, type: { id: "bank", p: 0.9 }, pressure: 2.5 },
    extractLinks("CaixaBank: verifique su cuenta https://саіхаbank.com/acceso"),
  );
  assert.equal(r.verdict, "red");
  assert.equal(r.headline.code, "homoglyph");
});
