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
