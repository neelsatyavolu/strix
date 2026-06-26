// ModuleReview — between Module 1 and Module 2A/2B. Shows what just happened.

function ModuleReview({ go }) {
  const { Card, Button, Badge, StatCard, AccuracyRing, DomainBar } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const m = d.moduleResult;
  return (
    <div style={{ padding: '40px 48px', maxWidth: 880, margin: '0 auto' }}>
      <span style={{ font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)' }}>
        {m.section}
      </span>
      <h1 style={{margin:'4px 0 8px', font:'var(--role-title-lg)', color:'var(--ink-1)'}}>
        {m.moduleLabel} · {m.correct} of {m.total}.
      </h1>
      <p style={{margin:'0 0 24px', font:'var(--role-body-lg)', color:'var(--text-secondary)'}}>
        Your pace was steady; you usually clear medium questions faster than hard ones — you spent 1m 40s on Q14.
      </p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap: 16}}>
        <Card padding="lg">
          <div style={{display:'flex', alignItems:'center', gap: 18}}>
            <AccuracyRing value={Math.round((m.correct / m.total) * 100)} size={88} color="var(--rw-color)" />
            <div style={{display:'flex', flexDirection:'column', gap: 8}}>
              <StatCard label="Median time" value={m.median} unit="s" size="sm" />
              <StatCard label="Marked for review" value={3} size="sm" />
            </div>
          </div>
          <DomainBar style={{marginTop: 18}} segments={[
            { value: m.correct,   label:'Correct',   color:'var(--correct)'   },
            { value: m.incorrect, label:'Incorrect', color:'var(--incorrect)' },
            { value: m.skipped,   label:'Skipped',   color:'var(--unanswered)'},
          ]}/>
        </Card>

        <Card padding="lg">
          <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Coming up</span>
          <h2 style={{margin:'6px 0 6px', font:'var(--role-title-md)'}}>{m.nextLabel}</h2>
          <p style={{margin:0, font:'var(--role-body-lg)', color:'var(--text-body)'}}>{m.nextDescription}</p>
          <div style={{display:'flex', gap: 8, marginTop: 18}}>
            <Button variant="primary" size="lg" onClick={() => go('rw-question')}>Start {m.nextLabel}</Button>
            <Button variant="secondary" onClick={() => go('dashboard')}>Take a break</Button>
          </div>
          <div style={{marginTop: 16, padding: '10px 12px', background:'var(--brand-blue-soft)', borderRadius:'var(--radius-md)', display:'flex', gap: 10, alignItems:'flex-start'}}>
            <i data-lucide="info" style={{width:14, height:14, color:'var(--brand-blue)', marginTop: 2}}/>
            <span style={{font:'var(--role-caption)', color:'var(--brand-ink)'}}>
              Finish both modules in one sitting for the most accurate score estimate.
            </span>
          </div>
        </Card>
      </div>

      <div style={{marginTop: 22}}>
        <h2 style={{margin:'0 0 10px', font:'var(--role-title-md)'}}>Questions to review</h2>
        <Card padding="none">
          {[
            { n: 6,  cat:'Craft & Structure',   diff:'Hard', state:'incorrect', time:'1m 12s' },
            { n: 14, cat:'Information & Ideas', diff:'Medium', state:'marked', time:'1m 40s' },
            { n: 19, cat:'Expression of Ideas', diff:'Medium', state:'incorrect', time:'58s' },
            { n: 22, cat:'Conventions',         diff:'Hard', state:'marked', time:'52s' },
            { n: 26, cat:'Craft & Structure',   diff:'Hard', state:'skipped', time:'—' },
          ].map((r, i) => (
            <button key={r.n} onClick={() => go('rw-question')} style={{
              display:'grid', gridTemplateColumns:'auto 1fr auto auto auto auto', gap: 12, alignItems:'center',
              padding:'12px 16px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
              background:'transparent', border:0, cursor:'pointer', textAlign:'left', width:'100%',
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--ink-1)', color:'#fff', display:'grid', placeItems:'center', font:'var(--role-label)', fontWeight: 700 }}>{r.n}</span>
              <span style={{font:'var(--role-body)'}}>{r.cat}</span>
              <Badge variant={r.diff === 'Hard' ? 'warning' : 'neutral'} size="sm">{r.diff}</Badge>
              {r.state === 'incorrect' && <Badge variant="error" size="sm">Incorrect</Badge>}
              {r.state === 'marked'    && <Badge variant="warning" size="sm">Marked</Badge>}
              {r.state === 'skipped'   && <Badge variant="neutral" size="sm">Skipped</Badge>}
              <span style={{font:'var(--role-numeric)', color:'var(--text-tertiary)'}}>{r.time}</span>
              <i data-lucide="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}

window.ModuleReview = ModuleReview;
