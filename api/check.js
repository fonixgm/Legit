// POST /api/check  { "text": "..." }  ->  verdict JSON
// Runs on the server so the NaN key never reaches the browser.
// The message is not stored and not logged.

import { checkMessage, MAX_CHARS } from "../lib/check.js";
import { ClefError } from "../lib/clef.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ error: "empty" });
  if (text.length > MAX_CHARS) return res.status(413).json({ error: "too_long", max: MAX_CHARS });

  try {
    return res.status(200).json(await checkMessage(text));
  } catch (err) {
    const status = err instanceof ClefError ? err.status : 0;
    // Log the failure, never the message.
    console.error("check failed:", status, err?.name, err instanceof ClefError ? err.message : "");
    if (status === 429) return res.status(503).json({ error: "busy" });
    return res.status(502).json({ error: "unavailable" });
  }
}
