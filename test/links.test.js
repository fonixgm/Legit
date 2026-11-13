import { test } from "node:test";
import assert from "node:assert/strict";
import { extractLinks, refang } from "../lib/links.js";

const one = (text) => {
  const links = extractLinks(text);
  assert.equal(links.length, 1, `expected 1 link in: ${text} -> ${JSON.stringify(links)}`);
  return links[0];
};

test("official domain, including subdomains and country sites", () => {
  assert.deepEqual(pick(one("Track it: https://www.amazon.es/gp/your-orders")), { domain: "amazon.es", kind: "official", brand: "amazon" });
  assert.equal(one("login.microsoftonline.com/common").kind, "official");
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
