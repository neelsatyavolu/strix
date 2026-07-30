# Vocab quiz verify criteria

For each word in your batch JSON:

1. **definition** — accurate, short
2. **memoryTip** — clear, sticky, not empty
3. **correctPassage** — uses word correctly; does NOT contain dictionary definition or "means"/"defined as"
4. **wrongPassages** (3) — each uses the word; misuse is clear; no definition leak; not identical templates
5. **Fresh options**: mentally sample 2 different MCQ sets (1 correct + 3 wrongs from bank + plausible alts). Confirm they can differ. Note if pool is too small to vary.
6. **Right answer feedback**: After answer, UI must highlight correct option AND show correct passage text (whether user was right or wrong). Code lives in Vocabulary.jsx FlashPractice feedback section.

Write results to `scripts/vocab-verify/result-NN.json` as:
```json
{
  "batch": NN,
  "pass": true/false,
  "words": [{"id","word","ok":true,"issues":[]}],
  "feedbackUiOk": true/false,
  "freshOptionsOk": true/false
}
```
