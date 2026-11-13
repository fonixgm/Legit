# Measurement set

The published figure comes from `eval/cases.jsonl`: **30 real scams + 30 real legitimate messages**.
`cases.sample.jsonl` is invented, only to try the runner, and never counts.

## Format

One JSON object per line:

```json
{"id":"s01","label":"scam","text":"...","source":"mine | friend | public report (URL)"}
```

- `label`: `scam` or `legit`.
- `source` says where it came from. Never write "synthetic" in `cases.jsonl`.

## How to collect

- **Scams**: messages you or people you know actually received (ask family; mothers and grandparents get plenty), and public reports with a URL as `source`. Mix the patterns: bank, parcel, account, prize, relative in trouble, tech support, investment. Mix languages if the app is bilingual.
- **Legitimate**: real notices from banks, couriers, shops and verification codes, plus ordinary family messages. Include the hard ones on purpose: a real bank text with a real link, a verification code, a parcel notice with a tracking link. If every legitimate case is easy, the false-alarm rate means nothing.
- **Anonymise**: remove names, phone numbers, card digits, IBANs and e-mails. Neutralise scam links: `hxxps://evil[.]com/x` (the runner undoes it before parsing).
- **Do not tune on the test set.** Tune thresholds on a small separate set, then run the 60 once and publish what comes out, failures included.

## Run

```bash
npm run eval:check              # validates the file (30 + 30, no live links, no personal data)
NAN_KEY=... npm run eval        # baseline (no Clef) and Clef over the same messages -> eval/RESULTS.md
```
