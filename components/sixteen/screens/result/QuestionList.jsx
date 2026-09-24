'use client';
import React from 'react';
import { EmptyState, Icon, List, ListRow, Tabs } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import { QuestionDetail } from './QuestionDetail';
import { formatDuration, outcomeOf, tally } from './format';
import s from './QuestionList.module.css';

const MODULE_FALLBACK_LABELS = { m1: 'Module 1', m2: 'Module 2' };

const OUTCOME = {
  correct: { icon: 'circle-check', label: 'Correct', className: s.correct },
  incorrect: { icon: 'circle-x', label: 'Incorrect', className: s.incorrect },
  skipped: { icon: 'circle-minus', label: 'Skipped', className: s.skipped },
};

const EMPTY_FILTER = {
  incorrect: { title: 'No incorrect answers', body: 'Every answered question here was right.' },
  flagged: { title: 'Nothing flagged', body: 'No questions were marked for review.' },
  skipped: { title: 'Nothing skipped', body: 'Every question got an answer.' },
};

const matches = (item, filter) => {
  if (filter === 'flagged') return !!item.response?.flagged;
  if (filter === 'incorrect' || filter === 'skipped') return outcomeOf(item) === filter;
  return true;
};

// Consecutive items from the same module form one group; numbering restarts per
// group (Module 1 · 1–27, Module 2 · 1–27). Single-module reviews are one group.
function groupByModule(review) {
  return review.reduce((groups, item, idx) => {
    const label = item.moduleLabel || MODULE_FALLBACK_LABELS[item.module] || null;
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      const entry = { item, n: last.entries.length + 1, key: item.question?.id || `q-${idx}` };
      return [...groups.slice(0, -1), { ...last, entries: [...last.entries, entry] }];
    }
    return [...groups, { label, entries: [{ item, n: 1, key: item.question?.id || `q-${idx}` }] }];
  }, []);
}

/**
 * QuestionList — filterable list of reviewed questions (number, outcome, skill,
 * time). A row expands in place to the full question review.
 *
 * `filter` / `onFilterChange` make the filter controlled (optional).
 * `revealQid` + `revealSeq` expand that question (teaching mode "Show student").
 */
export function QuestionList({ review = [], filter, onFilterChange, revealQid, revealSeq, emptyTitle = 'No questions recorded' }) {
  const [ownFilter, setOwnFilter] = React.useState('all');
  const current = filter ?? ownFilter;
  const setFilter = onFilterChange ?? setOwnFilter;

  const [open, setOpen] = React.useState(() => new Set());
  const [seenReveal, setSeenReveal] = React.useState(null);
  const revealKey = revealQid ? `${revealQid}:${revealSeq ?? ''}` : null;
  if (revealKey && revealKey !== seenReveal) {
    setSeenReveal(revealKey);
    setOpen((prev) => (prev.has(revealQid) ? prev : new Set([...prev, revealQid])));
  }

  const toggle = (key) =>
    setOpen((prev) => (prev.has(key) ? new Set([...prev].filter((k) => k !== key)) : new Set([...prev, key])));

  const groups = React.useMemo(() => groupByModule(review), [review]);

  if (!review.length) {
    return <EmptyState compact icon="list" title={emptyTitle} />;
  }

  const counts = tally(review);
  const tabs = [
    { value: 'all', label: 'All', count: review.length },
    { value: 'incorrect', label: 'Incorrect', count: counts.incorrect },
    ...(counts.flagged ? [{ value: 'flagged', label: 'Flagged', count: counts.flagged }] : []),
    ...(counts.skipped ? [{ value: 'skipped', label: 'Skipped', count: counts.skipped }] : []),
  ];
  const showHeaders = groups.length > 1;
  const visible = groups
    .map((g) => ({ ...g, shown: g.entries.filter((e) => matches(e.item, current)) }))
    .filter((g) => g.shown.length > 0);

  return (
    <div className={s.wrap}>
      <Tabs variant="pill" tabs={tabs} value={current} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState compact icon="circle-check" {...(EMPTY_FILTER[current] || { title: 'Nothing here' })} />
      ) : (
        visible.map((g, gi) => (
          <div key={g.label || gi} className={s.group}>
            {showHeaders && g.label && (
              <div className={s.groupHead}>
                <span className={s.groupTitle}>{g.label}</span>
                <span className={s.groupMeta}>
                  {g.entries.filter((e) => e.item.isCorrect).length} of {g.entries.length} correct
                </span>
              </div>
            )}
            <List>
              {g.shown.map((e) => (
                <QuestionRow key={e.key} entry={e} open={open.has(e.key)} onToggle={() => toggle(e.key)} />
              ))}
            </List>
          </div>
        ))
      )}
    </div>
  );
}

function QuestionRow({ entry, open, onToggle }) {
  const { item, n } = entry;
  const q = item.question || {};
  const outcome = OUTCOME[outcomeOf(item)];
  const time = formatDuration(item.timeMs);
  const title = q.skillLabel || q.domainLabel || 'Question';
  const subtitle = [q.skillLabel ? q.domainLabel : null, q.difficulty ? `Difficulty ${q.difficulty}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={s.item} data-teach-question={q.id}>
      <ListRow
        onClick={onToggle}
        chevron={false}
        className={open ? s.rowOpen : undefined}
        leading={(
          <span className={s.lead}>
            <span className={s.num}>{n}</span>
            <span className={cx(s.outcome, outcome.className)} title={outcome.label}>
              <Icon name={outcome.icon} size={16} />
              <span className={s.srOnly}>{outcome.label}</span>
            </span>
          </span>
        )}
        title={title}
        subtitle={subtitle || null}
        meta={time}
        trailing={(
          <>
            {item.response?.flagged && (
              <span className={s.flag} title="Flagged">
                <Icon name="flag" size={14} />
                <span className={s.srOnly}>Flagged</span>
              </span>
            )}
            <Icon name="chevron-down" size={15} className={cx(s.chev, open && s.chevOpen)} />
          </>
        )}
      />
      {open && <QuestionDetail item={item} />}
    </div>
  );
}
