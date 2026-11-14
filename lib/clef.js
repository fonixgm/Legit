// Clef (through NaN) takes the central decision: four typed questions in ONE request.

import { BRANDS } from "./brands.js";
import { mockClef } from "./mock.js";

const URL = "https://api.nan.builders/v1/systemone";
const MAX_RETRIES = 20; // NaN allows one request in flight per key: on 429, wait and retry (bounded by BUDGET_MS)
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

// Clef accepts at most 26 options per `choice`, so the brand list is asked as one question per group.
const BRAND_GROUPS = {
  online: "an online service: shopping, technology, e-mail, streaming, social network, messaging or crypto",
  money: "a bank or a parcel delivery company",
  bank_es: "a Spanish bank",
  es_latam: "a Spanish public body, phone or energy company, or a Latin American bank or wallet",
};
export const BRAND_QUESTIONS = Object.keys(BRAND_GROUPS).map((g) => `brand_${g}`);

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
        "Does this message ask the recipient to hand over or type in personal data, a password, a PIN, a verification code or card details, to log in through a link, or to send money or make a payment? A message that only contains or announces a code, or only informs about a purchase or a delivery, does not ask for anything.",
    },
    calls: {
      type: "noul",
      instructions:
        "Does this message give a phone number or other contact detail and tell the recipient to call it, reply to it or contact someone through it?",
    },
    ...Object.fromEntries(Object.keys(BRAND_GROUPS).map((g) => [`brand_${g}`, brandQuestion(g)])),
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

// NaN allows ONE request in flight per key, and every visitor shares ours. Inside one server
// instance, wait your turn instead of firing at once and burning retries on 429s.
// The line is bounded: past MAX_WAITING we say "busy" at once (the page retries by itself)
// rather than let everyone wait for a timeout.
const MAX_WAITING = 15;
const BUDGET_MS = 20_000; // total time one check may spend queueing + retrying
let queue = Promise.resolve();
let waiting = 0;
export function inTurn(task) {
  if (waiting >= MAX_WAITING) return Promise.reject(new ClefError("Clef queue is full", 429));
  waiting++;
  const run = queue.then(task, task).finally(() => waiting--);
  queue = run.catch(() => {});
  return run;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callClef(state, questions, deadline) {
  if (process.env.CLEF_MOCK === "1") return mockClef(state);
  const key = process.env.NAN_KEY;
  if (!key) throw new ClefError("NAN_KEY is not set", 500);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const left = deadline - Date.now();
    if (left < 500) break;
    const res = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "clef", state, questions }),
      signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, left)),
    });
    if (res.ok) return res.json();
    if ([429, 502, 504].includes(res.status)) {
      // Another server instance holds the key's single slot: back off a little, unevenly,
      // so the instances do not collide again on the same beat.
      await sleep(Math.min(400 + Math.random() * 800, Math.max(0, deadline - Date.now())));
      continue;
    }
    throw new ClefError(`Clef HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
  }
  throw new ClefError("Clef busy", 429);
}

const num = (v, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

// Normalises Clef's answer into the handful of numbers the rules use.
export function readAnswers(response) {
  const a = response?.answers ?? {};
  // Fail closed: a missing or malformed answer must never be read as "nothing found", which
  // would end in a green verdict. The caller turns this into an error ("don't tap anything").
  const usable =
    typeof a.asks?.noul === "number" &&
    typeof a.calls?.noul === "number" &&
    typeof a.pressure?.score === "number" &&
    typeof a.scam_type?.choice === "string" &&
    BRAND_QUESTIONS.some((q) => typeof a[q]?.choice === "string");
  if (!usable) throw new ClefError("Clef answered with an unexpected shape", 502);
  const pick = (ans, fallbackId) => {
    const id = typeof ans?.choice === "string" ? ans.choice : fallbackId;
    return { id, p: num(ans?.probabilities?.[id], num(ans?.confidence, 0)) };
  };
  // Merge the two brand questions: a named brand beats "other", which beats "none".
  const picks = BRAND_QUESTIONS.filter((q) => a[q]).map((q) => pick(a[q], "none"));
  const named = picks.filter((b) => b.id !== "none" && b.id !== "other").sort((x, y) => y.p - x.p);
  const other = picks.filter((b) => b.id === "other").sort((x, y) => y.p - x.p);
  const brand = named[0] ?? other[0] ?? { id: "none", p: Math.min(...picks.map((b) => b.p)) };
  return {
    asks: num(a.asks?.noul),
    calls: num(a.calls?.noul),
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
  const deadline = Date.now() + BUDGET_MS;
  const response = baseline ? mockClef(state) : await inTurn(() => callClef(state, buildQuestions(), deadline));
  return readAnswers(response);
}
