# Strix Test 6 — Semantic Matching Audit

_Generated as a Bluebook 11-shaped full SAT. 146 questions are unused by official Bluebook forms 5–11 and Strix Tests 1–5. Math hard Q11 is an original Strix item (`strix-6-math-hard-11`) because the unused pool has no H.E./H item._

## Goal

Strix Test 6 mirrors Bluebook Practice Test 11 slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer `score_band_range_cd` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.

## Sources & method

- Live College Board qbank (`get-questions` + `get-question`).
- Pool = fetchable `external_id` items **not** in official Bluebook forms 5–11 and Strix Tests 1–5.
- When that pool is empty at skill+difficulty, the slot is an original item written with `sat-question-creator` (writer / blind verifier) and stored in `lib/cb/strix-originals.json`.
- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.

## Result summary

- **147 questions, all unique**, none in Bluebook 5–11 or Strix Tests 1–5. One original (`strix-6-math-hard-11`).
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- Domain, skill and difficulty match the Bluebook 11 slot exactly for all 147 questions.
- Score band matches on **118 / 147** slots (R&W 78/81).
- Answer type matches on **136 / 147** slots.
- Documented exceptions below the skill+difficulty bar: **47**.

## Exceptions

| Slot | Skill / Diff | BB11 original | Chosen | What differs | Why |
|---|---|---|---|---|---|
| rw · m1 · Q10 | COE / E | `0b634641` | `628e1305` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · m1 · Q14 | INF / E | `72cbdbc6` | `dbbbc5dd` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q11 | COE / E | `b29c520a` | `b238a07a` | **stimulus form: diagram → none; band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q12 | COE / E | `3dc911d6` | `47f2cddd` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q14 | INF / E | `ead0fd9b` | `4025e00c` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · hard · Q10 | COE / E | `6af80ff3` | `3091f805` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q1 | H.A. / E | `d76ab4f5` | `c3989ef8` | **band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q2 | P.C. / E | `2f8a580c` | `72ae8a87` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q3 | Q.C. / E | `40f0ee70` | `79340403` | **stimulus form: none → diagram; band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q4 | H.C. / E | `4edecdba` | `b8fa27db` | **stimulus form: none → diagram** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q5 | Q.D. / E | `632cf8f9` | `ae32cc3c` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q7 | S.B. / M | `585a9138` | `e89f63bf` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q8 | P.C. / E | `ffdfe1e1` | `cfff8f8e` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q9 | P.B. / E | `63c00e2b` | `7a8cb72a` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q13 | H.A. / M | `5ab9903f` | `8c515062` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q14 | H.B. / M | `23c5d458` | `a775af14` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q15 | P.C. / M | `0a74365c` | `b7cd6ca6` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q17 | P.C. / M | `b3b07f0c` | `dd8ac009` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q19 | H.C. / H | `1a1a95de` | `9d0396d4` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q20 | S.C. / H | `94f7c9e2` | `27d075d8` | **stimulus form: diagram → none; band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q21 | H.B. / H | `63d03c0b` | `b988eeec` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q22 | P.B. / M | `faeae876` | `895628b5` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q2 | H.E. / E | `4047cfa7` | `86f7483f` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q6 | Q.B. / E | `73362607` | `771ee744` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q8 | P.B. / E | `cec36caf` | `c5d83a99` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q10 | Q.E. / E | `ecf8d15f` | `60caadfd` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q11 | H.D. / E | `d1aeb6f1` | `f5563c26` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q12 | H.C. / E | `820ad8e8` | `b450ab03` | **band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q14 | P.C. / M | `0f9f8ea7` | `3918e8bc` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q15 | S.B. / H | `1318dfea` | `6d99b141` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q16 | P.A. / E | `dc67c130` | `72ebc024` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q17 | S.C. / M | `9823f279` | `2bddbc1b` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q19 | P.B. / E | `fc2ec559` | `c8bf5313` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q21 | H.D. / M | `36f068e2` | `686b7cad` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q1 | H.B. / E | `3dffe9d2` | `bf883fde` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q2 | H.D. / E | `3409707e` | `f88970cc` | **answer type: spr → mcq; band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q3 | H.E. / E | `00ec9102` | `f01ef454` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q5 | P.C. / M | `7d3a84bf` | `beca03de` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q10 | P.A. / H | `c8a5c221` | `efc469c4` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q11 | H.E. / H | `187f74bc` | `strix-6-math-hard-11` | **original item: unused pool empty at skill+difficulty** | Unused H.E./H pool is empty. Original figured MCQ, writer/blind-verifier, stored in `lib/cb/strix-originals.json`. |
| math · hard · Q12 | Q.E. / H | `9ce8cbbe` | `89ff6a0a` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q13 | Q.C. / H | `608cf8e2` | `241f1db7` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q14 | Q.A. / H | `b5bc47d5` | `11b06e35` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q17 | S.B. / H | `c41eb616` | `b1e1c2f5` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q18 | S.B. / H | `1318dfea` | `345cc36a` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q19 | H.D. / H | `58477a6c` | `ff501705` | **answer type: mcq → spr** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q21 | P.C. / H | `c946d5bd` | `ce579859` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |

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

IDs are CB `questionId`s. "→" is Bluebook 11 original → Strix Test 6 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `631a1b64` → `faa5696c` | blank/transition |
| 2 | WIC | E | 3 | `16f2d678` → `52fe862a` | blank/transition |
| 3 | WIC | M | 5 | `995358b4` → `e56b66e5` | blank/transition |
| 4 | WIC | H | 6 | `b35e2fdc` → `98364791` | blank/transition |
| 5 | TSP | E | 3 | `70612a79` → `0ed94d4c` | single |
| 6 | TSP | H | 6 | `93ce86d0` → `3e6ad72d` | single |
| 7 | CTC | H | 7 | `592f94c2` → `3cfbf077` | paired |
| 8 | CID | H | 6 | `daa90829` → `701126bc` | single |
| 9 | CID | E | 2 | `b633cc4f` → `a842db60` | single |
| 10 | COE | E | 1 | `0b634641` → `628e1305` | blank/transition |
| 11 | COE | E | 3 | `0a77c362` → `6df33868` | blank/transition |
| 12 | COE | H | 6 | `33b1b285` → `39e440e4` | single |
| 13 | COE | H | 7 | `4411e15b` → `626a1308` | blank/transition |
| 14 | INF | E | 2→3 | `72cbdbc6` → `dbbbc5dd` | blank/transition |
| 15 | INF | H | 6 | `45c03837` → `cae97f58` | blank/transition |
| 16 | FSS | E | 2 | `035fd57e` → `e6f2dba6` | blank/transition |
| 17 | BOU | M | 4 | `cfe23776` → `2c84f96a` | blank/transition |
| 18 | BOU | M | 4 | `d198997b` → `8f6d6ae6` | blank/transition |
| 19 | BOU | M | 5 | `12013e06` → `89fbc3eb` | blank/transition |
| 20 | FSS | H | 6 | `772835db` → `99dedf36` | blank/transition |
| 21 | TRA | M | 4 | `74028acf` → `af89fa02` | blank/transition |
| 22 | TRA | M | 5 | `b88dad9d` → `30438650` | blank/transition |
| 23 | TRA | H | 7 | `e6b1e12c` → `47e238be` | blank/transition |
| 24 | SYN | E | 3 | `e887dab1` → `eaded344` | notes |
| 25 | SYN | M | 4 | `fb3abe38` → `4c26f18a` | notes |
| 26 | SYN | M | 4 | `77e3b3b3` → `6249b173` | notes |
| 27 | SYN | M | 4 | `a1955620` → `d6dec50e` | notes |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `0afb2ac4` → `637d0878` | blank/transition |
| 2 | WIC | E | 1 | `1695391a` → `82b7c3b2` | blank/transition |
| 3 | WIC | E | 3 | `6e3fdd1a` → `4d1a9c0d` | blank/transition |
| 4 | WIC | M | 5 | `7b43c0cc` → `757077f9` | blank/transition |
| 5 | TSP | E | 3 | `29741ebc` → `e13171c4` | single |
| 6 | TSP | E | 3 | `3e63fce0` → `c8603ed7` | single |
| 7 | CID | E | 2 | `0fd96039` → `ee41d7e0` | single |
| 8 | CID | E | 3 | `f2208f98` → `0e3b4967` | single |
| 9 | CID | M | 5 | `73caa3ab` → `3f05e40f` | single |
| 10 | COE | E | 3 | `0021d326` → `ac7166f7` | single |
| 11 | COE | E | 1→2 | `b29c520a` → `b238a07a` | blank/transition |
| 12 | COE | E | 2 | `3dc911d6` → `47f2cddd` | blank/transition |
| 13 | COE | E | 2 | `c088a9a9` → `d6e97054` | blank/transition |
| 14 | INF | E | 2→3 | `ead0fd9b` → `4025e00c` | blank/transition |
| 15 | FSS | E | 1 | `eee7536f` → `fff4c7f4` | blank/transition |
| 16 | BOU | E | 2 | `8459dc2f` → `9091458d` | blank/transition |
| 17 | FSS | E | 2 | `674e59a3` → `96e5da01` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `69f031ab` | blank/transition |
| 19 | BOU | E | 2 | `75eb5242` → `de55ec71` | blank/transition |
| 20 | FSS | M | 4 | `7c766ceb` → `cd2443c0` | blank/transition |
| 21 | BOU | M | 5 | `82a76537` → `4ba99a6f` | blank/transition |
| 22 | TRA | E | 2 | `072666a3` → `420dea42` | blank/transition |
| 23 | TRA | E | 2 | `e268c452` → `37957752` | blank/transition |
| 24 | TRA | M | 4 | `be44fea0` → `2b5f4bdc` | blank/transition |
| 25 | TRA | H | 6 | `f5149550` → `6e0c60da` | blank/transition |
| 26 | SYN | M | 5 | `e1453c88` → `b46e0c8a` | notes |
| 27 | SYN | M | 5 | `bb43fc3c` → `0f64ded3` | notes |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 3 | `a20b7511` → `cb526866` | blank/transition |
| 2 | WIC | H | 7 | `bce4d106` → `7bc05fa2` | blank/transition |
| 3 | WIC | H | 7 | `dd19befa` → `15daaded` | blank/transition |
| 4 | WIC | H | 7 | `7f935017` → `5ccbfe22` | blank/transition |
| 5 | TSP | E | 3 | `edbc6cca` → `271a5017` | single |
| 6 | TSP | H | 7 | `0f2933b9` → `de059199` | single |
| 7 | CTC | H | 7 | `5e4e082c` → `4b4ab04e` | paired |
| 8 | CID | H | 7 | `dcca0dfc` → `024eb2ec` | single |
| 9 | CID | H | 7 | `251e5281` → `db2da2bf` | single |
| 10 | COE | E | 3 | `6af80ff3` → `3091f805` | single |
| 11 | COE | M | 4 | `d52fca9f` → `7254379e` | single |
| 12 | COE | H | 6 | `54be8f96` → `b2e54b50` | single |
| 13 | INF | H | 6 | `38facbad` → `fd1095d7` | blank/transition |
| 14 | INF | H | 7 | `d95a0bb8` → `9869c261` | blank/transition |
| 15 | FSS | M | 5 | `f1c5157d` → `75f49353` | blank/transition |
| 16 | FSS | M | 5 | `96a904c5` → `59209b6d` | blank/transition |
| 17 | FSS | H | 6 | `9994ae0d` → `f0864217` | blank/transition |
| 18 | FSS | M | 4 | `ac7b8d04` → `c8607bdf` | blank/transition |
| 19 | BOU | H | 6 | `4dcedc31` → `e7afd0a1` | blank/transition |
| 20 | FSS | H | 7 | `81f09e07` → `2bca654a` | blank/transition |
| 21 | FSS | H | 7 | `3a1239d2` → `f10b7ce4` | blank/transition |
| 22 | TRA | H | 6 | `a7a944ed` → `4b7a84b0` | blank/transition |
| 23 | TRA | H | 7 | `d3b7d7a3` → `8fbf206d` | blank/transition |
| 24 | SYN | M | 4 | `b98b8f64` → `bce57278` | notes |
| 25 | SYN | M | 5 | `efa2be4f` → `72ae9bca` | notes |
| 26 | SYN | H | 6 | `1d79a59d` → `be3363dd` | notes |
| 27 | SYN | H | 7 | `459df2ba` → `8fe4f4ab` | notes |

### Math

#### Module 1

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.A. | E | 2→1 | `d76ab4f5` → `c3989ef8` ⚠ | mcq→mcq | N→N |
| 2 | P.C. | E | 2→3 | `2f8a580c` → `72ae8a87` ⚠ | mcq→mcq | N→N |
| 3 | Q.C. | E | 2→1 | `40f0ee70` → `79340403` ⚠ | spr→spr | N→Y |
| 4 | H.C. | E | 3 | `4edecdba` → `b8fa27db` ⚠ | spr→spr | N→Y |
| 5 | Q.D. | E | 3→2 | `632cf8f9` → `ae32cc3c` ⚠ | mcq→mcq | Y→Y |
| 6 | P.A. | E | 1 | `253985c2` → `5dd53f73` | mcq→mcq | N→N |
| 7 | S.B. | M | 4 | `585a9138` → `e89f63bf` ⚠ | spr→mcq | N→N |
| 8 | P.C. | E | 2→3 | `ffdfe1e1` → `cfff8f8e` ⚠ | mcq→mcq | N→N |
| 9 | P.B. | E | 3→2 | `63c00e2b` → `7a8cb72a` ⚠ | mcq→mcq | N→N |
| 10 | H.C. | E | 3 | `deee9063` → `1efd8202` | mcq→mcq | N→N |
| 11 | S.A. | M | 4 | `c4e5e23c` → `42155bac` | mcq→mcq | N→N |
| 12 | P.B. | M | 4 | `3934dd0a` → `75a32330` | mcq→mcq | N→N |
| 13 | H.A. | M | 5→4 | `5ab9903f` → `8c515062` ⚠ | mcq→mcq | N→N |
| 14 | H.B. | M | 5→4 | `23c5d458` → `a775af14` ⚠ | mcq→mcq | N→N |
| 15 | P.C. | M | 5 | `0a74365c` → `b7cd6ca6` ⚠ | spr→mcq | N→N |
| 16 | Q.D. | M | 4 | `38525983` → `e17babed` | mcq→mcq | Y→Y |
| 17 | P.C. | M | 5→4 | `b3b07f0c` → `dd8ac009` ⚠ | mcq→mcq | N→N |
| 18 | S.D. | H | 6 | `c447367f` → `10e059a6` | mcq→mcq | N→N |
| 19 | H.C. | H | 6→7 | `1a1a95de` → `9d0396d4` ⚠ | mcq→mcq | Y→Y |
| 20 | S.C. | H | 6→7 | `94f7c9e2` → `27d075d8` ⚠ | mcq→mcq | Y→N |
| 21 | H.B. | H | 7→6 | `63d03c0b` → `b988eeec` ⚠ | spr→spr | N→N |
| 22 | P.B. | M | 5→4 | `faeae876` → `895628b5` ⚠ | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | P.C. | E | 1 | `5f07b257` → `02c67921` | spr→spr | Y→Y |
| 2 | H.E. | E | 1→2 | `4047cfa7` → `86f7483f` ⚠ | mcq→mcq | N→N |
| 3 | Q.C. | E | 1 | `7b1a3200` → `a067c926` | mcq→mcq | Y→Y |
| 4 | H.B. | E | 3 | `346d5c2e` → `97eab129` | mcq→mcq | N→N |
| 5 | H.A. | E | 2 | `465c73ad` → `56e1b09e` | spr→spr | N→N |
| 6 | Q.B. | E | 1 | `73362607` → `771ee744` ⚠ | spr→mcq | N→N |
| 7 | H.B. | E | 2 | `343aaff6` → `1993561d` | mcq→mcq | N→N |
| 8 | P.B. | E | 3→2 | `cec36caf` → `c5d83a99` ⚠ | mcq→mcq | N→N |
| 9 | S.B. | E | 2 | `9342ca50` → `c24e1bda` | mcq→mcq | Y→Y |
| 10 | Q.E. | E | 1→2 | `ecf8d15f` → `60caadfd` ⚠ | mcq→mcq | N→N |
| 11 | H.D. | E | 3→2 | `d1aeb6f1` → `f5563c26` ⚠ | mcq→mcq | N→N |
| 12 | H.C. | E | 2→1 | `820ad8e8` → `b450ab03` ⚠ | mcq→mcq | N→N |
| 13 | Q.A. | E | 1 | `555939d2` → `312ba47c` | mcq→mcq | N→N |
| 14 | P.C. | M | 4 | `0f9f8ea7` → `3918e8bc` ⚠ | spr→mcq | N→N |
| 15 | S.B. | H | 6 | `1318dfea` → `6d99b141` ⚠ | mcq→spr | Y→Y |
| 16 | P.A. | E | 3→2 | `dc67c130` → `72ebc024` ⚠ | mcq→mcq | N→N |
| 17 | S.C. | M | 4 | `9823f279` → `2bddbc1b` ⚠ | spr→mcq | Y→Y |
| 18 | S.A. | M | 4 | `96467fea` → `e336a1d2` | mcq→mcq | N→N |
| 19 | P.B. | E | 3→2 | `fc2ec559` → `c8bf5313` ⚠ | mcq→mcq | N→N |
| 20 | P.C. | M | 4 | `4d425cef` → `768b60d2` | mcq→mcq | N→N |
| 21 | H.D. | M | 4→5 | `36f068e2` → `686b7cad` ⚠ | mcq→mcq | N→N |
| 22 | P.A. | M | 5 | `1e7a1deb` → `abc61109` | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | Band | BB11 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.B. | E | 1→2 | `3dffe9d2` → `bf883fde` ⚠ | mcq→mcq | N→N |
| 2 | H.D. | E | 3→2 | `3409707e` → `f88970cc` ⚠ | spr→mcq | N→N |
| 3 | H.E. | E | 2→3 | `00ec9102` → `f01ef454` ⚠ | mcq→mcq | N→N |
| 4 | Q.D. | M | 4 | `e9129a5c` → `03a16790` | mcq→mcq | Y→Y |
| 5 | P.C. | M | 4 | `7d3a84bf` → `beca03de` ⚠ | mcq→mcq | Y→N |
| 6 | H.B. | M | 4 | `68f343c9` → `58c7daed` | mcq→mcq | N→N |
| 7 | S.D. | H | 6 | `6b4707aa` → `b8a225ff` | spr→spr | N→N |
| 8 | H.B. | E | 3 | `346d5c2e` → `73b5f330` | mcq→mcq | N→N |
| 9 | P.B. | H | 6 | `041eda89` → `58b109d4` | spr→spr | N→N |
| 10 | P.A. | H | 6→7 | `c8a5c221` → `efc469c4` ⚠ | mcq→mcq | N→N |
| 11 | H.E. | H | 6 | `187f74bc` → `strix-6-math-hard-11` ⚠ | mcq→mcq | Y→Y |
| 12 | Q.E. | H | 7 | `9ce8cbbe` → `89ff6a0a` ⚠ | mcq→spr | N→N |
| 13 | Q.C. | H | 6 | `608cf8e2` → `241f1db7` ⚠ | mcq→mcq | Y→N |
| 14 | Q.A. | H | 7→6 | `b5bc47d5` → `11b06e35` ⚠ | mcq→mcq | N→N |
| 15 | P.A. | H | 7 | `565428e1` → `137cc6fd` | spr→spr | N→N |
| 16 | P.C. | H | 7 | `b0543157` → `1073d70c` | mcq→mcq | N→N |
| 17 | S.B. | H | 7 | `c41eb616` → `b1e1c2f5` ⚠ | mcq→spr | N→N |
| 18 | S.B. | H | 6 | `1318dfea` → `345cc36a` ⚠ | mcq→spr | Y→Y |
| 19 | H.D. | H | 7 | `58477a6c` → `ff501705` ⚠ | mcq→spr | N→N |
| 20 | S.A. | H | 7 | `62ec6574` → `f243c383` | mcq→mcq | N→N |
| 21 | P.C. | H | 7 | `c946d5bd` → `ce579859` ⚠ | mcq→mcq | Y→N |
| 22 | Q.B. | H | 7 | `699af7b3` → `98818acf` | spr→spr | N→N |
