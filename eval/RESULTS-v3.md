# Results

Set: `eval/cases-v3.jsonl` · 50 messages (25 scams, 25 legitimate) · date 2026-11-14

## With and without Clef

| Arm | Scams caught (red) | Scams missed (green) | Legit cleared (green) | False alarms (legit red) | Errors |
|---|---|---|---|---|---|
| baseline (no Clef) | 18/25 (72%) | 0/25 (0%) | 25/25 (100%) | 0/25 (0%) | 0 |
| clef | 25/25 (100%) | 0/25 (0%) | 23/25 (92%) | 0/25 (0%) | 0 |


`baseline` = same link check and same rules, but keyword guesses (`lib/mock.js`) instead of Clef. What `clef` gains over it is what the model adds.

Median latency with Clef: 634 ms per message.

## baseline

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (25) | 18 | 7 | 0 | 0 |
| **Legitimate** (25) | 0 | 0 | 25 | 0 |

### Where it fails

No scam came out green and no legitimate message came out red.

## clef

| | Red | Yellow | Green | Error |
|---|---|---|---|---|
| **Scams** (25) | 25 | 0 | 0 | 0 |
| **Legitimate** (25) | 0 | 2 | 23 | 0 |

### Where it fails

No scam came out green and no legitimate message came out red.

## Every case

| id | label | baseline | clef |
|---|---|---|---|
| inc3-01 | scam | red | red |
| inc3-02 | scam | red | red |
| inc3-03 | scam | red | red |
| inc3-04 | scam | yellow | red |
| inc3-05 | scam | red | red |
| inc3-06 | scam | red | red |
| inc3-07 | scam | red | red |
| inc3-08 | scam | yellow | red |
| inc3-09 | scam | red | red |
| inc3-10 | scam | red | red |
| inc3-11 | scam | red | red |
| inc3-12 | scam | red | red |
| inc3-13 | scam | red | red |
| inc3-14 | scam | red | red |
| inc3-15 | scam | yellow | red |
| inc3-16 | scam | red | red |
| inc3-17 | scam | red | red |
| inc3-18 | scam | red | red |
| inc3-19 | scam | red | red |
| inc3-20 | scam | yellow | red |
| inc3-21 | scam | red | red |
| inc3-22 | scam | yellow | red |
| inc3-23 | scam | red | red |
| inc3-24 | scam | yellow | red |
| inc3-25 | scam | yellow | red |
| uci3-01 | legit | green | green |
| uci3-02 | legit | green | green |
| uci3-03 | legit | green | green |
| uci3-04 | legit | green | green |
| uci3-05 | legit | green | green |
| uci3-06 | legit | green | green |
| uci3-07 | legit | green | yellow |
| uci3-08 | legit | green | green |
| uci3-09 | legit | green | green |
| uci3-10 | legit | green | green |
| uci3-11 | legit | green | green |
| uci3-12 | legit | green | green |
| uci3-13 | legit | green | green |
| uci3-14 | legit | green | green |
| uci3-15 | legit | green | green |
| uci3-16 | legit | green | green |
| uci3-17 | legit | green | green |
| uci3-18 | legit | green | green |
| uci3-19 | legit | green | green |
| uci3-20 | legit | green | green |
| uci3-21 | legit | green | green |
| uci3-22 | legit | green | green |
| uci3-23 | legit | green | yellow |
| uci3-24 | legit | green | green |
| uci3-25 | legit | green | green |
