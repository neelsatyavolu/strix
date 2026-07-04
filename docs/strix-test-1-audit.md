# Strix Test 1 — Semantic Matching Audit

_Generated for the task of making Strix Test 1 mirror Bluebook Practice Test 11 as closely as possible, with no reused Bluebook questions._

## Goal

Strix Test 1 is a full-length adaptive SAT (R&W + Math, each with Module 1 and both Module 2 forms — easier "easy" and harder "hard"). Every slot is a **content-matched replacement** for the question in the same slot of Bluebook Practice Test 11, chosen so a student experiences the same test *shape and feel* without ever seeing a real Bluebook question.

## Sources & method

- **Question content** was read live from the College Board question bank via the same client the app uses (`lib/cb/client.ts`: `get-questions` for stubs, `get-question` for content). No third-party scraping.
- For **every** Bluebook 11 slot we fetched the original question and read its actual content: answer type (MCQ vs grid-in/SPR), stimulus form, figure/table presence, passage length, and CB metadata (domain `primary_class_cd`, skill `skill_cd`, difficulty, and the finer 1–7 `score_band_range_cd`).
- The **candidate pool** is every SAT question-bank item that is *not* part of any captured official Bluebook form (forms 5–11 in `lib/cb/official-forms.json`), restricted to fetchable `external_id` (qbank) items so content renders natively.
- Selection is deterministic and priority-ordered, matching the task's criteria:
  1. Never reuse the exact Bluebook 11 question (guaranteed — all official ids are excluded).
  2. No overlap with any captured official Bluebook form (forms 5–11), not just BB11.
  3. Same section and module slot.
  4. Same CB domain, skill **and difficulty** (kept exact for all 147 slots).
  5. Same answer type (MCQ vs SPR) — enforced as a hard preference within the exact skill+difficulty bucket.
  6. Same task style — for R&W this is *carried by the CB skill code itself* (e.g. `WIC`→words-in-context blank, `CTC`→paired Text 1/Text 2, `SYN`→research-notes synthesis, `TRA`→transition, `BOU`→boundary punctuation); for Math, the skill code + representation (figure/table/word-problem).
  7. Same stimulus form — figure/table/paired/notes matched where the pool allows.
  8. Same difficulty *feel* — tie-broken by nearest `score_band_range_cd` (1–7).
  9. No near-duplicate topics inside Strix Test 1 — verified after selection on de-boilerplated stimulus text.

## Result summary

- **147 questions, all unique**, none appearing in Bluebook 11 or any official form 5–11.
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- **Domain, skill and difficulty match the Bluebook 11 slot exactly for all 147 questions.**
- R&W difficulty band (`score_band_range_cd`) matches the original **exactly on all 81 slots** (gap 0).
- R&W: 0 near-duplicate topics detected within the test. Answer type is MCQ throughout (as in real R&W).
- Math answer type matches on 65 / 66 slots; 1 documented exception. 3 documented stimulus-form (figure) exceptions.

## Exceptions

These are the only slots where a criterion below "same skill + difficulty" could not be fully met, because the *non-official* pool at that exact skill+difficulty does not contain a question with the needed property. Priority order was honored: difficulty (#4) and answer type (#5) were kept ahead of stimulus form (#7).

| Slot | Skill / Diff | BB11 original | Chosen | What differs | Why unavoidable |
|---|---|---|---|---|---|
| Math · easy · Q15 | S.B. / H | has figure `1318dfea` | no figure `322a6dfe` | **stimulus form: diagram → none** | The only figured non-official items at S.B./H are grid-ins (SPR); answer type (#5) outranks figure (#7), so the MCQ answer type was preserved and the diagram dropped. |
| Math · hard · Q2 | H.D. / E | grid-in (SPR) `3409707e` | MCQ `9db5b5c1` | **answer type: grid-in → MCQ** | No non-official SPR item exists at H.D./E (all 14 pool items are MCQ). Difficulty (#4) outranks answer type (#5), so difficulty was kept exact rather than borrowing an H.D./M grid-in. Same skill (systems of equations) and difficulty preserved. |
| Math · hard · Q11 | H.E. / H | has figure `187f74bc` | no figure `55ea82f3` | **stimulus form: diagram → none** | No figured item exists at H.E./H in the non-official pool (all 7 are text-only); kept exact skill+difficulty+MCQ. |
| Math · hard · Q18 | S.B. / H | has figure `1318dfea` | no figure `fecc446d` | **stimulus form: diagram → none** | The only figured non-official items at S.B./H are grid-ins (SPR); answer type (#5) outranks figure (#7), so the MCQ answer type was preserved and the diagram dropped. |

_No other answer-type or difficulty deviations exist. All R&W slots are exact matches on skill, difficulty, band and task form._

## Per-module mirror confirmation

Because domain/skill/difficulty are matched exactly per slot, each module's skill and difficulty distribution is identical to Bluebook 11 by construction:

**Reading & Writing**

- Module 1 — 27 questions: BOU×3, CID×2, COE×4, CTC×1, FSS×2, INF×2, SYN×4, TRA×3, TSP×2, WIC×4
- Module 2 (easy) — 27 questions: BOU×3, CID×3, COE×4, FSS×4, INF×1, SYN×2, TRA×4, TSP×2, WIC×4
- Module 2 (hard) — 27 questions: BOU×1, CID×2, COE×3, CTC×1, FSS×6, INF×2, SYN×4, TRA×2, TSP×2, WIC×4

**Math**

- Module 1 — 22 questions: H.A.×2, H.B.×2, H.C.×3, P.A.×1, P.B.×3, P.C.×4, Q.C.×1, Q.D.×2, S.A.×1, S.B.×1, S.C.×1, S.D.×1
- Module 2 (easy) — 22 questions: H.A.×1, H.B.×2, H.C.×1, H.D.×2, H.E.×1, P.A.×2, P.B.×2, P.C.×3, Q.A.×1, Q.B.×1, Q.C.×1, Q.E.×1, S.A.×1, S.B.×2, S.C.×1
- Module 2 (hard) — 22 questions: H.B.×3, H.D.×2, H.E.×2, P.A.×2, P.B.×1, P.C.×3, Q.A.×1, Q.B.×1, Q.C.×1, Q.D.×1, Q.E.×1, S.A.×1, S.B.×2, S.D.×1

## Full slot-by-slot mapping

IDs are CB `questionId`s. "→" is Bluebook 11 original → Strix Test 1 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `631a1b64` → `06b96bfc` | blank/transition |
| 2 | WIC | E | 3 | `16f2d678` → `01de46bb` | blank/transition |
| 3 | WIC | M | 5 | `995358b4` → `1374a9fa` | blank/transition |
| 4 | WIC | H | 6 | `b35e2fdc` → `10c236ce` | blank/transition |
| 5 | TSP | E | 3 | `70612a79` → `066a3295` | single |
| 6 | TSP | H | 6 | `93ce86d0` → `03c9f327` | single |
| 7 | CTC | H | 7 | `592f94c2` → `105ea6de` | paired |
| 8 | CID | H | 6 | `daa90829` → `14189fbb` | single |
| 9 | CID | E | 2 | `b633cc4f` → `04bcb7a9` | single |
| 10 | COE | E | 1 | `0b634641` → `0014477f` | blank/transition |
| 11 | COE | E | 3 | `0a77c362` → `08ff903e` | single |
| 12 | COE | H | 6 | `33b1b285` → `0045c234` | single |
| 13 | COE | H | 7 | `4411e15b` → `04cbeca3` | single |
| 14 | INF | E | 2 | `72cbdbc6` → `01989d77` | blank/transition |
| 15 | INF | H | 6 | `45c03837` → `0dba14e6` | blank/transition |
| 16 | FSS | E | 2 | `035fd57e` → `1448f43f` | blank/transition |
| 17 | BOU | M | 4 | `cfe23776` → `0f39b19c` | blank/transition |
| 18 | BOU | M | 4 | `d198997b` → `1aa3f174` | blank/transition |
| 19 | BOU | M | 5 | `12013e06` → `01a32c84` | blank/transition |
| 20 | FSS | H | 6 | `772835db` → `188f7e3c` | blank/transition |
| 21 | TRA | M | 4 | `74028acf` → `0839a4b9` | blank/transition |
| 22 | TRA | M | 5 | `b88dad9d` → `080a7b51` | blank/transition |
| 23 | TRA | H | 7 | `e6b1e12c` → `00e0170f` | blank/transition |
| 24 | SYN | E | 3 | `e887dab1` → `00bb356a` | single |
| 25 | SYN | M | 4 | `fb3abe38` → `04397a63` | single |
| 26 | SYN | M | 4 | `77e3b3b3` → `0778b4ac` | single |
| 27 | SYN | M | 4 | `a1955620` → `113f16da` | single |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `0afb2ac4` → `03f5a9b7` | blank/transition |
| 2 | WIC | E | 1 | `1695391a` → `05575bca` | single |
| 3 | WIC | E | 3 | `6e3fdd1a` → `0ee67e09` | blank/transition |
| 4 | WIC | M | 5 | `7b43c0cc` → `1fbf276a` | blank/transition |
| 5 | TSP | E | 3 | `29741ebc` → `1782cdd7` | single |
| 6 | TSP | M | 4 | `3e63fce0` → `1090b367` | single |
| 7 | CID | E | 2 | `0fd96039` → `0b696a0c` | single |
| 8 | CID | M | 4 | `f2208f98` → `0d81b7d9` | single |
| 9 | CID | M | 5 | `73caa3ab` → `04dff083` | single |
| 10 | COE | E | 3 | `0021d326` → `11c00ab9` | blank/transition |
| 11 | COE | E | 1 | `b29c520a` → `0147b080` | blank/transition |
| 12 | COE | E | 2 | `3dc911d6` → `0113152f` | single |
| 13 | COE | E | 2 | `c088a9a9` → `08b28c1a` | single |
| 14 | INF | E | 2 | `ead0fd9b` → `6bc0e595` | blank/transition |
| 15 | FSS | E | 1 | `eee7536f` → `12bd5b75` | blank/transition |
| 16 | BOU | E | 2 | `8459dc2f` → `148be4da` | blank/transition |
| 17 | FSS | E | 2 | `674e59a3` → `175df826` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `0bcb4417` | blank/transition |
| 19 | BOU | E | 2 | `75eb5242` → `333b2b65` | blank/transition |
| 20 | FSS | M | 4 | `7c766ceb` → `20a6a4ed` | blank/transition |
| 21 | BOU | M | 5 | `82a76537` → `083a35dc` | blank/transition |
| 22 | TRA | E | 2 | `072666a3` → `20733eac` | blank/transition |
| 23 | TRA | E | 2 | `e268c452` → `2bda9edb` | blank/transition |
| 24 | TRA | M | 4 | `be44fea0` → `0c13dea9` | blank/transition |
| 25 | TRA | H | 6 | `f5149550` → `00221c00` | blank/transition |
| 26 | SYN | M | 5 | `e1453c88` → `146233fc` | single |
| 27 | SYN | M | 5 | `bb43fc3c` → `164a32e7` | single |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 3 | `a20b7511` → `3654202f` | blank/transition |
| 2 | WIC | H | 7 | `bce4d106` → `22a41819` | blank/transition |
| 3 | WIC | H | 7 | `dd19befa` → `3d658a5a` | blank/transition |
| 4 | WIC | H | 7 | `7f935017` → `4b54bbf0` | blank/transition |
| 5 | TSP | E | 3 | `edbc6cca` → `1b5d4e3e` | single |
| 6 | TSP | H | 7 | `0f2933b9` → `2e744883` | single |
| 7 | CTC | H | 7 | `5e4e082c` → `17bf10de` | paired |
| 8 | CID | H | 7 | `dcca0dfc` → `4d3e3c52` | single |
| 9 | CID | H | 7 | `251e5281` → `7812801f` | single |
| 10 | COE | M | 4 | `6af80ff3` → `0ec15b5a` | single |
| 11 | COE | M | 4 | `d52fca9f` → `15873d14` | single |
| 12 | COE | H | 6 | `54be8f96` → `01c1d9ee` | single |
| 13 | INF | H | 6 | `38facbad` → `0dccbf17` | blank/transition |
| 14 | INF | H | 7 | `d95a0bb8` → `03701ef3` | blank/transition |
| 15 | FSS | M | 5 | `f1c5157d` → `003f22c8` | blank/transition |
| 16 | FSS | M | 5 | `96a904c5` → `1ee7b429` | blank/transition |
| 17 | FSS | H | 6 | `9994ae0d` → `329255db` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `20ea68b7` | blank/transition |
| 19 | BOU | H | 6 | `4dcedc31` → `1b97cce9` | blank/transition |
| 20 | FSS | H | 7 | `81f09e07` → `0fe5ce68` | blank/transition |
| 21 | FSS | H | 7 | `3a1239d2` → `18382e67` | blank/transition |
| 22 | TRA | H | 6 | `a7a944ed` → `176edca6` | blank/transition |
| 23 | TRA | H | 7 | `d3b7d7a3` → `2df7b582` | blank/transition |
| 24 | SYN | M | 4 | `b98b8f64` → `14037904` | single |
| 25 | SYN | M | 5 | `efa2be4f` → `25755def` | single |
| 26 | SYN | H | 6 | `1d79a59d` → `0acc26b2` | single |
| 27 | SYN | H | 7 | `459df2ba` → `10cd0327` | single |

### Math

#### Module 1

| # | Skill | Diff | BB11 → Strix | Type | Fig |
|--:|---|:--:|---|:--:|:--:|
| 1 | H.A. | E | `d76ab4f5` → `4de87c9a` | mcq→mcq | N→N |
| 2 | P.C. | E | `2f8a580c` → `0ad5012e` | mcq→mcq | N→N |
| 3 | Q.C. | E | `40f0ee70` → `4b09f783` | spr→spr | N→N |
| 4 | H.C. | E | `4edecdba` → `2d0e13a6` | spr→spr | N→N |
| 5 | Q.D. | E | `632cf8f9` → `13f67ddc` | mcq→mcq | Y→Y |
| 6 | P.A. | E | `253985c2` → `290cdc2c` | mcq→mcq | N→N |
| 7 | S.B. | M | `585a9138` → `7a8ad237` | spr→spr | N→N |
| 8 | P.C. | E | `ffdfe1e1` → `9da41c80` | mcq→mcq | N→N |
| 9 | P.B. | E | `63c00e2b` → `1e003284` | mcq→mcq | N→N |
| 10 | H.C. | E | `deee9063` → `52a8ef85` | mcq→mcq | N→N |
| 11 | S.A. | M | `c4e5e23c` → `1f0b582e` | mcq→mcq | N→N |
| 12 | P.B. | M | `3934dd0a` → `b4acba95` | mcq→mcq | N→N |
| 13 | H.A. | M | `5ab9903f` → `620abf36` | mcq→mcq | N→N |
| 14 | H.B. | M | `23c5d458` → `b2fe7ab6` | mcq→mcq | N→N |
| 15 | P.C. | M | `0a74365c` → `dd3b1e1a` | spr→spr | N→N |
| 16 | Q.D. | M | `38525983` → `50b2807e` | mcq→mcq | Y→Y |
| 17 | P.C. | M | `b3b07f0c` → `f423771c` | mcq→mcq | N→N |
| 18 | S.D. | H | `c447367f` → `2855cb58` | mcq→mcq | N→N |
| 19 | H.C. | H | `1a1a95de` → `5b7599a6` | mcq→mcq | Y→Y |
| 20 | S.C. | H | `94f7c9e2` → `52f7b898` | mcq→mcq | Y→Y |
| 21 | H.B. | H | `63d03c0b` → `0bd33265` | spr→spr | N→N |
| 22 | P.B. | M | `faeae876` → `be1b8c74` | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | BB11 → Strix | Type | Fig |
|--:|---|:--:|---|:--:|:--:|
| 1 | P.C. | E | `5f07b257` → `26f5269a` | spr→spr | Y→Y |
| 2 | H.E. | E | `4047cfa7` → `e006209c` | mcq→mcq | N→N |
| 3 | Q.C. | E | `7b1a3200` → `fe6a49d6` | mcq→mcq | Y→Y |
| 4 | H.B. | E | `346d5c2e` → `adf60b28` | mcq→mcq | N→N |
| 5 | H.A. | E | `465c73ad` → `fa80893a` | spr→spr | N→N |
| 6 | Q.B. | E | `73362607` → `77cf4fa6` | spr→spr | N→N |
| 7 | H.B. | E | `343aaff6` → `a396ed75` | mcq→mcq | N→N |
| 8 | P.B. | E | `cec36caf` → `c6a26e14` | mcq→mcq | N→N |
| 9 | S.B. | E | `9342ca50` → `64d1f49f` | mcq→mcq | Y→Y |
| 10 | Q.E. | E | `ecf8d15f` → `dae79de4` | mcq→mcq | N→N |
| 11 | H.D. | E | `d1aeb6f1` → `608eeb6e` | mcq→mcq | N→N |
| 12 | H.C. | E | `820ad8e8` → `c6b151d4` | mcq→mcq | N→N |
| 13 | Q.A. | E | `555939d2` → `15617f62` | mcq→mcq | N→N |
| 14 | P.C. | M | `0f9f8ea7` → `50e40f08` | spr→spr | N→N |
| 15 | S.B. | H | `1318dfea` → `322a6dfe` ⚠ | mcq→mcq | Y→N |
| 16 | P.A. | E | `dc67c130` → `4a5af623` | mcq→mcq | N→N |
| 17 | S.C. | M | `9823f279` → `a71617d3` | spr→spr | Y→Y |
| 18 | S.A. | M | `96467fea` → `c0586eb5` | mcq→mcq | N→N |
| 19 | P.B. | E | `fc2ec559` → `0bebc08c` | mcq→mcq | N→N |
| 20 | P.C. | M | `4d425cef` → `735a0a00` | mcq→mcq | N→N |
| 21 | H.D. | M | `36f068e2` → `bf4a8b6a` | mcq→mcq | N→N |
| 22 | P.A. | M | `1e7a1deb` → `d9137a84` | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | BB11 → Strix | Type | Fig |
|--:|---|:--:|---|:--:|:--:|
| 1 | H.B. | E | `3dffe9d2` → `fe287f7e` | mcq→mcq | N→N |
| 2 | H.D. | E | `3409707e` → `9db5b5c1` ⚠ | spr→mcq | N→N |
| 3 | H.E. | E | `00ec9102` → `2869fe95` | mcq→mcq | N→N |
| 4 | Q.D. | M | `e9129a5c` → `f46139df` | mcq→mcq | Y→Y |
| 5 | P.C. | M | `7d3a84bf` → `252a3b3a` | mcq→mcq | Y→Y |
| 6 | H.B. | M | `68f343c9` → `7e3f8363` | mcq→mcq | N→N |
| 7 | S.D. | H | `6b4707aa` → `249d3f80` | spr→spr | N→N |
| 8 | H.B. | E | `346d5c2e` → `0d6ab461` | mcq→mcq | N→N |
| 9 | P.B. | H | `041eda89` → `f5aa5040` | spr→spr | N→N |
| 10 | P.A. | H | `c8a5c221` → `c3b116d7` | mcq→mcq | N→N |
| 11 | H.E. | H | `187f74bc` → `55ea82f3` ⚠ | mcq→mcq | Y→N |
| 12 | Q.E. | H | `9ce8cbbe` → `89f20d9e` | mcq→mcq | N→N |
| 13 | Q.C. | H | `608cf8e2` → `e7d48c8a` | mcq→mcq | Y→Y |
| 14 | Q.A. | H | `b5bc47d5` → `50b99b2d` | mcq→mcq | N→N |
| 15 | P.A. | H | `565428e1` → `42f8e4b4` | spr→spr | N→N |
| 16 | P.C. | H | `b0543157` → `2992ac30` | mcq→mcq | N→N |
| 17 | S.B. | H | `c41eb616` → `f7dbde16` | mcq→mcq | N→N |
| 18 | S.B. | H | `1318dfea` → `fecc446d` ⚠ | mcq→mcq | Y→N |
| 19 | H.D. | H | `58477a6c` → `7866a908` | mcq→mcq | N→N |
| 20 | S.A. | H | `62ec6574` → `502d9690` | mcq→mcq | N→N |
| 21 | P.C. | H | `c946d5bd` → `df71424b` | mcq→mcq | Y→Y |
| 22 | Q.B. | H | `699af7b3` → `8213b1b3` | spr→spr | N→N |

