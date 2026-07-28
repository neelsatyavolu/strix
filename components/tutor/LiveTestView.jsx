'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import Highlightable from '@/components/sixteen/test/Highlightable';
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';

const NOOP = () => {};

// Read-only mirror of a watched student's exact test screen. Driven entirely by
// the live broadcast payload; every interaction is disabled. The answer key is
// fetched server-side (same reveal path as Question Bank) so tutors always see
// the correct answer while students practice — keys never ride on the broadcast.
export default function LiveTestView({ live, studentName = 'your student' }) {
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = SixteenNS;
  const first = String(studentName).split(' ')[0];
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  // { correct: string[] } once loaded for the current live.id; null while idle
  // or still fetching. Keyed only by question id so timer ticks don't re-fetch.
  const [answerKey, setAnswerKey] = React.useState(null);

  const questionId = live?.active && live?.id ? live.id : null;
  const questionSection = live?.section || undefined;

  React.useEffect(() => {
    if (!questionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswerKey(null);
      return undefined;
    }
    let alive = true;
    setAnswerKey(null);
    (async () => {
      try {
        const res = await fetch('/api/questions/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempts: [{ id: questionId, section: questionSection }],
            reveal: true,
          }),
        });
        const json = await res.json();
        const key = json?.data?.results?.[0]?.key;
        if (alive && key?.correct?.length) setAnswerKey(key);
      } catch {
        /* answer stays hidden; the live mirror still works */
      }
    })();
    return () => { alive = false; };
  }, [questionId, questionSection]);

  if (!live || live.active === false) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--test-canvas)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: 360 }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>{first} isn’t in a section right now</div>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>This view will fill in the moment they start a module.</div>
        </div>
      </div>
    );
  }

  const isMath = live.section === 'math';
  const sectionLabel = live.sectionLabel || (isMath ? 'Math' : 'Reading & Writing');
  const elimSet = new Set(live.eliminated || []);
  const correctSet = new Set(answerKey?.correct || []);
  // Prefer the student's real per-question palette; fall back to a grid derived
  // from the question count so the popover always renders something sensible.
  const palette = (live.palette && live.palette.length)
    ? live.palette
    : Array.from({ length: live.total || 0 }, (_, i) => ({ current: i === (live.index ?? -1), answered: false, flagged: false }));
  const items = palette.map((p, i) => ({
    n: i + 1,
    status: p.current ? 'current' : p.answered ? 'answered' : 'unanswered',
    marked: !!p.flagged,
    onClick: NOOP,
  }));
  const calc = live.calc;
  // Grid-in (student-produced response): the derived type, or any math question
  // that has no multiple-choice options.
  const isSpr = live.type === 'spr' || (isMath && !(live.choices && live.choices.length));
  const correctLabel = answerKey?.correct?.length
    ? answerKey.correct.join(' or ')
    : null;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--test-canvas)' }}>
      <TestHeader
        sectionLabel={sectionLabel}
        timer={live.timerRunning === false || live.seconds == null ? null : <Timer seconds={live.seconds} hidden={false} onToggleHide={NOOP} />}
        tools={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', font: 'var(--role-caption)', paddingRight: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          Watching {first} · read-only
        </span>}
      />
      <DirectionsBar onDirections={NOOP} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (!isMath && live.stimulusHtml) ? '1fr 1px 1fr' : '1fr', overflow: 'hidden' }}>
        {!isMath && live.stimulusHtml && (
          <>
            <div style={{ overflow: 'auto', padding: '36px 56px 48px' }}>
              <Highlightable className="cb-passage" html={live.stimulusHtml} active={false} value={live.marks?.passage} onChange={NOOP} />
            </div>
            <div style={{ background: 'var(--test-divider)' }} />
          </>
        )}
        <div style={{ overflow: 'auto', padding: isMath ? '32px 24px 48px' : '24px 56px 48px', position: 'relative' }}>
          <div style={{ maxWidth: isMath ? 760 : undefined, margin: isMath ? '0 auto' : undefined }}>
            <QuestionNumberBadge
              n={(live.index ?? 0) + 1}
              flag={<FlagButton marked={!!live.flagged} onClick={NOOP} />}
            />
            <Highlightable className="cb-stem" html={live.stemHtml} active={false} value={live.marks?.stem} onChange={NOOP} />

            {isSpr ? (
              <div style={{ marginTop: 24, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Student’s answer</label>
                  <div style={{ width: '100%', padding: '12px 14px', font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)', color: 'var(--test-ink)', background: 'var(--test-canvas)', border: '2px solid var(--border-2)', borderRadius: 'var(--radius-md)', minHeight: 22 }}>
                    {live.selected || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Correct answer</label>
                  <div style={{ width: '100%', padding: '12px 14px', font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)', color: 'var(--success)', background: 'color-mix(in srgb, var(--success) 8%, transparent)', border: '2px solid var(--success)', borderRadius: 'var(--radius-md)', minHeight: 22 }}>
                    {correctLabel || <span style={{ color: 'var(--text-tertiary)' }}>{questionId ? '…' : '—'}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                {(live.choices || []).map((o) => {
                  const isCorrectChoice = correctSet.has(o.letter);
                  const isStudentPick = live.selected === o.letter;
                  // Always surface the key; if the student picked something else,
                  // mark theirs wrong so the tutor can see the mismatch at a glance.
                  const feedback = isCorrectChoice
                    ? 'correct'
                    : (isStudentPick && correctSet.size > 0 ? 'wrong' : null);
                  return (
                    <OptionRow
                      key={o.letter}
                      letter={o.letter}
                      selected={isStudentPick}
                      feedback={feedback}
                      locked
                      eliminated={elimSet.has(o.letter) && !isCorrectChoice}
                      showEliminator={elimSet.size > 0}
                      onSelect={NOOP}
                      onToggleEliminate={NOOP}
                    >
                      <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                    </OptionRow>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMath && calc?.open && <DesmosPanel readOnly state={calc.state} pos={calc.pos} size={calc.size} onClose={NOOP} />}

      {paletteOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette items={items} title={sectionLabel} onSelect={NOOP} onReviewAll={NOOP} />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 10 }} />}

      <TestFooter
        studentName={studentName}
        current={(live.index ?? 0) + 1}
        total={live.total}
        onPalette={() => setPaletteOpen((o) => !o)}
        paletteOpen={paletteOpen}
        onBack={NOOP}
        onNext={NOOP}
        nextDisabled
        nextLabel="—"
      />
    </div>
  );
}
