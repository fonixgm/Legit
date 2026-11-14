# Results

Set: `eval/cases.jsonl` · 60 messages (30 scams, 30 legitimate) · date 2026-11-14

## With and without Clef

| Arm | Scams caught (red) | Scams missed (green) | Legit cleared (green) | False alarms (legit red) | Errors |
|---|---|---|---|---|---|
| baseline (no Clef) | 3/30 (10%) | 19/30 (63%) | 26/30 (87%) | 0/30 (0%) | 0 |
| clef | 8/30 (27%) | 7/30 (23%) | 30/30 (100%) | 0/30 (0%) | 0 |


`baseline` = same link check and same rules, but keyword guesses (`lib/mock.js`) instead of Clef. What `clef` gains over it is what the model adds.

Median latency with Clef: 619 ms per message.

## baseline

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (30) | 3 | 8 | 19 | 0 |
| **Legitimate** (30) | 0 | 4 | 26 | 0 |

### Where it fails

- `ar-correos-03` (scam) → green · clean
- `ar-correos-04` (scam) → green · clean
- `ar-dhl-01` (scam) → green · clean
- `ar-mrw-01` (scam) → green · clean
- `ar-seur-01` (scam) → green · clean
- `ar-tgss-01` (scam) → green · clean
- `ar-hijo-01` (scam) → green · clean
- `ar-hijo-02` (scam) → green · clean
- `ar-netflix-02` (scam) → green · clean
- `ar-netflix-03` (scam) → green · clean
- `ar-netflix-04` (scam) → green · clean
- `ar-iberdrola-01` (scam) → green · clean
- `ar-movistar-01` (scam) → green · clean
- `ar-fedex-01` (scam) → green · clean
- `ar-fedex-02` (scam) → green · clean
- `ar-amazon-01` (scam) → green · clean
- `inc-bank-22` (scam) → green · clean
- `inc-bank-39` (scam) → green · clean
- `inc-bank-40` (scam) → green · clean

## clef

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (30) | 8 | 15 | 7 | 0 |
| **Legitimate** (30) | 0 | 0 | 30 | 0 |

### Where it fails

- `ar-correos-02` (scam) → green · clean
- `ar-correos-03` (scam) → green · clean
- `ar-aeat-01` (scam) → green · clean
- `ar-netflix-04` (scam) → green · clean
- `ar-iberdrola-01` (scam) → green · clean
- `ar-fedex-01` (scam) → green · clean
- `ar-amazon-01` (scam) → green · clean

## Every case

| id | label | baseline | clef |
|---|---|---|---|
| ar-correos-01 | scam | yellow | yellow |
| ar-correos-02 | scam | yellow | green |
| ar-correos-03 | scam | green | green |
| ar-correos-04 | scam | green | yellow |
| ar-dhl-01 | scam | green | yellow |
| ar-mrw-01 | scam | green | yellow |
| ar-seur-01 | scam | green | yellow |
| ar-tgss-01 | scam | green | red |
| ar-aeat-01 | scam | yellow | green |
| ar-hijo-01 | scam | green | yellow |
| ar-hijo-02 | scam | green | yellow |
| ar-netflix-01 | scam | yellow | yellow |
| ar-netflix-02 | scam | green | yellow |
| ar-netflix-03 | scam | green | yellow |
| ar-netflix-04 | scam | green | green |
| ar-iberdrola-01 | scam | green | green |
| ar-movistar-01 | scam | green | red |
| ar-santander-01 | scam | yellow | yellow |
| ar-fedex-01 | scam | green | green |
| ar-fedex-02 | scam | green | yellow |
| ar-amazon-01 | scam | green | green |
| ar-dgt-01 | scam | red | red |
| ar-dgt-02 | scam | yellow | yellow |
| ar-dgt-03 | scam | red | red |
| inc-bank-01 | scam | yellow | red |
| inc-bank-22 | scam | green | red |
| inc-bank-33 | scam | red | red |
| inc-bank-39 | scam | green | red |
| inc-bank-40 | scam | green | yellow |
| inc-bank-42 | scam | yellow | yellow |
| ar-uci-01 | legit | green | green |
| ar-uci-02 | legit | green | green |
| ar-uci-03 | legit | green | green |
| ar-uci-04 | legit | yellow | green |
| ar-uci-05 | legit | green | green |
| ar-uci-06 | legit | green | green |
| ar-uci-07 | legit | green | green |
| ar-uci-08 | legit | green | green |
| ar-uci-09 | legit | green | green |
| ar-uci-10 | legit | green | green |
| ar-uci-11 | legit | yellow | green |
| ar-uci-12 | legit | green | green |
| ar-uci-13 | legit | green | green |
| ar-uci-14 | legit | green | green |
| ar-uci-15 | legit | green | green |
| ar-uci-16 | legit | green | green |
| ar-uci-17 | legit | green | green |
| ar-uci-18 | legit | green | green |
| ar-uci-19 | legit | green | green |
| ar-uci-20 | legit | green | green |
| ar-uci-21 | legit | green | green |
| ar-uci-22 | legit | green | green |
| ar-uci-23 | legit | green | green |
| ar-uci-24 | legit | green | green |
| ar-uci-25 | legit | yellow | green |
| ar-uci-26 | legit | green | green |
| ar-uci-27 | legit | green | green |
| ar-uci-28 | legit | yellow | green |
| ar-uci-29 | legit | green | green |
| ar-uci-30 | legit | green | green |
