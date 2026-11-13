// Brands Legit? knows about.
//  - `desc` is what Clef reads to tell one brand from another.
//  - `domains` are the registrable domains the brand really owns (hand-curated: when in
//    doubt, leave a domain OUT — a missing domain gives a false warning, a wrong one gives
//    a false "all clear").
//  - `keywords` are used to spot look-alike domains (amazon-security.xyz, paypa1.com...).
//    Keywords of 5 letters or fewer only match whole labels/tokens, never substrings.
//  - `group` splits the list in two Clef questions: a `choice` takes at most 26 options.

export const BRANDS = {
  amazon: {
    group: "online",
    name: "Amazon",
    desc: "Amazon, Amazon Prime or AWS",
    domains: [
      "amazon.com", "amazon.es", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it",
      "amazon.nl", "amazon.ca", "amazon.com.mx", "amazon.com.br", "amazon.in",
      "amazon.co.jp", "amazon.com.au", "amzn.to", "amzn.com", "a.co", "primevideo.com",
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
      "google.com", "google.es", "gmail.com", "googlemail.com", "youtube.com", "youtu.be",
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
    domains: ["telegram.org", "t.me"],
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
    domains: ["ebay.com", "ebay.es", "ebay.co.uk", "ebay.de"],
    keywords: ["ebay"],
  },
  mercadolibre: {
    group: "online",
    name: "Mercado Libre",
    desc: "Mercado Libre or Mercado Pago",
    domains: [
      "mercadolibre.com", "mercadolibre.com.mx", "mercadolibre.com.ar",
      "mercadolibre.com.co", "mercadolivre.com.br", "mercadopago.com",
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
    domains: ["hsbc.com", "hsbc.co.uk", "hsbc.com.mx"],
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
