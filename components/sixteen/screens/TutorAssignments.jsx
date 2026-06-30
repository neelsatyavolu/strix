'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useTutorAssignments } from '@/lib/data/hooks';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

// TutorAssignments — a tutor assigns a drill to the student they're viewing and
// tracks completion. A finished assignment links straight to the per-question
// review of what the student actually did (RLS lets the tutor read it).

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const CATS = { rw: ['info', 'craft', 'expr', 'conv'], math: ['alg', 'adv', 'pas', 'geo'] };
const COUNTS = [5, 10, 15, 20];
const TYPES = [
  { value: 'drill', label: 'Drill' },
  { value: 'mock-m1', label: 'Module' },
  { value: 'mock-full', label: 'Section' },
  { value: 'mock-exam', label: 'Full SAT' },
];
const MODULE_LABEL = { m1: 'Module 1', easy: 'Module 2A', hard: 'Module 2B' };

function bbSuffix(bluebook) {
  return bluebook ? ` · Bluebook ${bluebook}` : ' · Question Bank';
}

function defaultTitle({ mode, section, category, moduleKey, bluebook }) {
  if (mode === 'mock-exam') return `Full SAT${bbSuffix(bluebook)}`;
  if (mode === 'mock-full') return `${SECTION_LABEL[section]} section${bbSuffix(bluebook)}`;
  if (mode === 'mock-m1') return `${SECTION_LABEL[section]} ${MODULE_LABEL[moduleKey] || 'Module 1'}${bbSuffix(bluebook)}`;
  const topic = category ? domainLabel(section, CATEGORY_TO_DOMAIN[category]) : SECTION_LABEL[section];
  return `${topic} drill`;
}

// One Bluebook-source chip (Question Bank, or a numbered official test).
function BBChip({ active, muted, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        font: 'var(--role-label)', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '6px 10px', borderRadius: 'var(--radius-md)',
        border: `1px solid ${active ? 'var(--brand-blue)' : 'var(--border-2)'}`,
        background: active ? 'color-mix(in srgb, var(--brand-blue) 12%, transparent)' : 'var(--sunken)',
        color: disabled ? 'var(--text-tertiary)' : muted ? 'var(--text-tertiary)' : 'var(--text-primary)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

// Pick the form an official assignment runs on: Question Bank (randomized) or a
// specific Bluebook test 5–11 (taken tests are muted, never disabled).
function BluebookPicker({ available, completed, value, onChange, allowQuestionBank }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <BBChip active={value == null} disabled={!allowQuestionBank} onClick={() => onChange(null)}>
        Question Bank
      </BBChip>
      {available.map((t) => (
        <BBChip key={t} active={value === t} muted={completed.includes(t)} onClick={() => onChange(t)}>
          Bluebook {t}{completed.includes(t) ? ' · taken' : ''}
        </BBChip>
      ))}
    </div>
  );
}

function TutorAssignments({ go, studentId = null, studentName = null }) {
  const { Card, Button, Badge, Input, SegmentedControl } = SixteenNS;
  const { assignments, reload } = useTutorAssignments(studentId);

  const [mode, setMode] = React.useState('drill');
  const [section, setSection] = React.useState('rw');
  const [category, setCategory] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('all');
  const [count, setCount] = React.useState(10);
  const [moduleKey, setModuleKey] = React.useState('m1');
  const [bluebook, setBluebook] = React.useState(null); // null = Question Bank
  const [title, setTitle] = React.useState('');
  const [dueAt, setDueAt] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [forms, setForms] = React.useState({ available: [], completed: [] });

  // Load the official Bluebook forms once the tutor picks an official type.
  const needsForms = mode !== 'drill';
  React.useEffect(() => {
    if (!needsForms || forms.available.length) return;
    let on = true;
    fetch('/api/official-forms')
      .then((r) => r.json())
      .then((j) => { if (on && j?.success) setForms({ available: j.data.available || [], completed: j.data.completed || [] }); })
      .catch(() => {});
    return () => { on = false; };
  }, [needsForms, forms.available.length]);

  // Module 2A/2B exist only in official forms — force a Bluebook test for them.
  const moduleNeedsForm = mode === 'mock-m1' && (moduleKey === 'easy' || moduleKey === 'hard');
  const allowQuestionBank = !moduleNeedsForm;
  // 2A/2B can't use the Question Bank, so fall back to the first official test.
  const effectiveBluebook = moduleNeedsForm && bluebook == null ? (forms.available[0] ?? null) : bluebook;

  const titleArgs = { mode, section, category, moduleKey, bluebook: effectiveBluebook };
  const submit = async () => {
    if (!studentId || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          title: (title || '').trim() || defaultTitle(titleArgs),
          mode,
          section: mode === 'mock-exam' ? null : section,
          category: mode === 'drill' ? (category || null) : null,
          difficulty,
          count,
          bluebookTest: mode === 'drill' ? null : effectiveBluebook,
          moduleKey: mode === 'mock-m1' ? moduleKey : null,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setTitle('');
        setCategory('');
        setDueAt('');
        reload();
      } else {
        setError(json?.error || 'Could not create the assignment.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const open = (assignments || []).filter((a) => a.status === 'assigned');
  const done = (assignments || []).filter((a) => a.status === 'completed');

  const inputStyle = {
    font: 'var(--role-body)', color: 'var(--text-primary)', background: 'var(--sunken)',
    border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '7px 9px', width: '100%',
  };

  return (
    <div style={{ padding: '28px 36px' }}>
      <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Assignments</h1>
      <p style={{ margin: '4px 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Assign focused practice to {studentName || 'your student'} and see exactly how they did.
      </p>

      {/* Assign form */}
      <Card padding="lg" style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 14px', font: 'var(--role-title-sm)' }}>New assignment</h2>
        <div style={{ marginBottom: 14 }}>
          <Field label="Type">
            <SegmentedControl size="sm" value={mode} onChange={setMode} options={TYPES} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {mode !== 'mock-exam' && (
            <Field label="Section">
              <SegmentedControl
                size="sm"
                value={section}
                onChange={(v) => { setSection(v); setCategory(''); }}
                options={[{ value: 'rw', label: 'R&W' }, { value: 'math', label: 'Math' }]}
              />
            </Field>
          )}
          {mode === 'drill' && (
            <>
              <Field label="Topic">
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option value="">Whole section</option>
                  {CATS[section].map((c) => (
                    <option key={c} value={c}>{domainLabel(section, CATEGORY_TO_DOMAIN[c])}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={inputStyle}>
                  <option value="all">Any</option>
                  <option value="easy">Easy</option>
                  <option value="med">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
              <Field label="Questions">
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={inputStyle}>
                  {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </>
          )}
          {mode === 'mock-m1' && (
            <Field label="Module">
              <select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)} style={inputStyle}>
                <option value="m1">Module 1</option>
                <option value="easy">Module 2A (easier)</option>
                <option value="hard">Module 2B (harder)</option>
              </select>
            </Field>
          )}
          <Field label="Due date (optional)">
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle(titleArgs)} />
          </Field>
        </div>
        {mode !== 'drill' && (
          <div style={{ marginTop: 14 }}>
            <Field label="Test form">
              <BluebookPicker
                available={forms.available}
                completed={forms.completed}
                value={effectiveBluebook}
                onChange={setBluebook}
                allowQuestionBank={allowQuestionBank}
              />
            </Field>
            {moduleNeedsForm && (
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 6 }}>
                Module 2A/2B come from official Bluebook forms — pick a test above.
              </div>
            )}
          </div>
        )}
        {error && <div style={{ font: 'var(--role-caption)', color: 'var(--error)', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="primary" disabled={!studentId || busy} loading={busy} onClick={submit} icon={<Icon name="plus" size={14} />}>
            Assign
          </Button>
        </div>
      </Card>

      {/* Open assignments */}
      <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)' }}>Assigned ({open.length})</h2>
      {open.length === 0 ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)', font: 'var(--role-body)', marginBottom: 22 }}>No open assignments.</Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {open.map((a) => (
            <Card key={a.id} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TypeBadge assignment={a} Badge={Badge} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{metaLine(a)}</div>
                </div>
                <RetractButton assignment={a} onDone={reload} />
                <Badge variant="neutral" size="sm">Waiting</Badge>
              </div>
              <FeedbackEditor assignment={a} onSaved={reload} />
            </Card>
          ))}
        </div>
      )}

      {/* Completed assignments */}
      <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)' }}>Completed ({done.length})</h2>
      {done.length === 0 ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)', font: 'var(--role-body)' }}>Nothing completed yet.</Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {done.map((a) => (
            <Card key={a.id} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TypeBadge assignment={a} Badge={Badge} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                    {a.completed_at ? `Done ${new Date(a.completed_at).toLocaleDateString()}` : 'Done'}
                  </div>
                </div>
                <ScoreCell assignment={a} />
                <ReviewButton assignment={a} go={go} label="Open review" />
              </div>
              <FeedbackEditor assignment={a} onSaved={reload} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent',
  border: 0, cursor: 'pointer', font: 'var(--role-label)', color: 'var(--brand-blue)', padding: 0,
};
const retractBtn = { ...linkBtn, color: 'var(--error)' };

// Section/type badge — a full SAT has no single section, so it gets a 'SAT' chip.
function TypeBadge({ assignment, Badge }) {
  if (assignment.mode === 'mock-exam') return <Badge variant="neutral" dot>SAT</Badge>;
  return <Badge variant={assignment.section} dot>{assignment.section === 'rw' ? 'R&W' : 'Math'}</Badge>;
}

// One-line description of an open assignment, scaled to its type.
function metaLine(a) {
  const due = a.due_at ? ` · due ${new Date(a.due_at).toLocaleDateString()}` : '';
  if (a.mode === 'mock-exam') return `Full SAT${bbSuffix(a.bluebook_test)}${due}`;
  if (a.mode === 'mock-full') return `${SECTION_LABEL[a.section]} section${bbSuffix(a.bluebook_test)}${due}`;
  if (a.mode === 'mock-m1') return `${MODULE_LABEL[a.module_key] || 'Module 1'}${bbSuffix(a.bluebook_test)}${due}`;
  return `${a.question_count} questions${due}`;
}

// Completed-score cell — exam/section show the scaled estimate; drill/module show raw.
function ScoreCell({ assignment: a }) {
  const numStyle = (color) => ({ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color });
  if (a.mode === 'mock-exam' || a.mode === 'mock-full') {
    return a.scaled_score != null ? <span style={numStyle('var(--text-primary)')}>{a.scaled_score}</span> : null;
  }
  const pct = a.score_total ? Math.round((a.score_correct / a.score_total) * 100) : 0;
  return <span style={numStyle(pct >= 75 ? 'var(--success)' : 'var(--warning)')}>{a.score_correct}/{a.score_total}</span>;
}

// Where a completed assignment's review opens: a full SAT goes to the composite
// test-review (both halves); everything else to the single session detail.
function reviewTarget(a) {
  if (!a.session_id) return null;
  if (a.mode === 'mock-exam') return ['test-review', { rwId: a.session_id, mathId: a.session_id_2 }];
  return ['session-detail', { id: a.session_id }];
}

function ReviewButton({ assignment, go, label }) {
  const { Button } = SixteenNS;
  const target = reviewTarget(assignment);
  if (!target) return null;
  return <Button variant="outline" size="sm" onClick={() => go(target[0], target[1])}>{label}</Button>;
}

// Retract an open assignment (soft) with a one-tap inline confirm.
function RetractButton({ assignment, onDone }) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const retract = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, status: 'retracted' }),
      });
      const json = await res.json();
      if (json?.success) onDone?.(); else setBusy(false);
    } catch { setBusy(false); }
  };
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} style={retractBtn}>Retract</button>;
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>Retract?</span>
      <button type="button" disabled={busy} onClick={retract} style={{ ...retractBtn, fontWeight: 600 }}>Yes</button>
      <button type="button" disabled={busy} onClick={() => setConfirming(false)} style={linkBtn}>No</button>
    </span>
  );
}

// Inline tutor-feedback editor on a single assignment (read view + edit form).
function FeedbackEditor({ assignment, onSaved }) {
  const { Button } = SixteenNS;
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(assignment.feedback || '');
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, feedback: text.trim() || null }),
      });
      const json = await res.json();
      if (json?.success) { setEditing(false); onSaved?.(); }
    } catch { /* leave the editor open so the tutor can retry */ } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-1)' }}>
        {assignment.feedback ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="message-circle" size={14} style={{ color: 'var(--brand-blue)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, font: 'var(--role-body)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{assignment.feedback}</div>
            <button onClick={() => setEditing(true)} style={linkBtn}>Edit</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={linkBtn}>
            <Icon name="message-circle" size={13} /> Add feedback
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-1)' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Leave feedback for your student…"
        style={{ width: '100%', font: 'var(--role-body)', color: 'var(--text-primary)', background: 'var(--sunken)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '8px 10px', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => { setText(assignment.feedback || ''); setEditing(false); }}>Cancel</Button>
        <Button variant="primary" size="sm" loading={busy} disabled={busy} onClick={save}>Save feedback</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{label}</span>
      {children}
    </label>
  );
}

export default TutorAssignments;
