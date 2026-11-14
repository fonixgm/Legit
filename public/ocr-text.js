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
