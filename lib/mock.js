// DEVELOPMENT ONLY (CLEF_MOCK=1). This is NOT Clef: a few keyword guesses shaped like a
// Clef response, so the UI and the rules can be exercised without a NaN key.
// Never enable it in production and never use it for the published measurements.

import { BRANDS } from "./brands.js";

const has = (t, re) => re.test(t);

export function mockClef(state) {
  const t = state.toLowerCase();

  const asks = has(t, /contraseña|password|\bclave|\bpin\b|verif|confirm|\bpag[ao]|\bpay\b|transfer|bizum|iniciar sesión|log ?in|actualiz|update/) ? 0.85 : 0.08;

  const lure = has(t, /giros? gratis|free spins|casino|apuest|\bbet\b|bono de|bonus|gana dinero|easy money|trading|rentabilidad/) ? 0.8 : 0.05;

  const calls = has(t, /llama|llame|call (us|now|this)|contact(a|e)|\b\d{3}[ .-]?\d{3}[ .-]?\d{3}\b/) ? 0.8 : 0.05;

  let brand = "none";
  for (const [id, b] of Object.entries(BRANDS)) {
    if ([b.name.toLowerCase(), ...b.keywords].some((k) => new RegExp(`\\b${k}\\b`).test(t))) {
      brand = id;
      break;
    }
  }

  let type = "none";
  if (has(t, /banco|bank|tarjeta|card|cuenta bancaria/)) type = "bank";
  else if (has(t, /paquete|envío|parcel|package|delivery|aduana|customs/)) type = "delivery";
  else if (has(t, /premio|ganado|won|prize|gift card|sorteo/)) type = "prize";
  else if (has(t, /número nuevo|móvil nuevo|new number|nuevo número|new phone/)) type = "family";
  else if (has(t, /virus|soporte|support|técnico/)) type = "tech_support";
  else if (has(t, /inversión|invest|crypto|bitcoin|rentabilidad/)) type = "investment";
  else if (has(t, /suspend|bloquead|locked|expir|caduc|suscripción|subscription/)) type = "account";
  if (brand !== "none" && type === "none" && asks > 0.5) type = "account";

  const urgent = has(t, /urgente|urgent|inmediat|immediately|24 ?h|hoy|today|bloquead|suspend|último aviso|final notice/);
  const pressure = urgent ? 2.4 : 0.3;

  return {
    model: "mock",
    answers: {
      asks: { type: "noul", noul: asks },
      calls: { type: "noul", noul: calls },
      lure: { type: "noul", noul: lure },
      via_link: { type: "noul", noul: has(t, /enlace|link|https?:|www\.|\[url|pulse|clic|siguiente/) ? 0.8 : 0.05 },
      new_number: { type: "noul", noul: has(t, /n[uú]mero (nuevo|temporal)|nuevo n[uú]mero|new number/) ? 0.85 : 0.05 },
      only_code: { type: "noul", noul: has(t, /c[oó]digo|code/) && !has(t, /enlace|link|http/) ? 0.7 : 0.05 },
      brand_online: { type: "choice", choice: brand, probabilities: { [brand]: 0.9 }, confidence: 0.9 },
      brand_money: { type: "choice", choice: "none", probabilities: { none: 0.9 }, confidence: 0.9 },
      scam_type: { type: "choice", choice: type, probabilities: { [type]: 0.8 }, confidence: 0.8 },
      pressure: { type: "score", score: pressure, confidence: 0.7 },
    },
  };
}
