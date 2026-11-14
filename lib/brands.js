// Brands Legit? knows about.
//  - `desc` is what Clef reads to tell one brand from another.
//  - `domains` are the registrable domains the brand really owns (hand-curated: when in
//    doubt, leave a domain OUT — a missing domain gives a false warning, a wrong one gives
//    a false "all clear").
//  - `keywords` are used to spot look-alike domains (amazon-security.xyz, paypa1.com...).
//    Keywords of 5 letters or fewer only match whole labels/tokens, never substrings.
//  - `group` splits the list in two Clef questions: a `choice` takes at most 26 options.

import { GOOGLE_DOMAINS } from "./google-domains.js";

export const BRANDS = {
  amazon: {
    group: "online",
    name: "Amazon",
    desc: "Amazon, Amazon Prime or AWS",
    domains: [
      "amazon.com", "amazon.es", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it",
      "amazon.nl", "amazon.ca", "amazon.com.mx", "amazon.com.br", "amazon.in",
      "amazon.co.jp", "amazon.com.au", "amazon.se", "amazon.pl", "amazon.com.be",
      "amazon.com.tr", "amazon.ae", "amazon.sa", "amazon.eg", "amazon.sg", "amazon.ie",
      "amazon.co.za", "amazon.cn",
      // These redirect to amazon.com (checked 13 Nov 2026).
      "amazon.cl", "amazon.com.co", "amazon.com.ar", "amazon.pe",
      "amzn.to", "amzn.com", "a.co", "primevideo.com",
    ],
    keywords: ["amazon", "amzn"],
  },
  microsoft: {
    group: "online",
    name: "Microsoft",
    desc: "Microsoft, Outlook, Hotmail, Office 365, OneDrive, Teams, Windows or Xbox",
    domains: [
      "microsoft.com", "live.com", "outlook.com", "hotmail.com", "office.com",
      "office365.com", "microsoft365.com", "microsoftonline.com", "sharepoint.com",
      "onedrive.com", "1drv.ms", "windows.com", "xbox.com", "skype.com", "msn.com",
      "bing.com", "azure.com", "aka.ms",
    ],
    keywords: ["microsoft", "outlook", "office365", "onedrive", "hotmail"],
  },
  apple: {
    group: "online",
    name: "Apple",
    desc: "Apple, iCloud, Apple ID, App Store or iTunes",
    domains: ["apple.com", "icloud.com", "me.com", "apple.co", "itunes.com"],
    keywords: ["apple", "icloud", "appleid"],
  },
  google: {
    group: "online",
    name: "Google",
    desc: "Google, Gmail, YouTube, Google Drive or Android",
    domains: [
      ...GOOGLE_DOMAINS, "gmail.com", "googlemail.com", "youtube.com", "youtu.be",
      "goo.gl", "g.co", "android.com", "withgoogle.com",
    ],
    keywords: ["google", "gmail", "youtube"],
  },
  paypal: {
    group: "online",
    name: "PayPal",
    desc: "PayPal",
    domains: ["paypal.com", "paypal.me"],
    keywords: ["paypal"],
  },
  netflix: {
    group: "online",
    name: "Netflix",
    desc: "Netflix",
    domains: ["netflix.com"],
    keywords: ["netflix"],
  },
  spotify: {
    group: "online",
    name: "Spotify",
    desc: "Spotify",
    domains: ["spotify.com"],
    keywords: ["spotify"],
  },
  facebook: {
    group: "online",
    name: "Facebook",
    desc: "Facebook, Messenger or Meta",
    domains: ["facebook.com", "fb.com", "fb.me", "messenger.com", "m.me", "meta.com"],
    keywords: ["facebook", "meta"],
  },
  instagram: {
    group: "online",
    name: "Instagram",
    desc: "Instagram",
    domains: ["instagram.com", "instagr.am", "ig.me"],
    keywords: ["instagram"],
  },
  whatsapp: {
    group: "online",
    name: "WhatsApp",
    desc: "WhatsApp (the company itself, e.g. account verification), not just a message received on WhatsApp",
    domains: ["whatsapp.com", "whatsapp.net", "wa.me"],
    keywords: ["whatsapp"],
  },
  telegram: {
    group: "online",
    name: "Telegram",
    desc: "Telegram (the company itself)",
    domains: ["telegram.org", "t.me", "telegram.me"],
    keywords: ["telegram"],
  },
  linkedin: {
    group: "online",
    name: "LinkedIn",
    desc: "LinkedIn",
    domains: ["linkedin.com", "lnkd.in"],
    keywords: ["linkedin"],
  },
  tiktok: {
    group: "online",
    name: "TikTok",
    desc: "TikTok",
    domains: ["tiktok.com"],
    keywords: ["tiktok"],
  },
  ebay: {
    group: "online",
    name: "eBay",
    desc: "eBay",
    domains: ["ebay.com", "ebay.es", "ebay.co.uk", "ebay.de", "ebay.it", "ebay.fr", "ebay.ca", "ebay.com.au"],
    keywords: ["ebay"],
  },
  mercadolibre: {
    group: "online",
    name: "Mercado Libre",
    desc: "Mercado Libre or Mercado Pago",
    domains: [
      "mercadolibre.com", "mercadolibre.com.mx", "mercadolibre.com.ar",
      "mercadolibre.com.co", "mercadolibre.cl", "mercadolibre.com.uy", "mercadolibre.com.ve",
      "mercadolibre.com.pe", "mercadolivre.com.br", "mercadolivre.com", "mercadopago.com",
      "mercadopago.com.br", "mercadopago.com.ar", "mercadopago.com.mx", "mercadopago.cl",
    ],
    keywords: ["mercadolibre", "mercadolivre", "mercadopago"],
  },
  dhl: {
    group: "money",
    name: "DHL",
    desc: "DHL parcel delivery",
    domains: ["dhl.com", "dhl.de"],
    keywords: ["dhl"],
  },
  fedex: {
    group: "money",
    name: "FedEx",
    desc: "FedEx parcel delivery",
    domains: ["fedex.com"],
    keywords: ["fedex"],
  },
  ups: {
    group: "money",
    name: "UPS",
    desc: "UPS parcel delivery",
    domains: ["ups.com"],
    keywords: ["ups"],
  },
  usps: {
    group: "money",
    name: "USPS",
    desc: "USPS, the United States Postal Service",
    domains: ["usps.com"],
    keywords: ["usps"],
  },
  correos: {
    group: "money",
    name: "Correos",
    desc: "Correos, the Spanish postal service",
    domains: ["correos.es", "correosexpress.com"],
    keywords: ["correos"],
  },
  santander: {
    group: "money",
    name: "Santander",
    desc: "Banco Santander",
    domains: [
      "bancosantander.es", "santander.com", "santander.co.uk", "santander.com.mx",
      "santander.com.br", "santanderbank.com",
    ],
    keywords: ["santander"],
  },
  bbva: {
    group: "money",
    name: "BBVA",
    desc: "BBVA bank",
    domains: ["bbva.es", "bbva.com", "bbva.mx", "bbva.com.co", "bbva.com.ar", "bbva.pe"],
    keywords: ["bbva"],
  },
  caixabank: {
    group: "money",
    name: "CaixaBank",
    desc: "CaixaBank or La Caixa",
    domains: ["caixabank.es", "caixabank.com"],
    keywords: ["caixabank", "lacaixa"],
  },
  bancolombia: {
    group: "money",
    name: "Bancolombia",
    desc: "Bancolombia",
    domains: ["bancolombia.com", "grupobancolombia.com"],
    keywords: ["bancolombia"],
  },
  chase: {
    group: "money",
    name: "Chase",
    desc: "Chase or JPMorgan Chase bank",
    domains: ["chase.com", "jpmorganchase.com"],
    keywords: ["chase"],
  },
  bankofamerica: {
    group: "money",
    name: "Bank of America",
    desc: "Bank of America",
    domains: ["bankofamerica.com", "bofa.com"],
    keywords: ["bankofamerica", "bofa"],
  },
  wellsfargo: {
    group: "money",
    name: "Wells Fargo",
    desc: "Wells Fargo bank",
    domains: ["wellsfargo.com", "wf.com"],
    keywords: ["wellsfargo"],
  },
  hsbc: {
    group: "money",
    name: "HSBC",
    desc: "HSBC bank",
    domains: ["hsbc.com", "hsbc.co.uk", "hsbc.com.mx", "hsbc.com.hk"],
    keywords: ["hsbc"],
  },
  binance: {
    group: "online",
    name: "Binance",
    desc: "Binance crypto exchange",
    domains: ["binance.com"],
    keywords: ["binance"],
  },
  coinbase: {
    group: "online",
    name: "Coinbase",
    desc: "Coinbase crypto exchange",
    domains: ["coinbase.com"],
    keywords: ["coinbase"],
  },

  // ---- Spain and Latin America (added 14 Nov 2026). Each domain was checked against the
  // brand's official website in Wikidata (P856, QID given) and/or by loading it (HTTP 200 on
  // the brand's own site). Left OUT for lack of proof: seg-social.es, seur.com, cajarural.com,
  // agenciatributaria.es. Add them only with a source.
  sabadell: { group: "bank_es", name: "Banco Sabadell", desc: "Banco Sabadell (Spanish bank)",
    domains: ["bancsabadell.com"], keywords: ["sabadell", "bancsabadell"] }, // Q762330 + live
  unicaja: { group: "bank_es", name: "Unicaja", desc: "Unicaja Banco (Spanish bank, formerly also Liberbank)",
    domains: ["unicajabanco.es"], keywords: ["unicaja", "unicajabanco"] }, // Q20908850 + live
  ing: { group: "bank_es", name: "ING", desc: "ING bank in Spain (ING Direct)",
    domains: ["ing.es"], keywords: ["ing"] }, // live only (no Wikidata P856 for ING España)
  openbank: { group: "bank_es", name: "Openbank", desc: "Openbank (Spanish online bank of Santander group)",
    domains: ["openbank.es"], keywords: ["openbank"] }, // Q7096483 + live
  abanca: { group: "bank_es", name: "Abanca", desc: "Abanca (Spanish bank from Galicia)",
    domains: ["abanca.com"], keywords: ["abanca"] }, // Q9598744 + live
  laboralkutxa: { group: "bank_es", name: "Laboral Kutxa", desc: "Laboral Kutxa (Basque cooperative bank)",
    domains: ["laboralkutxa.com"], keywords: ["laboralkutxa"] }, // Q12052386 + live
  kutxabank: { group: "bank_es", name: "Kutxabank", desc: "Kutxabank (Basque bank)",
    domains: ["kutxabank.es"], keywords: ["kutxabank", "kutxa"] }, // Q5139377 + live
  bankinter: { group: "bank_es", name: "Bankinter", desc: "Bankinter (Spanish bank)",
    domains: ["bankinter.com"], keywords: ["bankinter"] }, // Q806808 (site answers 403 to scripts)
  ibercaja: { group: "bank_es", name: "Ibercaja", desc: "Ibercaja (Spanish bank)",
    domains: ["ibercaja.es"], keywords: ["ibercaja"] }, // live only
  cajarural: { group: "bank_es", name: "Caja Rural", desc: "Caja Rural or Ruralvía (Spanish rural savings banks)",
    domains: ["ruralvia.com", "grupocajarural.es"], keywords: ["ruralvia", "cajarural"] }, // Q3649971; ruralvia.com redirects to grupocajarural.es
  dgt: { group: "es_latam", name: "DGT", desc: "DGT, Dirección General de Tráfico (Spanish traffic authority, fines)",
    domains: ["dgt.es"], keywords: ["dgt"] }, // Q5280627 + live
  aeat: { group: "es_latam", name: "Agencia Tributaria", desc: "Agencia Tributaria / Hacienda (Spanish tax agency)",
    domains: ["agenciatributaria.gob.es"], keywords: ["agenciatributaria", "aeat"] }, // Q4891205
  movistar: { group: "es_latam", name: "Movistar", desc: "Movistar or Telefónica (phone and internet company)",
    domains: ["movistar.es"], keywords: ["movistar"] }, // live only
  iberdrola: { group: "es_latam", name: "Iberdrola", desc: "Iberdrola (Spanish electricity company)",
    domains: ["iberdrola.es", "iberdrola.com"], keywords: ["iberdrola"] }, // Q1437502
  nequi: { group: "es_latam", name: "Nequi", desc: "Nequi (Colombian digital wallet)",
    domains: ["nequi.com.co"], keywords: ["nequi"] }, // Q128916812 + live
  davivienda: { group: "es_latam", name: "Davivienda", desc: "Davivienda (Colombian bank)",
    domains: ["davivienda.com"], keywords: ["davivienda"] }, // Q5242054 + live
  banorte: { group: "es_latam", name: "Banorte", desc: "Banorte (Mexican bank)",
    domains: ["banorte.com"], keywords: ["banorte"] }, // Q806914 (investors.banorte.com) + live
  nubank: { group: "es_latam", name: "Nubank", desc: "Nubank or Nu (digital bank in Brazil, Mexico, Colombia)",
    domains: ["nubank.com.br", "nu.com.ar", "nu.com.co", "nu.com.mx", "nubank.com.mx"], keywords: ["nubank"] }, // Q25422888; nu.com.mx redirects to nubank.com.mx
  bancoestado: { group: "es_latam", name: "BancoEstado", desc: "BancoEstado (Chilean state bank)",
    domains: ["bancoestado.cl"], keywords: ["bancoestado"] }, // Q5718188
  bcp: { group: "es_latam", name: "BCP", desc: "BCP, Banco de Crédito del Perú",
    domains: ["viabcp.com"], keywords: ["viabcp", "bcp"] }, // Q4854124
};

// Top-level domains that belong to a brand: nobody else can register a name under them.
export const BRAND_TLDS = {
  google: "google", youtube: "google", gmail: "google", android: "google",
  microsoft: "microsoft", windows: "microsoft", xbox: "microsoft", azure: "microsoft",
  amazon: "amazon", aws: "amazon", apple: "apple", dhl: "dhl", fedex: "fedex", ups: "ups",
  bbva: "bbva", hsbc: "hsbc", chase: "chase",
};

// domain -> brand id
export const DOMAIN_TO_BRAND = new Map();
for (const [id, b] of Object.entries(BRANDS)) {
  for (const d of b.domains) DOMAIN_TO_BRAND.set(d, id);
}

// Link shorteners: the real destination is hidden. Brand-owned short domains
// (amzn.to, t.co-style) live in BRANDS instead.
export const SHORTENERS = new Set([
  "bit.ly", "bitly.com", "tinyurl.com", "t.co", "is.gd", "v.gd", "ow.ly", "buff.ly",
  "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy", "t.ly", "tiny.cc", "s.id", "lc.cx",
  "bl.ink", "short.io", "qr.ae", "soo.gd", "clck.ru", "urlz.fr", "acortar.link",
  "n9.cl", "goo.su", "shorter.me", "linktr.ee", "dub.sh", "tr.ee",
]);
