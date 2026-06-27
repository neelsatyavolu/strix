'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';

// Modal for clearing practice data. The user picks which sections (R&W / Math)
// and how far back (all time, or older than 30/90 days); we show a live count of
// affected sessions before they confirm the destructive delete.

const RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30', label: 'Older than 30 days' },
  { value: '90', label: 'Older than 90 days' },
];

// Turn the dialog state into the query string shared by the count + delete calls.
function buildParams(rw, math, range) {
  const sections = [rw && 'rw', math && 'math'].filter(Boolean);
  const params = new URLSearchParams({ sections: sections.join(',') });
  if (range !== 'all') params.set('olderThanDays', range);
  return { sections, params };
}

function ClearDataDialog({ onClose, onCleared }) {
  const { Button, Toggle, SegmentedControl } = SixteenNS;

  const [rw, setRw] = React.useState(true);
  const [math, setMath] = React.useState(true);
  const [range, setRange] = React.useState('all');

  const [count, setCount] = React.useState(null);   // null = loading/unknown
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const { sections, params } = buildParams(rw, math, range);
  const qs = params.toString();
  const nothingSelected = sections.length === 0;

  // Refresh the live count whenever the filters change. Resetting to the loading
  // state on a filter change is the intended use of setState-in-effect here.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (nothingSelected) { setCount(0); return undefined; }
    const ctrl = new AbortController();
    setCount(null);
    fetch(`/api/sessions/purge?${qs}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) { setCount(j.data.count); setError(null); }
        else setError(j?.error || 'Could not load count.');
      })
      .catch((err) => { if (err?.name !== 'AbortError') setError('Could not load count.'); });
    return () => ctrl.abort();
  }, [qs, nothingSelected]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const confirm = async () => {
    if (nothingSelected || !count) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/purge?${qs}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j?.success) throw new Error(j?.error || 'Could not delete data.');
      onCleared?.(j.data.deleted);
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not delete data.');
      setDeleting(false);
    }
  };

  const countLabel = nothingSelected
    ? 'Select at least one section.'
    : count === null
      ? 'Counting sessions…'
      : count === 0
        ? 'No sessions match these filters.'
        : `This will permanently delete ${count} ${count === 1 ? 'session' : 'sessions'} and all questions and answers in them.`;

  const deleteLabel = !nothingSelected && count > 0 ? `Delete ${count} ${count === 1 ? 'session' : 'sessions'}` : 'Delete';

  return (
    <div
      onClick={deleting ? undefined : onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Clear practice data"
        style={{ width: 460, maxWidth: '100%', background: 'var(--surface, #FFFFFF)', borderRadius: 12, boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 22px 4px' }}>
          <h2 style={{ margin: 0, font: 'var(--role-title-sm)', color: 'var(--text-primary)' }}>Clear practice data</h2>
          <p style={{ margin: '6px 0 0', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
            Choose what to remove. This can&apos;t be undone.
          </p>
        </div>

        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Sections</div>
            <Toggle checked={rw} onChange={setRw} label="Reading & Writing" />
            <div style={{ height: 10 }} />
            <Toggle checked={math} onChange={setMath} label="Math" />
          </div>

          <div>
            <div style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Time range</div>
            <SegmentedControl value={range} onChange={setRange} options={RANGE_OPTIONS} />
          </div>

          <div style={{ font: 'var(--role-caption)', color: nothingSelected ? 'var(--danger, #d4564a)' : 'var(--text-secondary)' }}>
            {countLabel}
          </div>

          {error && (
            <div style={{ font: 'var(--role-caption)', color: 'var(--danger, #d4564a)' }}>{error}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 22px', borderTop: '1px solid var(--border-1)' }}>
          <Button variant="secondary" disabled={deleting} onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            loading={deleting}
            disabled={deleting || nothingSelected || !count}
            onClick={confirm}
          >
            {deleteLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClearDataDialog;
