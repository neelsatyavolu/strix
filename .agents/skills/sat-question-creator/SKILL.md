---
name: sat-question-creator
description: Use when writing original Digital SAT questions, filling Strix test slots, authoring MCQ or SPR items, mirroring Bluebook 10 or 11, replacing exhausted qbank items, or the user says write SAT questions, create a Strix item, or original SAT question.
---

# SAT Question Creator

Write **original** Digital SAT items that can sit in a real Strix form. Official Bluebook items are a **structure reference only**. Never copy stem, passage, numbers, options, or topic.

**Two roles. Same agent “checking itself” is not verification.** Writer never sees the official item. Verifier never sees the writer’s key until after a cold solve.

Read `docs/sat-realism.md` for form shape. Read this skill’s `references/` only for the skill you are writing.

## Hard rules

1. If two options survive a strict reading, the item is dead. Do not argue the key is “better.”
2. Every distractor gets a named SAT failure tag. Untagged = not written.
3. RW keys must be provable from the passage alone. No outside knowledge.
4. SEC tests exactly one rule. Parse every BOU option as a full sentence; exactly one is grammatical.
5. WIC is not a dictionary quiz. Context forces one sense.
6. Tables/figures must be self-consistent. Prose numbers match the display. The key is derivable from what is shown.
7. SPR: prove the constraints admit exactly one value unless `spr.valueCount` > 1. Then list every Bluebook-legal string for every accepted value.
8. Hard ≠ obscure words. Hard = more steps or closer distractors.
9. No leakage: key is not the longest, the only stem-echo, or the only hedge.
10. If the Bluebook topic, entities, number set, or sentence skeleton is recoverable, it is a clone. Change subject and numbers wholesale.
11. Uniqueness is pairwise: substitute each option for the key and show what breaks. Two interchangeable options = dead item.
12. SEC options vary on exactly one axis. A second untested error makes the item unfair.

## Workflow

### A — Slot spec (no writing)

1. Read the target slot from `lib/cb/official-forms.json` + qbank: `section`, `domain`, `skill`, `difficulty`, `type`.
2. Fetch the Bluebook item (and optionally 1–2 same skill+diff items). Extract **structure only** — run `scripts/brief-slot.mjs` when possible.
3. Keep a slot spec ≤150 words: task form, step count, word budget, stem template, required distractor tags. **Discard official text.** Do not paste stems into the writer context.

### B — Writer (fresh context, spec + topic only)

4. Assign a topic **distant** from the reference subject (different field, entities, numbers).
5. Draft in this order: stimulus → key + proof → distractors last, each tagged.
6. Emit JSON (`references/output-schema.md`) with `verification.status: "unverified"`.

Skill-specific rules: `references/rw-skills.md` or `references/math-skills.md`.
Codes and domain↔skill mapping: `references/codes.md`.

### C — Verifier (separate pass or agent; blind)

7. Verifier reads **only** `node scripts/blind-view.mjs <item>.json` output. Never the item file. Solves cold and records `blindSolve` before any other file is opened.
8. Then runs `references/verify-checklist.md` against the full item. Blind-solve mismatch = **FAIL**.
9. Verifier does not rewrite the item. FAIL → writer revises → **a different verifier context** does a fresh cold solve. Two failed cycles → new topic, new draft.

### D — Form fit

10. Skill / difficulty / type / stimulus form match the slot. `domain` is the parent of `skill` (`references/codes.md`).
11. Originality: no shared proper nouns or number sets with the reference; no 8-gram overlap.
12. `node scripts/validate-item.mjs <item>.json` exits 0.
13. Mark `verified` only when the checklist is all PASS. **Nothing ships unverified.**

## Stimulus forms (match the slot)

| Form | Typical skills |
|---|---|
| blank / underlined word | WIC, TRA, BOU, FSS |
| single short passage | TSP, CID, COE, INF |
| paired Text 1 / Text 2 | CTC |
| research notes | SYN |
| table / graph | COE quantitative, many Q |
| diagram | many S, some H/P |
| none (stem only) | many algebra / SPR |

R&W passages are one short text per item (about 25–150 words). No multi-question shared passages.

## Do not

- Paste official stems, passages, options, or number sets into the skill, the writer prompt, or committed examples. Do not commit `.cache/` (official qbank stubs).
- Let the writer see the official item.
- Ship `unverified` items.
- Use dictionary definitions as WIC options.
- Invent SYN facts that are not in the notes.

## Serving later

Output must match `lib/cb/types.ts` (`section` is `rw` | `math`, `source: "strix"`). Store verified items in `lib/cb/strix-originals.json`; `getStrixModule` serves them when a form id is in that map.
