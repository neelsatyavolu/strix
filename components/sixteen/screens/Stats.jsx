'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useStats, useSessions } from '@/lib/data/hooks';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { useInsight } from '@/lib/ai/insights';
import { SECTION_LABEL, shortAgo, EmptyState } from '@/components/sixteen/stats/shared';

// Stats — overall + per-domain breakdown, driven by real practice data.

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
        { value:'rw',       label:'Reading & Writing', count: rwDone },
        { value:'math',     label:'Math', count: mathDone },
      ]}/>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {tab === 'overall' && <OverallTab stats={stats} sessions={sessions} />}
          {tab !== 'overall' && (
            <DomainBreakdown domain={tab} stats={stats} go={go} studentId={studentId} />
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
  const overallTot = stats.sectionTotals?.overall ?? { done: 0, correct: 0 };
  const totalDone = rwTot.done + mathTot.done;
  const totalCorrect = rwTot.correct + mathTot.correct;
  // Headline accuracy follows the rest of the app: recency-weighted, falling
  // back to all-time only when there's no recent signal.
  const accOf = (t) => (t.recentAccuracy != null ? t.recentAccuracy : t.accuracy ?? 0);
  const overallAcc = accOf(overallTot);
  const rwAcc = accOf(rwTot);
  const mathAcc = accOf(mathTot);

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
        <Card padding="md"><StatCard label="Section estimates" value={overTime.length} /></Card>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16}}>
        <Card padding="lg" style={{display:'flex', flexDirection:'column'}}>
          <h2 style={{margin:'0 0 12px', font:'var(--role-title-sm)'}}>Estimate over time</h2>
          {overTime.length < 2 ? (
            <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:160, font:'var(--role-body)', color:'var(--text-tertiary)', textAlign:'center'}}>
              Not enough section estimates yet
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
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Recent</span>
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

function SectionInsights({ sectionLabel, cats, accent, studentId = null }) {
  const baseline = React.useMemo(() => sectionBaseline(sectionLabel, cats), [sectionLabel, cats]);
  const payload = React.useMemo(() => ({
    section: sectionLabel,
    note: 'recentAccuracy weights recent attempts more heavily — prioritize it over all-time accuracy when recommending focus areas.',
    topics: (cats ?? []).filter((c) => c.done > 0).map((c) => ({ topic: c.label, answered: c.done, accuracy: c.accuracy, recentAccuracy: c.recentAccuracy })),
  }), [sectionLabel, cats]);
  const ready = (cats ?? []).some((c) => c.done > 0);
  const ins = useInsight({ scope: `section:${sectionLabel}${studentId ? `:${studentId}` : ''}`, payload, baseline, ready });
  if (!ready) return null;
  return <InsightCard title="Insights" accent={accent} {...ins} />;
}

function DomainBreakdown({ domain, stats, go, studentId = null }) {
  const { Card, AccuracyRing, Badge } = SixteenNS;
  const cats = (domain === 'rw' ? stats?.categories?.rw : stats?.categories?.math) ?? [];
  const color = domain === 'rw' ? 'var(--rw-color)' : 'var(--math-color)';
  return (
    <>
      <SectionInsights sectionLabel={SECTION_LABEL[domain] ?? domain} cats={cats} accent={color} studentId={studentId} />
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
              // Match the rest of the app: show recency-weighted accuracy, not
              // all-time. Fall back to plain accuracy only when there's no
              // recent signal (no answered questions → recentAccuracy null).
              const pct = c.recentAccuracy != null ? c.recentAccuracy : c.accuracy;
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
                  <AccuracyRing value={pct} size={44} stroke={5} color={color} />
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{c.label}</span>
                    <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
                      {c.done} answered{clickable ? ' · view detail' : ''}
                    </span>
                  </div>
                  <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)'}}>{pct}%</span>
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
  // SVG line of section estimates over time, built from completed full sections.
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
        {/* Area + line live in a non-uniformly stretched SVG; dots and labels are
            HTML overlays so they aren't distorted by preserveAspectRatio="none". */}
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{position:'absolute', inset:0, paddingLeft: 38}}>
          <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill="var(--brand-blue-soft)" />
          <path d={path} stroke="var(--brand-blue)" strokeWidth="2" fill="none" />
        </svg>
        <div style={{position:'absolute', top:0, bottom:0, left:38, right:0, pointerEvents:'none'}}>
          {points.map((pt, i) => {
            const xPct = (i / (points.length - 1)) * 100;
            const yPct = (yFor(pt.score) / h) * 100;
            const isFirst = i === 0, isLast = i === points.length - 1;
            return (
              <React.Fragment key={i}>
                <div style={{position:'absolute', left:`${xPct}%`, top:`${yPct}%`, width:6, height:6, borderRadius:'50%', background: sectionColor(pt.section), transform:'translate(-50%, -50%)'}}/>
                {(isFirst || isLast) && (
                  <span style={{
                    position:'absolute', left:`${xPct}%`, top:`calc(${yPct}% - 10px)`,
                    transform:`translate(${isFirst ? '0' : '-100%'}, -100%)`,
                    font:'var(--role-caption)', fontFamily:'var(--font-mono)', fontWeight:600,
                    color:'var(--text-primary)', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
                  }}>{pt.score}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
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

export default Stats;
