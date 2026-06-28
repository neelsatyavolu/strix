import "server-only";
import type { Difficulty, Question, QuestionStub, Section } from "./types";
import { listStubs, getQuestion } from "./client";
import {
  allocateDomainCounts,
  arrangeMathQuestions,
  SAT_MODULE_DOMAIN_RANGES,
  selectPretestQuestions,
} from "../practice/sessionLogic.mjs";

// Assembles a full SAT module the way College Board's published test
// specification describes it, rather than a flat random shuffle:
//
//  - R&W: questions are grouped by content domain in a FIXED order
//    (Craft and Structure -> Information and Ideas -> Standard English
//    Conventions -> Expression of Ideas) and, within each domain, grouped by
//    skill and arranged easiest -> hardest. SEC is ordered by difficulty only.
//  - Math: a single easiest -> hardest ramp with the four domains interleaved.
//  - Per-domain question counts vary test-to-test within CB's published ranges.
//  - Module 1 draws a broad difficulty mix; Module 2A/2B shift the pool easier
//    or harder to mirror the adaptive second module.
//
// Source: CB "Digital SAT Suite Assessment Specifications" domain order, weight
// ranges, and difficulty-ramp rules.
//
// >>> Before changing any SAT structure/ordering/scoring here, read
// >>> docs/sat-realism.md — it has the verified spec (with sources + confidence
// >>> flags), this app's fidelity audit, the dedup policy, and the full-SAT roadmap.
// >>> Do not assume how the SAT works; verify against those sources.

const DIFF_RANK: Record<Difficulty, number> = { E: 0, M: 1, H: 2 };

interface DomainRange {
  code: string;
  min: number;
  max: number;
}

const OPERATIONAL_TOTAL: Record<Section, number> = { rw: 25, math: 20 };
const PRETEST_PER_MODULE = 2;

// Fixed test-order of R&W domains (per the CB specification).
const RW_DOMAIN_ORDER = ["CAS", "INI", "SEC", "EOI"];

// Canonical within-domain skill order (CB `skill_cd`, verified against the live
// qbank API). SEC is excluded — it is ordered by difficulty only, not by skill.
const RW_SKILL_ORDER: Record<string, number> = {
  WIC: 0, TSP: 1, CTC: 2, // Craft and Structure
  CID: 0, COE: 1, INF: 2, // Information and Ideas
  TRA: 0, SYN: 1, // Expression of Ideas
};

export type DifficultyProfile = "mixed" | "easy" | "hard";

// Fraction of a module's questions targeted at each difficulty, per profile.
const PROFILE_WEIGHTS: Record<DifficultyProfile, Record<Difficulty, number>> = {
  mixed: { E: 0.3, M: 0.4, H: 0.3 },
  easy: { E: 0.45, M: 0.4, H: 0.15 },
  hard: { E: 0.15, M: 0.4, H: 0.45 },
};

const OVERDRAW = 3; // R&W per-domain buffer to tolerate the odd failed detail fetch
// Math fetches more per domain: question type (MCQ vs grid-in) isn't on the list
// stub, so selectMath needs extra candidates of both types to hit the grid-in target.
const MATH_OVERDRAW = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stubId(s: QuestionStub): string {
  return s.externalId ?? s.ibn ?? s.questionId;
}

/** Split `n` across E/M/H by the profile weights (largest-remainder rounding). */
function allocateByDifficulty(n: number, profile: DifficultyProfile): Record<Difficulty, number> {
  const w = PROFILE_WEIGHTS[profile];
  const raw: Record<Difficulty, number> = { E: n * w.E, M: n * w.M, H: n * w.H };
  const out: Record<Difficulty, number> = {
    E: Math.floor(raw.E),
    M: Math.floor(raw.M),
    H: Math.floor(raw.H),
  };
  const rem = n - (out.E + out.M + out.H);
  const byFrac = (["E", "M", "H"] as Difficulty[]).sort(
    (a, b) => raw[b] - out[b] - (raw[a] - out[a]),
  );
  for (let i = 0; i < rem; i++) out[byFrac[i % byFrac.length]] += 1;
  return out;
}

/** Select `n` stubs from a (homogeneous) pool, biased to the profile's difficulty mix. */
function takeByProfile(stubs: QuestionStub[], n: number, profile: DifficultyProfile): QuestionStub[] {
  if (n <= 0) return [];
  const buckets: Record<Difficulty, QuestionStub[]> = { E: [], M: [], H: [] };
  for (const s of shuffle(stubs)) buckets[s.difficulty].push(s);
  const want = allocateByDifficulty(n, profile);
  const result: QuestionStub[] = [];
  const leftover: QuestionStub[] = [];
  for (const d of ["E", "M", "H"] as Difficulty[]) {
    const take = Math.min(want[d], buckets[d].length);
    result.push(...buckets[d].slice(0, take));
    leftover.push(...buckets[d].slice(take));
  }
  const deficit = n - result.length;
  if (deficit > 0) result.push(...shuffle(leftover).slice(0, deficit));
  return result;
}

/**
 * Pick `total` stubs from one domain. ALL unseen items are exhausted before any
 * previously-seen item is reused (the difficulty profile is applied within
 * whichever pool is being drawn). The returned list is unseen-first, so a later
 * trim keeps the unseen items.
 */
function pickStubs(
  stubs: QuestionStub[],
  total: number,
  profile: DifficultyProfile,
  seen?: Set<string>,
): QuestionStub[] {
  if (!seen?.size) return takeByProfile(stubs, total, profile);
  const id = (s: QuestionStub) => s.externalId ?? s.ibn ?? s.questionId;
  const unseen = stubs.filter((s) => !seen.has(id(s)));
  const fromUnseen = takeByProfile(unseen, Math.min(total, unseen.length), profile);
  if (fromUnseen.length >= total) return fromUnseen;
  const seenStubs = stubs.filter((s) => seen.has(id(s)));
  return [...fromUnseen, ...takeByProfile(seenStubs, total - fromUnseen.length, profile)];
}

function byDifficultyAsc(a: Question, b: Question): number {
  return DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty];
}

/** R&W: fixed domain order; within domain, skills in canonical order, ramped. */
function arrangeRW(questions: Question[]): Question[] {
  const out: Question[] = [];
  for (const code of RW_DOMAIN_ORDER) {
    const inDomain = [...questions.filter((q) => q.domain === code)];
    if (code === "SEC") {
      // Standard English Conventions is arranged by difficulty only.
      inDomain.sort(byDifficultyAsc);
    } else {
      // Skills in their published order; easiest -> hardest within each skill.
      inDomain.sort((a, b) => {
        const sa = RW_SKILL_ORDER[a.skill] ?? 99;
        const sb = RW_SKILL_ORDER[b.skill] ?? 99;
        return sa - sb || byDifficultyAsc(a, b);
      });
    }
    out.push(...inDomain);
  }
  return out;
}

/** Math: one easiest -> hardest ramp across MCQ and SPR. */
function arrangeMath(questions: Question[]): Question[] {
  return arrangeMathQuestions(questions) as Question[];
}

/**
 * Choose the kept Math questions: hit each domain's count AND a ~5–6 grid-in
 * (SPR) total, the real-test proportion. Question type is only known after fetch,
 * so this runs on fetched questions.
 *
 * Step 1 fills each domain to its count by priority tier (unseen before seen,
 * MCQ before SPR). Step 2 rebalances the grid-in count to the target via
 * SAME-DOMAIN MCQ<->SPR swaps — these preserve every domain count and are only
 * made when they don't replace an unseen item with a seen one, so dedup still
 * wins over the grid-in target.
 */
function selectMath(
  questions: Question[],
  counts: Record<string, number>,
  seen?: Set<string>,
): Question[] {
  const sprTarget = 5; // 20 operational Math items: about 25% SPR.
  const seenRank = (q: Question): number => (seen && seen.has(q.id) ? 1 : 0);
  const tier = (q: Question): number => seenRank(q) * 2 + (q.type === "spr" ? 1 : 0);

  // Step 1 — per-domain fill, unseen-first then MCQ-first (so grid-ins start low).
  const kept: Record<string, Question[]> = {};
  const rest: Record<string, Question[]> = {};
  for (const code of Object.keys(counts)) {
    const pool = questions.filter((q) => q.domain === code).sort((a, b) => tier(a) - tier(b));
    kept[code] = pool.slice(0, counts[code]);
    rest[code] = pool.slice(counts[code]);
  }
  const sprCount = () => Object.values(kept).flat().filter((q) => q.type === "spr").length;

  // Step 2a — too few grid-ins: swap a kept MCQ for a reserve SPR (dedup-safe).
  for (let guard = 0; sprCount() < sprTarget && guard < 100; guard++) {
    let swapped = false;
    for (const code of Object.keys(counts)) {
      const mi = kept[code].findIndex((q) => q.type !== "spr");
      if (mi < 0) continue;
      const mcq = kept[code][mi];
      const si = rest[code].findIndex((q) => q.type === "spr" && seenRank(q) <= seenRank(mcq));
      if (si < 0) continue;
      [kept[code][mi], rest[code][si]] = [rest[code][si], kept[code][mi]];
      swapped = true;
      break;
    }
    if (!swapped) break;
  }
  // Step 2b — too many grid-ins: swap a kept SPR for a reserve MCQ (dedup-safe).
  for (let guard = 0; sprCount() > sprTarget && guard < 100; guard++) {
    let swapped = false;
    for (const code of Object.keys(counts)) {
      const si = kept[code].findIndex((q) => q.type === "spr");
      if (si < 0) continue;
      const spr = kept[code][si];
      const mi = rest[code].findIndex((q) => q.type !== "spr" && seenRank(q) <= seenRank(spr));
      if (mi < 0) continue;
      [kept[code][si], rest[code][mi]] = [rest[code][mi], kept[code][si]];
      swapped = true;
      break;
    }
    if (!swapped) break;
  }
  return Object.values(kept).flat();
}

async function drawPretests(
  stubs: QuestionStub[],
  profile: DifficultyProfile,
  usedIds: Set<string>,
  seen?: Set<string>,
  sprTarget: number | null = null,
  overdraw = OVERDRAW,
): Promise<Question[]> {
  const candidates = stubs.filter((s) => !usedIds.has(stubId(s)));
  const picked = pickStubs(candidates, PRETEST_PER_MODULE + overdraw, profile, seen);
  const fetched = await Promise.all(picked.map((s) => getQuestion(s)));
  const available: Question[] = [];
  const availableIds = new Set<string>();
  for (const q of fetched) {
    if (!q?.stemHtml || usedIds.has(q.id) || availableIds.has(q.id)) continue;
    available.push(q);
    availableIds.add(q.id);
  }
  const selected = selectPretestQuestions(available, { limit: PRETEST_PER_MODULE, sprTarget }) as Question[];
  for (const q of selected) usedIds.add(q.id);
  return selected.map((q) => ({ ...q, pretest: true }));
}

export interface ModuleDrawOptions {
  section: Section;
  /** Module 1 = "mixed"; adaptive Module 2A = "easy", 2B = "hard". */
  profile?: DifficultyProfile;
  /** Hard exclusion — ids never drawn (e.g. items already in this test/module). */
  exclude?: Set<string>;
  /** Soft exclusion — ids drawn only once unseen items run out (cross-session history). */
  seen?: Set<string>;
}

/** Draw one blueprinted, test-ordered SAT module of real CB questions. */
export async function drawModule(opts: ModuleDrawOptions): Promise<Question[]> {
  const { section, profile = "mixed", exclude, seen } = opts;
  const ranges = SAT_MODULE_DOMAIN_RANGES[section] as DomainRange[];
  const total = OPERATIONAL_TOTAL[section];

  let stubs = await listStubs(section);
  stubs = stubs.filter((s) => s.externalId); // qbank items render math inline
  if (exclude?.size) stubs = stubs.filter((s) => !exclude.has(s.externalId as string));

  const byDomain = new Map<string, QuestionStub[]>();
  for (const s of stubs) {
    const g = byDomain.get(s.domain) ?? [];
    g.push(s);
    byDomain.set(s.domain, g);
  }

  const counts = allocateDomainCounts(ranges, total) as Record<string, number>;

  const buffer = section === "math" ? MATH_OVERDRAW : OVERDRAW;
  const picked: QuestionStub[] = [];
  for (const r of ranges) {
    picked.push(...pickStubs(byDomain.get(r.code) ?? [], counts[r.code] + buffer, profile, seen));
  }

  const fetched = await Promise.all(picked.map((s) => getQuestion(s)));
  const questions = fetched.filter((q): q is Question => !!q && !!q.stemHtml);

  if (section === "rw") {
    // Keep the allocated count per domain, preserving the unseen-first fetch
    // order so the trim never drops an unseen item in favor of a seen one.
    const kept: Question[] = [];
    for (const r of ranges) {
      kept.push(...questions.filter((q) => q.domain === r.code).slice(0, counts[r.code]));
    }
    const usedIds = new Set(kept.map((q) => q.id));
    const pretests = await drawPretests(stubs, profile, usedIds, seen);
    return arrangeRW([...kept, ...pretests]);
  }
  // Math: per-domain counts + grid-ins, then one easiest-to-hardest ramp.
  const kept = selectMath(questions, counts, seen);
  const usedIds = new Set(kept.map((q) => q.id));
  const pretests = await drawPretests(stubs, profile, usedIds, seen, 1, MATH_OVERDRAW);
  return arrangeMath([...kept, ...pretests]);
}
