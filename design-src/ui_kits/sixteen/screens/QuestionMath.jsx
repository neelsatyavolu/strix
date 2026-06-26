// QuestionMath — Bluebook-faithful Math question with Desmos calculator panel.

function QuestionMath({ go, tutorOn, setTutorOn, statsOn, setStatsOn, kind = 'drill', role = 'student' }) {
  const isTutor = role === 'tutor';
  const NS = window.SixteenDesignSystem_375889;
  const {
    TestHeader, DirectionsBar, Timer, IconButton, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = NS;
  const d = window.SixteenData;
  const q = d.mathQuestion;
  const mod = d.mathModule;

  const [seconds, setSeconds] = React.useState(31 * 60 + 5);
  const [hidden, setHidden] = React.useState(false);
  const [ans, setAns] = React.useState(isTutor ? 'D' : null);
  const [marked, setMarked] = React.useState(true);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [formulaOpen, setFormulaOpen] = React.useState(false);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
  const [eliminator, setEliminator] = React.useState(false);
  const [elim, setElim] = React.useState(new Set());

  React.useEffect(() => {
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.getElementById('math-q-area'), {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    }
  }, [calcOpen, formulaOpen]);

  const tog = (l) => { const s = new Set(elim); s.has(l) ? s.delete(l) : s.add(l); setElim(s); };

  const items = Array.from({length: mod.total}, (_, i) => {
    const n = i + 1;
    let status = 'unanswered';
    if (mod.answered.has(n)) status = 'answered';
    if (n === mod.current) status = 'current';
    return { n, status, marked: mod.marked.has(n) };
  });

  return (
    <div style={{ position:'relative', display:'flex', flexDirection:'column', height:'100%', background:'#FFFFFF' }}>
      <TestHeader
        sectionLabel={mod.title}
        timer={<Timer seconds={seconds} hidden={hidden} onToggleHide={() => setHidden(!hidden)} />}
        tools={<>
          <MathToolBtn label="Calculator" icon="square-function" active={calcOpen} onClick={() => setCalcOpen(!calcOpen)} />
          <MathToolBtn label="Reference"  icon="book-marked"     active={formulaOpen} onClick={() => setFormulaOpen(!formulaOpen)} />
          <MathToolBtn label="Tutor"      icon="message-circle"  active={tutorOn} onClick={() => setTutorOn(!tutorOn)} />
          <MathToolBtn label="More"       icon="more-vertical" />
        </>}
      />

      <DirectionsBar onDirections={() => setDirectionsOpen(d => !d)} />

      <div id="math-q-area" style={{ flex: 1, overflow:'auto', position:'relative' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
          <QuestionNumberBadge
            n={q.n}
            flag={<>
              <button onClick={() => setEliminator(e => !e)} title="Cross out answers" style={{
                display:'inline-flex', alignItems:'center', gap: 4,
                padding: '3px 8px',
                background: eliminator ? '#1D1D1F' : 'transparent',
                color: eliminator ? '#fff' : '#1D1D1F',
                border: '1px solid #1D1D1F', borderRadius: 3,
                cursor: 'pointer',
                font: 'var(--role-label)', fontSize: 12, fontWeight: 700,
                textDecoration: 'line-through',
                textDecorationThickness: '1.5px',
                marginRight: 8,
              }}>ABC</button>
              <FlagButton marked={marked} onClick={() => setMarked(!marked)} />
            </>}
          />
          <p style={{
            fontFamily:'var(--font-sans)',
            fontSize: 16, lineHeight: 1.55, color:'#1D1D1F', margin:'0 0 22px', fontWeight: 400,
          }}>{q.prompt}</p>
          <div style={{display:'flex', flexDirection:'column', gap: 10}}>
            {q.options.map(o => (
              <OptionRow
                key={o.letter}
                letter={o.letter}
                selected={ans === o.letter}
                eliminated={elim.has(o.letter)}
                showEliminator={!isTutor && eliminator}
                onSelect={isTutor ? undefined : () => setAns(o.letter)}
                onToggleEliminate={() => tog(o.letter)}
                style={isTutor ? { cursor:'default', pointerEvents: o.letter === ans ? 'auto' : 'none' } : undefined}
              ><span>{o.text}</span></OptionRow>
            ))}
          </div>
        </div>

        {kind === 'drill' && statsOn && (
          <SessionStats answered={7} total={mod.total} accuracy={81} median={62} hidden={false} onToggle={() => setStatsOn(false)}/>
        )}
        {kind === 'drill' && !statsOn && (
          <SessionStats hidden={true} onToggle={() => setStatsOn(true)} />
        )}
      </div>

      {calcOpen && <DesmosPanel onClose={() => setCalcOpen(false)} />}
      {formulaOpen && <FormulaSheet onClose={() => setFormulaOpen(false)} />}

      {paletteOpen && (
        <div style={{ position:'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform:'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette items={items} onSelect={() => setPaletteOpen(false)} onReviewAll={() => setPaletteOpen(false)} />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{position:'absolute', inset: 0, background:'rgba(0,0,0,0.10)', zIndex: 10}} />}

      <TestFooter
        studentName={d.student.name}
        current={mod.current} total={mod.total}
        onPalette={() => setPaletteOpen(o => !o)}
        paletteOpen={paletteOpen}
        onBack={() => {}}
        onNext={() => go('score-report')}
        nextLabel="Next"
      />
    </div>
  );
}

function MathToolBtn({ label, icon, active = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
        padding: '4px 8px',
        background: active ? 'rgba(255,255,255,0.18)' : (hover ? 'rgba(255,255,255,0.10)' : 'transparent'),
        color: '#fff', border: 0, cursor: 'pointer',
        borderRadius: 4,
        font: 'var(--role-caption)', fontWeight: 500, fontSize: 11,
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      <i data-lucide={icon} style={{width:18, height:18, color: '#fff'}}/>
      <span>{label}</span>
    </button>
  );
}

function DesmosPanel({ onClose }) {
  return (
    <div style={{
      position:'absolute', left: 18, top: 78, width: 460, height: 360,
      background: '#FFFFFF', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      zIndex: 25, display:'flex', flexDirection:'column', overflow:'hidden',
      border: '1px solid var(--border-2)',
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '6px 10px', background:'#2E7D32', color:'#fff',
      }}>
        <span style={{font:'var(--role-label)', fontWeight: 600}}>Desmos Graphing Calculator</span>
        <button onClick={onClose} style={{width:18, height:18, borderRadius:'50%', border:0, background:'rgba(255,255,255,0.18)', color:'#fff', cursor:'pointer', display:'grid', placeItems:'center', fontSize: 12}}>×</button>
      </div>
      <div style={{flex:1, display:'grid', gridTemplateColumns:'180px 1fr'}}>
        <div style={{background:'#F8F8F8', borderRight:'1px solid #E0E0E0', padding: 8, display:'flex', flexDirection:'column', gap: 4}}>
          {[['1','3x + 4y = 24'], ['2','x - y = 2'], ['3','']].map(([n, expr]) => (
            <div key={n} style={{display:'flex', alignItems:'center', gap: 6, padding: '6px 8px', background: expr ? '#FFFFFF' : 'transparent', borderRadius: 4, border: expr ? '1px solid #E0E0E0' : 'none'}}>
              <span style={{width: 16, height: 16, borderRadius: '50%', background: n === '1' ? '#C74440' : n === '2' ? '#2D70B3' : 'transparent', flexShrink: 0}}/>
              <span style={{fontFamily:'var(--font-mono)', fontSize: 13, color:'#1F1F1F'}}>{expr || <span style={{color:'#9E9E9E'}}>+ Add expression</span>}</span>
            </div>
          ))}
        </div>
        <div style={{position:'relative', background:'#FAFAFA'}}>
          <svg width="100%" height="100%" viewBox="0 0 280 320" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#E0E0E0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="280" height="320" fill="url(#grid)"/>
            <line x1="140" y1="0" x2="140" y2="320" stroke="#9E9E9E" strokeWidth="1"/>
            <line x1="0" y1="160" x2="280" y2="160" stroke="#9E9E9E" strokeWidth="1"/>
            <line x1="0" y1="118" x2="280" y2="202" stroke="#C74440" strokeWidth="2"/>
            <line x1="0" y1="216" x2="280" y2="104" stroke="#2D70B3" strokeWidth="2"/>
            <circle cx="180" cy="155" r="4" fill="#1FA56A"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function FormulaSheet({ onClose }) {
  return (
    <div style={{
      position:'absolute', right: 18, top: 78, width: 380, maxHeight: 420,
      background:'#FFFFFF', borderRadius: 8, boxShadow:'var(--shadow-lg)',
      border:'1px solid var(--border-2)', overflow:'auto', zIndex: 25,
    }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-1)'}}>
        <span style={{font:'var(--role-title-sm)'}}>Reference Sheet</span>
        <button onClick={onClose} style={{border:0, background:'transparent', cursor:'pointer', color:'var(--text-secondary)'}}>×</button>
      </div>
      <div style={{padding: 14, display:'flex', flexDirection:'column', gap: 14, font:'var(--role-body)'}}>
        {[
          ['Area of a circle', 'A = πr²'],
          ['Circumference', 'C = 2πr'],
          ['Pythagorean theorem', 'a² + b² = c²'],
          ['Slope-intercept form', 'y = mx + b'],
          ['Quadratic formula', 'x = (−b ± √(b² − 4ac)) / 2a'],
          ['Distance', 'd = √((x₂−x₁)² + (y₂−y₁)²)'],
        ].map(([k, v]) => (
          <div key={k} style={{display:'flex', justifyContent:'space-between', gap: 12}}>
            <span style={{color:'var(--text-secondary)'}}>{k}</span>
            <span style={{fontFamily:'var(--font-mono)', color:'#1D1D1F'}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.QuestionMath = QuestionMath;
