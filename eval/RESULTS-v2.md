# Results

Set: `eval/cases-v2.jsonl` · 60 messages (30 scams, 30 legitimate) · date 2026-11-14

## With and without Clef

| Arm | Scams caught (red) | Scams missed (green) | Legit cleared (green) | False alarms (legit red) | Errors |
|---|---|---|---|---|---|
| baseline (no Clef) | 20/30 (67%) | 3/30 (10%) | 28/30 (93%) | 0/30 (0%) | 0 |
| clef | 27/30 (90%) | 0/30 (0%) | 30/30 (100%) | 0/30 (0%) | 0 |


`baseline` = same link check and same rules, but keyword guesses (`lib/mock.js`) instead of Clef. What `clef` gains over it is what the model adds.

Median latency with Clef: 638 ms per message.

## baseline

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (30) | 20 | 7 | 3 | 0 |
| **Legitimate** (30) | 0 | 2 | 28 | 0 |

### Where it fails

- `md-hijo-01` (scam) → green · clean
- `md-hijo-02` (scam) → green · clean
- `inc-bank-35` (scam) → green · clean

## clef

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (30) | 27 | 3 | 0 | 0 |
| **Legitimate** (30) | 0 | 0 | 30 | 0 |

### Where it fails

No scam came out green and no legitimate message came out red.

## Every case

| id | label | baseline | clef |
|---|---|---|---|
| md-hijo-01 | scam | green | yellow |
| md-hijo-02 | scam | green | yellow |
| md-hijo-03 | scam | yellow | yellow |
| ar-dgt-04 | scam | yellow | red |
| ar-dgt-05 | scam | red | red |
| ar-dgt-06 | scam | red | red |
| ar-dgt-07 | scam | red | red |
| ar-dgt-08 | scam | red | red |
| ar-dgt-09 | scam | red | red |
| inc-bank-02 | scam | red | red |
| inc-bank-04 | scam | red | red |
| inc-bank-06 | scam | yellow | red |
| inc-bank-08 | scam | red | red |
| inc-bank-10 | scam | red | red |
| inc-bank-13 | scam | red | red |
| inc-bank-15 | scam | red | red |
| inc-bank-17 | scam | red | red |
| inc-bank-19 | scam | red | red |
| inc-bank-23 | scam | yellow | red |
| inc-bank-25 | scam | yellow | red |
| inc-bank-27 | scam | red | red |
| inc-bank-29 | scam | red | red |
| inc-bank-32 | scam | red | red |
| inc-bank-35 | scam | green | red |
| inc-bank-37 | scam | red | red |
| inc-bank-41 | scam | yellow | red |
| inc-bank-45 | scam | red | red |
| inc-bank-47 | scam | yellow | red |
| inc-bank-49 | scam | red | red |
| inc-bank-51 | scam | red | red |
| uci2-01 | legit | green | green |
| uci2-02 | legit | green | green |
| uci2-03 | legit | green | green |
| uci2-04 | legit | green | green |
| uci2-05 | legit | green | green |
| uci2-06 | legit | green | green |
| uci2-07 | legit | yellow | green |
| uci2-08 | legit | green | green |
| uci2-09 | legit | green | green |
| uci2-10 | legit | green | green |
| uci2-11 | legit | green | green |
| uci2-12 | legit | green | green |
| uci2-13 | legit | green | green |
| uci2-14 | legit | green | green |
| uci2-15 | legit | green | green |
| uci2-16 | legit | green | green |
| uci2-17 | legit | yellow | green |
| uci2-18 | legit | green | green |
| uci2-19 | legit | green | green |
| uci2-20 | legit | green | green |
| uci2-21 | legit | green | green |
| uci2-22 | legit | green | green |
| uci2-23 | legit | green | green |
| uci2-24 | legit | green | green |
| uci2-25 | legit | green | green |
| uci2-26 | legit | green | green |
| uci2-27 | legit | green | green |
| uci2-28 | legit | green | green |
| uci2-29 | legit | green | green |
| uci2-30 | legit | green | green |
