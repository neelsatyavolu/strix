// Stats — overall + per-domain breakdown.

function Stats({ go }) {
  const { Card, Tabs, ScoreBadge, AccuracyRing, StatCard, DomainBar, Badge } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const [tab, setTab] = React.useState('overall');

  return (
    <div style={{padding: '28px 36px'}}>
      <h1 style={{margin:'0 0 14px', font:'var(--role-title-lg)'}}>Stats</h1>
      <Tabs value={tab} onChange={setTab} style={{marginBottom: 18}} tabs={[
        { value:'overall',  label:'Overall' },
        { value:'sessions', label:'Sessions', count: d.recentSessions.length },
        { value:'rw',       label:'Reading & Writing', count: 312 },
        { value:'math',     label:'Math', count: 248 },
      ]}/>

      {tab === 'overall' && (
        <>
          <Card padding="xl" style={{marginBottom: 16}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 28, alignItems:'center'}}>
              <ScoreBadge value={1480} label="Estimated total" trend="+40" size="lg" />
              <ScoreBadge value={740} max={800} domain="rw" label="R&W" size="md" />
              <ScoreBadge value={740} max={800} domain="math" label="Math" size="md" />
            </div>
          </Card>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
            <Card padding="md"><StatCard label="Total questions" value={560} /></Card>
            <Card padding="md"><StatCard label="Accuracy" value={78} unit="%" trend="+4" /></Card>
            <Card padding="md"><StatCard label="Median time" value={56} unit="s" sublabel="per question" /></Card>
            <Card padding="md"><StatCard label="Streak" value={3} unit="d" sublabel="Practice daily" /></Card>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16}}>
            <Card padding="lg" style={{display:'flex', flexDirection:'column'}}>
              <h2 style={{margin:'0 0 12px', font:'var(--role-title-sm)'}}>Score over time</h2>
              <ScoreLine />
            </Card>
            <Card padding="lg">
              <h2 style={{margin:'0 0 12px', font:'var(--role-title-sm)'}}>Practice by day</h2>
              <Heatmap />
            </Card>
          </div>

          <Card padding="lg">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14}}>
              <h2 style={{margin:0, font:'var(--role-title-sm)'}}>Accuracy by domain</h2>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Last 30 days</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 28}}>
              <AccuracyRing value={76} color="var(--rw-color)" label="Reading & Writing" />
              <AccuracyRing value={81} color="var(--math-color)" label="Math" />
              <div style={{flex:1}}>
                <DomainBar segments={[
                  { value: 437, label:'Correct',   color:'var(--correct)' },
                  { value: 105, label:'Incorrect', color:'var(--incorrect)' },
                  { value: 18,  label:'Skipped',   color:'var(--unanswered)' },
                ]}/>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'sessions' && (
        <SessionsTab go={go} />
      )}

      {tab !== 'overall' && tab !== 'sessions' && (
        <DomainBreakdown domain={tab} />
      )}
    </div>
  );
}

function SessionsTab({ go }) {
  const { Card, Badge, Button, SegmentedControl } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const [filter, setFilter] = React.useState('all');
  const all = d.recentSessions;
  const sessions = filter === 'all'
    ? all
    : filter === 'modules'
      ? all.filter(s => s.kind === 'module')
      : filter === 'sections'
        ? all.filter(s => s.kind === 'section')
        : all.filter(s => s.domain === filter);

  const kindLabel = {
    drill:   'Drill',
    module:  'Mock module',
    section: 'Full section',
  };
  const kindVariant = {
    drill:   'neutral',
    module:  'brand',
    section: 'success',
  };

  // Quick aggregate
  const totalQs = all.reduce((a, s) => a + s.count, 0);
  const totalMin = all.reduce((a, s) => a + s.durationMin, 0);
  const avgAcc = Math.round(all.reduce((a, s) => a + s.accuracy * s.count, 0) / totalQs);

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
        <Card padding="md"><StatCardLite label="Sessions" value={all.length} sublabel="Last 14 days" /></Card>
        <Card padding="md"><StatCardLite label="Questions" value={totalQs} /></Card>
        <Card padding="md"><StatCardLite label="Time on task" value={`${Math.floor(totalMin/60)}h ${totalMin%60}m`} /></Card>
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
          <span style={{textAlign:'right'}}>Time</span>
          <span style={{textAlign:'right'}}>Accuracy</span>
          <span/>
        </div>
        {sessions.map((s, i) => (
          <button key={s.id} onClick={() => go('score-report')} style={{
            display:'grid', gridTemplateColumns:'120px minmax(220px, 1fr) 110px 60px 70px 80px 24px',
            gap: 12, alignItems:'center', padding:'12px 16px',
            background:'transparent', border:0, borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
            cursor:'pointer', textAlign:'left', width:'100%',
          }}>
            <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.when}</span>
            <span style={{display:'flex', alignItems:'center', gap: 8, font:'var(--role-body)', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
              <Badge variant={s.domain} dot size="sm">{s.domain === 'rw' ? 'R&W' : 'Math'}</Badge>
              <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{s.label}</span>
            </span>
            <Badge variant={kindVariant[s.kind]} size="sm">{kindLabel[s.kind]}</Badge>
            <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{s.count}</span>
            <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{s.durationMin}m</span>
            <span style={{font:'var(--role-numeric)', textAlign:'right', color: s.accuracy >= 75 ? 'var(--success)' : s.accuracy >= 65 ? 'var(--warning)' : 'var(--error)'}}>{s.accuracy}%</span>
            <i data-lucide="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
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

function DomainBreakdown({ domain }) {
  const { Card, AccuracyRing, Badge } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const cats = domain === 'rw' ? d.rwCategories : d.mathCategories;
  const color = domain === 'rw' ? 'var(--rw-color)' : 'var(--math-color)';
  return (
    <Card padding="lg">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16}}>
        <h2 style={{margin:0, font:'var(--role-title-md)'}}>By category</h2>
        <Badge variant={domain} dot>{domain === 'rw' ? 'Reading & Writing' : 'Math'}</Badge>
      </div>
      <div style={{display:'flex', flexDirection:'column'}}>
        {cats.map((c, i) => (
          <div key={c.id} style={{
            display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 14, alignItems:'center',
            padding:'14px 0', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
          }}>
            <AccuracyRing value={c.accuracy} size={44} stroke={5} color={color} />
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{c.label}</span>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
                {c.done} answered · median 56s
              </span>
            </div>
            <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)'}}>{c.accuracy}%</span>
            <i data-lucide="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScoreLine() {
  // Simple SVG sparkline of total score over weeks
  const points = [1280, 1310, 1340, 1330, 1380, 1410, 1440, 1480];
  const weeks = ['8w', '7w', '6w', '5w', '4w', '3w', '2w', 'now'];
  const max = 1600, min = 1200, w = 360, h = 160;
  const step = w / (points.length - 1);
  const yFor = (p) => h - ((p - min) / (max - min)) * h;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${yFor(p)}`).join(' ');
  const delta = points[points.length - 1] - points[0];
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 10, flex: 1}}>
      <div style={{position:'relative', flex: 1, minHeight: h}}>
        {/* y gridlines */}
        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents:'none'}}>
          {[1600, 1400, 1200].map(v => (
            <div key={v} style={{display:'flex', alignItems:'center', gap: 6}}>
              <span style={{font:'var(--role-caption)', fontFamily:'var(--font-mono)', color:'var(--text-tertiary)', width: 32, textAlign:'right', fontVariantNumeric:'tabular-nums'}}>{v}</span>
              <div style={{flex: 1, height: 1, background:'var(--border-1)'}}/>
            </div>
          ))}
        </div>
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{position:'absolute', inset:0, paddingLeft: 38}}>
          <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill="var(--brand-blue-soft)" />
          <path d={path} stroke="var(--brand-blue)" strokeWidth="2" fill="none" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={i * step} cy={yFor(p)} r={3} fill="var(--brand-blue)" />
              {(i === 0 || i === points.length - 1) && (
                <text x={i * step + (i === 0 ? 6 : -6)} y={yFor(p) - 8}
                  fontFamily="var(--font-mono)" fontSize="11" fontWeight="600"
                  textAnchor={i === 0 ? 'start' : 'end'} fill="var(--ink-1)">{p}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div style={{display:'grid', gridTemplateColumns:`repeat(${points.length}, 1fr)`, gap: 0, paddingLeft: 38, font:'var(--role-caption)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)'}}>
        {weeks.map((w, i) => (
          <span key={i} style={{textAlign:'center'}}>{w}</span>
        ))}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop: 10, borderTop:'1px solid var(--border-1)', font:'var(--role-caption)', color:'var(--text-secondary)'}}>
        <span>8-week change <span style={{color:'var(--success)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>+{delta}</span></span>
        <span>High <span style={{color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>{hi}</span></span>
        <span>Low <span style={{color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontWeight:600, marginLeft: 4}}>{lo}</span></span>
      </div>
    </div>
  );
}

function Heatmap() {
  const days = Array.from({length: 49}, (_, i) => Math.random() < 0.6 ? Math.floor(Math.random() * 4) : 0);
  const color = (v) => v === 0 ? 'var(--sunken)' : v === 1 ? '#CFE0F8' : v === 2 ? '#7FA8F0' : 'var(--brand-blue)';
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4}}>
      {days.map((v, i) => <div key={i} style={{aspectRatio:'1/1', background: color(v), borderRadius: 3}}/>)}
    </div>
  );
}

window.Stats = Stats;
