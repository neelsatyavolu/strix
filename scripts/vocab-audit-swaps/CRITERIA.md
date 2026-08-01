# Audit: false-correct / true-wrong swaps

For each of the 5 words in your batch, judge **usage quality** against the given definition.

## Flag as BAD if any of these:

### 1. FALSE_CORRECT
`correctPassage` does **not** correctly use the word per the definition (wrong meaning, wrong POS, nonsense collocation).

### 2. TRUE_WRONG  
Any entry in `wrongPassages` that is actually a **valid, natural, correct** use of the word.  
Example bug: Vacate = “leave a place”  
- WRONGLY listed as wrong: “He refused to vacate the apartment and signed a three-year extension.” ← this is correct English!

### 3. AMBIGUOUS  
A passage where a careful reader could reasonably defend both “correct” and “incorrect.” Prefer rewriting so wrongs are clearly misuse (opposite sense / wrong collocation) without being cartoonish.

## Do NOT flag
- Subtle but still wrong uses (student who knows the word would reject)
- Style/tone only issues

## Output
Write JSON to:
`/Users/neel/Documents/GitHub/strix/scripts/vocab-audit-swaps/findings-NN.json`

```json
{
  "batch": "NN",
  "issues": [
    {
      "id": "w124",
      "word": "Vacate",
      "kind": "TRUE_WRONG",
      "which": "wrongPassages[1]",
      "passage": "...",
      "why": "This is correct usage of vacate = leave a place",
      "fix": {
        "correctPassage": "optional rewrite if needed",
        "wrongPassages": ["three", "fixed", "wrongs"]
      }
    }
  ],
  "clean": ["w001", "w002"]
}
```

- Always include full rewritten `wrongPassages` (exactly 3) and `correctPassage` when you flag a word.
- Keep id/word/definition/memoryTip the same.
- If batch has zero issues: `"issues": []` and list all 5 ids in `clean`.
- SAT academic register; no definition text in passages; wrongs not absurd jokes.
