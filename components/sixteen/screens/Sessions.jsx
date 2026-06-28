'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useSessions } from '@/lib/data/hooks';
import {
  SECTION_SHORT, MODE_LABEL, MODE_VARIANT,
  relTime, sessionTitle, StatCardLite, EmptyState,
} from '@/components/sixteen/stats/shared';

// Sessions — the full practice-session log. Previously a tab inside Stats; now
// its own screen. Every drill / module / section run, newest first, filterable.

function Sessions({ go, studentId = null }) {
  const { Card, Badge, SegmentedControl } = SixteenNS;
  const { sessions, loading } = useSessions(50, studentId);
  const [filter, setFilter] = React.useState('all');

  const filtered = sessions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'modules') return s.mode === 'mock-m1';
    if (filter === 'sections') return s.mode === 'mock-full';
    return s.section === filter; // 'rw' | 'math'
  });

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
            <Card padding="md"><StatCardLite label="Sessions" value={sessions.length} sublabel="Recent" /></Card>
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
            {filtered.map((s, i) => (
              <button key={s.id} onClick={() => go('session-detail', { id: s.id })} style={{
                display:'grid', gridTemplateColumns:'120px minmax(220px, 1fr) 110px 60px 70px 80px 24px',
                gap: 12, alignItems:'center', padding:'12px 16px',
                background:'transparent', border:0, borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
                cursor:'pointer', textAlign:'left', width:'100%',
              }}>
                <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{relTime(s.created_at)}</span>
                <span style={{display:'flex', alignItems:'center', gap: 8, font:'var(--role-body)', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  <Badge variant={s.section} dot size="sm">{SECTION_SHORT[s.section] ?? s.section}</Badge>
                  <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{sessionTitle(s)}</span>
                </span>
                <Badge variant={MODE_VARIANT[s.mode] ?? 'neutral'} size="sm">{MODE_LABEL[s.mode] ?? s.mode}</Badge>
                <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{s.score_total}</span>
                <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{s.scaled_score ?? '—'}</span>
                <span style={{font:'var(--role-numeric)', textAlign:'right', color: s.accuracy >= 75 ? 'var(--success)' : s.accuracy >= 65 ? 'var(--warning)' : 'var(--error)'}}>{s.accuracy}%</span>
                <Icon name="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
              </button>
            ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default Sessions;
