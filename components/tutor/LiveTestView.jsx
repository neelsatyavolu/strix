'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { EmptyState } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import Highlightable from '@/components/sixteen/test/Highlightable';
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';
import TeachRegion from '@/components/tutor/TeachRegion';
import { useTeach } from '@/components/tutor/TeachContext';
import { regionId } from '@/lib/tutor/anchors';
import f from '@/components/sixteen/test/dialogs.module.css';
import s from './LiveTestView.module.css';

const NOOP = () => {};

// Read-only mirror of a watched student's exact test screen. Driven entirely by
// the live broadcast payload; every interaction is disabled. The answer key is
// fetched server-side (same reveal path as Question Bank) so tutors always see
// the correct answer while students practice — keys never ride on the broadcast.
export default function LiveTestView({ live, studentName = 'your student' }) {
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge, ToolButton,
  } = SixteenNS;
  const first = studentName && studentName !== 'your student'
    ? String(studentName).trim().split(/\s+/)[0]
    : 'Your student';
  const teach = useTeach();
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
      <div className={s.empty}>
        <EmptyState
          icon="radio"
          title={`${first} isn’t in a section right now`}
          body="This view fills in the moment they start a module."
        />
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

  const showTimer = !(live.timerRunning === false || live.seconds == null);

  return (
    <div className={s.root}>
      <LiveStatusStrip
        name={first}
        current={(live.index ?? 0) + 1}
        total={live.total}
        seconds={showTimer ? live.seconds : null}
        teaching={!!teach?.on}
      />
      <div className={s.mirror}>
        <TestHeader
          sectionLabel={sectionLabel}
          timer={showTimer ? <Timer seconds={live.seconds} hidden={false} onToggleHide={NOOP} /> : null}
          tools={<>
            {/* Inert replicas of the student's header tools, so the mirror matches. */}
            <ToolButton inert label="Exit" icon="log-out" />
            {isMath && <ToolButton inert label="Calculator" icon="square-function" active={!!calc?.open} />}
            {isMath && <ToolButton inert label="Reference" icon="book-marked" />}
            <ToolButton inert label="Annotate" icon="pencil-line" active={!!live.annotateActive} />
            <ToolButton inert label="Tutor" icon="message-circle" />
            <ToolButton inert label="More" icon="more-vertical" />
          </>}
        />
        <DirectionsBar onDirections={NOOP} />

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (!isMath && live.stimulusHtml) ? '1fr 1px 1fr' : '1fr', overflow: 'hidden' }}>
          {!isMath && live.stimulusHtml && (
            <>
              <div style={{ overflow: 'auto', padding: '36px 56px 48px' }}>
                <TeachRegion id={regionId(live.id, 'passage')}>
                  <Highlightable className="cb-passage" html={live.stimulusHtml} active={false} value={live.marks?.passage} onChange={NOOP} />
                </TeachRegion>
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
              {isMath && live.stimulusHtml && (
                <TeachRegion id={regionId(live.id, 'passage')}>
                  <Highlightable className="cb-passage" html={live.stimulusHtml} active={false} value={live.marks?.passage} onChange={NOOP} style={{ marginBottom: 18 }} />
                </TeachRegion>
              )}
              <TeachRegion id={regionId(live.id, 'stem')}>
                <Highlightable className="cb-stem" html={live.stemHtml} active={false} value={live.marks?.stem} onChange={NOOP} />
              </TeachRegion>

              {isSpr ? (
                <TeachRegion id={regionId(live.id, 'spr')} style={{ marginTop: 24, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span className={f.fieldLabel}>{first}’s answer</span>
                    <div className={f.answerBox}>
                      {live.selected || <span className={f.muted}>—</span>}
                    </div>
                  </div>
                  <div>
                    <span className={f.fieldLabel}>Correct answer</span>
                    <div className={cx(f.answerBox, f.answerBoxKey)}>
                      {correctLabel || <span className={f.muted}>{questionId ? '…' : '—'}</span>}
                    </div>
                  </div>
                </TeachRegion>
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
                    // Explicit captions — green-on-green "selected correct" alone
                    // is hard to read; labels make student pick vs key unambiguous.
                    let endLabel = null;
                    if (isCorrectChoice && isStudentPick) endLabel = 'Student · Correct';
                    else if (isCorrectChoice) endLabel = 'Correct';
                    else if (isStudentPick && correctSet.size > 0) endLabel = 'Student';
                    else if (isStudentPick) endLabel = 'Student';
                    return (
                      <TeachRegion key={o.letter} id={regionId(live.id, `choice-${o.letter}`)}>
                      <OptionRow
                        letter={o.letter}
                        selected={isStudentPick && !isCorrectChoice}
                        feedback={feedback}
                        locked
                        endLabel={endLabel}
                        eliminated={elimSet.has(o.letter) && !isCorrectChoice}
                        showEliminator={false}
                        onSelect={NOOP}
                        onToggleEliminate={NOOP}
                      >
                        <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                      </OptionRow>
                      </TeachRegion>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMath && calc?.open && (
          <TeachRegion id={regionId(live.id, 'calc')}>
            <DesmosPanel readOnly state={calc.state} pos={calc.pos} size={calc.size} onClose={NOOP} />
          </TeachRegion>
        )}

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
    </div>
  );
}

// Tutor-only status line above the mirror: who, where, and how long is left.
function LiveStatusStrip({ name, current, total, seconds, teaching }) {
  return (
    <div className={s.strip}>
      <div className={s.stripMain}>
        <span className={cx(s.live, teaching && s.liveTeaching)} aria-hidden="true" />
        <span className={s.who}>Watching {name}</span>
        {total ? <><span className={s.sep}>·</span><span>Question {current} of {total}</span></> : null}
        {seconds != null && <><span className={s.sep}>·</span><span>{formatClock(seconds)} left</span></>}
      </div>
      <span className={cx(s.mode, teaching && s.modeTeaching)}>
        {teaching ? 'Teaching' : 'Read-only'}
      </span>
    </div>
  );
}

function formatClock(total) {
  const t = Math.max(0, Math.floor(total));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
