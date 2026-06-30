'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useSessions } from '@/lib/data/hooks';
import {
  SECTION_SHORT, MODE_LABEL, MODE_VARIANT,
  relTime, sessionTitle, StatCardLite, EmptyState,
  isExam, pairTests,
} from '@/components/sixteen/stats/shared';

// A full SAT is two `mock-full` halves; this collapses them into one row.
function isExamHalf(s) { return s.mode === 'mock-full' && isExam(s); }

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
    .filter((s) => !isExamHalf(s))
    .map((s) => ({ type: 'session', key: s.id, at: new Date(s.created_at).getTime(), session: s }));
  return [...exams, ...rest].sort((a, b) => b.at - a.at);
}

function rowMatches(row, filter) {
  if (filter === 'all') return true;
  if (filter === 'tests') return row.type === 'exam';
  if (row.type === 'exam') return false;
  const s = row.session;
  if (filter === 'modules') return s.mode === 'mock-m1';
  if (filter === 'sections') return s.mode === 'mock-full';
  return s.section === filter; // 'rw' | 'math'
}

// Flatten a row into the cells the table renders, so the exam / session
// branches share one template.
function rowView(row) {
  if (row.type === 'exam') {
    return {
      when: relTime(new Date(row.at).toISOString()),
      section: 'brand', sectionLabel: 'SAT',
      title: 'Full SAT',
      kindVariant: 'brand', kindLabel: 'Full SAT',
      qs: row.score_total,
      estimate: row.composite ?? '—',
      accuracy: row.accuracy,
    };
  }
  const s = row.session;
  return {
    when: relTime(s.created_at),
    section: s.section, sectionLabel: SECTION_SHORT[s.section] ?? s.section,
    title: sessionTitle(s),
    kindVariant: MODE_VARIANT[s.mode] ?? 'neutral', kindLabel: MODE_LABEL[s.mode] ?? s.mode,
    qs: s.score_total,
    estimate: s.scaled_score ?? '—',
    accuracy: s.accuracy,
  };
}

// Sessions — the full practice-session log. Previously a tab inside Stats; now
// its own screen. Every drill / module / section run, newest first, filterable.

function Sessions({ go, studentId = null }) {
  const { Card, Badge, SegmentedControl } = SixteenNS;
  const { sessions: allSessions, loading } = useSessions(50, studentId);
  const [filter, setFilter] = React.useState('all');
  // Optimistically hide rows the user deletes; the server delete runs in the
  // background and a rollback re-shows the row if it fails.
  const [deleted, setDeleted] = React.useState(() => new Set());
  const sessions = allSessions.filter((s) => !deleted.has(s.id));
  const rows = buildRows(sessions);
  const filtered = rows.filter((row) => rowMatches(row, filter));

  async function deleteRow(ids, message) {
    if (!window.confirm(message)) return;
    setDeleted((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; });
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/sessions/${id}`, { method: 'DELETE' }).then((r) => r.json())),
      );
      if (results.some((j) => !j?.success)) throw new Error('Delete failed');
    } catch {
      setDeleted((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next; });
      window.alert('Could not delete the session. Please try again.');
    }
  }

  const totalQ = sessions.reduce((a, s) => a + (s.score_total || 0), 0);
  const totalCorrect = sessions.reduce((a, s) => a + (s.score_correct || 0), 0);
  const avgAcc = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;

  return (
    <div style={{padding: '28px 36px'}}>
      <h1 style={{margin:'0 0 14px', font:'var(--role-title-lg)'}}>Sessions</h1>

      {loading ? (
        <div style={{padding:'48px 0', textAlign:'center', font:'var(--role-body)', color:'var(--text-tertiary)'}}>
          Loading your sessions…
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState title="No sessions yet" hint="Complete a drill or mock to see it here." />
      ) : (
        <>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
            <Card padding="md"><StatCardLite label="Sessions" value={rows.length} sublabel="Recent" /></Card>
            <Card padding="md"><StatCardLite label="Questions" value={totalQ} /></Card>
            <Card padding="md"><StatCardLite label="Correct" value={totalCorrect} /></Card>
            <Card padding="md"><StatCardLite label="Avg. accuracy" value={`${avgAcc}%`} /></Card>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10, gap: 12, flexWrap: 'wrap'}}>
            <h2 style={{margin:0, font:'var(--role-title-sm)'}}>All sessions</h2>
            <SegmentedControl
              value={filter} onChange={setFilter}
              options={[
                { value:'all',      label:'All' },
                { value:'modules',  label:'Modules' },
                { value:'sections', label:'Full sections' },
                { value:'tests',    label:'Full SATs' },
                { value:'rw',       label:'R&W' },
                { value:'math',     label:'Math' },
              ]}
            />
          </div>

          <Card padding="none" style={{overflowX: 'auto'}}>
            <div style={{minWidth: 720}}>
            <div style={{
              display:'grid', gridTemplateColumns:'120px minmax(220px, 1fr) 110px 60px 70px 80px 24px',
              gap: 12, alignItems:'center', padding:'10px 16px',
              font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)',
              color:'var(--text-tertiary)', borderBottom:'1px solid var(--border-1)',
            }}>
              <span>When</span>
              <span>Session</span>
              <span>Kind</span>
              <span style={{textAlign:'right'}}>Qs</span>
              <span style={{textAlign:'right'}}>Estimate</span>
              <span style={{textAlign:'right'}}>Accuracy</span>
              <span/>
            </div>
            {filtered.map((row, i) => {
              const v = rowView(row);
              const isEx = row.type === 'exam';
              const open = isEx
                ? () => go('test-review', { rwId: row.rw?.id, mathId: row.math?.id })
                : () => go('session-detail', { id: row.session.id });
              return (
              <div key={row.key} style={{position:'relative', borderTop: i === 0 ? 0 : '1px solid var(--border-1)'}}>
                <button onClick={open} style={{
                  display:'grid', gridTemplateColumns:'120px minmax(220px, 1fr) 110px 60px 70px 80px 24px',
                  gap: 12, alignItems:'center', padding:'12px 16px',
                  background:'transparent', border:0,
                  cursor:'pointer', textAlign:'left', width:'100%',
                }}>
                  <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{v.when}</span>
                  <span style={{display:'flex', alignItems:'center', gap: 8, font:'var(--role-body)', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    <Badge variant={v.section} dot size="sm">{v.sectionLabel}</Badge>
                    <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.title}</span>
                  </span>
                  <Badge variant={v.kindVariant} size="sm">{v.kindLabel}</Badge>
                  <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{v.qs}</span>
                  <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{v.estimate}</span>
                  <span style={{font:'var(--role-numeric)', textAlign:'right', color: v.accuracy >= 75 ? 'var(--success)' : v.accuracy >= 65 ? 'var(--warning)' : 'var(--error)'}}>{v.accuracy}%</span>
                  {studentId
                    ? <Icon name="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
                    : <span/>}
                </button>
                {!studentId && (
                  <button
                    onClick={() => isEx
                      ? deleteRow(row.ids, 'Delete this full SAT? This permanently removes both sections and their questions.')
                      : deleteRow([row.session.id], 'Delete this session? This permanently removes it and its questions.')}
                    title="Delete session" aria-label="Delete session"
                    style={{
                      position:'absolute', right: 12, top:'50%', transform:'translateY(-50%)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width: 28, height: 28, padding: 0, borderRadius: 6,
                      background:'transparent', border:0, cursor:'pointer', color:'var(--error)',
                    }}>
                    <Icon name="trash-2" style={{width:15, height:15}}/>
                  </button>
                )}
              </div>
              );
            })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default Sessions;
