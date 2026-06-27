'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import renderMathInElement from 'katex/contrib/auto-render';
import SessionStats from '@/components/sixteen/panels/SessionStats';
import Highlightable from '@/components/sixteen/test/Highlightable';
import { ExitTest } from '@/components/sixteen/test/ExitTest';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { TestLoading, TestMessage } from '@/components/sixteen/screens/TestStates';
import { moduleSubmitDisabled, moduleTimerSeconds } from '@/lib/practice/sessionLogic.mjs';

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

  const [seconds, setSeconds] = React.useState(moduleTimerSeconds('math'));
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
  // General practice: no skipping. MCQs retry until correct; SPR (grid-in) just
  // needs a non-empty answer (single attempt) before you can move on.
  const solved = !!resp.solved;
  const hasAnswer = !!(resp.value && String(resp.value).trim());
  const triedWrong = new Set(resp.tried || []);
  const blocked = isDrill && (q.type === 'spr' ? !hasAnswer : !solved);
  // General practice stays no-skip; scored modules can be submitted with blanks,
  // which count wrong in the section score.
  const isLast = session.index >= total - 1;
  const submitDisabled = moduleSubmitDisabled({ isDrill, blocked });
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
    if (isLast) {
      session.finishModule(go);
    } else session.next();
  };

  // Palette "Go to Review Page": submit the active module.
  const onReviewAll = () => {
    setPaletteOpen(false);
    if (submitDisabled) return;
    session.finishModule(go);
  };

  const answered = session.answeredCount;
  const liveCorrect = (session.result?.review || []).filter((r) => r.response?.value && r.isCorrect).length;
  const liveAcc = answered ? Math.round((liveCorrect / answered) * 100) : 0;
  const median = answered ? Math.round((session.result?.elapsedMs || 0) / 1000 / answered) : 0;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--test-canvas)' }}>
      <TestHeader
        sectionLabel={session.activeModule?.label === 'Drill' ? 'Math — Drill' : `Math, ${session.activeModule?.label || 'Module 1'}`}
        timer={session.config?.timing === 'untimed' ? null : <Timer seconds={seconds} hidden={hidden} onToggleHide={() => setHidden(!hidden)} />}
        tools={<>
          <ExitTest mode={session.mode} onConfirm={() => session.exitSession(go)} />
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
                  background: eliminator ? 'var(--test-fill)' : 'transparent', color: eliminator ? 'var(--test-fill-fg)' : 'var(--test-ink)',
                  border: '1px solid var(--test-line)', borderRadius: 3, cursor: 'pointer',
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
          {isDrill && q.type !== 'spr' && <DrillFeedback solved={solved} triedAny={triedWrong.size > 0} rationaleHtml={q.rationaleHtml} />}
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
            onReviewAll={onReviewAll}
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
        nextDisabled={isLast ? submitDisabled : blocked}
        nextLabel={isLast ? 'Submit' : 'Next'}
      />
    </div>
  );
}

// General-practice inline feedback under the answer choices.
function DrillFeedback({ solved, triedAny, rationaleHtml }) {
  if (!solved && !triedAny) return null;
  const color = solved ? 'var(--success)' : 'var(--error)';
  return (
    <div style={{ margin: '14px 0 0' }}>
      <p role="status" style={{ margin: 0, font: 'var(--role-label)', fontWeight: 600, color }}>
        {solved ? 'Correct.' : 'Not quite — try again.'}
      </p>
      {solved && rationaleHtml && (
        <div className="cb-stem" style={{ fontSize: 14, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-1)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: rationaleHtml }} />
      )}
    </div>
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
          color: 'var(--test-ink)', background: 'var(--test-canvas)',
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

const CALC_MIN_W = 320;
const CALC_MIN_H = 280;

function DesmosPanel({ onClose }) {
  const ref = React.useRef(null);
  const calcRef = React.useRef(null);
  const [failed, setFailed] = React.useState(false);
  const [size, setSize] = React.useState({ w: 460, h: 360 });
  const [pos, setPos] = React.useState({ x: 18, y: 78 });

  React.useEffect(() => {
    let alive = true;
    loadDesmos()
      .then((Desmos) => {
        if (!alive || !ref.current) return;
        calcRef.current = Desmos.GraphingCalculator(ref.current, { keypad: true, expressions: true, settingsMenu: false });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (calcRef.current) calcRef.current.destroy();
    };
  }, []);

  // Drag the header to reposition the calculator, like real Bluebook.
  const onHeaderDown = (e) => {
    if (e.target.closest('button')) return; // let the close button work
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = pos;
    const move = (ev) => {
      setPos({ x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Drag the bottom-right grip to enlarge the calculator, like real Bluebook.
  const onResizeDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = size;
    const move = (ev) => {
      setSize({
        w: Math.max(CALC_MIN_W, orig.w + (ev.clientX - startX)),
        h: Math.max(CALC_MIN_H, orig.h + (ev.clientY - startY)),
      });
      if (calcRef.current) calcRef.current.resize();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div style={{
      position: 'absolute', left: pos.x, top: pos.y, width: size.w, height: size.h,
      background: 'var(--paper)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      zIndex: 25, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid var(--border-2)',
    }}>
      <div onMouseDown={onHeaderDown} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#2E7D32', color: '#fff', cursor: 'move', userSelect: 'none' }}>
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
      <div
        onMouseDown={onResizeDown}
        title="Drag to resize"
        style={{
          position: 'absolute', right: 0, bottom: 0, width: 18, height: 18,
          cursor: 'nwse-resize', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0 50%, var(--border-2) 50% 60%, transparent 60% 70%, var(--border-2) 70% 80%, transparent 80%)',
        }}
      />
    </div>
  );
}

function FormulaSheet({ onClose }) {
  return (
    <div style={{
      position: 'absolute', right: 18, top: 78, width: 380, maxHeight: 420,
      background: 'var(--paper)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
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
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--test-ink)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionMath;
