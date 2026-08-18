# Strix Test 5 — Semantic Matching Audit

_Generated as a Bluebook 10-shaped full SAT. Questions are unused by official Bluebook forms 5–11 and Strix Test 1, 2, 3, 4._

## Goal

Strix Test 5 mirrors Bluebook Practice Test 10 slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer `score_band_range_cd` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.

## Sources & method

- Live College Board qbank (`get-questions` + `get-question`).
- Pool = fetchable `external_id` items **not** in official Bluebook forms 5–11 and Strix Test 1, 2, 3, 4.
- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.

## Result summary

- **147 questions, all unique**, none in Bluebook 5–11 or Strix Test 1/2/3/4.
- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.
- Domain, skill and difficulty match the Bluebook 10 slot exactly for all 147 questions.
- Score band matches on **128 / 147** slots (R&W 78/81).
- Answer type matches on **144 / 147** slots.
- Documented exceptions below the skill+difficulty bar: **24**.

## Exceptions

| Slot | Skill / Diff | BB10 original | Chosen | What differs | Why |
|---|---|---|---|---|---|
| rw · easy · Q5 | TSP / E | `d5600e74` | `fcc328c6` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · easy · Q10 | COE / E | `303bcc41` | `0992bd73` | **band: 1 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| rw · hard · Q24 | SYN / H | `5519da78-975a-4211-a2db-4a25f7f1fd8f` | `b0620764` | **band: null → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q1 | Q.E. / E | `b8150b17` | `eccbf957` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q6 | H.C. / E | `ba79f10f` | `d1042cf8` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q8 | P.A. / E | `f5c3e3b8` | `67e866b5` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q12 | P.C. / M | `cc6ccd71` | `cef0eada` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · m1 · Q14 | P.C. / H | `ee857afb` | `301faf80` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q2 | Q.C. / E | `ea95087d` | `55cfaf22` | **band: 1 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q3 | H.B. / M | `3e9eaffc` | `c8fb6bcb` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q8 | S.B. / E | `0d3f51dc` | `e0d2e21a` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q16 | P.C. / E | `a26c29f7` | `d84a514a` | **band: 2 → 3** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q17 | P.B. / E | `a67a439d` | `58443765` | **band: 3 → 2** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q21 | P.C. / M | `f1c81b3b` | `39714777` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · easy · Q22 | Q.B. / M | `ba61d95f` | `ad1d6adb` | **band: 5 → 4** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q1 | Q.D. / E | `43744269` | `8baf2118` | **stimulus form: none → diagram** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q4 | P.C. / M | `cb29c54c` | `68607eca` | **band: 4 → 5** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q8 | Q.C. / H | `d65b9a87` | `bf47ad54` | **stimulus form: diagram → none** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q10 | S.A. / H | `ba8ca563` | `f6ca90cc` | **band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q12 | Q.A. / H | `c7c6445f` | `69f6717f` | **band: 7 → 6** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q13 | S.B. / H | `010243e6` | `f731d88b` | **answer type: mcq → spr; band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q14 | H.E. / H | `ee7b1de1` | `5bf5136d` | **answer type: spr → mcq** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q17 | H.D. / H | `5e08a055` | `9b7a1b67` | **stimulus form: none → diagram; band: 6 → 7** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |
| math · hard · Q21 | H.D. / H | `75012ee7` | `27f5fff3` | **stimulus form: none → diagram** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |

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

IDs are CB `questionId`s. "→" is Bluebook 10 original → Strix Test 5 replacement.

### Reading & Writing

#### Module 1

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 2 | `69a6d050` → `e386a11d` | blank/transition |
| 2 | WIC | E | 2 | `83687083` → `80ebb189` | blank/transition |
| 3 | WIC | E | 3 | `a4ca92fd` → `fa014d2d` | blank/transition |
| 4 | WIC | E | 2 | `051d3065` → `fce80a36` | blank/transition |
| 5 | WIC | M | 5 | `3f37eb3b` → `f4166aae` | blank/transition |
| 6 | TSP | E | 2 | `be947479` → `a2dd51c1` | single |
| 7 | TSP | H | 6 | `0a04cac5` → `d9915c15` | single |
| 8 | CTC | M | 4 | `c8a2af72` → `059f7201` | paired |
| 9 | CID | M | 5 | `66bef967` → `d2e0cba5` | single |
| 10 | CID | M | 5 | `d73a908a` → `f64ff4fb` | single |
| 11 | COE | M | 5 | `03e5cf33` → `dd72993d` | single |
| 12 | COE | M | 5 | `39de2206` → `99fdf71c` | blank/transition |
| 13 | COE | M | 5 | `b30a2613` → `23e2421a` | blank/transition |
| 14 | INF | M | 5 | `f3f444bc` → `bcf2f169` | blank/transition |
| 15 | INF | M | 5 | `4a85fea6` → `7c1e5880` | blank/transition |
| 16 | BOU | E | 3 | `d75d57a0` → `577b09fa` | blank/transition |
| 17 | BOU | M | 4 | `cdbbbf94` → `8999c0c5` | blank/transition |
| 18 | FSS | M | 5 | `9f737b2a` → `dd6a0326` | blank/transition |
| 19 | BOU | H | 6 | `9d4a701b` → `a8fa749a` | blank/transition |
| 20 | BOU | H | 6 | `d4fe8f03` → `80aa7690` | blank/transition |
| 21 | TRA | M | 4 | `42301836` → `01c8c433` | blank/transition |
| 22 | TRA | M | 5 | `4fde4454` → `9f1a0d91` | blank/transition |
| 23 | TRA | M | 4 | `08be6347` → `25361ec6` | blank/transition |
| 24 | SYN | E | 3 | `c6645cab` → `6b5bc97d` | notes |
| 25 | SYN | M | 4 | `a86c0b1b` → `31ac4d2c` | notes |
| 26 | SYN | M | 4 | `24014c3f` → `92dec236` | notes |
| 27 | SYN | M | 5 | `6351062d` → `7aac173e` | notes |

#### Module 2 — easy

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | E | 1 | `e5e7f264` → `d4a8f7cb` | blank/transition |
| 2 | WIC | E | 3 | `6d5ddea4` → `aad56f2b` | blank/transition |
| 3 | WIC | E | 3 | `5effa190` → `849bf8d7` | blank/transition |
| 4 | WIC | E | 3 | `31d0bd9a` → `5d2fd27d` | blank/transition |
| 5 | TSP | E | 1→2 | `d5600e74` → `fcc328c6` | single |
| 6 | TSP | M | 4 | `97360a00` → `ae2b3112` | single |
| 7 | CID | E | 1 | `487a05f8` → `b168ce48` | single |
| 8 | CID | E | 2 | `706046f7` → `89961e26` | single |
| 9 | COE | H | 6 | `ec93e52c` → `9c407117` | single |
| 10 | COE | E | 1→3 | `303bcc41` → `0992bd73` | blank/transition |
| 11 | COE | E | 1 | `e37f79a7` → `faaf484f` | blank/transition |
| 12 | COE | M | 5 | `94978129` → `145da981` | single |
| 13 | COE | M | 5 | `9aa5efc4` → `b4cda84d` | single |
| 14 | INF | M | 5 | `54057e3f` → `6409016a` | blank/transition |
| 15 | FSS | E | 2 | `430d929a` → `7c48a6dd` | blank/transition |
| 16 | FSS | E | 2 | `576b2c70` → `cf08e2fd` | blank/transition |
| 17 | FSS | E | 3 | `4bed4658` → `0560b2b8` | blank/transition |
| 18 | BOU | E | 3 | `8a3998f1` → `aab78b25` | blank/transition |
| 19 | FSS | E | 3 | `0ff8477b` → `b7363ba2` | blank/transition |
| 20 | BOU | M | 5 | `da53d726` → `aecdb820` | blank/transition |
| 21 | TRA | E | 3 | `827afb27` → `9fe7315b` | blank/transition |
| 22 | TRA | E | 3 | `57bcd0d6` → `9f7ac40d` | blank/transition |
| 23 | TRA | E | 3 | `4f2710ab` → `4154a7a3` | blank/transition |
| 24 | TRA | E | 3 | `dd087f31` → `991e849a` | blank/transition |
| 25 | SYN | M | 4 | `f2f6009b` → `dd11e5ab` | notes |
| 26 | SYN | E | 3 | `3067723b` → `b5cd28a7` | notes |
| 27 | SYN | H | 6 | `0fab0c90` → `87d34a39` | notes |

#### Module 2 — hard

| # | Skill | Diff | Band | BB10 → Strix | Form |
|--:|---|:--:|:--:|---|---|
| 1 | WIC | H | 6 | `aaa3ee7c` → `5dce6cab` | blank/transition |
| 2 | WIC | H | 6 | `0462dac3` → `adc8ea28` | blank/transition |
| 3 | WIC | H | 7 | `a06c434d` → `177ed7dc` | blank/transition |
| 4 | WIC | H | 7 | `e26d23c4` → `5a97d9cd` | blank/transition |
| 5 | TSP | M | 5 | `d69bc408` → `dbb56a02` | single |
| 6 | TSP | H | 6 | `39857700` → `8af926b1` | single |
| 7 | TSP | H | 7 | `df45f0eb` → `9b01bcf4` | single |
| 8 | CID | H | 7 | `881ba6f1` → `e80ba20d` | single |
| 9 | COE | M | 5 | `2ef8e367` → `1f3be847` | blank/transition |
| 10 | COE | H | 6 | `014b3394` → `24c1b7e4` | single |
| 11 | COE | H | 6 | `6536183b` → `860803dd` | single |
| 12 | COE | H | 6 | `3fc06a91` → `35ec767c` | blank/transition |
| 13 | INF | H | 6 | `1b9b29f1` → `4b3d6062` | blank/transition |
| 14 | INF | H | 7 | `ac285054` → `71c2cea9` | blank/transition |
| 15 | FSS | M | 5 | `7f1df833` → `43b88827` | blank/transition |
| 16 | BOU | H | 7 | `5aae2475` → `c04e9136` | blank/transition |
| 17 | FSS | H | 7 | `c88ba1b7` → `dc645172` | blank/transition |
| 18 | BOU | H | 7 | `be37d4ae` → `f30a478e` | blank/transition |
| 19 | BOU | H | 7 | `a05cc490` → `e9aee0d8` | blank/transition |
| 20 | FSS | H | 7 | `5fd86f4b` → `c9a677e9` | blank/transition |
| 21 | TRA | M | 4 | `52b31d7b` → `28c7a762` | blank/transition |
| 22 | TRA | M | 5 | `b8eec031` → `b7c404d1` | blank/transition |
| 23 | TRA | H | 7 | `2b08f514` → `e225cf02` | blank/transition |
| 24 | SYN | H | null→6 | `5519da78-975a-4211-a2db-4a25f7f1fd8f` → `b0620764` | notes |
| 25 | SYN | E | 3 | `4b376902` → `7f2781fd` | notes |
| 26 | SYN | M | 5 | `dede8260` → `5a5e22b5` | notes |
| 27 | SYN | H | 7 | `2c61e0b9` → `3fa48bf3` | notes |

### Math

#### Module 1

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | Q.E. | E | 1→2 | `b8150b17` → `eccbf957` ⚠ | mcq→mcq | N→N |
| 2 | H.B. | E | 2 | `c4d49134` → `6863c7ce` | mcq→mcq | N→N |
| 3 | H.A. | E | 3 | `2e8cc1c0` → `935f3403` | mcq→mcq | N→N |
| 4 | Q.D. | E | 2 | `c5ee6ac0` → `d112bc9d` | mcq→mcq | Y→Y |
| 5 | Q.B. | E | 2 | `58a71e06` → `949cd96b` | mcq→mcq | N→N |
| 6 | H.C. | E | 3→2 | `ba79f10f` → `d1042cf8` ⚠ | mcq→mcq | N→N |
| 7 | P.C. | E | 3 | `c13016f9` → `befeb95f` | spr→spr | N→N |
| 8 | P.A. | E | 3→2 | `f5c3e3b8` → `67e866b5` ⚠ | mcq→mcq | N→N |
| 9 | S.B. | M | 4 | `055aafe7` → `d3fe472f` | mcq→mcq | N→N |
| 10 | Q.A. | M | 5 | `3726e079` → `61b87506` | spr→spr | N→N |
| 11 | H.B. | M | 4 | `56dc8045` → `7e1bff94` | mcq→mcq | N→N |
| 12 | P.C. | M | 4→5 | `cc6ccd71` → `cef0eada` ⚠ | mcq→mcq | Y→Y |
| 13 | P.C. | M | 4 | `4618501a` → `52b1700c` | mcq→mcq | N→N |
| 14 | P.C. | H | 6→7 | `ee857afb` → `301faf80` ⚠ | spr→spr | N→N |
| 15 | S.A. | H | 6 | `e5c57163` → `179edb12` | spr→spr | N→N |
| 16 | H.D. | M | 4 | `6ba39da5` → `e53688cb` | spr→spr | N→N |
| 17 | P.C. | H | 6 | `8490cc45` → `7bbfbe70` | mcq→mcq | N→N |
| 18 | P.C. | H | 6 | `a8ae0d22` → `ebed7dc6` | mcq→mcq | N→N |
| 19 | S.D. | M | 5 | `1efd7ef3` → `267f82b5` | mcq→mcq | N→N |
| 20 | H.D. | H | 6 | `14360f84` → `797a81fb` | mcq→mcq | N→N |
| 21 | P.B. | H | 7 | `ba0edc30` → `3a01a5ee` | mcq→mcq | N→N |
| 22 | P.B. | H | 7 | `104bff62` → `2c05d312` | mcq→mcq | N→N |

#### Module 2 — easy

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | H.A. | E | 2 | `349a5bc1` → `4e77195b` | spr→spr | N→N |
| 2 | Q.C. | E | 1→2 | `ea95087d` → `55cfaf22` ⚠ | mcq→mcq | N→N |
| 3 | H.B. | M | 4→5 | `3e9eaffc` → `c8fb6bcb` ⚠ | mcq→mcq | N→N |
| 4 | H.D. | E | 1 | `5f46fc76` → `b0fc3166` | mcq→mcq | Y→Y |
| 5 | Q.A. | E | 2 | `c81499e1` → `2d16d62c` | spr→spr | N→N |
| 6 | H.B. | E | 2 | `0d391910` → `447fa970` | spr→spr | N→N |
| 7 | S.B. | E | 3 | `0bb39de4` → `42b4493b` | mcq→mcq | N→N |
| 8 | S.B. | E | 2→3 | `0d3f51dc` → `e0d2e21a` ⚠ | mcq→mcq | Y→Y |
| 9 | H.D. | E | 2 | `ffb371f5` → `e0177f5f` | mcq→mcq | N→N |
| 10 | P.A. | E | 2 | `beb86a0c` → `02489d55` | mcq→mcq | N→N |
| 11 | H.C. | E | 3 | `174885f8` → `029c2dc2` | mcq→mcq | N→N |
| 12 | S.A. | E | 2 | `02b02213` → `9d2e7037` | mcq→mcq | N→N |
| 13 | H.C. | E | 3 | `10c448d6` → `cea27ab2` | mcq→mcq | N→N |
| 14 | S.C. | E | 2 | `c9f8d1e9` → `b0c5ece5` | mcq→mcq | Y→Y |
| 15 | H.C. | E | 3 | `7038b587` → `8b2a2a63` | spr→spr | N→N |
| 16 | P.C. | E | 2→3 | `a26c29f7` → `d84a514a` ⚠ | mcq→mcq | N→N |
| 17 | P.B. | E | 3→2 | `a67a439d` → `58443765` ⚠ | mcq→mcq | N→N |
| 18 | Q.D. | M | 4 | `24a1e6a7` → `2e74e403` | mcq→mcq | Y→Y |
| 19 | H.D. | H | 6 | `5e08a055` → `1b1deebe` | mcq→mcq | N→N |
| 20 | H.B. | M | 4 | `e470e19d` → `a5834ea4` | mcq→mcq | N→N |
| 21 | P.C. | M | 5 | `f1c81b3b` → `39714777` ⚠ | spr→mcq | N→N |
| 22 | Q.B. | M | 5→4 | `ba61d95f` → `ad1d6adb` ⚠ | mcq→mcq | N→N |

#### Module 2 — hard

| # | Skill | Diff | Band | BB10 → Strix | Type | Fig |
|--:|---|:--:|:--:|---|:--:|:--:|
| 1 | Q.D. | E | 3 | `43744269` → `8baf2118` ⚠ | mcq→mcq | N→Y |
| 2 | H.C. | M | 4 | `0451d754` → `df78b361` | mcq→mcq | N→N |
| 3 | H.B. | M | 4 | `3e9eaffc` → `946ab892` | mcq→mcq | N→N |
| 4 | P.C. | M | 4→5 | `cb29c54c` → `68607eca` ⚠ | mcq→mcq | N→N |
| 5 | H.B. | M | 5 | `e3cf671f` → `c387583f` | spr→spr | N→N |
| 6 | S.B. | E | 3 | `0bb39de4` → `f1747a6a` | mcq→mcq | N→N |
| 7 | H.E. | H | 6 | `541bef2f` → `f8ff3249` | mcq→mcq | N→N |
| 8 | Q.C. | H | 6 | `d65b9a87` → `bf47ad54` ⚠ | mcq→mcq | Y→N |
| 9 | P.C. | M | 5 | `752055d1` → `e1f9000d` | mcq→mcq | N→N |
| 10 | S.A. | H | 6→7 | `ba8ca563` → `f6ca90cc` ⚠ | spr→spr | N→N |
| 11 | H.D. | H | 6 | `edc1b7b7` → `f718c9cf` | spr→spr | N→N |
| 12 | Q.A. | H | 7→6 | `c7c6445f` → `69f6717f` ⚠ | mcq→mcq | N→N |
| 13 | S.B. | H | 6→7 | `010243e6` → `f731d88b` ⚠ | mcq→spr | N→N |
| 14 | H.E. | H | 7 | `ee7b1de1` → `5bf5136d` ⚠ | spr→mcq | N→N |
| 15 | S.C. | H | 7 | `ae041e52` → `58c26db8` | mcq→mcq | N→N |
| 16 | S.D. | H | 7 | `9d159400` → `3e577e4a` | mcq→mcq | N→N |
| 17 | H.D. | H | 6→7 | `5e08a055` → `9b7a1b67` ⚠ | mcq→mcq | N→Y |
| 18 | P.A. | H | 7 | `20291f47` → `ffdbcad4` | mcq→mcq | N→N |
| 19 | P.B. | H | 7 | `133f3e41` → `77c0cced` | mcq→mcq | N→N |
| 20 | P.B. | H | 7 | `03ff48d2` → `30596346` | spr→spr | N→N |
| 21 | H.D. | H | 7 | `75012ee7` → `27f5fff3` ⚠ | mcq→mcq | N→Y |
| 22 | H.B. | H | 7 | `8c5e6702` → `a7e2859a` | mcq→mcq | N→N |
