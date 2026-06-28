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

function defaultTitle(section, category) {
  const topic = category ? domainLabel(section, CATEGORY_TO_DOMAIN[category]) : SECTION_LABEL[section];
  return `${topic} drill`;
}

function TutorAssignments({ go, studentId = null, studentName = null }) {
  const { Card, Button, Badge, Input, SegmentedControl } = SixteenNS;
  const { assignments, reload } = useTutorAssignments(studentId);

  const [section, setSection] = React.useState('rw');
  const [category, setCategory] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('all');
  const [count, setCount] = React.useState(10);
  const [title, setTitle] = React.useState('');
  const [dueAt, setDueAt] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

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
          title: (title || '').trim() || defaultTitle(section, category),
          section,
          category: category || null,
          difficulty,
          count,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Field label="Section">
            <SegmentedControl
              size="sm"
              value={section}
              onChange={(v) => { setSection(v); setCategory(''); }}
              options={[{ value: 'rw', label: 'R&W' }, { value: 'math', label: 'Math' }]}
            />
          </Field>
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
          <Field label="Due date (optional)">
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle(section, category)} />
          </Field>
        </div>
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
                <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                    {a.question_count} questions{a.due_at ? ` · due ${new Date(a.due_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
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
          {done.map((a) => {
            const pct = a.score_total ? Math.round((a.score_correct / a.score_total) * 100) : 0;
            return (
              <Card key={a.id} padding="lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                      {a.completed_at ? `Done ${new Date(a.completed_at).toLocaleDateString()}` : 'Done'}
                    </div>
                  </div>
                  <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                    {a.score_correct}/{a.score_total}
                  </span>
                  {a.session_id && (
                    <Button variant="outline" size="sm" onClick={() => go('session-detail', { id: a.session_id })}>Open review</Button>
                  )}
                </div>
                <FeedbackEditor assignment={a} onSaved={reload} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent',
  border: 0, cursor: 'pointer', font: 'var(--role-label)', color: 'var(--brand-blue)', padding: 0,
};

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
