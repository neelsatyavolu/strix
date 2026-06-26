'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';

// Dashboard — the landing screen. Resume card, recent sessions, category drilling.

function Dashboard({ go }) {
  const { Card, Button, Badge, ScoreBadge, AccuracyRing, StatCard } = SixteenNS;
  const d = SixteenData;
  return (
    <div style={{ padding: '28px 36px', maxWidth: 980 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, font:'var(--role-title-lg)', color:'var(--ink-1)' }}>Good afternoon, Maya.</h1>
          <p style={{ margin: '4px 0 0', font:'var(--role-body-lg)', color:'var(--text-secondary)' }}>
            You're 22 seconds faster than your 14-day average. Accuracy is holding steady at 78%.
          </p>
        </div>
        <Badge variant="brand" dot>{d.student.streakDays}-day streak</Badge>
      </div>

      <Card padding="lg" style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', gap: 24, alignItems:'center', flexWrap:'wrap' }}>
          <ScoreBadge value={d.student.estTotal} label="Estimated total" trend={`+${40}`} />
          <div style={{ width: 1, height: 56, background:'var(--border-1)' }}/>
          <ScoreBadge value={d.student.estRW} max={800} label="Reading & Writing" domain="rw" size="md" />
          <ScoreBadge value={d.student.estMath} max={800} label="Math" domain="math" size="md" />
          <div style={{ flex: 1, minWidth: 0 }}/>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            <Button variant="primary" size="lg" onClick={() => go('practice-setup')} icon={<Icon name="play" style={{width:14, height:14}}/>}>
              New session
            </Button>
            <Button variant="secondary" onClick={() => go('rw-question')}>Resume Module 1 · Q14</Button>
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card padding="lg">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12}}>
            <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Reading &amp; Writing</span>
            <Badge variant="rw" dot>R&amp;W</Badge>
          </div>
          <div style={{ display:'flex', gap: 16, alignItems:'center', marginBottom: 14 }}>
            <AccuracyRing value={76} size={64} color="var(--rw-color)" />
            <div style={{ display:'flex', flexDirection:'column', gap: 6, flex: 1 }}>
              <StatCard label="Questions done" value={312} size="sm" />
              <StatCard label="Last session" value="78" unit="%" size="sm" sublabel="Information & Ideas" />
            </div>
          </div>
          <Button variant="outline" fullWidth iconRight={<Icon name="chevron-right" style={{width:14, height:14}}/>} onClick={() => go('practice-setup', { domain: 'rw' })}>
            Drill Reading &amp; Writing
          </Button>
        </Card>

        <Card padding="lg">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12}}>
            <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Math</span>
            <Badge variant="math" dot>Math</Badge>
          </div>
          <div style={{ display:'flex', gap: 16, alignItems:'center', marginBottom: 14 }}>
            <AccuracyRing value={81} size={64} color="var(--math-color)" />
            <div style={{ display:'flex', flexDirection:'column', gap: 6, flex: 1 }}>
              <StatCard label="Questions done" value={248} size="sm" />
              <StatCard label="Last session" value="81" unit="%" size="sm" sublabel="Algebra" />
            </div>
          </div>
          <Button variant="outline" fullWidth iconRight={<Icon name="chevron-right" style={{width:14, height:14}}/>} onClick={() => go('practice-setup', { domain: 'math' })}>
            Drill Math
          </Button>
        </Card>
      </div>

      <div>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10}}>
          <h2 style={{margin:0, font:'var(--role-title-md)'}}>Recent sessions</h2>
          <button onClick={() => go('stats')} style={{font:'var(--role-label)', color:'var(--text-link)', background:'transparent', border:0, cursor:'pointer'}}>View all stats →</button>
        </div>
        <Card padding="none" style={{overflowX: 'auto'}}>
          <div style={{minWidth: 540}}>
          {d.recentSessions.slice(0, 3).map((s, i) => (
            <div key={s.id} style={{
              display:'grid', gridTemplateColumns:'auto minmax(160px, 1fr) auto auto auto', alignItems:'center',
              gap: 14, padding: '12px 16px',
              borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
            }}>
              <Badge variant={s.domain} dot>{s.domain === 'rw' ? 'R&W' : 'Math'}</Badge>
              <span style={{font:'var(--role-body)', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.label}</span>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', whiteSpace:'nowrap'}}>{s.when}</span>
              <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', whiteSpace:'nowrap'}}>{s.count} qs</span>
              <span style={{font:'var(--role-numeric)', color: s.accuracy >= 75 ? 'var(--success)' : 'var(--warning)', whiteSpace:'nowrap'}}>{s.accuracy}%</span>
            </div>
          ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
