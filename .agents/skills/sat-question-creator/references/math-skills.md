# Math skill rules

Domains: `H` Algebra · `P` Advanced Math · `Q` Problem-Solving and Data Analysis · `S` Geometry and Trigonometry.

Match the slot’s **skill code** (e.g. `H.A.`, `P.C.`, `Q.D.`, `S.B.`) — same algebraic target, not just the same domain.

## Type

- **MCQ:** four options. Each wrong option is a named error (sign, dropped term, wrong percent base, solved for the other variable).
- **SPR:** no choices. `correct` is the full list of accepted strings.

## SPR entry

**Uniqueness first.** Before wording, prove the constraints admit exactly one value (state the domain restriction that kills the second root / extra solution). If the item genuinely has several correct values, set `spr.valueCount` > 1 and enumerate forms for each. `correct` stays a flat array for loader compatibility.

**Bluebook entry rules — the accepted set must obey all of these.**

- Positive answers: ≤ 5 characters. Negative: ≤ 6 including the minus sign.
- Decimal point and `/` count as characters.
- Fractions and decimals both accepted. **Mixed numbers are not** — the grid reads `2 1/2` as `21/2`. If the answer is a mixed number, the item is only safe if the improper fraction and the decimal both fit; otherwise change the numbers.
- Repeating decimals must fill the field: accept both truncated and rounded at the last available character (a repeating `.666…` → both the truncated and rounded forms).
- No units, `%`, `$`, commas, `π`, radicals, or scientific notation.
- Leading `0` optional: list both `0.5` and `.5`.

Group the strings in an extra field, ignored by the loader:

```json
"spr": { "valueCount": 1, "acceptedForms": [["7/2", "3.5", "3.50"]] }
```

A mathematically correct string a student could type that is missing from `correct` is a FAIL.

## By family

- **H:** isolate what is solved for. Linear vs system vs inequality — don’t mix.
- **P:** equivalent expressions, quadratics, exponentials, functions. Extraneous roots after squaring = fail if not checked.
- **Q:** units, percent **base**, sample vs population. Table/graph must be sufficient.
- **S:** state diagram assumptions. Fail if a length/angle needed for the key is not given and not derivable.

## Difficulty

- E: one setup, one step.
- M: two constraints or a representation shift (words → equation).
- H: extra constraint, close distractors, or a representation that hides the path — not huge arithmetic.

## Figures

- If the Bluebook slot has a must-use diagram/table, the new item needs one too.
- Values in HTML/table must match the stem. Do not ship an underspecified figure.
- Figure is not to scale and must not be solvable by measuring. Every value needed for the key is labeled or derivable.
- Markup must render in the app sanitizer (table / MathML / SVG). Include a text equivalent of every number on the figure.
