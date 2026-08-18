# Item JSON

Align with `lib/cb/types.ts`. Extra fields are for the writer pipeline.

```json
{
  "id": "strix-orig-rw-wic-m-001",
  "source": "strix",
  "section": "rw",
  "domain": "CAS",
  "domainLabel": "Craft and Structure",
  "skill": "WIC",
  "skillLabel": "Words in Context",
  "difficulty": "M",
  "type": "mcq",
  "stemHtml": "<p>Which choice completes the text with the most logical and precise word or phrase?</p>",
  "stimulusHtml": "<p>…</p>",
  "choices": [
    { "id": "optA", "letter": "A", "html": "<p>…</p>" },
    { "id": "optB", "letter": "B", "html": "<p>…</p>" },
    { "id": "optC", "letter": "C", "html": "<p>…</p>" },
    { "id": "optD", "letter": "D", "html": "<p>…</p>" }
  ],
  "correct": ["A"],
  "correctIds": ["optA"],
  "rationaleHtml": "<p>…</p>",
  "provenance": {
    "mirrorForm": 11,
    "moduleKey": "m1",
    "slot": 7,
    "referenceQuestionId": "631a1b64",
    "referenceUse": "structure-only",
    "topic": "peat-core sampling"
  },
  "distractors": {
    "B": { "tag": "wrong-sense", "why": "…" },
    "C": { "tag": "too-broad", "why": "…" },
    "D": { "tag": "true-but-unsupported", "why": "…" }
  },
  "verification": {
    "status": "unverified",
    "blindSolve": null,
    "checks": []
  }
}
```

## Enums

- `section`: `rw` | `math`
- `domain` RW: `CAS` `INI` `SEC` `EOI` · Math: `H` `P` `Q` `S`
- `difficulty`: `E` | `M` | `H`
- `type`: `mcq` | `spr`
- `verification.status`: `unverified` | `failed` | `verified`

## SPR

`choices` and `correctIds` are empty. `correct` is the accepted-answer list:

```json
"type": "spr",
"choices": [],
"correct": ["7/2", "3.5"],
"correctIds": [],
"spr": { "valueCount": 1, "acceptedForms": [["7/2", "3.5", "3.50"]] }
```

## Distractor tags

`too-broad` · `too-narrow` · `half-right-half-wrong` · `true-but-unsupported` · `out-of-scope` · `wrong-sense` · `reversed-relation` · `sign-error` · `step-error` · `wrong-percent-base` · `solved-other-variable` · `extraneous-root`
