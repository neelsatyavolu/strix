---
name: verify
description: Run the project's full verification gate (lint + typecheck + build) and report pass/fail. Use before committing, before claiming a change is complete, or whenever the user asks to verify/check the build.
---

# verify

This repo has no test framework. The verification gate is three commands, run in order. Run all three even if an earlier one fails — report the full picture.

```
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Steps

1. Run `pnpm lint`. Capture pass/fail and any errors.
2. Run `pnpm exec tsc --noEmit` (there is no `typecheck` script; invoke tsc directly). Capture type errors.
3. Run `pnpm build` (`next build`). Capture build failures.
4. Report a short summary: ✅/❌ per step, with the specific errors for any failure. Do NOT claim success unless all three pass — quote the real output.

If a step fails, stop guessing and surface the actual error to the user before attempting fixes.
