'use client';
import React from 'react';
import { Button, EmptyState, Icon, Page } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { examBreakCanBegin } from '@/lib/practice/sessionLogic.mjs';
import { SECTION_LABEL } from './result/format';
import s from './result/BreakScreen.module.css';

// ExamBreak — the 10-minute break between the R&W and Math sections of a full SAT.
// The clock here is the real break timer; section time does not run during it.

const BREAK_SECONDS = 10 * 60;

function ExamBreak({ go }) {
  const session = usePracticeSession();
  const exam = session.exam;
  const [seconds, setSeconds] = React.useState(BREAK_SECONDS);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setSeconds((sec) => Math.max(0, sec - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!exam) {
    return (
      <Page width="narrow">
        <EmptyState
          icon="coffee"
          title="No exam in progress"
          body="Start a full SAT to get a break between sections."
          action={<Button onClick={() => go('practice-setup')}>Set up a test</Button>}
        />
      </Page>
    );
  }

  const nextSection = exam.sections[exam.index];
  const results = exam.results || [];
  const previousSection = results[results.length - 1]?.section;
  const nextLabel = SECTION_LABEL[nextSection] || 'the next section';
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const canBegin = examBreakCanBegin({ seconds, status: session.status, starting });
  const loadingNext = starting || session.status === 'loading';
  const elapsedPct = ((BREAK_SECONDS - seconds) / BREAK_SECONDS) * 100;
  const begin = () => {
    if (!canBegin) return;
    setStarting(true);
    session.startExamNextSection(go);
  };

  return (
    <Page width="narrow">
      <div className={s.screen}>
        <span className={s.icon}><Icon name="coffee" size={20} /></span>
        <p className={s.meta}>Full SAT · Break</p>
        <h1 className={s.title}>Take a 10-minute break</h1>
        <p className={s.subtitle}>
          Stand up, stretch, get some water. Up next: <strong>{nextLabel}</strong>.
        </p>

        <div className={s.clock} role="timer" aria-label={`${Number(mm)} minutes ${Number(ss)} seconds of break left`}>
          {mm}:{ss}
        </div>
        <div className={s.track} aria-hidden="true">
          <span className={s.fill} style={{ width: `${elapsedPct}%` }} />
        </div>
        <p className={s.clockLabel}>{seconds > 0 ? 'Break remaining' : 'Break’s over'}</p>

        <Button size="lg" loading={loadingNext} disabled={!canBegin} onClick={begin} className={s.cta}>
          {loadingNext ? `Loading ${nextLabel}…` : 'Resume now'}
        </Button>
        <p className={s.note}>
          {seconds > 0 && 'You can resume when the break ends. '}
          Once you begin {nextLabel}, you can’t return to {SECTION_LABEL[previousSection] || 'the previous section'}.
        </p>
      </div>
    </Page>
  );
}

export default ExamBreak;
