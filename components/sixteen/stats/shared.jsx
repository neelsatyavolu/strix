'use client';
import * as SixteenNS from '@/components/sixteen';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

// Shared formatting + small presentational pieces for the stats / practice
// analysis screens. Kept here so Stats, Sessions and the Practice* screens
// don't each redefine the same labels and helpers.

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
export const SECTION_SHORT = { rw: 'R&W', math: 'Math' };
export const MODE_LABEL = { drill: 'Drill', 'mock-m1': 'Module 1', 'mock-full': 'Full section' };
export const MODE_VARIANT = { drill: 'neutral', 'mock-m1': 'brand', 'mock-full': 'success' };

const HOUR = 3600 * 1000;

// A full SAT is stored as two `mock-full` sessions flagged with config.exam.
export function isExam(s) { return !!s.config?.exam; }

function buildTest(key, halves) {
  const rw = halves.find((h) => h.section === 'rw') || null;
  const math = halves.find((h) => h.section === 'math') || null;
  const composite = rw?.scaled_score != null && math?.scaled_score != null ? rw.scaled_score + math.scaled_score : null;
  const at = Math.max(...halves.map((h) => new Date(h.created_at).getTime()));
  return { key, rw, math, composite, at };
}

// Pair a full SAT's two halves into one test. Prefer the shared config.examId
// (written for tests taken after that change shipped); fall back to
// opposite-section halves taken within a few hours of each other for older data.
export function pairTests(rows) {
  const byId = new Map();
  const loose = [];
  for (const s of rows) {
    const id = s.config?.examId;
    if (id) { if (!byId.has(id)) byId.set(id, []); byId.get(id).push(s); }
    else loose.push(s);
  }
  const tests = [...byId.entries()].map(([id, halves]) => buildTest(id, halves));

  loose.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const used = new Set();
  for (let i = 0; i < loose.length; i++) {
    if (used.has(i)) continue;
    const a = loose[i];
    const halves = [a];
    used.add(i);
    for (let j = i + 1; j < loose.length; j++) {
      if (used.has(j)) continue;
      const b = loose[j];
      if (b.section !== a.section && Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) <= 3 * HOUR) {
        halves.push(b); used.add(j); break;
      }
    }
    tests.push(buildTest(`ts-${a.id}`, halves));
  }
  return tests.sort((a, b) => b.at - a.at);
}

// "Math · Algebra" for targeted drills; falls back to the section label.
export function sessionTitle(s) {
  const sec = SECTION_LABEL[s.section] ?? s.section;
  if (s.mode === 'drill') {
    const code = CATEGORY_TO_DOMAIN[s.config?.category];
    const cat = code ? domainLabel(s.section, code) : null;
    if (cat) return `${sec} · ${cat}`;
  }
  return sec;
}

export function relTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return 'Just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function shortAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 90) return 'now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w`;
  return `${Math.floor(d / 30)}mo`;
}

// Headline accuracy follows the rest of the app: recency-weighted, falling back
// to all-time only when there's no recent signal.
export function recentAcc(t) {
  if (!t) return 0;
  return t.recentAccuracy != null ? t.recentAccuracy : t.accuracy ?? 0;
}

// Status tone for an accuracy percentage.
export function accuracyTone(pct) {
  if (pct == null) return 'var(--text-secondary)';
  return pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)';
}

/** StatCardLite — compact labelled figure (kept for older callers; wraps Metric). */
export function StatCardLite({ label, value, sublabel }) {
  const { Metric } = SixteenNS;
  return <Metric size="sm" label={label} value={value} hint={sublabel} />;
}

/** EmptyState — kept for older callers; wraps the core EmptyState (hint → body). */
export function EmptyState({ title, hint, action, icon }) {
  const { EmptyState: CoreEmpty } = SixteenNS;
  return <CoreEmpty icon={icon} title={title} body={hint} action={action} />;
}
