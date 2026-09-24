'use client';
import React from 'react';
import { AccuracyRing, DomainBar, Icon, IconButton, StatCard } from '@/components/sixteen';
import s from './SessionStats.module.css';

// Live "session stats" card — floats bottom-left over the question column in
// drill mode and shows accuracy, pace and the correct/incorrect/skipped split.
// Collapses to a round button; `onToggle` flips between the two.

function SessionStats({ answered = 0, total = 0, accuracy = 0, median = 0, correct = 0, incorrect = 0, skipped = 0, hidden = false, onToggle }) {
  if (hidden) {
    return (
      <div className={s.dock}>
        <button type="button" onClick={onToggle} title="Show session stats" aria-label="Show session stats" className={s.fab}>
          <Icon name="chart-no-axes-column" size={17} strokeWidth={2.2} />
        </button>
      </div>
    );
  }
  return (
    <aside className={`${s.dock} ${s.card}`} aria-label="Session stats">
      <div className={s.head}>
        <span className={s.title}>Session stats</span>
        <IconButton size="sm" label="Hide session stats" onClick={onToggle}>
          <Icon name="x" size={14} />
        </IconButton>
      </div>
      <div className={s.summary}>
        <AccuracyRing value={accuracy} size={64} stroke={7} />
        <div className={s.figures}>
          <StatCard label="Answered" value={`${answered}/${total}`} size="sm" />
          <StatCard label="Median time" value={median} unit="s" size="sm" />
        </div>
      </div>
      <div className={s.section}>
        <span className={s.label}>Breakdown</span>
        <DomainBar segments={[
          { value: correct, label: 'Correct', color: 'var(--correct)' },
          { value: incorrect, label: 'Incorrect', color: 'var(--incorrect)' },
          { value: skipped, label: 'Skipped', color: 'var(--unanswered)' },
        ]} />
      </div>
    </aside>
  );
}

export default SessionStats;
