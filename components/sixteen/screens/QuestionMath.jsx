'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import renderMathInElement from 'katex/contrib/auto-render';
import SessionStats from '@/components/sixteen/panels/SessionStats';
import Highlightable from '@/components/sixteen/test/Highlightable';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { TestLoading, TestMessage } from '@/components/sixteen/screens/TestStates';

// QuestionMath — Bluebook-faithful Math question (real CB items), with Desmos
// calculator + reference sheet. Renders MathML natively and KaTeX for \(...\).

function QuestionMath({ go, tutorOn, setTutorOn, statsOn, setStatsOn, kind = 'drill' }) {
  const NS = SixteenNS;
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = NS;
  const session = usePracticeSession();
  const q = session.current;
  const isDrill = session.mode === 'drill';

  const [seconds, setSeconds] = React.useState(35 * 60);
  const [hidden, setHidden] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [formulaOpen, setFormulaOpen] = React.useState(false);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
  const [eliminator, setEliminator] = React.useState(false);
  const [elim, setElim] = React.useState({});
  const [annotate, setAnnotate] = React.useState(false);
  const [marks, setMarks] = React.useState({}); // questionId -> { stem } highlighted HTML
  const expiredRef = React.useRef(false);

  React.useEffect(() => {
    if (session.config?.timing === 'untimed') return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [session.config]);

  // Bluebook auto-advances when a module's time runs out (you can't return to it).
  React.useEffect(() => {
    if (session.config?.timing === 'untimed') return;
    if (seconds === 0 && !expiredRef.current) {
      expiredRef.current = true;
      session.finishModule(go);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  React.useEffect(() => {
    const el = document.getElementById('math-q-area');
    if (el) {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch { /* MathML renders natively; ignore KaTeX failures */ }
    }
  }, [q?.id, calcOpen, formulaOpen, marks]);

  if (session.status === 'loading') return <TestLoading label="Loading Math questions…" />;
  if (session.status === 'error') return <TestMessage title="Couldn't load questions" body={session.error} onHome={() => go('practice-setup', { domain: 'math' })} />;
  if (!q) return <TestMessage title="No active session" body="Start a practice session to begin." onHome={() => go('practice-setup', { domain: 'math' })} />;

  const total = session.questions.length;
  const resp = session.responses[q.id] || {};
  const ans = resp.value || null;
  const marked = !!resp.flagged;
  // General practice: MCQs retry-until-correct; SPR (grid-in) stays single-attempt.
  const solved = !!resp.solved;
  const triedWrong = new Set(resp.tried || []);
  const blocked = isDrill && q.type !== 'spr' && !solved;
  const elimSet = elim[q.id] || new Set();
  const tog = (l) =>
    setElim((prev) => {
      const s = new Set(prev[q.id] || []);
      s.has(l) ? s.delete(l) : s.add(l);
      return { ...prev, [q.id]: s };
    });

  const items = session.questions.map((qq, i) => {
    let status = 'unanswered';
    if (session.responses[qq.id]?.value) status = 'answered';
    if (i === session.index) status = 'current';
    return {
      n: i + 1,
      status,
      marked: !!session.responses[qq.id]?.flagged,
      onClick: () => { session.goTo(i); setPaletteOpen(false); },
    };
  });

  const onNext = () => {
    if (blocked) return;
    if (session.index >= total - 1) session.finishModule(go);
    else session.next();
  };

  const answered = session.answeredCount;
  const liveCorrect = (session.result?.review || []).filter((r) => r.response?.value && r.isCorrect).length;
  const liveAcc = answered ? Math.round((liveCorrect / answered) * 100) : 0;
  const median = answered ? Math.round((session.result?.elapsedMs || 0) / 1000 / answered) : 0;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFFFF' }}>
      <TestHeader
        sectionLabel={session.activeModule?.label === 'Drill' ? 'Math — Drill' : `Math, ${session.activeModule?.label || 'Module 1'}`}
        timer={<Timer seconds={seconds} hidden={hidden} onToggleHide={() => setHidden(!hidden)} />}
        tools={<>
          <MathToolBtn label="Calculator" icon="square-function" active={calcOpen} onClick={() => setCalcOpen(!calcOpen)} />
          <MathToolBtn label="Reference" icon="book-marked" active={formulaOpen} onClick={() => setFormulaOpen(!formulaOpen)} />
          <MathToolBtn label="Annotate" icon="pencil-line" active={annotate} onClick={() => setAnnotate((a) => !a)} />
          <MathToolBtn label="Tutor" icon="message-circle" active={tutorOn} onClick={() => setTutorOn(!tutorOn)} />
          <MathToolBtn label="More" icon="more-vertical" />
        </>}
      />

      <DirectionsBar onDirections={() => setDirectionsOpen((v) => !v)} />

      <div id="math-q-area" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
          <QuestionNumberBadge
            n={session.index + 1}
            flag={<>
              {q.type === 'mcq' && !isDrill && (
                <button onClick={() => setEliminator((e) => !e)} title="Cross out answers" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                  background: eliminator ? '#1D1D1F' : 'transparent', color: eliminator ? '#fff' : '#1D1D1F',
                  border: '1px solid #1D1D1F', borderRadius: 3, cursor: 'pointer',
                  font: 'var(--role-label)', fontSize: 12, fontWeight: 700,
                  textDecoration: 'line-through', textDecorationThickness: '1.5px', marginRight: 8,
                }}>ABC</button>
              )}
              <FlagButton marked={marked} onClick={() => session.toggleFlag()} />
            </>}
          />
          <Highlightable
            className="cb-stem"
            html={q.stemHtml}
            active={annotate}
            value={marks[q.id]?.stem}
            onChange={(h) => setMarks((m) => ({ ...m, [q.id]: { ...m[q.id], stem: h } }))}
          />

          {q.type === 'spr' ? (
            <GridIn value={ans || ''} onChange={(v) => session.setValue(v)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              {q.choices.map((o) => (
                <OptionRow
                  key={o.letter}
                  letter={o.letter}
                  selected={isDrill ? (solved && resp.value === o.letter) : ans === o.letter}
                  feedback={isDrill ? (solved && resp.value === o.letter ? 'correct' : triedWrong.has(o.letter) ? 'wrong' : null) : null}
                  locked={isDrill && solved}
                  eliminated={!isDrill && elimSet.has(o.letter)}
                  showEliminator={!isDrill && eliminator}
                  onSelect={() => (isDrill ? session.answerDrillMCQ(o.letter) : session.setValue(o.letter))}
                  onToggleEliminate={() => tog(o.letter)}
                >
                  <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                </OptionRow>
              ))}
            </div>
          )}
          {isDrill && q.type !== 'spr' && <DrillFeedback solved={solved} triedAny={triedWrong.size > 0} />}
        </div>

        {kind === 'drill' && statsOn && (
          <SessionStats answered={answered} total={total} accuracy={liveAcc} median={median} correct={liveCorrect} incorrect={answered - liveCorrect} skipped={total - answered} hidden={false} onToggle={() => setStatsOn(false)} />
        )}
        {kind === 'drill' && !statsOn && (
          <SessionStats hidden={true} onToggle={() => setStatsOn(true)} />
        )}
      </div>

      {calcOpen && <DesmosPanel onClose={() => setCalcOpen(false)} />}
      {formulaOpen && <FormulaSheet onClose={() => setFormulaOpen(false)} />}

      {paletteOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette
            items={items}
            title={session.activeModule?.label === 'Drill' ? 'Math — Drill' : `Math — ${session.activeModule?.label || 'Module 1'}`}
            onSelect={(n) => { session.goTo(n - 1); setPaletteOpen(false); }}
            onReviewAll={() => { setPaletteOpen(false); session.finishModule(go); }}
          />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 10 }} />}

      <TestFooter
        studentName="You"
        current={session.index + 1}
        total={total}
        onPalette={() => setPaletteOpen((o) => !o)}
        paletteOpen={paletteOpen}
        onBack={() => session.prev()}
        onNext={onNext}
        nextDisabled={blocked}
        nextLabel={session.index >= total - 1 ? 'Submit' : 'Next'}
      />
    </div>
  );
}

// General-practice inline feedback under the answer choices.
function DrillFeedback({ solved, triedAny }) {
  if (!solved && !triedAny) return null;
  const color = solved ? 'var(--success)' : 'var(--error)';
  return (
    <p role="status" style={{ margin: '14px 0 0', font: 'var(--role-label)', fontWeight: 600, color }}>
      {solved ? 'Correct.' : 'Not quite — try again.'}
    </p>
  );
}

function GridIn({ value, onChange }) {
  return (
    <div style={{ marginTop: 24, maxWidth: 320 }}>
      <label style={{ display: 'block', font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
        Enter your answer
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="text"
        placeholder="e.g. 3/4 or 0.75"
        style={{
          width: '100%', padding: '12px 14px',
          font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)',
          color: '#1D1D1F', background: '#FFFFFF',
          border: '2px solid var(--border-2)', borderRadius: 'var(--radius-md)',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand-blue)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
      />
      <p style={{ margin: '8px 0 0', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
        Student-produced response. Fractions and decimals are both accepted.
      </p>
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
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '4px 8px',
        background: active ? 'rgba(255,255,255,0.18)' : (hover ? 'rgba(255,255,255,0.10)' : 'transparent'),
        color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4,
        font: 'var(--role-caption)', fontWeight: 500, fontSize: 11,
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      <Icon name={icon} style={{ width: 18, height: 18, color: '#fff' }} />
      <span>{label}</span>
    </button>
  );
}

// Desmos API key. The public demo key works for development; set
// NEXT_PUBLIC_DESMOS_API_KEY to your own (free for education) for production.
const DESMOS_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || 'dcb31709b452b1cf9dc26972add0fda6';

function loadDesmos() {
  if (window.Desmos) return Promise.resolve(window.Desmos);
  if (window.__desmosPromise) return window.__desmosPromise;
  window.__desmosPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_KEY}`;
    s.async = true;
    s.onload = () => resolve(window.Desmos);
    s.onerror = () => reject(new Error('Desmos failed to load'));
    document.head.appendChild(s);
  });
  return window.__desmosPromise;
}

function DesmosPanel({ onClose }) {
  const ref = React.useRef(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let calc;
    let alive = true;
    loadDesmos()
      .then((Desmos) => {
        if (!alive || !ref.current) return;
        calc = Desmos.GraphingCalculator(ref.current, { keypad: true, expressions: true, settingsMenu: false });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (calc) calc.destroy();
    };
  }, []);

  return (
    <div style={{
      position: 'absolute', left: 18, top: 78, width: 460, height: 360,
      background: '#FFFFFF', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      zIndex: 25, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid var(--border-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#2E7D32', color: '#fff' }}>
        <span style={{ font: 'var(--role-label)', fontWeight: 600 }}>Desmos Graphing Calculator</span>
        <button onClick={onClose} style={{ width: 18, height: 18, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12 }}>×</button>
      </div>
      {failed ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center', font: 'var(--role-caption)', color: 'var(--text-secondary)' }}>
          Calculator couldn’t load. Check your connection.
        </div>
      ) : (
        <div ref={ref} style={{ flex: 1 }} />
      )}
    </div>
  );
}

function FormulaSheet({ onClose }) {
  return (
    <div style={{
      position: 'absolute', right: 18, top: 78, width: 380, maxHeight: 420,
      background: '#FFFFFF', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-2)', overflow: 'auto', zIndex: 25,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-1)' }}>
        <span style={{ font: 'var(--role-title-sm)' }}>Reference Sheet</span>
        <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14, font: 'var(--role-body)' }}>
        {[
          ['Area of a circle', 'A = πr²'],
          ['Circumference', 'C = 2πr'],
          ['Pythagorean theorem', 'a² + b² = c²'],
          ['Slope-intercept form', 'y = mx + b'],
          ['Quadratic formula', 'x = (−b ± √(b² − 4ac)) / 2a'],
          ['Distance', 'd = √((x₂−x₁)² + (y₂−y₁)²)'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#1D1D1F' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionMath;
