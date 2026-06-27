'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import SessionStats from '@/components/sixteen/panels/SessionStats';
import Highlightable from '@/components/sixteen/test/Highlightable';
import { ExitTest } from '@/components/sixteen/test/ExitTest';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { TestLoading, TestMessage } from '@/components/sixteen/screens/TestStates';
import { moduleSubmitDisabled, moduleTimerSeconds } from '@/lib/practice/sessionLogic.mjs';

// QuestionRW — Bluebook-faithful Reading & Writing question screen, driven by
// real College Board questions from the practice session.

function QuestionRW({ go, tutorOn, setTutorOn, statsOn, setStatsOn, kind = 'drill' }) {
  const NS = SixteenNS;
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = NS;
  const session = usePracticeSession();
  const q = session.current;
  const isDrill = session.mode === 'drill';

  const [seconds, setSeconds] = React.useState(moduleTimerSeconds('rw'));
  const [hidden, setHidden] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [eliminator, setEliminator] = React.useState(false);
  const [elim, setElim] = React.useState({}); // questionId -> Set(letters)
  const [directionsOpen, setDirectionsOpen] = React.useState(false);
  const [annotate, setAnnotate] = React.useState(false);
  const [marks, setMarks] = React.useState({}); // questionId -> { passage, stem } highlighted HTML
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

  if (session.status === 'loading') return <TestLoading label="Loading Reading & Writing questions…" />;
  if (session.status === 'error') return <TestMessage title="Couldn't load questions" body={session.error} onHome={() => go('practice-setup', { domain: 'rw' })} />;
  if (!q) return <TestMessage title="No active session" body="Start a practice session to begin." onHome={() => go('practice-setup', { domain: 'rw' })} />;

  const total = session.questions.length;
  const resp = session.responses[q.id] || {};
  const ans = resp.value || null;
  const marked = !!resp.flagged;
  // General practice: retry-until-correct. `solved` ungates Next; wrong picks lock out.
  const solved = !!resp.solved;
  const triedWrong = new Set(resp.tried || []);
  const blocked = isDrill && !solved; // can't advance until the right answer is chosen
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
        sectionLabel={session.activeModule?.label === 'Drill' ? 'Reading & Writing — Drill' : `Reading & Writing, ${session.activeModule?.label || 'Module 1'}`}
        timer={session.config?.timing === 'untimed' ? null : <Timer seconds={seconds} hidden={hidden} onToggleHide={() => setHidden(!hidden)} />}
        tools={<>
          <ExitTest mode={session.mode} onConfirm={() => session.exitSession(go)} />
          <ToolBtn label="Annotate" icon="pencil-line" active={annotate} onClick={() => setAnnotate((a) => !a)} />
          <ToolBtn label="Tutor" icon="message-circle" active={tutorOn} onClick={() => setTutorOn(!tutorOn)} />
          <ToolBtn label="More" icon="more-vertical" />
        </>}
      />

      <DirectionsBar onDirections={() => setDirectionsOpen((v) => !v)} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: q.stimulusHtml ? '1fr 1px 1fr' : '1fr', overflow: 'hidden' }}>
        {q.stimulusHtml && (
          <>
            <div style={{ overflow: 'auto', padding: '36px 56px 48px' }}>
              <Highlightable
                className="cb-passage"
                html={q.stimulusHtml}
                active={annotate}
                value={marks[q.id]?.passage}
                onChange={(h) => setMarks((m) => ({ ...m, [q.id]: { ...m[q.id], passage: h } }))}
              />
            </div>
            <div style={{ background: 'var(--test-divider)' }} />
          </>
        )}

        <div style={{ overflow: 'auto', padding: '24px 56px 48px', position: 'relative' }}>
          <QuestionNumberBadge
            n={session.index + 1}
            flag={<>
              {!isDrill && (
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
          {isDrill && <DrillFeedback solved={solved} triedAny={triedWrong.size > 0} rationaleHtml={q.rationaleHtml} />}
        </div>

        {kind === 'drill' && statsOn && (
          <SessionStats answered={answered} total={total} accuracy={liveAcc} median={median} correct={liveCorrect} incorrect={answered - liveCorrect} skipped={total - answered} hidden={false} onToggle={() => setStatsOn(false)} />
        )}
        {kind === 'drill' && !statsOn && (
          <SessionStats hidden={true} onToggle={() => setStatsOn(true)} />
        )}
      </div>

      {paletteOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette
            items={items}
            title={session.activeModule?.label === 'Drill' ? 'Reading & Writing — Drill' : `Reading & Writing — ${session.activeModule?.label || 'Module 1'}`}
            onSelect={(n) => { session.goTo(n - 1); setPaletteOpen(false); }}
            onReviewAll={onReviewAll}
          />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 10 }} />}

      {directionsOpen && <DirectionsModal onClose={() => setDirectionsOpen(false)} />}

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

function ToolBtn({ label, icon, active = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '4px 8px', height: 'auto',
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

function DirectionsModal({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'grid', placeItems: 'center' }}>
      <div style={{ width: 520, maxWidth: '90%', maxHeight: '80%', background: 'var(--paper)', borderRadius: 8, boxShadow: 'var(--shadow-xl)', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, font: 'var(--role-title-sm)' }}>Section Directions</h2>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>×</button>
        </div>
        <div style={{ padding: 20, font: 'var(--role-body-lg)', color: 'var(--ink-1)', lineHeight: 1.55 }}>
          <p>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p>
          <p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
        </div>
      </div>
    </div>
  );
}

export default QuestionRW;
