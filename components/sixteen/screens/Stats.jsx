'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useStats, useSessions } from '@/lib/data/hooks';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { useInsight } from '@/lib/ai/insights';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

// Stats — overall + per-domain breakdown, driven by real practice data.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const SECTION_SHORT = { rw: 'R&W', math: 'Math' };
const MODE_LABEL = { drill: 'drill', 'mock-m1': 'Module 1', 'mock-full': 'Full section' };
const MODE_VARIANT = { drill: 'neutral', 'mock-m1': 'brand', 'mock-full': 'success' };

// "Math · Algebra" for targeted drills; falls back to the section label.
function sessionTitle(s) {
  const sec = SECTION_LABEL[s.section] ?? s.section;
  if (s.mode === 'drill') {
    const code = CATEGORY_TO_DOMAIN[s.config?.category];
    const cat = code ? domainLabel(s.section, code) : null;
    if (cat) return `${sec} · ${cat}`;
  }
  return sec;
}

function relTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return 'Just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function shortAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 90) return 'now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w`;
  return `${Math.floor(d / 30)}mo`;
}

function Stats({ go, studentId = null }) {
  const { Tabs } = SixteenNS;
  const { stats, loading } = useStats(studentId);
  const { sessions } = useSessions(50, studentId);
  const [tab, setTab] = React.useState('overall');

  const rwDone = stats?.sectionTotals?.rw?.done ?? 0;
  const mathDone = stats?.sectionTotals?.math?.done ?? 0;

  return (
    <div style={{padding: '28px 36px'}}>
      <h1 style={{margin:'0 0 14px', font:'var(--role-title-lg)'}}>Stats</h1>
      <Tabs value={tab} onChange={setTab} style={{marginBottom: 18}} tabs={[
        { value:'overall',  label:'Overall' },
        { value:'sessions', label:'Sessions', count: sessions.length },
        { value:'rw',       label:'Reading & Writing', count: rwDone },
        { value:'math',     label:'Math', count: mathDone },
      ]}/>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {tab === 'overall' && <OverallTab stats={stats} sessions={sessions} />}
          {tab === 'sessions' && <SessionsTab go={go} sessions={sessions} />}
          {tab !== 'overall' && tab !== 'sessions' && (
            <DomainBreakdown domain={tab} stats={stats} go={go} />
          )}
        </>
      )}
    </div>
  );
}

function OverallTab({ stats, sessions }) {
  const { Card, ScoreBadge, AccuracyRing, StatCard, DomainBar } = SixteenNS;

  if (!stats) {
    return <EmptyState title="Couldn't load your stats" hint="Please try again in a moment." />;
  }

  const scores = stats.scores ?? {};
  const rwTot = stats.sectionTotals?.rw ?? { done: 0, correct: 0 };
  const mathTot = stats.sectionTotals?.math ?? { done: 0, correct: 0 };
  const totalDone = rwTot.done + mathTot.done;
  const totalCorrect = rwTot.correct + mathTot.correct;
  const overallAcc = totalDone ? Math.round((totalCorrect / totalDone) * 100) : 0;
  const rwAcc = rwTot.done ? Math.round((rwTot.correct / rwTot.done) * 100) : 0;
  const mathAcc = mathTot.done ? Math.round((mathTot.correct / mathTot.done) * 100) : 0;

  const overTime = [...(stats.overTime ?? [])]
    .filter((p) => typeof p.score === 'number')
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <>
      <Card padding="xl" style={{marginBottom: 16}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 28, alignItems:'center'}}>
          <ScoreBadge value={scores.total ?? '—'} label="Estimated total" size="lg" />
          <ScoreBadge value={scores.rw ?? '—'} max={800} domain="rw" label="R&W" size="md" />
          <ScoreBadge value={scores.math ?? '—'} max={800} domain="math" label="Math" size="md" />
        </div>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
        <Card padding="md"><StatCard label="Total questions" value={totalDone} /></Card>
        <Card padding="md"><StatCard label="Accuracy" value={totalDone ? overallAcc : '—'} unit={totalDone ? '%' : undefined} /></Card>
        <Card padding="md"><StatCard label="Sessions" value={stats.sessionCount ?? 0} /></Card>
        <Card padding="md"><StatCard label="Sections scored" value={overTime.length} /></Card>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16}}>
        <Card padding="lg" style={{display:'flex', flexDirection:'column'}}>
          <h2 style={{margin:'0 0 12px', font:'var(--role-title-sm)'}}>Score over time</h2>
          {overTime.length < 2 ? (
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:160, font:'var(--role-body)', color:'var(--text-tertiary)', textAlign:'center'}}>
              Not enough scored sections yet
            </div>
          ) : (
            <ScoreLine points={overTime} />
          )}
        </Card>
        <Card padding="lg">
          <h2 style={{margin:'0 0 12px', font:'var(--role-title-sm)'}}>Practice by day</h2>
          <Heatmap sessions={sessions} />
        </Card>
      </div>

      <Card padding="lg">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14}}>
          <h2 style={{margin:0, font:'var(--role-title-sm)'}}>Accuracy by domain</h2>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>All time</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 28}}>
          <AccuracyRing value={rwAcc} color="var(--rw-color)" label="Reading & Writing" />
          <AccuracyRing value={mathAcc} color="var(--math-color)" label="Math" />
          <div style={{flex:1}}>
            <DomainBar segments={[
              { value: totalCorrect,             label:'Correct',   color:'var(--correct)' },
              { value: totalDone - totalCorrect, label:'Incorrect', color:'var(--incorrect)' },
            ]}/>
          </div>
        </div>
      </Card>
    </>
  );
}

function SessionsTab({ go, sessions }) {
  const { Card, Badge, SegmentedControl } = SixteenNS;
  const [filter, setFilter] = React.useState('all');

  if (sessions.length === 0) {
    return <EmptyState title="No sessions yet" hint="Complete a drill or mock to see it here." />;
  }

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
          <span style={{textAlign:'right'}}>Score</span>
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
  );
}

function StatCardLite({ label, value, sublabel }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 4}}>
      <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>{label}</span>
      <span style={{font:'var(--role-title-md)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontVariantNumeric:'tabular-nums', lineHeight: 1}}>{value}</span>
      {sublabel && <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{sublabel}</span>}
    </div>
  );
}

// Deterministic best/worst read over a section's categories — the always-on
// fallback when no AI provider is connected. Shape matches a parsed AI insight.
function sectionBaseline(sectionLabel, cats) {
  const pool = (cats ?? []).filter((c) => c.done > 0);
  if (!pool.length) return null;
  // Rank by recency-weighted accuracy when available so the strength/focus call
  // reflects how the student is doing lately, not their all-time average.
  const accOf = (c) => (c.recentAccuracy != null ? c.recentAccuracy : c.accuracy);
  const eligible = pool.filter((c) => c.done >= 5);
  const ranked = [...(eligible.length ? eligible : pool)].sort((a, b) => accOf(b) - accOf(a));
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const total = pool.reduce((a, c) => a + c.done, 0);
  const same = best.id === worst.id;
  return {
    summary: same
      ? `You've answered ${total} ${sectionLabel} questions so far, all in ${best.label} (${accOf(best)}%). Practice the other categories to round out your profile.`
      : `You've answered ${total} ${sectionLabel} questions. Lately you're strongest in ${best.label} (${accOf(best)}%) and weakest in ${worst.label} (${accOf(worst)}%).`,
    strength: `${best.label} — ${accOf(best)}% recently across ${best.done} question${best.done === 1 ? '' : 's'}.`,
    focus: same ? '' : `${worst.label} — ${accOf(worst)}%. Put your next sessions here.`,
    actions: same
      ? [`Practice categories you haven't tried yet`]
      : [`Drill ${worst.label} questions`, `Review the ones you missed in ${worst.label}`],
  };
}

function SectionInsights({ sectionLabel, cats, accent }) {
  const baseline = React.useMemo(() => sectionBaseline(sectionLabel, cats), [sectionLabel, cats]);
  const payload = React.useMemo(() => ({
    section: sectionLabel,
    note: 'recentAccuracy weights recent attempts more heavily — prioritize it over all-time accuracy when recommending focus areas.',
    topics: (cats ?? []).filter((c) => c.done > 0).map((c) => ({ topic: c.label, answered: c.done, accuracy: c.accuracy, recentAccuracy: c.recentAccuracy })),
  }), [sectionLabel, cats]);
  const ready = (cats ?? []).some((c) => c.done > 0);
  const ins = useInsight({ scope: `section:${sectionLabel}`, payload, baseline, ready });
  if (!ready) return null;
  return <InsightCard title="Insights" accent={accent} {...ins} />;
}

function DomainBreakdown({ domain, stats, go }) {
  const { Card, AccuracyRing, Badge } = SixteenNS;
  const cats = (domain === 'rw' ? stats?.categories?.rw : stats?.categories?.math) ?? [];
  const color = domain === 'rw' ? 'var(--rw-color)' : 'var(--math-color)';
  return (
    <>
      <SectionInsights sectionLabel={SECTION_LABEL[domain] ?? domain} cats={cats} accent={color} />
      <Card padding="lg">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16}}>
          <h2 style={{margin:0, font:'var(--role-title-md)'}}>By category</h2>
          <Badge variant={domain} dot>{SECTION_LABEL[domain] ?? domain}</Badge>
        </div>
        {cats.length === 0 ? (
          <div style={{padding:'24px 0', textAlign:'center', font:'var(--role-body)', color:'var(--text-tertiary)'}}>
            No category data yet
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column'}}>
            {cats.map((c, i) => {
              const clickable = c.done > 0 && !!c.code;
              return (
                <button
                  key={c.id}
                  disabled={!clickable}
                  onClick={() => clickable && go('category-detail', { section: domain, domain: c.code, label: c.label })}
                  style={{
                    display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 14, alignItems:'center',
                    padding:'14px 6px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
                    background:'transparent', border:0, borderRadius:'var(--radius-sm)',
                    cursor: clickable ? 'pointer' : 'default', textAlign:'left', width:'100%',
                  }}
                >
                  <AccuracyRing value={c.accuracy} size={44} stroke={5} color={color} />
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{c.label}</span>
                    <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
                      {c.done} answered{clickable ? ' · view detail' : ''}
                    </span>
                  </div>
                  <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)'}}>{c.accuracy}%</span>
                  <Icon name="chevron-right" style={{width:14, height:14, color: clickable ? 'var(--text-tertiary)' : 'transparent'}}/>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function ScoreLine({ points }) {
  // SVG line of section scaled-scores over time, built from real scored sessions.
  const scores = points.map((p) => p.score);
  const dataLo = Math.min(...scores);
  const dataHi = Math.max(...scores);
  const span = Math.max(50, dataHi - dataLo);
  const lo = Math.floor((dataLo - span * 0.2) / 10) * 10;
  const hi = Math.ceil((dataHi + span * 0.2) / 10) * 10;
  const mid = Math.round(((lo + hi) / 2) / 10) * 10;
  const w = 360, h = 160;
  const step = w / (points.length - 1);
  const yFor = (p) => h - ((p - lo) / (hi - lo)) * h;
  const path = scores.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${yFor(p)}`).join(' ');
  const delta = scores[scores.length - 1] - scores[0];
  const sectionColor = (sec) =>
    sec === 'rw' ? 'var(--rw-color)' : sec === 'math' ? 'var(--math-color)' : 'var(--brand-blue)';
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 10, flex: 1}}>
      <div style={{position:'relative', flex: 1, minHeight: h}}>
        {/* y gridlines */}
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents:'none'}}>
          {[hi, mid, lo].map((v) => (
            <div key={v} style={{display:'flex', alignItems:'center', gap: 6}}>
              <span style={{font:'var(--role-caption)', fontFamily:'var(--font-mono)', color:'var(--text-tertiary)', width: 32, textAlign:'right', fontVariantNumeric:'tabular-nums'}}>{v}</span>
              <div style={{flex: 1, height: 1, background:'var(--border-1)'}}/>
            </div>
          ))}
        </div>
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{position:'absolute', inset:0, paddingLeft: 38}}>
          <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill="var(--brand-blue-soft)" />
          <path d={path} stroke="var(--brand-blue)" strokeWidth="2" fill="none" />
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={i * step} cy={yFor(pt.score)} r={3} fill={sectionColor(pt.section)} />
              {(i === 0 || i === points.length - 1) && (
                <text x={i * step + (i === 0 ? 6 : -6)} y={yFor(pt.score) - 8}
                  fontFamily="var(--font-mono)" fontSize="11" fontWeight="600"
                  textAnchor={i === 0 ? 'start' : 'end'} fill="var(--ink-1)">{pt.score}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div style={{display:'grid', gridTemplateColumns:`repeat(${points.length}, 1fr)`, gap: 0, paddingLeft: 38, font:'var(--role-caption)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)'}}>
        {points.map((pt, i) => (
          <span key={i} style={{textAlign:'center'}}>{shortAgo(pt.at)}</span>
        ))}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop: 10, borderTop:'1px solid var(--border-1)', font:'var(--role-caption)', color:'var(--text-secondary)'}}>
        <span>Change <span style={{color: delta >= 0 ? 'var(--success)' : 'var(--error)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>{delta >= 0 ? '+' : ''}{delta}</span></span>
        <span>High <span style={{color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>{dataHi}</span></span>
        <span>Low <span style={{color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>{dataLo}</span></span>
      </div>
    </div>
  );
}

function Heatmap({ sessions }) {
  // Real practice-by-day grid for the last 49 days, counted from session timestamps.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = {};
  (sessions ?? []).forEach((s) => {
    const t = new Date(s.created_at);
    if (Number.isNaN(t.getTime())) return;
    t.setHours(0, 0, 0, 0);
    const key = t.getTime();
    counts[key] = (counts[key] || 0) + 1;
  });
  const days = Array.from({length: 49}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (48 - i));
    return counts[d.getTime()] || 0;
  });
  const color = (v) => v === 0 ? 'var(--sunken)' : v === 1 ? '#CFE0F8' : v === 2 ? '#7FA8F0' : 'var(--brand-blue)';
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4}}>
      {days.map((v, i) => <div key={i} style={{aspectRatio:'1/1', background: color(v), borderRadius: 3}}/>)}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{padding:'48px 0', textAlign:'center', font:'var(--role-body)', color:'var(--text-tertiary)'}}>
      Loading your stats…
    </div>
  );
}

function EmptyState({ title, hint }) {
  const { Card } = SixteenNS;
  return (
    <Card padding="xl" style={{textAlign:'center'}}>
      <div style={{font:'var(--role-title-sm)', color:'var(--text-primary)', marginBottom: 6}}>{title}</div>
      <div style={{font:'var(--role-body)', color:'var(--text-tertiary)'}}>{hint}</div>
    </Card>
  );
}

export default Stats;
