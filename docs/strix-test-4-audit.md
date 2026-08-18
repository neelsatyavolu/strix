# Strix Test 4 — Semantic Matching Audit

_Generated as a Bluebook 10-shaped full SAT. Questions are unused by official Bluebook forms 5–11 and Strix Test 1, 2, 3._

## Goal

Strix Test 4 mirrors Bluebook Practice Test 10 slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer `score_band_range_cd` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.

## Sources & method

- Live College Board qbank (`get-questions` + `get-question`).
- Pool = fetchable `external_id` items **not** in official Bluebook forms 5–11 and Strix Test 1, 2, 3.
- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.

## Result summary

- **147 questions, all unique**, none in Bluebook 5–11 or Strix Test 1/2/3.
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- Domain, skill and difficulty match the Bluebook 10 slot exactly for all 147 questions.
- Score band matches on **134 / 147** slots (R&W 79/81).
- Answer type matches on **145 / 147** slots.
- Documented exceptions below the skill+difficulty bar: **15**.

## Exceptions

| Slot | Skill / Diff | BB10 original | Chosen | What differs | Why |
|---|---|---|---|---|---|
| rw · easy · Q10 | COE / E | `303bcc41` | `df34b586` | **band: 1 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · hard · Q24 | SYN / H | `5519da78-975a-4211-a2db-4a25f7f1fd8f` | `9336f63b` | **band: null → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q4 | Q.D. / E | `c5ee6ac0` | `2e511919` | **band: 2 → 1** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q1 | H.A. / E | `349a5bc1` | `8339793c` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q7 | S.B. / E | `0bb39de4` | `739f1bbc` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q14 | S.C. / E | `c9f8d1e9` | `e6f2ace7` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q15 | H.C. / E | `7038b587` | `12ae3452` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q16 | P.C. / E | `a26c29f7` | `04b985e6` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q21 | P.C. / M | `f1c81b3b` | `c7a187a7` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q7 | H.E. / H | `541bef2f` | `6c71f3ec` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q8 | Q.C. / H | `d65b9a87` | `c78bb2b8` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q9 | P.C. / M | `752055d1` | `02add2d2` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q10 | S.A. / H | `ba8ca563` | `983412ea` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q13 | S.B. / H | `010243e6` | `f67255ea` | **answer type: mcq → spr; band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q14 | H.E. / H | `ee7b1de1` | `1a621af4` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |

## Per-module skill counts

**Reading & Writing**

- m1 — 27 questions: BOU×4, CID×2, COE×3, CTC×1, FSS×1, INF×2, SYN×4, TRA×3, TSP×2, WIC×5
- easy — 27 questions: BOU×2, CID×2, COE×5, FSS×4, INF×1, SYN×3, TRA×4, TSP×2, WIC×4
- hard — 27 questions: BOU×3, CID×1, COE×4, FSS×3, INF×2, SYN×4, TRA×3, TSP×3, WIC×4

**Math**

- m1 — 22 questions: H.A.×1, H.B.×2, H.C.×1, H.D.×2, P.A.×1, P.B.×2, P.C.×6, Q.A.×1, Q.B.×1, Q.D.×1, Q.E.×1, S.A.×1, S.B.×1, S.D.×1
- easy — 22 questions: H.A.×1, H.B.×3, H.C.×3, H.D.×3, P.A.×1, P.B.×1, P.C.×2, Q.A.×1, Q.B.×1, Q.C.×1, Q.D.×1, S.A.×1, S.B.×2, S.C.×1
- hard — 22 questions: H.B.×3, H.C.×1, H.D.×3, H.E.×2, P.A.×1, P.B.×2, P.C.×2, Q.A.×1, Q.C.×1, Q.D.×1, S.A.×1, S.B.×2, S.C.×1, S.D.×1

## Full slot-by-slot mapping

IDs are CB `questionId`s. "→" is Bluebook 10 original → Strix Test 4 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `69a6d050` → `089b0b41` | blank/transition |
| 2 | WIC | E | 2 | `83687083` → `8d579825` | blank/transition |
| 3 | WIC | E | 3 | `a4ca92fd` → `7d84fe2b` | blank/transition |
| 4 | WIC | E | 2 | `051d3065` → `b5898291` | blank/transition |
| 5 | WIC | M | 5 | `3f37eb3b` → `e0656211` | blank/transition |
| 6 | TSP | E | 2 | `be947479` → `662892ad` | single |
| 7 | TSP | H | 6 | `0a04cac5` → `65406d2c` | single |
| 8 | CTC | M | 4 | `c8a2af72` → `97e5bf55` | paired |
| 9 | CID | M | 5 | `66bef967` → `66c47028` | single |
| 10 | CID | M | 5 | `d73a908a` → `96802cc0` | single |
| 11 | COE | M | 5 | `03e5cf33` → `73d457b6` | single |
| 12 | COE | M | 5 | `39de2206` → `c6b470bb` | blank/transition |
| 13 | COE | M | 5 | `b30a2613` → `e99a38ec` | single |
| 14 | INF | M | 5 | `f3f444bc` → `c4d43991` | blank/transition |
| 15 | INF | M | 5 | `4a85fea6` → `485962a6` | blank/transition |
| 16 | BOU | E | 3 | `d75d57a0` → `667a0587` | blank/transition |
| 17 | BOU | M | 4 | `cdbbbf94` → `6df020e6` | blank/transition |
| 18 | FSS | M | 5 | `9f737b2a` → `a14eef71` | blank/transition |
| 19 | BOU | H | 6 | `9d4a701b` → `78b88c04` | blank/transition |
| 20 | BOU | H | 6 | `d4fe8f03` → `5ee7fb04` | blank/transition |
| 21 | TRA | M | 4 | `42301836` → `a819d8b6` | blank/transition |
| 22 | TRA | M | 5 | `4fde4454` → `e1b00a70` | blank/transition |
| 23 | TRA | M | 4 | `08be6347` → `221ecf0f` | blank/transition |
| 24 | SYN | E | 3 | `c6645cab` → `5a2a4b36` | notes |
| 25 | SYN | M | 4 | `a86c0b1b` → `bfad4508` | notes |
| 26 | SYN | M | 4 | `24014c3f` → `56cad44a` | notes |
| 27 | SYN | M | 5 | `6351062d` → `afec1a70` | notes |

#### Module 2 — easy

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `e5e7f264` → `bcd924a5` | blank/transition |
| 2 | WIC | E | 3 | `6d5ddea4` → `d8d1ecaa` | blank/transition |
| 3 | WIC | E | 3 | `5effa190` → `644f59cd` | blank/transition |
| 4 | WIC | E | 3 | `31d0bd9a` → `f7d58b53` | blank/transition |
| 5 | TSP | E | 1 | `d5600e74` → `48e4021d` | single |
| 6 | TSP | M | 4 | `97360a00` → `7d8224f9` | single |
| 7 | CID | E | 1 | `487a05f8` → `6675c5c3` | single |
| 8 | CID | E | 2 | `706046f7` → `c6d7dc78` | single |
| 9 | COE | H | 6 | `ec93e52c` → `8545ccfe` | single |
| 10 | COE | E | 1→3 | `303bcc41` → `df34b586` | blank/transition |
| 11 | COE | E | 1 | `e37f79a7` → `bc1b8a42` | blank/transition |
| 12 | COE | M | 5 | `94978129` → `f8244f7c` | single |
| 13 | COE | M | 5 | `9aa5efc4` → `7fdba7ad` | single |
| 14 | INF | M | 5 | `54057e3f` → `5105ca38` | blank/transition |
| 15 | FSS | E | 2 | `430d929a` → `353890a1` | blank/transition |
| 16 | FSS | E | 2 | `576b2c70` → `5ad2a12c` | blank/transition |
| 17 | FSS | E | 3 | `4bed4658` → `dbd78791` | blank/transition |
| 18 | BOU | E | 3 | `8a3998f1` → `7b950fc2` | blank/transition |
| 19 | FSS | E | 3 | `0ff8477b` → `d4f173ec` | blank/transition |
| 20 | BOU | M | 5 | `da53d726` → `ac5536c1` | blank/transition |
| 21 | TRA | E | 3 | `827afb27` → `a773f069` | blank/transition |
| 22 | TRA | E | 3 | `57bcd0d6` → `a6155e60` | blank/transition |
| 23 | TRA | E | 3 | `4f2710ab` → `b5972710` | blank/transition |
| 24 | TRA | E | 3 | `dd087f31` → `b7571c0a` | blank/transition |
| 25 | SYN | M | 4 | `f2f6009b` → `35507eba` | notes |
| 26 | SYN | E | 3 | `3067723b` → `25a197dd` | notes |
| 27 | SYN | H | 6 | `0fab0c90` → `1773fa73` | notes |

#### Module 2 — hard

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | H | 6 | `aaa3ee7c` → `bbb77c84` | blank/transition |
| 2 | WIC | H | 6 | `0462dac3` → `4d13a0c0` | blank/transition |
| 3 | WIC | H | 7 | `a06c434d` → `b411eb09` | blank/transition |
| 4 | WIC | H | 7 | `e26d23c4` → `3021d9ef` | blank/transition |
| 5 | TSP | M | 5 | `d69bc408` → `dcd9ad50` | single |
| 6 | TSP | H | 6 | `39857700` → `ca50de52` | single |
| 7 | TSP | H | 7 | `df45f0eb` → `153aaae2` | single |
| 8 | CID | H | 7 | `881ba6f1` → `d1b8a9ad` | single |
| 9 | COE | M | 5 | `2ef8e367` → `25290c8d` | blank/transition |
| 10 | COE | H | 6 | `014b3394` → `2c06139b` | single |
| 11 | COE | H | 6 | `6536183b` → `22e4d633` | single |
| 12 | COE | H | 6 | `3fc06a91` → `5cf5c0d3` | blank/transition |
| 13 | INF | H | 6 | `1b9b29f1` → `f495b554` | blank/transition |
| 14 | INF | H | 7 | `ac285054` → `f1bfbed3` | blank/transition |
| 15 | FSS | M | 5 | `7f1df833` → `4c9a2aee` | blank/transition |
| 16 | BOU | H | 7 | `5aae2475` → `adf210e7` | blank/transition |
| 17 | FSS | H | 7 | `c88ba1b7` → `9127635a` | blank/transition |
| 18 | BOU | H | 7 | `be37d4ae` → `707461d8` | blank/transition |
| 19 | BOU | H | 7 | `a05cc490` → `c06af4d8` | blank/transition |
| 20 | FSS | H | 7 | `5fd86f4b` → `c7cb5186` | blank/transition |
| 21 | TRA | M | 4 | `52b31d7b` → `d3898d32` | blank/transition |
| 22 | TRA | M | 5 | `b8eec031` → `ad729337` | blank/transition |
| 23 | TRA | H | 7 | `2b08f514` → `a266d876` | blank/transition |
| 24 | SYN | H | null→6 | `5519da78-975a-4211-a2db-4a25f7f1fd8f` → `9336f63b` | notes |
| 25 | SYN | E | 3 | `4b376902` → `af76771f` | notes |
| 26 | SYN | M | 5 | `dede8260` → `7fa2b1ee` | notes |
| 27 | SYN | H | 7 | `2c61e0b9` → `b07a7634` | notes |

### Math

#### Module 1

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | Q.E. | E | 1 | `b8150b17` → `0a99e5bb` | mcq→mcq | N→N |
| 2 | H.B. | E | 2 | `c4d49134` → `9d9fe1e6` | mcq→mcq | N→N |
| 3 | H.A. | E | 3 | `2e8cc1c0` → `fbb0ea7f` | mcq→mcq | N→N |
| 4 | Q.D. | E | 2→1 | `c5ee6ac0` → `2e511919` ⚠ | mcq→mcq | Y→Y |
| 5 | Q.B. | E | 2 | `58a71e06` → `3a6ed720` | mcq→mcq | N→N |
| 6 | H.C. | E | 3 | `ba79f10f` → `768b2425` | mcq→mcq | N→N |
| 7 | P.C. | E | 3 | `c13016f9` → `09f58996` | spr→spr | N→N |
| 8 | P.A. | E | 3 | `f5c3e3b8` → `1e8d7183` | mcq→mcq | N→N |
| 9 | S.B. | M | 4 | `055aafe7` → `94364a79` | mcq→mcq | N→N |
| 10 | Q.A. | M | 5 | `3726e079` → `eb672707` | spr→spr | N→N |
| 11 | H.B. | M | 4 | `56dc8045` → `1bc11c4e` | mcq→mcq | N→N |
| 12 | P.C. | M | 4 | `cc6ccd71` → `9ff88bb5` | mcq→mcq | Y→Y |
| 13 | P.C. | M | 4 | `4618501a` → `15c364bf` | mcq→mcq | N→N |
| 14 | P.C. | H | 6 | `ee857afb` → `7a6d06bf` | spr→spr | N→N |
| 15 | S.A. | H | 6 | `e5c57163` → `899c6042` | spr→spr | N→N |
| 16 | H.D. | M | 4 | `6ba39da5` → `38a43902` | spr→spr | N→N |
| 17 | P.C. | H | 6 | `8490cc45` → `2c6f214f` | mcq→mcq | N→N |
| 18 | P.C. | H | 6 | `a8ae0d22` → `1fe10d97` | mcq→mcq | N→N |
| 19 | S.D. | M | 5 | `1efd7ef3` → `82c8325f` | mcq→mcq | N→N |
| 20 | H.D. | H | 6 | `14360f84` → `f03465dc` | mcq→mcq | N→N |
| 21 | P.B. | H | 7 | `ba0edc30` → `88a0c425` | mcq→mcq | N→N |
| 22 | P.B. | H | 7 | `104bff62` → `c8e9a011` | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.A. | E | 2→3 | `349a5bc1` → `8339793c` ⚠ | spr→spr | N→N |
| 2 | Q.C. | E | 1 | `ea95087d` → `d1db8def` | mcq→mcq | N→N |
| 3 | H.B. | M | 4 | `3e9eaffc` → `2f34cd1c` | mcq→mcq | N→N |
| 4 | H.D. | E | 1 | `5f46fc76` → `e6545fa8` | mcq→mcq | Y→Y |
| 5 | Q.A. | E | 2 | `c81499e1` → `3c8fdc40` | spr→spr | N→N |
| 6 | H.B. | E | 2 | `0d391910` → `5ad6bc97` | spr→spr | N→N |
| 7 | S.B. | E | 3→2 | `0bb39de4` → `739f1bbc` ⚠ | mcq→mcq | N→N |
| 8 | S.B. | E | 2 | `0d3f51dc` → `d21270da` | mcq→mcq | Y→Y |
| 9 | H.D. | E | 2 | `ffb371f5` → `aff28230` | mcq→mcq | N→N |
| 10 | P.A. | E | 2 | `beb86a0c` → `4ac59df6` | mcq→mcq | N→N |
| 11 | H.C. | E | 3 | `174885f8` → `ebf8d2b7` | mcq→mcq | N→N |
| 12 | S.A. | E | 2 | `02b02213` → `4ddfa209` | mcq→mcq | N→N |
| 13 | H.C. | E | 3 | `10c448d6` → `ee846db7` | mcq→mcq | N→N |
| 14 | S.C. | E | 2→3 | `c9f8d1e9` → `e6f2ace7` ⚠ | mcq→mcq | Y→Y |
| 15 | H.C. | E | 3→2 | `7038b587` → `12ae3452` ⚠ | spr→spr | N→N |
| 16 | P.C. | E | 2→3 | `a26c29f7` → `04b985e6` ⚠ | mcq→mcq | N→N |
| 17 | P.B. | E | 3 | `a67a439d` → `b8c4a1cd` | mcq→mcq | N→N |
| 18 | Q.D. | M | 4 | `24a1e6a7` → `fdfc90e4` | mcq→mcq | Y→Y |
| 19 | H.D. | H | 6 | `5e08a055` → `5e9b6079` | mcq→mcq | N→N |
| 20 | H.B. | M | 4 | `e470e19d` → `1c29bfd1` | mcq→mcq | N→N |
| 21 | P.C. | M | 5 | `f1c81b3b` → `c7a187a7` ⚠ | spr→mcq | N→N |
| 22 | Q.B. | M | 5 | `ba61d95f` → `121dc44f` | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | Q.D. | E | 3 | `43744269` → `a03b7e02` | mcq→mcq | N→N |
| 2 | H.C. | M | 4 | `0451d754` → `92aa3a94` | mcq→mcq | N→N |
| 3 | H.B. | M | 4 | `3e9eaffc` → `8b9960b2` | mcq→mcq | N→N |
| 4 | P.C. | M | 4 | `cb29c54c` → `7e5a3640` | mcq→mcq | N→N |
| 5 | H.B. | M | 5 | `e3cf671f` → `c01f4a95` | spr→spr | N→N |
| 6 | S.B. | E | 3 | `0bb39de4` → `e570a99c` | mcq→mcq | N→N |
| 7 | H.E. | H | 6→7 | `541bef2f` → `6c71f3ec` ⚠ | mcq→mcq | N→N |
| 8 | Q.C. | H | 6 | `d65b9a87` → `c78bb2b8` ⚠ | mcq→mcq | Y→N |
| 9 | P.C. | M | 5→4 | `752055d1` → `02add2d2` ⚠ | mcq→mcq | N→N |
| 10 | S.A. | H | 6→7 | `ba8ca563` → `983412ea` ⚠ | spr→spr | N→N |
| 11 | H.D. | H | 6 | `edc1b7b7` → `73b3b7d8` | spr→spr | N→N |
| 12 | Q.A. | H | 7 | `c7c6445f` → `4c5ea142` | mcq→mcq | N→N |
| 13 | S.B. | H | 6→7 | `010243e6` → `f67255ea` ⚠ | mcq→spr | N→N |
| 14 | H.E. | H | 7→6 | `ee7b1de1` → `1a621af4` ⚠ | spr→spr | N→N |
| 15 | S.C. | H | 7 | `ae041e52` → `6ab30ce3` | mcq→mcq | N→N |
| 16 | S.D. | H | 7 | `9d159400` → `6585d841` | mcq→mcq | N→N |
| 17 | H.D. | H | 6 | `5e08a055` → `8383771a` | mcq→mcq | N→N |
| 18 | P.A. | H | 7 | `20291f47` → `7355b9d9` | mcq→mcq | N→N |
| 19 | P.B. | H | 7 | `133f3e41` → `c8db0e19` | mcq→mcq | N→N |
| 20 | P.B. | H | 7 | `03ff48d2` → `7028c74f` | spr→spr | N→N |
| 21 | H.D. | H | 7 | `75012ee7` → `1e0a46e4` | mcq→mcq | N→N |
| 22 | H.B. | H | 7 | `8c5e6702` → `114ae8a9` | mcq→mcq | N→N |
