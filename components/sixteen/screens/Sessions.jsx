'use client';
import React from 'react';
import {
  Badge, Button, Card, EmptyState, Icon, IconButton, List, Metric, SegmentedControl,
} from '@/components/sixteen';
import { useSessions } from '@/lib/data/hooks';
import {
  SECTION_SHORT, MODE_LABEL, relTime, sessionTitle, accuracyTone, isExam, pairTests,
} from '@/components/sixteen/stats/shared';
import { MetricsSkeleton, ListSkeleton } from './progress/Skeletons';
import p from './progress/Progress.module.css';
import s from './progress/History.module.css';

// Sessions — the History tab of Progress: every drill / module / section run
// and full SAT, newest first, filterable. Rows open the session or test review.

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'modules', label: 'Modules' },
  { value: 'sections', label: 'Full sections' },
  { value: 'tests', label: 'Full SATs' },
  { value: 'rw', label: 'R&W' },
  { value: 'math', label: 'Math' },
];

// A full SAT is two `mock-full` halves; this collapses them into one row.
function isExamHalf(sess) { return sess.mode === 'mock-full' && isExam(sess); }

// Build the display rows: each plain session stays a row; a full SAT's two
// halves merge into a single `exam` row. Sorted newest-first.
function buildRows(sessions) {
  const exams = pairTests(sessions.filter(isExamHalf)).map((t) => {
    const totalQ = (t.rw?.score_total || 0) + (t.math?.score_total || 0);
    const totalCorrect = (t.rw?.score_correct || 0) + (t.math?.score_correct || 0);
    return {
      type: 'exam', key: `exam-${t.key}`, at: t.at,
      rw: t.rw, math: t.math, composite: t.composite,
      score_total: totalQ,
      accuracy: totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0,
      ids: [t.rw?.id, t.math?.id].filter(Boolean),
    };
  });
  const rest = sessions
    .filter((sess) => !isExamHalf(sess))
    .map((sess) => ({ type: 'session', key: sess.id, at: new Date(sess.created_at).getTime(), session: sess }));
  return [...exams, ...rest].sort((a, b) => b.at - a.at);
}

function rowMatches(row, filter) {
  if (filter === 'all') return true;
  if (filter === 'tests') return row.type === 'exam';
  if (row.type === 'exam') return false;
  const sess = row.session;
  if (filter === 'modules') return sess.mode === 'mock-m1';
  if (filter === 'sections') return sess.mode === 'mock-full';
  return sess.section === filter; // 'rw' | 'math'
}

// Flatten a row into what the list renders, so exam / session share one template.
function rowView(row) {
  if (row.type === 'exam') {
    return {
      badge: 'brand', badgeLabel: 'SAT', title: 'Full SAT',
      sub: `Full SAT · ${row.score_total} questions · ${relTime(new Date(row.at).toISOString())}`,
      estimate: row.composite, accuracy: row.accuracy,
    };
  }
  const sess = row.session;
  return {
    badge: sess.section, badgeLabel: SECTION_SHORT[sess.section] ?? sess.section,
    title: sessionTitle(sess),
    sub: `${MODE_LABEL[sess.mode] ?? sess.mode} · ${sess.score_total ?? 0} questions · ${relTime(sess.created_at)}`,
    estimate: sess.scaled_score, accuracy: sess.accuracy,
  };
}

function Sessions({ go, studentId = null, readOnly = false, studentName = null }) {
  const { sessions: allSessions, loading } = useSessions(50, studentId);
  const [filter, setFilter] = React.useState('all');
  // Optimistically hide rows the user deletes; the server delete runs in the
  // background and a rollback re-shows the row if it fails.
  const [deleted, setDeleted] = React.useState(() => new Set());
  const sessions = allSessions.filter((sess) => !deleted.has(sess.id));
  const rows = buildRows(sessions);
  const filtered = rows.filter((row) => rowMatches(row, filter));
  const canDelete = !studentId && !readOnly;

  async function deleteRow(ids, message) {
    if (!window.confirm(message)) return;
    setDeleted((prev) => new Set([...prev, ...ids]));
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/sessions/${id}`, { method: 'DELETE' }).then((r) => r.json())),
      );
      if (results.some((j) => !j?.success)) throw new Error('Delete failed');
    } catch {
      setDeleted((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      window.alert('Could not delete the session. Please try again.');
    }
  }

  if (loading && !allSessions.length) {
    return (
      <div className={p.tabBody} aria-busy="true">
        <MetricsSkeleton />
        <ListSkeleton rows={6} />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <EmptyState
        icon="history"
        title="No sessions yet"
        body={readOnly
          ? `${studentName || 'This student'} hasn't finished a session yet.`
          : 'Finish a drill or a timed section and it shows up here.'}
        action={readOnly ? null : <Button onClick={() => go('practice', { tab: 'drill' })}>Start practicing</Button>}
      />
    );
  }

  const totalQ = sessions.reduce((a, sess) => a + (sess.score_total || 0), 0);
  const totalCorrect = sessions.reduce((a, sess) => a + (sess.score_correct || 0), 0);
  const avgAcc = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  return (
    <div className={p.tabBody}>
      <Card padding="lg">
        <div className={p.metrics}>
          <Metric label="Sessions" value={rows.length} hint="Most recent 50" />
          <Metric label="Questions" value={totalQ} />
          <Metric label="Correct" value={totalCorrect} />
          <Metric label="Avg. accuracy" value={avgAcc} unit="%" />
        </div>
      </Card>

      <div>
        <div className={p.toolbar} style={{ marginBottom: 12 }}>
          <div className={p.scrollX}>
            <SegmentedControl size="sm" label="Filter sessions" options={FILTERS} value={filter} onChange={setFilter} />
          </div>
          <span className={p.caption}>{filtered.length} shown</span>
        </div>
        {filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState compact icon="filter" title="Nothing here" body="No sessions match this filter." />
          </Card>
        ) : (
          <List>
            {filtered.map((row) => (
              <HistoryRow
                key={row.key}
                row={row}
                canDelete={canDelete}
                onOpen={row.type === 'exam'
                  ? () => go('test-review', { rwId: row.rw?.id, mathId: row.math?.id })
                  : () => go('session-detail', { id: row.session.id })}
                onDelete={row.type === 'exam'
                  ? () => deleteRow(row.ids, 'Delete this full SAT? This permanently removes both sections and their questions.')
                  : () => deleteRow([row.session.id], 'Delete this session? This permanently removes it and its questions.')}
              />
            ))}
          </List>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ row, canDelete, onOpen, onDelete }) {
  const v = rowView(row);
  return (
    <div className={`${s.row} ${canDelete ? s.deletable : ''}`}>
      <button type="button" className={s.main} onClick={onOpen}>
        <span className={s.lead}><Badge variant={v.badge} size="sm">{v.badgeLabel}</Badge></span>
        <span className={s.text}>
          <span className={s.title}>{v.title}</span>
          <span className={s.sub}>{v.sub}</span>
        </span>
        <span className={s.figures}>
          <span className={`${s.figure} ${s.figureHideNarrow}`}>
            <span className={s.figureValue}>{v.estimate ?? '—'}</span>
            <span className={s.figureLabel}>Estimate</span>
          </span>
          <span className={s.figure}>
            <span className={s.figureValue} style={{ color: accuracyTone(v.accuracy) }}>
              {v.accuracy != null ? `${v.accuracy}%` : '—'}
            </span>
            <span className={s.figureLabel}>Accuracy</span>
          </span>
        </span>
        {!canDelete && <Icon name="chevron-right" size={15} className={s.chev} />}
      </button>
      {canDelete && (
        <span className={s.delete}>
          <IconButton size="sm" label="Delete session" className={s.deleteBtn} onClick={onDelete}>
            <Icon name="trash-2" size={14} />
          </IconButton>
        </span>
      )}
    </div>
  );
}

export default Sessions;
