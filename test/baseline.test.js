import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMessage } from "../lib/check.js";

// The baseline must work with no key and no network: it is the "without Clef" arm of the eval.
test("baseline runs offline and is not flagged as mock", async () => {
  delete process.env.NAN_KEY;
  const r = await checkMessage("BBVA: su cuenta sera bloqueada. Verifique ya: https://bbva-seguridad-clientes.com/x", { baseline: true });
  assert.equal(r.verdict, "red");
  assert.equal(r.mock, undefined);
});

test("baseline clears a plain family message", async () => {
  const r = await checkMessage("Hola mamá, llego sobre las 5.30. ¿Compro pan?", { baseline: true });
  assert.equal(r.verdict, "green");
});

test("inTurn runs tasks one at a time, in order, and survives a failure", async () => {
  const { inTurn } = await import("../lib/clef.js");
  let running = 0, peak = 0;
  const order = [];
  const task = (n, fail = false) => () => new Promise((res, rej) => {
    running++; peak = Math.max(peak, running);
    setTimeout(() => { running--; order.push(n); fail ? rej(new Error("x")) : res(n); }, 10);
  });
  const results = await Promise.allSettled([inTurn(task(1)), inTurn(task(2, true)), inTurn(task(3))]);
  assert.equal(peak, 1);
  assert.deepEqual(order, [1, 2, 3]);
  assert.deepEqual(results.map((r) => r.status), ["fulfilled", "rejected", "fulfilled"]);
});
