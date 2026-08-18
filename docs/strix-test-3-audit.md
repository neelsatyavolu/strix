# Strix Test 3 — Semantic Matching Audit

_Generated as a Bluebook 11-shaped full SAT. Questions are unused by official Bluebook forms 5–11 and Strix Tests 1 and 2._

## Goal

Strix Test 3 mirrors Bluebook Practice Test 11 slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer `score_band_range_cd` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.

## Sources & method

- Live College Board qbank (`get-questions` + `get-question`).
- Pool = fetchable `external_id` items **not** in official Bluebook forms 5–11 and Strix Tests 1 and 2.
- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.

## Result summary

- **147 questions, all unique**, none in Bluebook 5–11 or Strix Test 1/2.
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- Domain, skill and difficulty match the Bluebook 11 slot exactly for all 147 questions.
- Score band matches on **123 / 147** slots (R&W 77/81).
- Answer type matches on **142 / 147** slots.
- Documented exceptions below the skill+difficulty bar: **30**.

## Exceptions

| Slot | Skill / Diff | BB11 original | Chosen | What differs | Why |
|---|---|---|---|---|---|
| rw · m1 · Q10 | COE / E | `0b634641` | `a9ac31e4` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q11 | COE / E | `b29c520a` | `8af28416` | **band: 1 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q12 | COE / E | `3dc911d6` | `1703403b` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q14 | INF / E | `ead0fd9b` | `93cad661` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q1 | H.A. / E | `d76ab4f5` | `3d04de9c` | **band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q2 | P.C. / E | `2f8a580c` | `2fec8bf4` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q3 | Q.C. / E | `40f0ee70` | `820d7a73` | **stimulus form: none → diagram; band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q7 | S.B. / M | `585a9138` | `686b5212` | **stimulus form: none → diagram; band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q8 | P.C. / E | `ffdfe1e1` | `3cf2698e` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q13 | H.A. / M | `5ab9903f` | `76f29fa5` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q15 | P.C. / M | `0a74365c` | `f880f910` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q16 | Q.D. / M | `38525983` | `70a2776f` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q19 | H.C. / H | `1a1a95de` | `05bb1af9` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q6 | Q.B. / E | `73362607` | `273b7f37` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q11 | H.D. / E | `d1aeb6f1` | `ece00725` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q14 | P.C. / M | `0f9f8ea7` | `1d3c5c95` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q15 | S.B. / H | `1318dfea` | `858809e7` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q17 | S.C. / M | `9823f279` | `87a9a2d4` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q18 | S.A. / M | `96467fea` | `c984f1a5` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q1 | H.B. / E | `3dffe9d2` | `3a3b95df` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q2 | H.D. / E | `3409707e` | `dcc4886a` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q3 | H.E. / E | `00ec9102` | `7d6928bd` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q7 | S.D. / H | `6b4707aa` | `c0b53183` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q8 | H.B. / E | `346d5c2e` | `0c490cd5` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q9 | P.B. / H | `041eda89` | `2c288148` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q11 | H.E. / H | `187f74bc` | `a049f400` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q12 | Q.E. / H | `9ce8cbbe` | `f496d2c0` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q13 | Q.C. / H | `608cf8e2` | `4626102e` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q18 | S.B. / H | `1318dfea` | `7ce2e728` | **stimulus form: diagram → none; band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q19 | H.D. / H | `58477a6c` | `1e11190a` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |

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

IDs are CB `questionId`s. "→" is Bluebook 11 original → Strix Test 3 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `631a1b64` → `3f753a8e` | blank/transition |
| 2 | WIC | E | 3 | `16f2d678` → `d2eb1df1` | blank/transition |
| 3 | WIC | M | 5 | `995358b4` → `fdca960a` | blank/transition |
| 4 | WIC | H | 6 | `b35e2fdc` → `e35d481c` | blank/transition |
| 5 | TSP | E | 3 | `70612a79` → `02e49a0c` | single |
| 6 | TSP | H | 6 | `93ce86d0` → `e818241b` | single |
| 7 | CTC | H | 7 | `592f94c2` → `d0198544` | paired |
| 8 | CID | H | 6 | `daa90829` → `1a2b29c9` | single |
| 9 | CID | E | 2 | `b633cc4f` → `d8758c3b` | single |
| 10 | COE | E | 1→2 | `0b634641` → `a9ac31e4` | blank/transition |
| 11 | COE | E | 3 | `0a77c362` → `72c7dafd` | blank/transition |
| 12 | COE | H | 6 | `33b1b285` → `09f9edb0` | single |
| 13 | COE | H | 7 | `4411e15b` → `43f4013a` | blank/transition |
| 14 | INF | E | 2 | `72cbdbc6` → `eca09a92` | blank/transition |
| 15 | INF | H | 6 | `45c03837` → `aaddd60f` | blank/transition |
| 16 | FSS | E | 2 | `035fd57e` → `4320b4ad` | blank/transition |
| 17 | BOU | M | 4 | `cfe23776` → `8790d061` | blank/transition |
| 18 | BOU | M | 4 | `d198997b` → `403d7bb5` | blank/transition |
| 19 | BOU | M | 5 | `12013e06` → `870ae7ec` | blank/transition |
| 20 | FSS | H | 6 | `772835db` → `5b8f9cf2` | blank/transition |
| 21 | TRA | M | 4 | `74028acf` → `ec3d7605` | blank/transition |
| 22 | TRA | M | 5 | `b88dad9d` → `4105f5ac` | blank/transition |
| 23 | TRA | H | 7 | `e6b1e12c` → `332e75bf` | blank/transition |
| 24 | SYN | E | 3 | `e887dab1` → `ca4ff52d` | notes |
| 25 | SYN | M | 4 | `fb3abe38` → `23da9791` | notes |
| 26 | SYN | M | 4 | `77e3b3b3` → `1c60119d` | notes |
| 27 | SYN | M | 4 | `a1955620` → `efc19153` | notes |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `0afb2ac4` → `b92c13fa` | blank/transition |
| 2 | WIC | E | 1 | `1695391a` → `0f040c50` | blank/transition |
| 3 | WIC | E | 3 | `6e3fdd1a` → `428cd2c1` | blank/transition |
| 4 | WIC | M | 5 | `7b43c0cc` → `54804e10` | blank/transition |
| 5 | TSP | E | 3 | `29741ebc` → `ea971260` | single |
| 6 | TSP | E | 3 | `3e63fce0` → `6f5fc289` | single |
| 7 | CID | E | 2 | `0fd96039` → `cf956802` | single |
| 8 | CID | E | 3 | `f2208f98` → `e677fa6c` | single |
| 9 | CID | M | 5 | `73caa3ab` → `ad680167` | single |
| 10 | COE | E | 3 | `0021d326` → `73c091d2` | single |
| 11 | COE | E | 1→3 | `b29c520a` → `8af28416` | blank/transition |
| 12 | COE | E | 2→3 | `3dc911d6` → `1703403b` | blank/transition |
| 13 | COE | E | 2 | `c088a9a9` → `38d75269` | single |
| 14 | INF | E | 2→3 | `ead0fd9b` → `93cad661` | blank/transition |
| 15 | FSS | E | 1 | `eee7536f` → `bd11fe93` | blank/transition |
| 16 | BOU | E | 2 | `8459dc2f` → `64a40675` | blank/transition |
| 17 | FSS | E | 2 | `674e59a3` → `36e89f74` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `6205f7e4` | blank/transition |
| 19 | BOU | E | 2 | `75eb5242` → `a7fdf862` | blank/transition |
| 20 | FSS | M | 4 | `7c766ceb` → `dd428136` | blank/transition |
| 21 | BOU | M | 5 | `82a76537` → `be34a3df` | blank/transition |
| 22 | TRA | E | 2 | `072666a3` → `5803befc` | blank/transition |
| 23 | TRA | E | 2 | `e268c452` → `c78620ba` | blank/transition |
| 24 | TRA | M | 4 | `be44fea0` → `eea351c4` | blank/transition |
| 25 | TRA | H | 6 | `f5149550` → `1e31470f` | blank/transition |
| 26 | SYN | M | 5 | `e1453c88` → `2b89bfe5` | notes |
| 27 | SYN | M | 5 | `bb43fc3c` → `f1d8550e` | notes |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 3 | `a20b7511` → `b507f90f` | blank/transition |
| 2 | WIC | H | 7 | `bce4d106` → `9ff88d6b` | blank/transition |
| 3 | WIC | H | 7 | `dd19befa` → `d5ad34f0` | blank/transition |
| 4 | WIC | H | 7 | `7f935017` → `e8fb0744` | blank/transition |
| 5 | TSP | E | 3 | `edbc6cca` → `e19e8478` | single |
| 6 | TSP | H | 7 | `0f2933b9` → `b0f7541b` | single |
| 7 | CTC | H | 7 | `5e4e082c` → `a87c3925` | paired |
| 8 | CID | H | 7 | `dcca0dfc` → `2b252bbd` | single |
| 9 | CID | H | 7 | `251e5281` → `ed314256` | single |
| 10 | COE | E | 3 | `6af80ff3` → `30c3aa98` | blank/transition |
| 11 | COE | M | 4 | `d52fca9f` → `85439572` | single |
| 12 | COE | H | 6 | `54be8f96` → `55df0275` | blank/transition |
| 13 | INF | H | 6 | `38facbad` → `5d20f560` | blank/transition |
| 14 | INF | H | 7 | `d95a0bb8` → `1755eaf0` | blank/transition |
| 15 | FSS | M | 5 | `f1c5157d` → `a03008de` | blank/transition |
| 16 | FSS | M | 5 | `96a904c5` → `9eb43963` | blank/transition |
| 17 | FSS | H | 6 | `9994ae0d` → `512f0ac9` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `6174a5b6` | blank/transition |
| 19 | BOU | H | 6 | `4dcedc31` → `aacddbd8` | blank/transition |
| 20 | FSS | H | 7 | `81f09e07` → `37e5c794` | blank/transition |
| 21 | FSS | H | 7 | `3a1239d2` → `b0fb36ad` | blank/transition |
| 22 | TRA | H | 6 | `a7a944ed` → `b5ed1a8b` | blank/transition |
| 23 | TRA | H | 7 | `d3b7d7a3` → `7ce14583` | blank/transition |
| 24 | SYN | M | 4 | `b98b8f64` → `296801d2` | notes |
| 25 | SYN | M | 5 | `efa2be4f` → `9e2d4ef7` | notes |
| 26 | SYN | H | 6 | `1d79a59d` → `5b8b69a2` | notes |
| 27 | SYN | H | 7 | `459df2ba` → `5645f119` | notes |

### Math

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.A. | E | 2→1 | `d76ab4f5` → `3d04de9c` ⚠ | mcq→mcq | N→N |
| 2 | P.C. | E | 2→3 | `2f8a580c` → `2fec8bf4` ⚠ | mcq→mcq | N→N |
| 3 | Q.C. | E | 2→1 | `40f0ee70` → `820d7a73` ⚠ | spr→spr | N→Y |
| 4 | H.C. | E | 3 | `4edecdba` → `db0107df` | spr→spr | N→N |
| 5 | Q.D. | E | 3 | `632cf8f9` → `9b9da812` | mcq→mcq | Y→Y |
| 6 | P.A. | E | 1 | `253985c2` → `127b2759` | mcq→mcq | N→N |
| 7 | S.B. | M | 4→5 | `585a9138` → `686b5212` ⚠ | spr→spr | N→Y |
| 8 | P.C. | E | 2→3 | `ffdfe1e1` → `3cf2698e` ⚠ | mcq→mcq | N→N |
| 9 | P.B. | E | 3 | `63c00e2b` → `c1964c11` | mcq→mcq | N→N |
| 10 | H.C. | E | 3 | `deee9063` → `5b8a8475` | mcq→mcq | N→N |
| 11 | S.A. | M | 4 | `c4e5e23c` → `cecbdeba` | mcq→mcq | N→N |
| 12 | P.B. | M | 4 | `3934dd0a` → `062f86db` | mcq→mcq | N→N |
| 13 | H.A. | M | 5→4 | `5ab9903f` → `76f29fa5` ⚠ | mcq→mcq | N→N |
| 14 | H.B. | M | 5 | `23c5d458` → `8ad64841` | mcq→mcq | N→N |
| 15 | P.C. | M | 5 | `0a74365c` → `f880f910` ⚠ | spr→mcq | N→N |
| 16 | Q.D. | M | 4→5 | `38525983` → `70a2776f` ⚠ | mcq→mcq | Y→Y |
| 17 | P.C. | M | 5 | `b3b07f0c` → `203774bc` | mcq→mcq | N→N |
| 18 | S.D. | H | 6 | `c447367f` → `9adb86ed` | mcq→mcq | N→N |
| 19 | H.C. | H | 6→7 | `1a1a95de` → `05bb1af9` ⚠ | mcq→mcq | Y→Y |
| 20 | S.C. | H | 6 | `94f7c9e2` → `6c67dd47` | mcq→mcq | Y→Y |
| 21 | H.B. | H | 7 | `63d03c0b` → `0b0fa68b` | spr→spr | N→N |
| 22 | P.B. | M | 5 | `faeae876` → `29ed5d39` | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | P.C. | E | 1 | `5f07b257` → `2f4eafcc` | spr→spr | Y→Y |
| 2 | H.E. | E | 1 | `4047cfa7` → `b64e2c7f` | mcq→mcq | N→N |
| 3 | Q.C. | E | 1 | `7b1a3200` → `6e3ab4bf` | mcq→mcq | Y→Y |
| 4 | H.B. | E | 3 | `346d5c2e` → `441558e7` | mcq→mcq | N→N |
| 5 | H.A. | E | 2 | `465c73ad` → `79cf8505` | spr→spr | N→N |
| 6 | Q.B. | E | 1 | `73362607` → `273b7f37` ⚠ | spr→mcq | N→N |
| 7 | H.B. | E | 2 | `343aaff6` → `776cfa7c` | mcq→mcq | N→N |
| 8 | P.B. | E | 3 | `cec36caf` → `70f98ab4` | mcq→mcq | N→N |
| 9 | S.B. | E | 2 | `9342ca50` → `5207e508` | mcq→mcq | Y→Y |
| 10 | Q.E. | E | 1 | `ecf8d15f` → `79201024` | mcq→mcq | N→N |
| 11 | H.D. | E | 3→2 | `d1aeb6f1` → `ece00725` ⚠ | mcq→mcq | N→N |
| 12 | H.C. | E | 2 | `820ad8e8` → `c8e0f511` | mcq→mcq | N→N |
| 13 | Q.A. | E | 1 | `555939d2` → `be35c117` | mcq→mcq | N→N |
| 14 | P.C. | M | 4 | `0f9f8ea7` → `1d3c5c95` ⚠ | spr→mcq | N→N |
| 15 | S.B. | H | 6→7 | `1318dfea` → `858809e7` ⚠ | mcq→mcq | Y→Y |
| 16 | P.A. | E | 3 | `dc67c130` → `5b6af6b1` | mcq→mcq | N→N |
| 17 | S.C. | M | 4 | `9823f279` → `87a9a2d4` ⚠ | spr→mcq | Y→Y |
| 18 | S.A. | M | 4→5 | `96467fea` → `c984f1a5` ⚠ | mcq→mcq | N→N |
| 19 | P.B. | E | 3 | `fc2ec559` → `d964bc26` | mcq→mcq | N→N |
| 20 | P.C. | M | 4 | `4d425cef` → `67f4b449` | mcq→mcq | N→N |
| 21 | H.D. | M | 4 | `36f068e2` → `0dd6227f` | mcq→mcq | N→N |
| 22 | P.A. | M | 5 | `1e7a1deb` → `4eaf0a3a` | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.B. | E | 1→2 | `3dffe9d2` → `3a3b95df` ⚠ | mcq→mcq | N→N |
| 2 | H.D. | E | 3 | `3409707e` → `dcc4886a` ⚠ | spr→mcq | N→N |
| 3 | H.E. | E | 2→3 | `00ec9102` → `7d6928bd` ⚠ | mcq→mcq | N→N |
| 4 | Q.D. | M | 4 | `e9129a5c` → `4cc05491` | mcq→mcq | Y→Y |
| 5 | P.C. | M | 4 | `7d3a84bf` → `db888cd6` | mcq→mcq | Y→Y |
| 6 | H.B. | M | 4 | `68f343c9` → `2493c767` | mcq→mcq | N→N |
| 7 | S.D. | H | 6→7 | `6b4707aa` → `c0b53183` ⚠ | spr→spr | N→N |
| 8 | H.B. | E | 3→2 | `346d5c2e` → `0c490cd5` ⚠ | mcq→mcq | N→N |
| 9 | P.B. | H | 6→7 | `041eda89` → `2c288148` ⚠ | spr→spr | N→N |
| 10 | P.A. | H | 6 | `c8a5c221` → `433184f1` | mcq→mcq | N→N |
| 11 | H.E. | H | 6 | `187f74bc` → `a049f400` ⚠ | mcq→mcq | Y→N |
| 12 | Q.E. | H | 7→6 | `9ce8cbbe` → `f496d2c0` ⚠ | mcq→mcq | N→N |
| 13 | Q.C. | H | 6→7 | `608cf8e2` → `4626102e` ⚠ | mcq→mcq | Y→Y |
| 14 | Q.A. | H | 7 | `b5bc47d5` → `d6456c7a` | mcq→mcq | N→N |
| 15 | P.A. | H | 7 | `565428e1` → `b74f2feb` | spr→spr | N→N |
| 16 | P.C. | H | 7 | `b0543157` → `84e8cc72` | mcq→mcq | N→N |
| 17 | S.B. | H | 7 | `c41eb616` → `a0369739` | mcq→mcq | N→N |
| 18 | S.B. | H | 6→7 | `1318dfea` → `7ce2e728` ⚠ | mcq→mcq | Y→N |
| 19 | H.D. | H | 7→6 | `58477a6c` → `1e11190a` ⚠ | mcq→mcq | N→N |
| 20 | S.A. | H | 7 | `62ec6574` → `e6c557f9` | mcq→mcq | N→N |
| 21 | P.C. | H | 7 | `c946d5bd` → `4d037075` | mcq→mcq | Y→Y |
| 22 | Q.B. | H | 7 | `699af7b3` → `20845d36` | spr→spr | N→N |
