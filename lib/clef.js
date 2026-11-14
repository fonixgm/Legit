// Clef (through NaN) takes the central decision: four typed questions in ONE request.

import { BRANDS } from "./brands.js";
import { mockClef } from "./mock.js";

const URL = "https://api.nan.builders/v1/systemone";
const MAX_RETRIES = 8; // NaN allows one request in flight per key: on 429, wait and retry
const TIMEOUT_MS = 25_000; // under the 30 s function limit in vercel.json, so the user gets our error, not a platform 504

export const SCAM_TYPES = {
  bank: "Pretends to be a bank or card issuer: blocked account or card, suspicious charge, verify your identity",
  delivery: "A parcel that is held, undelivered or needs a customs fee or address confirmation",
  account: "An online account or subscription (shopping, e-mail, streaming, social network) is suspended, expiring or was accessed, and must be verified or renewed",
  prize: "A prize, lottery, gift card, refund or giveaway the recipient has supposedly won",
  family: "Someone claiming to be a relative or friend with a new phone number or an emergency who needs money",
  tech_support: "Fake technical support: your device has a virus or a problem, call or install something",
  investment: "An investment, crypto or easy-money or job offer promising high returns",
  none: "An ordinary, harmless message: no scam pattern at all",
};

export const PRESSURE_LEVELS = [
  "No pressure at all",
  "Mild: a polite reminder or a normal deadline",
  "Strong: act today or lose something",
  "Extreme: threats, immediate blocking, legal action or act within minutes",
];

// Clef accepts at most 26 options per `choice`, so the brand list is asked as two questions.
const BRAND_GROUPS = {
  online: "an online service: shopping, technology, e-mail, streaming, social network, messaging or crypto",
  money: "a bank or a parcel delivery company",
};

export function buildQuestions() {
  const brandQuestion = (group) => {
    const criteria = {};
    for (const [id, b] of Object.entries(BRANDS)) if (b.group === group) criteria[id] = b.desc;
    criteria.other = "Any other company, bank or public institution that is not in this list";
    criteria.none = "No company or institution: a personal message, or no sender identity is claimed";
    return {
      type: "choice",
      instructions: `Which of these companies does this message claim to come from? The list only covers ${BRAND_GROUPS[group]}.`,
      criteria,
    };
  };

  return {
    asks: {
      type: "noul",
      instructions:
        "Does this message ask the recipient to give personal data, passwords, PINs, verification codes or card details, to log in through a link, or to send money or make a payment?",
    },
    brand_online: brandQuestion("online"),
    brand_money: brandQuestion("money"),
    scam_type: {
      type: "choice",
      instructions: "Which of these patterns does this message follow?",
      criteria: SCAM_TYPES,
    },
    pressure: {
      type: "score",
      instructions: "How much urgency or pressure does this message put on the recipient to act quickly?",
      criteria: PRESSURE_LEVELS,
    },
  };
}

export class ClefError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function callClef(state, questions) {
  if (process.env.CLEF_MOCK === "1") return mockClef(state);
  const key = process.env.NAN_KEY;
  if (!key) throw new ClefError("NAN_KEY is not set", 500);

  let last = 0;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "clef", state, questions }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return res.json();
    last = res.status;
    if ([429, 502, 504].includes(res.status) && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    throw new ClefError(`Clef HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
  }
  throw new ClefError("Clef busy", last);
}

const num = (v, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

// Normalises Clef's answer into the handful of numbers the rules use.
export function readAnswers(response) {
  const a = response?.answers ?? {};
  // Fail closed: a missing or malformed answer must never be read as "nothing found", which
  // would end in a green verdict. The caller turns this into an error ("don't tap anything").
  const usable =
    typeof a.asks?.noul === "number" &&
    typeof a.pressure?.score === "number" &&
    typeof a.scam_type?.choice === "string" &&
    (typeof a.brand_online?.choice === "string" || typeof a.brand_money?.choice === "string");
  if (!usable) throw new ClefError("Clef answered with an unexpected shape", 502);
  const pick = (ans, fallbackId) => {
    const id = typeof ans?.choice === "string" ? ans.choice : fallbackId;
    return { id, p: num(ans?.probabilities?.[id], num(ans?.confidence, 0)) };
  };
  // Merge the two brand questions: a named brand beats "other", which beats "none".
  const picks = [pick(a.brand_online, "none"), pick(a.brand_money, "none")];
  const named = picks.filter((b) => b.id !== "none" && b.id !== "other").sort((x, y) => y.p - x.p);
  const other = picks.filter((b) => b.id === "other").sort((x, y) => y.p - x.p);
  const brand = named[0] ?? other[0] ?? { id: "none", p: Math.min(picks[0].p, picks[1].p) };
  return {
    asks: num(a.asks?.noul),
    brand,
    type: pick(a.scam_type, "none"),
    pressure: num(a.pressure?.score), // 0 .. 3
    pressureConfidence: num(a.pressure?.confidence),
  };
}

// `baseline: true` swaps Clef for the keyword guesses of lib/mock.js. It is the "no Clef"
// arm of the measurement (eval/run.mjs): same links check, same rules, no model.
export async function askClef(message, { baseline = false } = {}) {
  const state = `Message received on a phone:\n\n${message}`;
  const response = baseline ? mockClef(state) : await callClef(state, buildQuestions());
  return readAnswers(response);
}
