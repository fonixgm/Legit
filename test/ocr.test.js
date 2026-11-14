import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanOcrText, joinWrappedLinks, pickMessage } from "../public/ocr-text.js";
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

// Lines read from a real screenshot (Google Messages, dark mode, 1440x3120): a casino-bonus SMS
// under Google's spam warning. [confidence, y0, y1, text]
const REAL = [
  [23, 33, 103, "15:35 @ encontréel J - * NER"], [54, 197, 234, ". 9"], [83, 208, 290, "& a India :"],
  [96, 476, 530, "Por qué parece spam"], [95, 561, 609, "Los mensajes similares que has recibido se han"],
  [94, 629, 677, "marcado como spam. Google mantiene la"], [97, 697, 745, "privacidad y la seguridad de tu información"],
  [97, 765, 812, "personal."], [97, 937, 982, "Marcar como seguro"], [10, 2075, 2108, "— No leidlos—8 —————"],
  [86, 2160, 2200, "jueves, 27 ago + 19:33"], [97, 2312, 2366, "Has recibido un bono en Euros y"],
  [96, 2393, 2448, "GirosGratis. Empieza ahora y gana en"], [63, 2474, 2529, "grande! cc9tg.vip/ewjgt2l"],
  [97, 2720, 2774, "El remitente no puede aceptar respuestas."], [97, 2800, 2844, "Contacta con él directamente. Más información"],
].map(([confidence, y0, y1, text]) => ({ confidence, y0, y1, text }));

test("a real screenshot keeps only the message, not the phone's interface", () => {
  const text = cleanOcrText(pickMessage(REAL, { width: 1440, height: 3120 }));
  assert.equal(text, "Has recibido un bono en Euros y\nGirosGratis. Empieza ahora y gana en\ngrande! cc9tg.vip/ewjgt2l");
  assert.equal(extractLinks(text)[0].domain, "cc9tg.vip");
});

test("a screenshot cropped to the bubble is kept whole", () => {
  const cropped = [
    { confidence: 95, y0: 10, y1: 50, text: "Correos: su paquete está retenido." },
    { confidence: 93, y0: 60, y1: 100, text: "Pague 1,99 EUR en envio-pendiente.info/pago" },
  ];
  assert.equal(pickMessage(cropped, { width: 900, height: 140 }), "Correos: su paquete está retenido.\nPague 1,99 EUR en envio-pendiente.info/pago");
});

test("if everything looks like interface, nothing is thrown away", () => {
  const only = [{ confidence: 90, y0: 500, y1: 540, text: "Marcar como seguro" }];
  assert.equal(pickMessage(only, { width: 1000, height: 2000 }), "Marcar como seguro");
});
