// Local dev server (no Vercel CLI needed): serves public/ and routes /api/check.
//   NAN_KEY=... npm run dev        real Clef
//   CLEF_MOCK=1 npm run dev        simulated answers, NOT Clef

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/check.js";

const PUBLIC = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const PORT = Number(process.env.PORT) || 3000;

createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/api/check") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (data) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };
    return handler(req, res);
  }
  const file = join(PUBLIC, normalize(path === "/" ? "/index.html" : path));
  if (!file.startsWith(PUBLIC)) return res.writeHead(403).end();
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, () => {
  console.log(`Legit? on http://localhost:${PORT}${process.env.CLEF_MOCK === "1" ? "  (MOCK — not Clef)" : ""}`);
});
