# Strix Test 2 — Semantic Matching Audit

_Generated as a second Bluebook 11-shaped full SAT. Questions are unused by official Bluebook forms 5–11 and Strix Test 1._

## Goal

Strix Test 2 mirrors Bluebook Practice Test 11 slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer `score_band_range_cd` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.

## Sources & method

- Live College Board qbank (`get-questions` + `get-question`).
- Pool = fetchable `external_id` items **not** in official forms 5–11 and **not** in Strix Test 1.
- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.

## Result summary

- **147 questions, all unique**, none in Bluebook 5–11 or Strix Test 1.
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- Domain, skill and difficulty match the Bluebook 11 slot exactly for all 147 questions.
- Score band matches on **141 / 147** slots (R&W 80/81).
- Answer type matches on **143 / 147** slots.
- Documented exceptions below the skill+difficulty bar: **12**.

## Exceptions

| Slot | Skill / Diff | BB11 original | Chosen | What differs | Why |
|---|---|---|---|---|---|
| rw · easy · Q11 | COE / E | `b29c520a` | `89f71526` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q3 | Q.C. / E | `40f0ee70` | `3aa0642c` | **band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q15 | P.C. / M | `0a74365c` | `dbe9b217` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q19 | H.C. / H | `1a1a95de` | `184ce5aa` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q6 | Q.B. / E | `73362607` | `9c44f828` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q14 | P.C. / M | `0f9f8ea7` | `99c5e794` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q15 | S.B. / H | `1318dfea` | `b5d62bba` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q2 | H.D. / E | `3409707e` | `4fb8adf7` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q10 | P.A. / H | `c8a5c221` | `2289b199` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q11 | H.E. / H | `187f74bc` | `68c5c81a` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q12 | Q.E. / H | `9ce8cbbe` | `014c47ab` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q18 | S.B. / H | `1318dfea` | `7a11ceea` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |

## Per-module skill counts

**Reading & Writing**

- m1 — 27 questions: BOU×3, CID×2, COE×4, CTC×1, FSS×2, INF×2, SYN×4, TRA×3, TSP×2, WIC×4
- easy — 27 questions: BOU×3, CID×3, COE×4, FSS×4, INF×1, SYN×2, TRA×4, TSP×2, WIC×4
- hard — 27 questions: BOU×1, CID×2, COE×3, CTC×1, FSS×6, INF×2, SYN×4, TRA×2, TSP×2, WIC×4

**Math**

- m1 — 22 questions: H.A.×2, H.B.×2, H.C.×3, P.A.×1, P.B.×3, P.C.×4, Q.C.×1, Q.D.×2, S.A.×1, S.B.×1, S.C.×1, S.D.×1
- easy — 22 questions: H.A.×1, H.B.×2, H.C.×1, H.D.×2, H.E.×1, P.A.×2, P.B.×2, P.C.×3, Q.A.×1, Q.B.×1, Q.C.×1, Q.E.×1, S.A.×1, S.B.×2, S.C.×1
- hard — 22 questions: H.B.×3, H.D.×2, H.E.×2, P.A.×2, P.B.×1, P.C.×3, Q.A.×1, Q.B.×1, Q.C.×1, Q.D.×1, Q.E.×1, S.A.×1, S.B.×2, S.D.×1

## Full slot-by-slot mapping

IDs are CB `questionId`s. "→" is Bluebook 11 original → Strix Test 2 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `631a1b64` → `bdab32fc` | blank/transition |
| 2 | WIC | E | 3 | `16f2d678` → `760ee1db` | blank/transition |
| 3 | WIC | M | 5 | `995358b4` → `f0be91b2` | blank/transition |
| 4 | WIC | H | 6 | `b35e2fdc` → `994be036` | blank/transition |
| 5 | TSP | E | 3 | `70612a79` → `2903a041` | single |
| 6 | TSP | H | 6 | `93ce86d0` → `4ed09415` | single |
| 7 | CTC | H | 7 | `592f94c2` → `f3c45b4f` | paired |
| 8 | CID | H | 6 | `daa90829` → `7f0be746` | single |
| 9 | CID | E | 2 | `b633cc4f` → `23a7038f` | single |
| 10 | COE | E | 1 | `0b634641` → `239d3535` | single |
| 11 | COE | E | 3 | `0a77c362` → `6f626ae5` | blank/transition |
| 12 | COE | H | 6 | `33b1b285` → `3d91c973` | single |
| 13 | COE | H | 7 | `4411e15b` → `9452092c` | blank/transition |
| 14 | INF | E | 2 | `72cbdbc6` → `25893fc7` | blank/transition |
| 15 | INF | H | 6 | `45c03837` → `9c591ff7` | blank/transition |
| 16 | FSS | E | 2 | `035fd57e` → `77bf77cd` | blank/transition |
| 17 | BOU | M | 4 | `cfe23776` → `fe41f258` | blank/transition |
| 18 | BOU | M | 4 | `d198997b` → `a427a52c` | blank/transition |
| 19 | BOU | M | 5 | `12013e06` → `c3397d25` | blank/transition |
| 20 | FSS | H | 6 | `772835db` → `3daf126e` | blank/transition |
| 21 | TRA | M | 4 | `74028acf` → `cf11282b` | blank/transition |
| 22 | TRA | M | 5 | `b88dad9d` → `f8c4591b` | blank/transition |
| 23 | TRA | H | 7 | `e6b1e12c` → `f5a00eff` | blank/transition |
| 24 | SYN | E | 3 | `e887dab1` → `064c8999` | notes |
| 25 | SYN | M | 4 | `fb3abe38` → `7c9d0e38` | notes |
| 26 | SYN | M | 4 | `77e3b3b3` → `fbffb352` | notes |
| 27 | SYN | M | 4 | `a1955620` → `48d0bb34` | notes |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `0afb2ac4` → `f3fac04f` | blank/transition |
| 2 | WIC | E | 1 | `1695391a` → `84f9b577` | blank/transition |
| 3 | WIC | E | 3 | `6e3fdd1a` → `84a7fbca` | blank/transition |
| 4 | WIC | M | 5 | `7b43c0cc` → `be069e38` | blank/transition |
| 5 | TSP | E | 3 | `29741ebc` → `2aaee77f` | single |
| 6 | TSP | E | 3 | `3e63fce0` → `1c6b1fa0` | single |
| 7 | CID | E | 2 | `0fd96039` → `714e4c10` | single |
| 8 | CID | E | 3 | `f2208f98` → `41d5c33e` | single |
| 9 | CID | M | 5 | `73caa3ab` → `409058ee` | single |
| 10 | COE | E | 3 | `0021d326` → `5f6adeee` | single |
| 11 | COE | E | 1→2 | `b29c520a` → `89f71526` | blank/transition |
| 12 | COE | E | 2 | `3dc911d6` → `5c73f0cc` | blank/transition |
| 13 | COE | E | 2 | `c088a9a9` → `0fc0a773` | single |
| 14 | INF | E | 2 | `ead0fd9b` → `7a895def` | blank/transition |
| 15 | FSS | E | 1 | `eee7536f` → `1e274153` | blank/transition |
| 16 | BOU | E | 2 | `8459dc2f` → `4b0c7b62` | blank/transition |
| 17 | FSS | E | 2 | `674e59a3` → `7b419faf` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `4f2ff5f2` | blank/transition |
| 19 | BOU | E | 2 | `75eb5242` → `6997261f` | blank/transition |
| 20 | FSS | M | 4 | `7c766ceb` → `8d53e7a0` | blank/transition |
| 21 | BOU | M | 5 | `82a76537` → `ad046778` | blank/transition |
| 22 | TRA | E | 2 | `072666a3` → `34a5ba1c` | blank/transition |
| 23 | TRA | E | 2 | `e268c452` → `7d56630a` | blank/transition |
| 24 | TRA | M | 4 | `be44fea0` → `f07570bb` | blank/transition |
| 25 | TRA | H | 6 | `f5149550` → `480ade7e` | blank/transition |
| 26 | SYN | M | 5 | `e1453c88` → `85c0c0f0` | notes |
| 27 | SYN | M | 5 | `bb43fc3c` → `34e1124f` | notes |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 3 | `a20b7511` → `9b2fbb2e` | blank/transition |
| 2 | WIC | H | 7 | `bce4d106` → `1eeb9bb8` | blank/transition |
| 3 | WIC | H | 7 | `dd19befa` → `5e57efec` | blank/transition |
| 4 | WIC | H | 7 | `7f935017` → `6557f7fc` | blank/transition |
| 5 | TSP | E | 3 | `edbc6cca` → `764331f8` | single |
| 6 | TSP | H | 7 | `0f2933b9` → `df46a2ee` | single |
| 7 | CTC | H | 7 | `5e4e082c` → `1917ba9a` | paired |
| 8 | CID | H | 7 | `dcca0dfc` → `5869a196` | single |
| 9 | CID | H | 7 | `251e5281` → `7aa510fb` | single |
| 10 | COE | E | 3 | `6af80ff3` → `e441da80` | single |
| 11 | COE | M | 4 | `d52fca9f` → `31ad8024` | single |
| 12 | COE | H | 6 | `54be8f96` → `bc7b1a04` | blank/transition |
| 13 | INF | H | 6 | `38facbad` → `09d942c6` | blank/transition |
| 14 | INF | H | 7 | `d95a0bb8` → `5f16d809` | blank/transition |
| 15 | FSS | M | 5 | `f1c5157d` → `6e193b19` | blank/transition |
| 16 | FSS | M | 5 | `96a904c5` → `f570cece` | blank/transition |
| 17 | FSS | H | 6 | `9994ae0d` → `c91ef0f0` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `d2cf0e11` | blank/transition |
| 19 | BOU | H | 6 | `4dcedc31` → `a9e5b788` | blank/transition |
| 20 | FSS | H | 7 | `81f09e07` → `2784cbaf` | blank/transition |
| 21 | FSS | H | 7 | `3a1239d2` → `4c335aea` | blank/transition |
| 22 | TRA | H | 6 | `a7a944ed` → `70c19cf6` | blank/transition |
| 23 | TRA | H | 7 | `d3b7d7a3` → `fc95a352` | blank/transition |
| 24 | SYN | M | 4 | `b98b8f64` → `fdd9a360` | notes |
| 25 | SYN | M | 5 | `efa2be4f` → `db3ad406` | notes |
| 26 | SYN | H | 6 | `1d79a59d` → `d4b07ce6` | notes |
| 27 | SYN | H | 7 | `459df2ba` → `ee51ad04` | notes |

### Math

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.A. | E | 2 | `d76ab4f5` → `12255364` | mcq→mcq | N→N |
| 2 | P.C. | E | 2 | `2f8a580c` → `788bfd56` | mcq→mcq | N→N |
| 3 | Q.C. | E | 2→1 | `40f0ee70` → `3aa0642c` ⚠ | spr→spr | N→N |
| 4 | H.C. | E | 3 | `4edecdba` → `6a12efbb` | spr→spr | N→N |
| 5 | Q.D. | E | 3 | `632cf8f9` → `dbd89c59` | mcq→mcq | Y→Y |
| 6 | P.A. | E | 1 | `253985c2` → `8452c42b` | mcq→mcq | N→N |
| 7 | S.B. | M | 4 | `585a9138` → `fd8745fc` | spr→spr | N→N |
| 8 | P.C. | E | 2 | `ffdfe1e1` → `fe62f031` | mcq→mcq | N→N |
| 9 | P.B. | E | 3 | `63c00e2b` → `ad03127d` | mcq→mcq | N→N |
| 10 | H.C. | E | 3 | `deee9063` → `535fa6e6` | mcq→mcq | N→N |
| 11 | S.A. | M | 4 | `c4e5e23c` → `a2659088` | mcq→mcq | N→N |
| 12 | P.B. | M | 4 | `3934dd0a` → `13e57f0a` | mcq→mcq | N→N |
| 13 | H.A. | M | 5 | `5ab9903f` → `40049d49` | mcq→mcq | N→N |
| 14 | H.B. | M | 5 | `23c5d458` → `af711d1b` | mcq→mcq | N→N |
| 15 | P.C. | M | 5→4 | `0a74365c` → `dbe9b217` ⚠ | spr→spr | N→N |
| 16 | Q.D. | M | 4 | `38525983` → `e97fd3f8` | mcq→mcq | Y→Y |
| 17 | P.C. | M | 5 | `b3b07f0c` → `44076c7d` | mcq→mcq | N→N |
| 18 | S.D. | H | 6 | `c447367f` → `ca2235f6` | mcq→mcq | N→N |
| 19 | H.C. | H | 6 | `1a1a95de` → `184ce5aa` ⚠ | mcq→mcq | Y→N |
| 20 | S.C. | H | 6 | `94f7c9e2` → `053e5e9f` | mcq→mcq | Y→Y |
| 21 | H.B. | H | 7 | `63d03c0b` → `3122fc7b` | spr→spr | N→N |
| 22 | P.B. | M | 5 | `faeae876` → `3148fe3e` | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | P.C. | E | 1 | `5f07b257` → `cc2601cb` | spr→spr | Y→Y |
| 2 | H.E. | E | 1 | `4047cfa7` → `4a090a46` | mcq→mcq | N→N |
| 3 | Q.C. | E | 1 | `7b1a3200` → `93779b53` | mcq→mcq | Y→Y |
| 4 | H.B. | E | 3 | `346d5c2e` → `27198699` | mcq→mcq | N→N |
| 5 | H.A. | E | 2 | `465c73ad` → `997bec28` | spr→spr | N→N |
| 6 | Q.B. | E | 1 | `73362607` → `9c44f828` ⚠ | spr→mcq | N→N |
| 7 | H.B. | E | 2 | `343aaff6` → `1d18794b` | mcq→mcq | N→N |
| 8 | P.B. | E | 3 | `cec36caf` → `332cd67b` | mcq→mcq | N→N |
| 9 | S.B. | E | 2 | `9342ca50` → `4a141e77` | mcq→mcq | Y→Y |
| 10 | Q.E. | E | 1 | `ecf8d15f` → `4e527894` | mcq→mcq | N→N |
| 11 | H.D. | E | 3 | `d1aeb6f1` → `0e926898` | mcq→mcq | N→N |
| 12 | H.C. | E | 2 | `820ad8e8` → `39571c77` | mcq→mcq | N→N |
| 13 | Q.A. | E | 1 | `555939d2` → `de799680` | mcq→mcq | N→N |
| 14 | P.C. | M | 4 | `0f9f8ea7` → `99c5e794` ⚠ | spr→mcq | N→N |
| 15 | S.B. | H | 6→7 | `1318dfea` → `b5d62bba` ⚠ | mcq→mcq | Y→Y |
| 16 | P.A. | E | 3 | `dc67c130` → `df747160` | mcq→mcq | N→N |
| 17 | S.C. | M | 4 | `9823f279` → `f1251f35` | spr→spr | Y→Y |
| 18 | S.A. | M | 4 | `96467fea` → `9c0a0eca` | mcq→mcq | N→N |
| 19 | P.B. | E | 3 | `fc2ec559` → `b5ebd31c` | mcq→mcq | N→N |
| 20 | P.C. | M | 4 | `4d425cef` → `d4950429` | mcq→mcq | N→N |
| 21 | H.D. | M | 4 | `36f068e2` → `340afb12` | mcq→mcq | N→N |
| 22 | P.A. | M | 5 | `1e7a1deb` → `fde6f3bb` | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.B. | E | 1 | `3dffe9d2` → `cee5b352` | mcq→mcq | N→N |
| 2 | H.D. | E | 3 | `3409707e` → `4fb8adf7` ⚠ | spr→mcq | N→N |
| 3 | H.E. | E | 2 | `00ec9102` → `74d0906a` | mcq→mcq | N→N |
| 4 | Q.D. | M | 4 | `e9129a5c` → `b3547a10` | mcq→mcq | Y→Y |
| 5 | P.C. | M | 4 | `7d3a84bf` → `f1fa0821` | mcq→mcq | Y→Y |
| 6 | H.B. | M | 4 | `68f343c9` → `042aa429` | mcq→mcq | N→N |
| 7 | S.D. | H | 6 | `6b4707aa` → `9f9112ab` | spr→spr | N→N |
| 8 | H.B. | E | 3 | `346d5c2e` → `c039b198` | mcq→mcq | N→N |
| 9 | P.B. | H | 6 | `041eda89` → `722de804` | spr→spr | N→N |
| 10 | P.A. | H | 6→7 | `c8a5c221` → `2289b199` ⚠ | mcq→mcq | N→N |
| 11 | H.E. | H | 6 | `187f74bc` → `68c5c81a` ⚠ | mcq→mcq | Y→N |
| 12 | Q.E. | H | 7 | `9ce8cbbe` → `014c47ab` ⚠ | mcq→spr | N→N |
| 13 | Q.C. | H | 6 | `608cf8e2` → `d3b9c8d8` | mcq→mcq | Y→Y |
| 14 | Q.A. | H | 7 | `b5bc47d5` → `7d721177` | mcq→mcq | N→N |
| 15 | P.A. | H | 7 | `565428e1` → `38c90632` | spr→spr | N→N |
| 16 | P.C. | H | 7 | `b0543157` → `270cf326` | mcq→mcq | N→N |
| 17 | S.B. | H | 7 | `c41eb616` → `1dc7e423` | mcq→mcq | N→N |
| 18 | S.B. | H | 6→7 | `1318dfea` → `7a11ceea` ⚠ | mcq→mcq | Y→Y |
| 19 | H.D. | H | 7 | `58477a6c` → `59813abf` | mcq→mcq | N→N |
| 20 | S.A. | H | 7 | `62ec6574` → `9fec9d49` | mcq→mcq | N→N |
| 21 | P.C. | H | 7 | `c946d5bd` → `36b6f8ba` | mcq→mcq | Y→Y |
| 22 | Q.B. | H | 7 | `699af7b3` → `3d73a58b` | spr→spr | N→N |
