import { test } from "node:test";
import assert from "node:assert/strict";
import { isImageDataUrl, linksSeenByClef, checkMessage } from "../lib/check.js";
import { buildQuestions, readAnswers, ClefError } from "../lib/clef.js";
import { decide } from "../lib/verdict.js";

const clef = (o = {}) => ({
  asks: 0.1, calls: 0.05, lure: 0.05, brand: { id: "none", p: 0.9 }, type: { id: "none", p: 0.9 }, pressure: 0.2,
  hasLink: 0, linkOdd: 0, ...o,
});
const fromShot = (c) => decide(c, linksSeenByClef(c));

test("only real screenshots are accepted", () => {
  assert.ok(isImageDataUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg=="));
  assert.ok(isImageDataUrl("data:image/png;base64,iVBORw0KGgo="));
  for (const bad of ["", "hola", "data:text/html;base64,PHNjcmlwdD4=", "https://example.com/a.jpg", "data:image/jpeg;base64,<script>", 42, null]) {
    assert.equal(isImageDataUrl(bad), false, String(bad));
  }
  assert.equal(isImageDataUrl("data:image/jpeg;base64," + "A".repeat(3_000_001)), false);
});

test("with a screenshot Clef is also asked about the link, and must answer", () => {
  assert.ok(buildQuestions({ image: true }).has_link && buildQuestions({ image: true }).link_odd);
  assert.equal(buildQuestions().has_link, undefined);
  const base = {
    asks: { noul: 0.1 }, calls: { noul: 0.1 }, lure: { noul: 0.1 }, via_link: { noul: 0.1 }, new_number: { noul: 0.05 }, only_code: { noul: 0.05 }, scam_type: { choice: "none" }, pressure: { score: 0 }, brand_online: { choice: "none" },
  };
  assert.throws(() => readAnswers({ answers: base }, { image: true }), ClefError);
  const a = readAnswers({ answers: { ...base, has_link: { noul: 0.9 }, link_odd: { noul: 0.8 } } }, { image: true });
  assert.equal(a.hasLink, 0.9);
  assert.equal(a.linkOdd, 0.8);
});

test("screenshot verdicts: Clef's view of the link feeds the same rules", () => {
  // The casino screenshot that came out green when only the text reader was used.
  const casino = fromShot(clef({ lure: 0.73, type: { id: "prize", p: 0.84 }, hasLink: 0.95, linkOdd: 0.9 }));
  assert.equal(casino.verdict, "red");
  assert.equal(casino.headline.code, "lure_link");
  assert.equal(casino.headline.domain, null);

  const bbva = fromShot(clef({ asks: 0.98, brand: { id: "bbva", p: 0.8 }, type: { id: "bank", p: 0.93 }, pressure: 2.5, hasLink: 0.95, linkOdd: 0.9 }));
  assert.equal(bbva.verdict, "red");
  assert.equal(bbva.headline.code, "brand_link_mismatch");

  const amazon = fromShot(clef({ asks: 0.07, brand: { id: "amazon", p: 0.82 }, hasLink: 0.95, linkOdd: 0.1 }));
  assert.equal(amazon.verdict, "green");
  assert.equal(amazon.headline.code, "official_link");

  const plain = fromShot(clef({ hasLink: 0.02 }));
  assert.equal(plain.verdict, "green");
  assert.equal(plain.headline.code, "clean");
});

test("the screenshot itself is what Clef receives", async () => {
  const realFetch = globalThis.fetch;
  const oldKey = process.env.NAN_KEY, oldMock = process.env.CLEF_MOCK;
  process.env.NAN_KEY = "test"; delete process.env.CLEF_MOCK;
  let sent;
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(init.body);
    const answers = {
      asks: { noul: 0.1 }, calls: { noul: 0.1 }, lure: { noul: 0.9 }, via_link: { noul: 0.1 }, new_number: { noul: 0.05 }, only_code: { noul: 0.05 }, scam_type: { choice: "prize", probabilities: { prize: 0.8 } },
      pressure: { score: 1 }, brand_online: { choice: "none", probabilities: { none: 0.9 } }, has_link: { noul: 0.9 }, link_odd: { noul: 0.9 },
    };
    return new Response(JSON.stringify({ answers }), { status: 200 });
  };
  try {
    const shot = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const r = await checkMessage("", { image: shot });
    assert.deepEqual(sent.images, [shot]);
    assert.ok(sent.questions.has_link && sent.questions.link_odd);
    assert.equal(r.verdict, "red");
    assert.equal(r.image, true);
  } finally {
    globalThis.fetch = realFetch;
    if (oldKey === undefined) delete process.env.NAN_KEY; else process.env.NAN_KEY = oldKey;
    if (oldMock !== undefined) process.env.CLEF_MOCK = oldMock;
  }
});

test("a bank that tells you to call the number in the message is never green", () => {
  // The call-back scam as Clef saw it in a screenshot: pressure right at the line (0.96).
  const r = fromShot(clef({ asks: 0.12, calls: 0.98, brand: { id: "bbva", p: 0.85 }, type: { id: "bank", p: 0.94 }, pressure: 0.96 }));
  assert.equal(r.verdict, "yellow");
  assert.equal(r.headline.code, "call_number");
  // A friend asking you to call back is not a warning.
  assert.equal(fromShot(clef({ calls: 0.9, pressure: 0.3 })).verdict, "green");
});
