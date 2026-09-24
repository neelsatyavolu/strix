// Practice hub — static options and pure helpers shared by the Drill and
// Full-length tabs. No React here.
import { RW_DOMAINS, MATH_DOMAINS, DOMAIN_TO_CATEGORY } from '@/lib/cb/domains';

export const SECTION_OPTIONS = [
  { value: 'rw', label: 'Reading & Writing' },
  { value: 'math', label: 'Math' },
];

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

// Categories before stats load (or for a brand-new student).
export const BASE_CATS = {
  rw: Object.entries(RW_DOMAINS).map(([code, label]) => ({ id: DOMAIN_TO_CATEGORY[code], label, done: 0, accuracy: 0 })),
  math: Object.entries(MATH_DOMAINS).map(([code, label]) => ({ id: DOMAIN_TO_CATEGORY[code], label, done: 0, accuracy: 0 })),
};

export const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Adaptive' },
  { value: 'easy', label: 'Easy' },
  { value: 'med', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const COUNT_OPTIONS = [5, 10, 15, 20].map((n) => ({ value: String(n), label: String(n) }));

export const TIMING_OPTIONS = [
  { value: 'untimed', label: 'Untimed' },
  { value: 'per-q', label: 'Per question' },
  { value: 'total', label: 'Whole drill' },
];

// Real SAT pace, seconds per question.
const PACE_SEC = { rw: 71, math: 95 };

export const drillTotalMinutes = (count) => Math.ceil(count * 1.1);

export function drillMinutes({ section, count, timing }) {
  if (timing === 'total') return drillTotalMinutes(count);
  return Math.max(1, Math.round((count * PACE_SEC[section]) / 60));
}

export function timingHint({ section, count, timing }) {
  if (timing === 'untimed') return 'No countdown — work at your own pace.';
  if (timing === 'per-q') return `A clock counts down ~${PACE_SEC[section]} seconds per question, matching SAT pace.`;
  return `One clock counts down ${drillTotalMinutes(count)} minutes for the whole drill.`;
}

// Full-length kinds → the session mode each one starts.
export const FULL_KINDS = [
  { value: 'module', mode: 'mock-m1', icon: 'square', title: 'Module', sub: 'One timed module, like Module 1 on test day.' },
  { value: 'section', mode: 'mock-full', icon: 'layers', title: 'Section', sub: 'Module 1 + adaptive Module 2, with an estimated score.' },
  { value: 'exam', mode: 'mock-exam', icon: 'graduation-cap', title: 'Full SAT', sub: 'Both sections with a 10-minute break. Estimated 400–1600.' },
];

export const MODE_TO_KIND = Object.fromEntries(FULL_KINDS.map((k) => [k.mode, k.value]));

const MODULE_SHAPE = { rw: { questions: 27, minutes: 32 }, math: { questions: 22, minutes: 35 } };

export function formatMinutes(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Questions + minutes for a full-length kind. Full SAT excludes the 10-min break. */
export function fullShape(kind, section) {
  if (kind === 'module') return MODULE_SHAPE[section];
  if (kind === 'section') {
    const m = MODULE_SHAPE[section];
    return { questions: m.questions * 2, minutes: m.minutes * 2 };
  }
  const rw = MODULE_SHAPE.rw;
  const math = MODULE_SHAPE.math;
  return { questions: (rw.questions + math.questions) * 2, minutes: (rw.minutes + math.minutes) * 2 };
}

export const validSection = (v) => (v === 'rw' || v === 'math' ? v : 'rw');
