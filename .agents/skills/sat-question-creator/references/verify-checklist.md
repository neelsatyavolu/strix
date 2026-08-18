# Fail-closed checklist

Every check is PASS or FAIL with cited evidence. Missing evidence = FAIL. Ambiguity = FAIL, not “reconcile.”

## Universal

| ID | Check |
|---|---|
| V1 | Blind solve matches `correct` |
| V2 | Exactly one option survives a strict reading; each other option is explicitly killed |
| V3 | Each distractor has a named tag and a distinct mechanism |
| V4 | No leakage (length outlier, unique stem-echo, unique hedge) |
| V5 | `skill` matches the actual task, not the topic |
| V6 | Difficulty justified by step count / distractor closeness, not vocab |
| V7 | No verbatim or near-verbatim overlap with the reference |
| V8 | No false claim about a real entity (or the study is clearly hypothetical in the text) |

## R&W

| ID | Check |
|---|---|
| V9 | Key is provable from the passage; quote the supporting span |
| V10 | INF/CID/COE: no distractor is also supported by some other span |
| V11 | CTC: both texts have a position; the asked relation holds and is not reversible unless intended |
| V12 | BOU: every option parsed as a full sentence; exactly one is grammatical |
| V13 | FSS: only one option satisfies agreement/tense/reference at once |
| V14 | TRA: all four connectors tested in the blank; only one fits |
| V15 | SYN: notes contain every fact in the key; key meets every stated goal; no distractor meets all |
| V16 | WIC: all four are real senses; context defeats three |

## Math

| ID | Check |
|---|---|
| V17 | Re-derive by an independent method or numeric check; matches |
| V18 | Each distractor is a stated plausible error |
| V19 | Domain: no extra root, ÷0, negative even root; units consistent |
| V20 | Figure/table internally consistent; prose matches display |
| V21 | SPR: complete acceptable set; Bluebook entry limits; no missing equivalent |
| V22 | Appropriate for calculator-allowed Digital SAT math |

## Added

| ID | Check |
|---|---|
| V23 | Verifier’s blind solve came from `blind-view.mjs` output only; `verification.blindSolve` was recorded before the key was seen |
| V24 | Substitution matrix present: each non-key option placed in the slot and explicitly broken |
| V25 | SEC only — all options differ on the single tested axis; no option carries a second error |
| V26 | For each distractor, its strongest supporting span/misread is quoted and refuted |
| V27 | `domain` is the correct parent of `skill`; `skill` string copied verbatim from the slot brief |
| V28 | `validate-item.mjs` exits 0 (shape loads as `Question`) |
| V29 | SPR only — `spr.valueCount` justified; every Bluebook-legal string for every accepted value is in `correct`; no mixed number required |
| V30 | Figures — not solvable by measurement; every value needed for the key is labeled or derivable; markup renders; text equivalent present |
| V31 | No invented finding attributed to a real named person or institution; invented studies use invented names or are marked hypothetical in the text |
| V32 | Key letter chosen to keep the form’s key distribution balanced; key is not systematically B/C |

## Gate

Reject if `verification.status !== "verified"`, blind solve mismatches, or any check is FAIL.
