// PracticeSetup — pick section, mock module vs targeted drill, category, difficulty.

function PracticeSetup({ go, initial = {} }) {
  const { Card, Button, Badge, SegmentedControl, Tabs } = window.SixteenDesignSystem_375889;
  const d = window.SixteenData;
  const [domain, setDomain] = React.useState(initial.domain || 'rw');
  const [mode, setMode] = React.useState('drill'); // 'drill' | 'mock-m1' | 'mock-full'
  const [cat, setCat] = React.useState('info');
  const [diff, setDiff] = React.useState('all');
  const [count, setCount] = React.useState(10);
  const [timed, setTimed] = React.useState('untimed'); // 'untimed' | 'per-q' | 'total'

  const cats = domain === 'rw' ? d.rwCategories : d.mathCategories;
  if (!cats.find(c => c.id === cat)) setCat(cats[0].id);

  const startLabel =
    mode === 'drill'      ? `Start drill · ${count} questions` :
    mode === 'mock-m1'    ? 'Start Module 1' :
                            'Start Module 1 → Module 2';

  return (
    <div style={{ padding: '28px 36px', maxWidth: 880, margin: '0 auto' }}>
      <button onClick={() => go('dashboard')} style={{font:'var(--role-label)', color:'var(--text-secondary)', background:'transparent', border:0, cursor:'pointer', marginBottom: 6, padding: 0}}>← Home</button>
      <h1 style={{ margin: '0 0 4px', font:'var(--role-title-lg)' }}>Practice Setup</h1>
      <p style={{ margin: '0 0 22px', font:'var(--role-body-lg)', color:'var(--text-secondary)' }}>
        Pick a section, then choose a quick drill or a full simulated module.
      </p>

      <div style={{display:'flex', flexDirection:'column', gap: 18}}>
        <Card padding="lg">
          <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 10}}>
            Section
          </label>
          <SegmentedControl
            value={domain}
            onChange={setDomain}
            fullWidth
            options={[
              { value:'rw',   label:'Reading & Writing' },
              { value:'math', label:'Math' },
            ]}
          />
        </Card>

        <Card padding="lg">
          <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 10}}>
            Mode
          </label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 10}}>
            <ModeTile
              selected={mode === 'drill'}
              onClick={() => setMode('drill')}
              title="Targeted drill"
              sub="Pick a category. Optional difficulty filter."
              icon="target"
            />
            <ModeTile
              selected={mode === 'mock-m1'}
              onClick={() => setMode('mock-m1')}
              title="Mock Module 1"
              sub={domain === 'rw' ? '27 questions · 32 min' : '22 questions · 35 min'}
              icon="square"
            />
            <ModeTile
              selected={mode === 'mock-full'}
              onClick={() => setMode('mock-full')}
              title="Full section"
              sub="Module 1 + adaptive Module 2 · scored on the curve"
              icon="layers"
              badge={<Badge variant="brand" size="sm">SCORED</Badge>}
            />
          </div>
        </Card>

        {mode === 'drill' && (
          <Card padding="lg">
            <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 10}}>
              Category
            </label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8}}>
              {cats.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10,
                  padding: '10px 12px', textAlign:'left',
                  background: cat === c.id ? 'var(--brand-blue-soft)' : 'var(--paper)',
                  border: `1px solid ${cat === c.id ? 'var(--brand-blue)' : 'var(--border-2)'}`,
                  borderRadius: 'var(--radius-md)', cursor:'pointer',
                  transition: 'var(--xn-color)',
                  font:'var(--role-body)', color:'var(--text-primary)',
                }}>
                  <span>{c.label}</span>
                  <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)'}}>{c.done} done · {c.accuracy}%</span>
                </button>
              ))}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16, marginTop: 18}}>
              <div>
                <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 6}}>Difficulty</label>
                <SegmentedControl
                  value={diff} onChange={setDiff} fullWidth
                  options={[{value:'all', label:'All'},{value:'easy', label:'Easy'},{value:'med', label:'Medium'},{value:'hard', label:'Hard'}]}
                />
              </div>
              <div>
                <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 6}}>How many</label>
                <SegmentedControl
                  value={String(count)} onChange={v => setCount(Number(v))} fullWidth
                  options={[{value:'5', label:'5'},{value:'10', label:'10'},{value:'15', label:'15'},{value:'20', label:'20'}]}
                />
              </div>
            </div>

            <div style={{marginTop: 18}}>
              <label style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 6}}>Timing</label>
              <SegmentedControl
                value={timed} onChange={setTimed} fullWidth
                options={[
                  {value:'untimed', label:'Untimed'},
                  {value:'per-q',   label:'~1m / question'},
                  {value:'total',   label:`Total · ${Math.ceil(count * 1.1)}m`},
                ]}
              />
              <span style={{display:'block', font:'var(--role-caption)', color:'var(--text-tertiary)', marginTop: 6}}>
                {timed === 'untimed'
                  ? 'No countdown. Use this to learn a new category at your own pace.'
                  : timed === 'per-q'
                    ? `A clock counts down ~${domain === 'math' ? 95 : 71} seconds per question, matching SAT pace.`
                    : `A single clock counts down ${Math.ceil(count * 1.1)} minutes for the whole drill.`}
              </span>
            </div>
          </Card>
        )}

        {mode !== 'drill' && (
          <Card padding="lg">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16}}>
              <div style={{flex: 1}}>
                <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Timing</span>
                <p style={{margin:'4px 0 0', font:'var(--role-body)', color:'var(--text-body)'}}>
                  {mode === 'mock-m1'
                    ? (domain === 'rw'
                      ? 'Module 1 is timed at 32 minutes for 27 questions — the real SAT pace. The clock starts when you tap Start.'
                      : 'Module 1 is timed at 35 minutes for 22 questions — the real SAT pace. The clock starts when you tap Start.')
                    : (domain === 'rw'
                      ? '64 minutes total (32 + 32) across both modules. The break between modules is yours — the clock pauses.'
                      : '70 minutes total (35 + 35) across both modules. The break between modules is yours — the clock pauses.')}
                </p>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
                fontWeight: 600, fontSize: 32, color: 'var(--ink-1)',
                background: 'var(--sunken)', padding: '8px 14px', borderRadius: 'var(--radius-md)',
              }}>
                {mode === 'mock-m1'
                  ? (domain === 'rw' ? '32:00' : '35:00')
                  : (domain === 'rw' ? '64:00' : '70:00')}
              </div>
            </div>
          </Card>
        )}

        <div style={{display:'flex', justifyContent:'flex-end', gap: 10, marginTop: 4}}>
          <Button variant="ghost" onClick={() => go('dashboard')}>Cancel</Button>
          <Button variant="primary" size="lg" onClick={() => go(domain === 'math' ? 'math-question' : 'rw-question', { kind: mode === 'drill' ? 'drill' : 'module' })}>
            {startLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModeTile({ selected, onClick, title, sub, icon, badge }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', gap: 4, padding: 14, textAlign:'left',
      background: selected ? 'var(--brand-blue-soft)' : 'var(--paper)',
      border: `1px solid ${selected ? 'var(--brand-blue)' : 'var(--border-2)'}`,
      borderRadius: 'var(--radius-md)', cursor:'pointer', transition: 'var(--xn-color)',
    }}>
      <div style={{display:'flex', alignItems:'center', gap:8, justifyContent:'space-between'}}>
        <i data-lucide={icon} style={{width:16, height:16, color: selected ? 'var(--brand-blue)' : 'var(--text-secondary)'}} />
        {badge}
      </div>
      <span style={{font:'var(--role-title-sm)', color:'var(--text-primary)', marginTop: 6}}>{title}</span>
      <span style={{font:'var(--role-caption)', color:'var(--text-secondary)', lineHeight: 1.4}}>{sub}</span>
    </button>
  );
}

window.PracticeSetup = PracticeSetup;
