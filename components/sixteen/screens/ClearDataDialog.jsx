'use client';
import React from 'react';
import { Button, Toggle, SegmentedControl } from '@/components/sixteen';
import s from './ClearDataDialog.module.css';

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

const plural = (n) => `${n} ${n === 1 ? 'session' : 'sessions'}`;

function ClearDataDialog({ onClose, onCleared }) {
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

  // Escape closes (unless a delete is in flight).
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleting, onClose]);

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
    ? 'Choose at least one section.'
    : count === null
      ? 'Counting sessions…'
      : count === 0
        ? 'No sessions match.'
        : `${plural(count)} and every question and answer in them will be deleted.`;

  return (
    <div className={s.scrim} onClick={deleting ? undefined : onClose}>
      <div
        className={s.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-data-title"
      >
        <div className={s.head}>
          <h2 id="clear-data-title" className={s.title}>Clear practice data</h2>
          <p className={s.desc}>Choose what to remove. This can&apos;t be undone.</p>
        </div>

        <div className={s.body}>
          <div className={s.group}>
            <span className={s.label}>Sections</span>
            <div className={s.toggles}>
              <Toggle checked={rw} onChange={setRw} label="Reading & Writing" />
              <Toggle checked={math} onChange={setMath} label="Math" />
            </div>
          </div>

          <div className={s.group}>
            <span className={s.label}>Time range</span>
            <SegmentedControl value={range} onChange={setRange} options={RANGE_OPTIONS} fullWidth label="Time range" />
          </div>

          <p className={s.count} data-warn={nothingSelected || undefined} aria-live="polite">{countLabel}</p>
          {error && <p className={s.error} role="alert">{error}</p>}
        </div>

        <div className={s.foot}>
          <Button variant="secondary" disabled={deleting} onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            loading={deleting}
            disabled={deleting || nothingSelected || !count}
            onClick={confirm}
          >
            {!nothingSelected && count > 0 ? `Delete ${plural(count)}` : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClearDataDialog;
