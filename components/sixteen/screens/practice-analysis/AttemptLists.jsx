'use client';
import { Badge, List, ListRow } from '@/components/sixteen';
import { SECTION_LABEL, SECTION_SHORT, relTime, accuracyTone } from '@/components/sixteen/stats/shared';
import s from './AttemptLists.module.css';

// Past attempts for the Full-length tab. Modules / sections open the session
// review; a full SAT opens the combined test review.

function Figure({ value, label, color }) {
  return (
    <span className={s.figure}>
      <span className={s.value} style={color ? { color } : undefined}>{value}</span>
      <span className={s.label}>{label}</span>
    </span>
  );
}

export function AttemptList({ attempts, kind, go }) {
  return (
    <List>
      {attempts.map((sess) => (
        <ListRow
          key={sess.id}
          leading={<span className={s.lead}><Badge variant={sess.section} size="sm">{SECTION_SHORT[sess.section] ?? sess.section}</Badge></span>}
          title={`${SECTION_LABEL[sess.section] ?? sess.section} ${kind === 'sections' ? 'section' : 'module'}`}
          subtitle={`${relTime(sess.created_at)} · ${sess.score_correct ?? 0} of ${sess.score_total ?? 0} correct`}
          meta={
            <span className={s.figures}>
              {kind === 'sections' && <Figure value={sess.scaled_score ?? '—'} label="Estimate" />}
              <Figure value={sess.accuracy != null ? `${sess.accuracy}%` : '—'} label="Accuracy" color={accuracyTone(sess.accuracy)} />
            </span>
          }
          onClick={() => go('session-detail', { id: sess.id })}
        />
      ))}
    </List>
  );
}

function halfText(half, label) {
  if (!half) return `${label} not taken`;
  return `${label} ${half.scaled_score ?? '—'}`;
}

export function TestList({ tests, go }) {
  return (
    <List>
      {tests.map((t) => (
        <ListRow
          key={t.key}
          leading={<span className={s.lead}><Badge variant="brand" size="sm">SAT</Badge></span>}
          title="Full SAT"
          subtitle={`${relTime(new Date(t.at).toISOString())} · ${halfText(t.rw, 'R&W')} · ${halfText(t.math, 'Math')}`}
          meta={<span className={s.figures}><Figure value={t.composite ?? '—'} label="Total" /></span>}
          onClick={() => go('test-review', { rwId: t.rw?.id, mathId: t.math?.id })}
        />
      ))}
    </List>
  );
}
