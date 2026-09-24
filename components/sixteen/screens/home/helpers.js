import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

// Pure formatting helpers for the Home screen.

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

const DAY = 86400000;

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

export function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < DAY) return `${Math.round(diff / 3600000)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  return `${Math.round(diff / DAY)} days ago`;
}

function categoryLabel(section, category) {
  const code = CATEGORY_TO_DOMAIN[category];
  return code ? domainLabel(section, code) : null;
}

// What a past session was, without the section (the row's mark shows that).
export function sessionTitle(s) {
  if (s.mode === 'drill') return categoryLabel(s.section, s.config?.category) || 'Drill';
  if (s.mode === 'review') return 'Review';
  if (s.mode === 'mock-m1') return 'Module 1';
  return s.config?.exam ? 'Full SAT' : 'Full section';
}

// "Math · Linear equations" for the unfinished-session card.
export function resumableLabel(r) {
  const sec = SECTION_LABEL[r.section] || r.section;
  if (r.mode === 'review') return `${sec} · Review`;
  const cat = categoryLabel(r.section, r.category);
  return cat ? `${sec} · ${cat}` : `${sec} · Drill`;
}

export function accuracyColor(pct) {
  if (pct >= 75) return 'var(--success)';
  if (pct >= 50) return 'var(--warning)';
  return 'var(--error)';
}

// "Due today" / "Due Friday" / "Overdue" for an assignment's due_at.
export function dueLabel(iso) {
  if (!iso) return null;
  const due = new Date(iso);
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(due) - startOf(new Date())) / DAY);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days < 7) return `Due ${due.toLocaleDateString(undefined, { weekday: 'long' })}`;
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

// Open assignments, soonest due first (undated last). Returns a new array.
export function openAssignments(list) {
  const time = (a) => (a.due_at ? new Date(a.due_at).getTime() : Infinity);
  return (list || []).filter((a) => a.status === 'assigned').sort((a, b) => time(a) - time(b));
}

// How much the total moved at the last scored section: the trend of whichever
// section was scored most recently (the other section's estimate didn't change).
export function totalDelta(stats) {
  const scores = stats?.scores;
  const last = stats?.overTime?.[stats.overTime.length - 1];
  if (scores?.total == null || !last) return null;
  return stats.trend?.[last.section] ?? null;
}
