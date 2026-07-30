# SAT-style vocab MCQ rewrite criteria

For each word in your batch, rewrite `correctPassage` and `wrongPassages` (exactly 3).

## Correct passage
- One short academic / Digital-SAT-style sentence (reading passage tone)
- Word used with the right meaning and natural grammar
- Context lets a strong student pick it without the definition
- NO dictionary definition, "means", "defined as", or meta language
- NO nonsense or joke frames

## Wrong passages (3)
- Sound like real SAT-ish sentences (same register as correct)
- Clear MISUSE: wrong meaning, opposite sense, or wrong grammatical role — but not cartoonish
- Prefer subtle but unambiguous wrongness over absurdity (no "packed spare WORD in trunk", no "paint color WORD Mist", no "emoji password")
- Each must include the word (or clear inflection: scrutinized, etc.)
- All three must be distinct from each other and from the correct passage
- A student who knows the word should reject them; a student who doesn't shouldn't spot the answer by "weirdness"

## Keep
- Same `id`, `word`, `definition`, `memoryTip` (only fix tip if empty/broken)

## Output
Write JSON array of 5 entries to:
`/Users/neel/Documents/GitHub/strix/scripts/vocab-sat-mcq/fixed-NN.json`
(same schema as batch)

Be careful and high quality — this is the product quiz.
