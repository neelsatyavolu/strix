'use client';
import React from 'react';
import { Button, Card, Icon, Input, SegmentedControl, Select } from '@/components/sixteen';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';
import BluebookPicker from './BluebookPicker';
import { MODULE_LABEL, SECTION_LABEL } from './assignmentMeta';
import s from './AssignForm.module.css';

// New assignment — a tutor assigns a drill, module, section, or full SAT to the
// student they're viewing. Posts to /api/tutor/assignments, then `onCreated`.

const CATS = { rw: ['info', 'craft', 'expr', 'conv'], math: ['alg', 'adv', 'pas', 'geo'] };
const COUNTS = [5, 10, 15, 20];
const TYPES = [
  { value: 'drill', label: 'Drill' },
  { value: 'mock-m1', label: 'Module' },
  { value: 'mock-full', label: 'Section' },
  { value: 'mock-exam', label: 'Full SAT' },
];
const TYPE_HINT = {
  'drill': 'Untimed practice questions, on one topic or the whole section.',
  'mock-m1': 'One timed module, from the Question Bank or an official Bluebook test.',
  'mock-full': 'Both modules of one section, timed like the real test.',
  'mock-exam': 'The whole SAT — Reading & Writing, then Math.',
};
const SECTIONS = [{ value: 'rw', label: 'R&W' }, { value: 'math', label: 'Math' }];
const DIFFICULTIES = [
  { value: 'all', label: 'Any' },
  { value: 'easy', label: 'Easy' },
  { value: 'med', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
const MODULES = [
  { value: 'm1', label: 'Module 1' },
  { value: 'easy', label: 'Module 2A (easier)' },
  { value: 'hard', label: 'Module 2B (harder)' },
];

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

// Today as YYYY-MM-DD in local time (the date input's format).
function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({ label, htmlFor, hint, error, wide = false, children }) {
  return (
    <div className={wide ? `${s.field} ${s.wide}` : s.field}>
      {htmlFor ? <label htmlFor={htmlFor} className={s.label}>{label}</label> : <span className={s.label}>{label}</span>}
      {children}
      {error ? <span className={s.error} role="alert">{error}</span> : hint && <span className={s.hint}>{hint}</span>}
    </div>
  );
}

export default function AssignForm({ studentId, firstName, onCreated }) {
  const id = React.useId();
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
  const [notice, setNotice] = React.useState('');
  const [forms, setForms] = React.useState({ available: [], completed: [] });
  const [formsLoaded, setFormsLoaded] = React.useState(false);
  const [today] = React.useState(localToday);

  // Load the official Bluebook forms once the tutor picks an official type.
  const needsForms = mode !== 'drill';
  React.useEffect(() => {
    if (!needsForms || forms.available.length) return;
    let on = true;
    fetch('/api/official-forms')
      .then((r) => r.json())
      .then((j) => { if (on && j?.success) setForms({ available: j.data.available || [], completed: j.data.completed || [] }); })
      .catch(() => {})
      .finally(() => { if (on) setFormsLoaded(true); });
    return () => { on = false; };
  }, [needsForms, forms.available.length]);

  // Module 2A/2B exist only in official forms — force a Bluebook test for them.
  const moduleNeedsForm = mode === 'mock-m1' && (moduleKey === 'easy' || moduleKey === 'hard');
  const allowQuestionBank = !moduleNeedsForm;
  // 2A/2B can't use the Question Bank, so fall back to the first official test.
  const effectiveBluebook = moduleNeedsForm && bluebook == null ? (forms.available[0] ?? null) : bluebook;

  // Inline validation — the Assign button stays disabled while any is set.
  const dueError = dueAt && dueAt < today ? 'Pick today or a later date.' : '';
  const formError = moduleNeedsForm && effectiveBluebook == null
    ? (formsLoaded ? 'Module 2A/2B need an official Bluebook test, and none are available.' : '')
    : '';
  const invalid = !!dueError || (moduleNeedsForm && effectiveBluebook == null);

  const titleArgs = { mode, section, category, moduleKey, bluebook: effectiveBluebook };
  const submit = async () => {
    if (!studentId || busy || invalid) return;
    setBusy(true);
    setError('');
    setNotice('');
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
        setNotice(`Assigned “${(title || '').trim() || defaultTitle(titleArgs)}”.`);
        setTitle('');
        setCategory('');
        setDueAt('');
        onCreated?.();
      } else {
        setError(json?.error || 'Could not create the assignment.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="lg">
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <Field label="Type" hint={TYPE_HINT[mode]} wide>
          <SegmentedControl value={mode} onChange={setMode} options={TYPES} label="Assignment type" />
        </Field>

        <div className={s.grid}>
          {mode !== 'mock-exam' && (
            <Field label="Section">
              <SegmentedControl
                value={section}
                onChange={(v) => { setSection(v); setCategory(''); }}
                options={SECTIONS}
                label="Section"
              />
            </Field>
          )}
          {mode === 'drill' && (
            <>
              <Field label="Topic" htmlFor={`${id}-topic`}>
                <Select
                  id={`${id}-topic`}
                  fullWidth
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: '', label: 'Whole section' },
                    ...CATS[section].map((c) => ({ value: c, label: domainLabel(section, CATEGORY_TO_DOMAIN[c]) })),
                  ]}
                />
              </Field>
              <Field label="Difficulty" htmlFor={`${id}-difficulty`}>
                <Select id={`${id}-difficulty`} fullWidth value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} />
              </Field>
              <Field label="Questions" htmlFor={`${id}-count`}>
                <Select
                  id={`${id}-count`}
                  fullWidth
                  value={count}
                  onChange={(v) => setCount(Number(v))}
                  options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
                />
              </Field>
            </>
          )}
          {mode === 'mock-m1' && (
            <Field label="Module" htmlFor={`${id}-module`}>
              <Select id={`${id}-module`} fullWidth value={moduleKey} onChange={setModuleKey} options={MODULES} />
            </Field>
          )}
        </div>

        {mode !== 'drill' && (
          <Field
            label="Test form"
            wide
            error={formError}
            hint={moduleNeedsForm ? 'Module 2A/2B come from official Bluebook tests.' : 'Question Bank builds a random form; a Bluebook test uses that official form.'}
          >
            <BluebookPicker
              available={forms.available}
              completed={forms.completed}
              loading={!formsLoaded && forms.available.length === 0}
              value={effectiveBluebook}
              onChange={setBluebook}
              allowQuestionBank={allowQuestionBank}
            />
          </Field>
        )}

        <div className={s.divider} />

        <div className={s.grid}>
          <Field label="Title" htmlFor={`${id}-title`} hint="Optional — leave blank to use the suggestion.">
            <Input id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle(titleArgs)} />
          </Field>
          <Field label="Due date" htmlFor={`${id}-due`} error={dueError} hint="Optional">
            <Input id={`${id}-due`} type="date" min={today} value={dueAt} invalid={!!dueError} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>

        <div className={s.footer}>
          <span className={s.status} aria-live="polite">
            {error ? <span className={s.error}>{error}</span> : notice && <span className={s.notice}><Icon name="check" size={13} /> {notice}</span>}
          </span>
          <Button type="submit" variant="primary" disabled={!studentId || busy || invalid} loading={busy} icon={<Icon name="plus" size={14} />}>
            {firstName ? `Assign to ${firstName}` : 'Assign'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
