// Shared, pure helpers for describing tutor assignments (student + tutor views).

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
export const MODULE_LABEL = { m1: 'Module 1', easy: 'Module 2A', hard: 'Module 2B' };

export function bbLabel(t) {
  return t ? `Bluebook ${t}` : 'Question Bank';
}

// One-line description of an assignment, scaled to its type.
export function typeMeta(a) {
  if (a.mode === 'mock-exam') return `Full SAT · ${bbLabel(a.bluebook_test)}`;
  if (a.mode === 'mock-full') return `${SECTION_LABEL[a.section]} section · ${bbLabel(a.bluebook_test)}`;
  if (a.mode === 'mock-m1') return `${SECTION_LABEL[a.section]} ${MODULE_LABEL[a.module_key] || 'Module 1'} · ${bbLabel(a.bluebook_test)}`;
  return `${SECTION_LABEL[a.section]} · ${a.question_count} questions`;
}

// Where a completed assignment's review opens: a full SAT goes to the composite
// test-review (both halves); everything else to the single session detail.
export function reviewTarget(a) {
  if (!a.session_id) return null;
  if (a.mode === 'mock-exam') return ['test-review', { rwId: a.session_id, mathId: a.session_id_2 }];
  return ['session-detail', { id: a.session_id }];
}

export function dueText(iso, now) {
  if (!iso) return 'No due date';
  const days = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  if (days < 0) return `Overdue by ${-days} day${-days === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Split a student's assignments into overdue / upcoming / done.
export function groupAssignments(list, now) {
  const isOverdue = (a) => a.due_at && new Date(a.due_at).getTime() < now;
  const open = list.filter((a) => a.status === 'assigned');
  return {
    overdue: open.filter(isOverdue),
    upcoming: open.filter((a) => !isOverdue(a)),
    done: list.filter((a) => a.status === 'completed'),
  };
}
