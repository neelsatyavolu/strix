// ScoreReport — the final Score Report after Module 1 + Module 2.

function ScoreReport({ go }) {
  const { Card, Button, Badge, ScoreBadge, AccuracyRing, DomainBar } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const r = d.scoreReport;

  const cat = (b) => (
    <div key={b.id} style={{display:'grid', gridTemplateColumns:'1fr 80px 60px', gap: 8, padding: '8px 0', alignItems:'center'}}>
      <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{b.label}</span>
      <div style={{
        height: 6, background:'var(--sunken)', borderRadius: 4, overflow:'hidden',
      }}>
        <div style={{ width: `${(b.correct / b.total) * 100}%`, height:'100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }}/>
      </div>
      <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>{b.correct} / {b.total}</span>
    </div>
  );

  return (
    <div style={{ padding: '36px 48px', maxWidth: 980, margin: '0 auto' }}>
      <span style={{ font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)' }}>
        Practice Score Report · Today
      </span>
      <h1 style={{margin:'4px 0 0', font:'var(--role-title-lg)', color:'var(--ink-1)'}}>You finished both modules.</h1>
      <p style={{margin:'4px 0 24px', font:'var(--role-body-lg)', color:'var(--text-secondary)'}}>
        Scored on the official curve. Up {r.delta} from your last full section.
      </p>

      <Card padding="xl" style={{marginBottom: 18}}>
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap: 28, alignItems:'center'}}>
          <ScoreBadge value={r.total} max={1600} label="Estimated total" size="xl" trend={`+${r.delta}`} />
          <ScoreBadge value={r.rw}    max={800}  label="Reading & Writing" domain="rw"   size="lg" />
          <ScoreBadge value={r.math}  max={800}  label="Math"              domain="math" size="lg" />
        </div>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 18}}>
        <Card padding="lg">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6}}>
            <h2 style={{margin:0, font:'var(--role-title-md)'}}>Reading &amp; Writing</h2>
            <Badge variant="rw" dot>740 / 800</Badge>
          </div>
          <div style={{marginBottom: 8}}>
            {r.rwBreakdown.map(cat)}
          </div>
        </Card>
        <Card padding="lg">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6}}>
            <h2 style={{margin:0, font:'var(--role-title-md)'}}>Math</h2>
            <Badge variant="math" dot>740 / 800</Badge>
          </div>
          <div style={{marginBottom: 8}}>
            {r.mathBreakdown.map(cat)}
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h2 style={{margin:0, font:'var(--role-title-md)'}}>Where to focus next</h2>
            <p style={{margin:'2px 0 0', font:'var(--role-body)', color:'var(--text-secondary)'}}>
              <strong style={{color:'var(--rw-color)'}}>Expression of Ideas</strong> and <strong style={{color:'var(--math-color)'}}>Geometry &amp; Trig</strong> dragged your section scores. 30 targeted questions should move both.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => go('practice-setup')}>Set up a targeted drill</Button>
        </div>
      </Card>

      <div style={{marginTop: 18, display:'flex', gap: 8, justifyContent:'flex-end'}}>
        <Button variant="ghost" onClick={() => go('dashboard')}>Back to home</Button>
        <Button variant="secondary" onClick={() => go('stats')}>View all stats →</Button>
      </div>
    </div>
  );
}

window.ScoreReport = ScoreReport;
