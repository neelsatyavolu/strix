'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import renderMathInElement from 'katex/contrib/auto-render';
import SessionStats from '@/components/sixteen/panels/SessionStats';
import Highlightable from '@/components/sixteen/test/Highlightable';
import { ExitTest } from '@/components/sixteen/test/ExitTest';
import ModuleCountdown from '@/components/sixteen/test/ModuleCountdown';
import ModuleReview from '@/components/sixteen/test/ModuleReview';
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';
import { DoneAlreadyButton, DrillFeedback, EliminatorToggle } from '@/components/sixteen/test/QuestionAids';
import { FormulaSheet, GridIn } from '@/components/sixteen/test/MathAids';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useLiveBroadcast } from '@/components/sixteen/session/LiveBroadcastContext';
import { throttle } from '@/lib/tutor/throttle';
import TeachRegion from '@/components/tutor/TeachRegion';
import { regionId } from '@/lib/tutor/anchors';
import { TestLoading, TestMessage } from '@/components/sixteen/screens/TestStates';
import { moduleReviewAction, moduleSubmitDisabled, moduleTimerIsRunning, moduleTimerResetKey, moduleTimerSeconds } from '@/lib/practice/sessionLogic.mjs';

// QuestionMath — Bluebook-faithful Math question (real CB items), with Desmos
// calculator + reference sheet. Renders MathML natively and KaTeX for \(...\).

function QuestionMath({ go, tutorOn, setTutorOn, statsOn, setStatsOn, kind = 'drill' }) {
  const NS = SixteenNS;
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge, ToolButton,
  } = NS;
  const session = usePracticeSession();
  const report = useLiveBroadcast();
  // Mirror the calculator to a watching tutor. The separate updates (open toggle,
  // Desmos change, drag/resize) each report a partial `calc`; report() deep-merges
  // the calc key so they accumulate into {open,state,pos,size} without clobbering.
  // 800ms: Desmos change events fire very often; each one rebuilds the full
  // live session broadcast. Faster rates thrash Realtime under math practice.
  const reportCalc = React.useMemo(() => throttle((state) => report({ calc: { state } }), 800), [report]);
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
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [marks, setMarks] = React.useState({}); // questionId -> { stem } highlighted HTML
  const [dismissing, setDismissing] = React.useState(false);
  const timerResetKey = moduleTimerResetKey({ section: 'math', moduleKey: session.activeModule?.key });
  const canDismiss = session.mode !== 'review' && session.status === 'active';
  const timerRunning = moduleTimerIsRunning({
    status: session.status,
    timing: session.config?.timing,
    hasQuestion: !!q,
  });

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

  // Stream this screen's genuinely-local UI state (highlights, strikethroughs,
  // annotate mode, timer) to a watching tutor. Selection/flag/palette/section
  // label are derived from the session in SixteenApp, not reported here.
  React.useEffect(() => {
    const qq = session.current;
    if (session.status !== 'active' || !qq) return;
    report({
      marks: marks[qq.id] || null,
      eliminated: [...(elim[qq.id] || new Set())],
      annotateActive: annotate,
      seconds,
      timerRunning,
    });
    // Depending on the whole `session` object would re-broadcast every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, session.status, session.current, marks, elim, annotate, seconds, timerRunning]);

  // Report the calculator open/close the instant the student toggles it, so the
  // tutor's mirror opens it without waiting for Desmos to finish loading.
  React.useEffect(() => { report({ calc: { open: calcOpen } }); }, [calcOpen, report]);

  if (session.status === 'loading') return <TestLoading label="Loading Math questions…" />;
  if (session.status === 'error') return <TestMessage title="Couldn't load questions" body={session.error} onHome={() => go('practice-setup', { domain: 'math' })} />;
  if (!q) return <TestMessage icon="circle-play" title="No active session" body="Start a practice session to begin." onHome={() => go('practice-setup', { domain: 'math' })} />;

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

  // Palette "Go to Review Page": open the in-module review page.
  const onReviewAll = () => {
    setPaletteOpen(false);
    const action = moduleReviewAction({ isDrill, blocked });
    if (action === 'blocked') return;
    setReviewOpen(true);
  };

  const answered = session.answeredCount;
  const liveCorrect = (session.result?.review || []).filter((r) => r.response?.value && r.isCorrect).length;
  const liveAcc = answered ? Math.round((liveCorrect / answered) * 100) : 0;
  const median = answered ? Math.round((session.result?.elapsedMs || 0) / 1000 / answered) : 0;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--test-canvas)' }}>
      <TestHeader
        sectionLabel={session.activeModule?.label === 'Drill' ? 'Math — Drill' : `Math, ${session.activeModule?.label || 'Module 1'}`}
        timer={session.config?.timing === 'untimed' ? null : (
          <ModuleCountdown
            key={timerResetKey}
            Timer={Timer}
            section="math"
            timerRunning={timerRunning}
            hidden={hidden}
            onToggleHide={() => setHidden(!hidden)}
            onSecondsChange={setSeconds}
            onExpire={() => session.finishModule(go)}
          />
        )}
        tools={<>
          <ExitTest mode={session.mode} onConfirm={() => session.exitSession(go)} />
          <ToolButton label="Calculator" icon="square-function" active={calcOpen} onClick={() => setCalcOpen(!calcOpen)} />
          <ToolButton label="Reference" icon="book-marked" active={formulaOpen} onClick={() => setFormulaOpen(!formulaOpen)} />
          <ToolButton label="Annotate" icon="pencil-line" active={annotate} onClick={() => setAnnotate((a) => !a)} />
          <ToolButton label="Tutor" icon="message-circle" active={tutorOn} onClick={() => setTutorOn(!tutorOn)} />
          <ToolButton label="More" icon="more-vertical" />
        </>}
      />

      <DirectionsBar onDirections={() => setDirectionsOpen((v) => !v)} />

      {reviewOpen ? (
        <ModuleReview
          title={session.activeModule?.label === 'Drill' ? 'Math — Drill' : `Math — ${session.activeModule?.label || 'Module 1'}`}
          items={items}
          onSelect={(n) => { session.goTo(n - 1); setReviewOpen(false); }}
          onBack={() => setReviewOpen(false)}
          onSubmit={() => !submitDisabled && session.finishModule(go)}
          submitDisabled={submitDisabled}
        />
      ) : (
        <div id="math-q-area" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
            <QuestionNumberBadge
              n={session.index + 1}
              flag={<>
                {q.type === 'mcq' && !isDrill && <EliminatorToggle on={eliminator} onClick={() => setEliminator((e) => !e)} />}
                <FlagButton marked={marked} onClick={() => session.toggleFlag()} />
              </>}
            />
            {q.stimulusHtml && (
              <TeachRegion id={regionId(q.id, 'passage')}>
                <Highlightable
                  className="cb-passage"
                  html={q.stimulusHtml}
                  active={annotate}
                  value={marks[q.id]?.passage}
                  onChange={(h) => setMarks((m) => ({ ...m, [q.id]: { ...m[q.id], passage: h } }))}
                  style={{ marginBottom: 18 }}
                />
              </TeachRegion>
            )}
            <TeachRegion id={regionId(q.id, 'stem')}>
              <Highlightable
                className="cb-stem"
                html={q.stemHtml}
                active={annotate}
                value={marks[q.id]?.stem}
                onChange={(h) => setMarks((m) => ({ ...m, [q.id]: { ...m[q.id], stem: h } }))}
              />
            </TeachRegion>

            {q.type === 'spr' ? (
              <TeachRegion id={regionId(q.id, 'spr')}>
                <GridIn value={ans || ''} onChange={(v) => session.setValue(v)} />
              </TeachRegion>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                {q.choices.map((o) => (
                  <TeachRegion key={o.letter} id={regionId(q.id, `choice-${o.letter}`)}>
                  <OptionRow
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
                  </TeachRegion>
                ))}
              </div>
            )}
            {isDrill && q.type !== 'spr' && <DrillFeedback solved={solved} triedAny={triedWrong.size > 0} rationaleHtml={q.rationaleHtml} />}
            {canDismiss && (
              <DoneAlreadyButton
                busy={dismissing}
                onClick={async () => {
                  if (dismissing) return;
                  setDismissing(true);
                  try {
                    const result = await session.dismissAndReplace();
                    if (!result?.ok) window.alert(result?.error || "Couldn't replace this question.");
                  } finally {
                    setDismissing(false);
                  }
                }}
              />
            )}
          </div>

          {kind === 'drill' && statsOn && (
            <SessionStats answered={answered} total={total} accuracy={liveAcc} median={median} correct={liveCorrect} incorrect={answered - liveCorrect} skipped={total - answered} hidden={false} onToggle={() => setStatsOn(false)} />
          )}
          {kind === 'drill' && !statsOn && (
            <SessionStats hidden={true} onToggle={() => setStatsOn(true)} />
          )}
        </div>
      )}

      {calcOpen && (
        <TeachRegion id={regionId(q.id, 'calc')}>
          <DesmosPanel
            onClose={() => setCalcOpen(false)}
            onStateChange={reportCalc}
            onGeometry={({ pos, size }) => report({ calc: { pos, size } })}
          />
        </TeachRegion>
      )}
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
        onBack={reviewOpen ? () => setReviewOpen(false) : () => session.prev()}
        onNext={reviewOpen ? () => !submitDisabled && session.finishModule(go) : onNext}
        nextDisabled={reviewOpen ? submitDisabled : isLast ? submitDisabled : blocked}
        nextLabel={reviewOpen || isLast ? 'Submit' : 'Next'}
      />
    </div>
  );
}

export default QuestionMath;
