'use client';
import React from 'react';
import { Card, Icon, SegmentedControl, Section } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import StartBar from './StartBar';
import TestSourcePicker, { defaultBluebook, useOfficialForms } from './TestSourcePicker';
import s from './Practice.module.css';
import {
  BASE_CATS, FULL_KINDS, MODE_TO_KIND, SECTION_LABEL, SECTION_OPTIONS,
  formatMinutes, fullShape, validSection,
} from './practiceConfig';

// Full-length — a timed module, a full adaptive section, or a whole SAT.
export default function FullLengthTab({ go, initial = {}, readOnly = false, studentName }) {
  const session = usePracticeSession();
  const [kind, setKind] = React.useState(() => MODE_TO_KIND[initial.mode] || 'section');
  const [section, setSection] = React.useState(() => validSection(initial.domain));
  // Full-SAT source: undefined = not yet defaulted, null = question bank, a
  // number = that Bluebook form. Strix tests aren't Bluebook-numbered, so they
  // are tracked separately.
  const [bluebookPick, setBluebookPick] = React.useState(undefined);
  const [strixTest, setStrixTest] = React.useState(null);
  const isExam = kind === 'exam';
  const forms = useOfficialForms(isExam);
  const bluebook = bluebookPick !== undefined ? bluebookPick
    : forms.status === 'ready' ? defaultBluebook(forms) : undefined;

  const start = () => {
    if (isExam) {
      const examConfig = strixTest
        ? { mode: 'mock-exam', bluebookTest: null, strixTest }
        : { mode: 'mock-exam', bluebookTest: bluebook ?? null };
      session.start(examConfig);
      go('rw-question', { kind: 'module' }); // a full SAT always opens with R&W
      return;
    }
    const mode = FULL_KINDS.find((k) => k.value === kind).mode;
    session.start({ section, mode, category: BASE_CATS[section][0].id, difficulty: 'all', count: 10, timing: 'total' });
    go(section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
  };

  const { title, detail, label } = summarize({ kind, section, bluebook, strixTest });

  return (
    <>
      <div role="radiogroup" aria-label="Length" className={s.kinds}>
        {FULL_KINDS.map((k) => {
          const shape = fullShape(k.value, section);
          const sel = k.value === kind;
          return (
            <Card
              key={k.value}
              as="button"
              type="button"
              role="radio"
              aria-checked={sel}
              interactive
              selected={sel}
              padding="lg"
              onClick={() => setKind(k.value)}
              className={s.kind}
            >
              <span className={s.kindIcon} data-on={sel || undefined}><Icon name={k.icon} size={16} /></span>
              <span className={s.kindTitle}>{k.title}</span>
              <span className={s.kindFigures}>
                {shape.questions} questions · {formatMinutes(shape.minutes)}
                {k.value === 'exam' ? ' + break' : ''}
              </span>
              <span className={s.kindSub}>{k.sub}</span>
            </Card>
          );
        })}
      </div>

      {isExam ? (
        <Section
          title="Test"
          description="Take an official Bluebook practice test, a Strix test built in the same shape, or a fresh one from the question bank."
        >
          <TestSourcePicker
            forms={forms}
            bluebook={bluebook}
            strixTest={strixTest}
            onPick={(p) => { setStrixTest(p.strixTest); setBluebookPick(p.bluebook); }}
          />
        </Section>
      ) : (
        <Section title="Section">
          <SegmentedControl label="Section" options={SECTION_OPTIONS} value={section} onChange={setSection} />
        </Section>
      )}

      <StartBar
        title={title}
        detail={detail}
        label={label}
        onStart={start}
        readOnly={readOnly}
        studentName={studentName}
        disabled={isExam && !strixTest && bluebook === undefined && forms.status === 'loading'}
      />
    </>
  );
}

function summarize({ kind, section, bluebook, strixTest }) {
  const shape = fullShape(kind, section);
  const time = formatMinutes(shape.minutes);
  if (kind === 'module') {
    return {
      title: `${SECTION_LABEL[section]} · Module 1`,
      detail: `${shape.questions} questions · ${time} · the clock starts when you begin`,
      label: 'Start module',
    };
  }
  if (kind === 'section') {
    return {
      title: `${SECTION_LABEL[section]} section`,
      detail: `${shape.questions} questions · ${time} across two timed modules · estimated score`,
      label: 'Start section',
    };
  }
  const source = strixTest ? `Strix Test ${strixTest}` : bluebook ? `Bluebook ${bluebook}` : null;
  return {
    title: source ? `Full SAT · ${source}` : 'Full SAT · question bank',
    detail: `${shape.questions} questions · ${time} + 10-min break · starts with Reading & Writing`,
    label: source ? `Start ${source}` : 'Start full SAT',
  };
}
