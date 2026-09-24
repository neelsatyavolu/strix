'use client';
import React from 'react';
import { Button, Icon, Skeleton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import strixForms from '@/lib/cb/strix-forms.json';
import strixMirrors from '@/lib/cb/strix-mirrors.json';
import s from './Practice.module.css';

export const STRIX_TEST_OPTIONS = Object.keys(strixForms).map(Number).sort((a, b) => a - b);

/**
 * useOfficialForms — Bluebook forms available (+ which this student already
 * took). Fetches whenever `enabled` turns on; `retry` refetches after an error.
 */
export function useOfficialForms(enabled) {
  const [state, setState] = React.useState({ status: 'loading', available: [], completed: [] });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    fetch('/api/official-forms')
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (!j?.success) throw new Error(j?.error || 'Failed to load tests');
        const { available = [], completed = [] } = j.data || {};
        setState({ status: 'ready', available, completed });
      })
      .catch(() => { if (active) setState((prev) => ({ ...prev, status: 'error' })); });
    return () => { active = false; };
  }, [enabled, attempt]);

  const retry = React.useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}

/** Default Bluebook pick: the first not-yet-taken form, else the first form, else the question bank. */
export function defaultBluebook({ available, completed }) {
  const untaken = available.filter((t) => !completed.includes(t));
  return untaken[0] ?? available[0] ?? null;
}

/**
 * TestSourcePicker — question bank, Strix alternative tests, or an official
 * Bluebook form. `bluebook` null = question bank; `strixTest` wins when set.
 */
export default function TestSourcePicker({ forms, bluebook, strixTest, onPick }) {
  return (
    <div role="radiogroup" aria-label="Test" className={s.tiles}>
      <Tile
        selected={!strixTest && bluebook === null}
        onClick={() => onPick({ strixTest: null, bluebook: null })}
        title="Question bank"
        sub="A fresh adaptive test"
      />
      {STRIX_TEST_OPTIONS.map((t) => (
        <Tile
          key={`strix-${t}`}
          selected={strixTest === t}
          onClick={() => onPick({ strixTest: t, bluebook: null })}
          title={`Strix Test ${t}`}
          sub={strixMirrors[t] ? `Like Bluebook ${strixMirrors[t]}` : 'Alternative full SAT'}
        />
      ))}
      {forms.status === 'loading' && forms.available.length === 0 && [0, 1, 2].map((i) => (
        <Skeleton key={`sk-${i}`} height={54} radius="var(--radius-md)" />
      ))}
      {forms.available.map((t) => (
        <Tile
          key={t}
          selected={!strixTest && bluebook === t}
          onClick={() => onPick({ strixTest: null, bluebook: t })}
          title={`Bluebook ${t}`}
          sub={forms.completed.includes(t) ? 'Already taken' : 'Official practice test'}
          muted={forms.completed.includes(t)}
        />
      ))}
      {forms.status === 'error' && (
        <div className={s.inlineError} role="alert">
          <Icon name="alert-circle" size={14} />
          <span>Couldn&rsquo;t load the Bluebook tests.</span>
          <Button variant="ghost" size="sm" onClick={forms.retry}>Retry</Button>
        </div>
      )}
    </div>
  );
}

function Tile({ selected, onClick, title, sub, muted = false }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(s.tile, selected && s.tileSelected, muted && !selected && s.tileMuted)}
    >
      <span className={s.tileTitle}>{title}</span>
      <span className={s.tileSub}>{sub}</span>
    </button>
  );
}
