import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanOcrText, joinWrappedLinks } from "../public/ocr-text.js";
import { extractLinks } from "../lib/links.js";

test("a link wrapped over lines is put back together", () => {
  const t = joinWrappedLinks("BBVA: verifique su identidad ahora: https://bbva-seguridad-\nclientes.com/verificar\nGracias");
  assert.match(t, /https:\/\/bbva-seguridad-clientes\.com\/verificar\nGracias/);
  assert.equal(extractLinks(t)[0].domain, "bbva-seguridad-clientes.com");
  assert.equal(extractLinks(joinWrappedLinks("Entra en https://www.amazon.es/gp/css/\norder-history?ref=abc"))[0].kind, "official");
  assert.equal(joinWrappedLinks("mira https://envio-pendien\nte.info/es/pago ya"), "mira https://envio-pendiente.info/es/pago ya");
});

test("the text after a complete link is left alone", () => {
  for (const t of ["Consulta en https://www.bbva.es\nGracias por confiar", "Consulta en https://www.bbva.es.\nUn saludo", "Web: https://www.bbva.es\nconsulta tu saldo", "Hola\nmamá"]) {
    assert.equal(joinWrappedLinks(t), t);
  }
  assert.equal(extractLinks(joinWrappedLinks("Consulta en https://www.bbva.es\nGracias"))[0].kind, "official");
});

test("screen clutter is dropped", () => {
  assert.equal(cleanOcrText("10:42\nCorreos: su paquete\n\n\n\nllega hoy\n9:15 PM"), "Correos: su paquete\n\nllega hoy");
});
