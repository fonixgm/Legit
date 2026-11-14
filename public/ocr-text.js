// Tidies the text read from a screenshot before it is checked.
// A phone wraps long links over two or three lines; read line by line, the link comes out
// cut ("https://bbva-seguridad-" / "clientes.com/verificar") and its real domain is lost.

const URL_CHARS = /^[a-z0-9\-._~%/?=&#+:@]+$/; // lower case only: a new sentence starts with a capital
const startsLink = (t) => /^(https?:\/\/|www\.)/i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i.test(t);

export function joinWrappedLinks(text) {
  const lines = text.split("\n").map((l) => l.trim());
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && line) {
      const last = prev.split(/\s+/).pop();
      const first = line.split(/\s+/)[0];
      const cutAtBreak = /[-/_=&?.]$/.test(last); // wrapped right after a separator
      const tail = /[/.]/.test(first) && !/^(https?:\/\/|www\.)/i.test(first); // "tes.com/verificar"
      if (startsLink(last) && URL_CHARS.test(first) && (cutAtBreak || tail)) {
        out[out.length - 1] = prev + line;
        continue;
      }
    }
    out.push(line);
  }
  return out.join("\n");
}

// Screenshots carry clutter around the message: the clock, battery, "Text message", times.
export function cleanOcrText(text) {
  const joined = joinWrappedLinks(text.replace(/\r/g, "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'"));
  return joined
    .split("\n")
    .filter((l) => !/^\d{1,2}[:.]\d{2}(\s?[ap]\.?m\.?)?$/i.test(l)) // a line that is only a time
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

// ---- Keep the message, drop the phone's interface.
// A screenshot of a chat also shows the clock and battery, the sender's name, dates, the app's
// spam warnings ("Por qué parece spam… Google mantiene la privacidad…") and footers ("El
// remitente no puede aceptar respuestas"). Read as part of the message, they bury it and can
// even look like a brand ("Google"). The reader returns everything as one block, so the screen
// is split into zones by the empty space between lines, and interface zones are dropped.

const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Interface text of the usual messaging apps (Google Messages, Samsung, iOS, WhatsApp), es + en.
const INTERFACE = [
  /parece spam|looks like spam|likely spam|posible spam|probable spam|marcad[oa]s? como spam|marked as spam/,
  /marcar como seguro|mark as safe|no es spam|not spam|informar de (spam|correo no deseado)|report (spam|junk)|denunciar/,
  /google mantiene la privacidad|privacidad y la seguridad de tu informacion|keeps your (personal )?information/,
  /no puede aceptar respuestas|can.?t (accept )?repl|cannot (accept )?repl|contacta con el directamente|reply not supported/,
  /no esta en tu lista de contactos|not in your contact|no esta en tus contactos|anadir a contactos|add to contacts/,
  /cifrados de extremo a extremo|end-to-end encrypted|cuenta de empresa|business account/,
  /^(mas informacion|learn more|more info|bloquear|block|informar|report|responder|reply)\.?$/,
  /^[^a-z0-9]*(no leidos?|unread)/,
  /^(mensaje de texto|text message|imessage|sms|mms|rcs|chat)\b.{0,30}$/,
  /^(escribe un mensaje|type a message|mensaje|message)$/,
  /^(entregado|leido|enviado|delivered|read|sent|visto|seen)\b.{0,20}$/,
];
const DATE_ONLY = [
  /^(hoy|ayer|today|yesterday|lunes|martes|miercoles|jueves|viernes|sabado|domingo|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b.{0,30}\d/,
  /^\d{1,2}[ /.-](de )?[a-z]{3,10}\.?([ /.-](de )?\d{2,4})?\b.{0,12}$/,
  /^\d{1,2}[:.]\d{2}( ?[ap]\.? ?m\.?)?$/,
];
const isInterface = (text) => {
  const t = fold(text).replace(/\s+/g, " ").trim();
  return INTERFACE.some((re) => re.test(t)) || DATE_ONLY.some((re) => re.test(t));
};
const alnum = (s) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;

// lines: [{ text, confidence (0-100), y0, y1 }] in reading order; width/height of the image.
export function pickMessage(lines, { width = 0, height = 0 } = {}) {
  const usable = lines
    .map((l) => ({ ...l, text: (l.text ?? "").trim() }))
    .filter((l) => l.text && l.confidence >= 45 && alnum(l.text) >= 3);
  if (!usable.length) return "";

  // Zones: a gap clearly taller than a line of text starts a new one.
  const sorted = [...usable].sort((a, b) => a.y0 - b.y0);
  const lineH = median(sorted.map((l) => l.y1 - l.y0)) || 1;
  const zones = [];
  for (const l of sorted) {
    const zone = zones[zones.length - 1];
    if (zone && l.y0 - zone.y1 < lineH * 1.2) {
      zone.lines.push(l);
      zone.y1 = Math.max(zone.y1, l.y1);
    } else {
      zones.push({ y0: l.y0, y1: l.y1, lines: [l] });
    }
  }

  // A whole phone screen (tall image): its top strip is the status bar and the chat header.
  const fullScreen = width > 0 && height / width > 1.6;
  const kept = zones.filter((z) => {
    if (fullScreen && z.y1 < height * 0.11) return false;
    return !z.lines.some((l) => isInterface(l.text));
  });
  const chosen = kept.length ? kept : zones;
  return chosen.map((z) => z.lines.map((l) => l.text).join("\n")).join("\n\n");
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}
