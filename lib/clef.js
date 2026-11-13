// Clef (through NaN) takes the central decision: four typed questions in ONE request.

import { BRANDS } from "./brands.js";
import { mockClef } from "./mock.js";

const URL = "https://api.nan.builders/v1/systemone";
const MAX_RETRIES = 8; // NaN allows one request in flight per key: on 429, wait and retry
const TIMEOUT_MS = 50_000;

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

export function buildQuestions() {
  const brands = {};
  for (const [id, b] of Object.entries(BRANDS)) brands[id] = b.desc;
  brands.other = "Another specific company, bank or public institution not in this list";
  brands.none = "No company or institution: a personal message, or no sender identity is claimed";

  return {
    asks: {
      type: "noul",
      instructions:
        "Does this message ask the recipient to give personal data, passwords, PINs, verification codes or card details, to log in through a link, or to send money or make a payment?",
    },
    brand: {
      type: "choice",
      instructions: "Which company or institution does this message claim to come from?",
      criteria: brands,
    },
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
  const pick = (ans, fallbackId) => {
    const id = typeof ans?.choice === "string" ? ans.choice : fallbackId;
    return { id, p: num(ans?.probabilities?.[id], num(ans?.confidence, 0)) };
  };
  return {
    asks: num(a.asks?.noul),
    brand: pick(a.brand, "none"),
    type: pick(a.scam_type, "none"),
    pressure: num(a.pressure?.score), // 0 .. 3
    pressureConfidence: num(a.pressure?.confidence),
  };
}

export async function askClef(message) {
  const response = await callClef(`Message received on a phone:\n\n${message}`, buildQuestions());
  return readAnswers(response);
}
