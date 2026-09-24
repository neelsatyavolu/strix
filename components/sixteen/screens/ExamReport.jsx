'use client';
import { Button, EmptyState, Page } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { compositeScore, compositeRange } from '@/lib/scoring/curve';
import { ResultHeader } from './result/ResultHeader';
import { SectionResult } from './result/SectionResult';
import { SECTION_COLOR, SECTION_LABEL, finiteRange, outcomeStats, rangeHint, tally } from './result/format';

// ExamReport — full SAT composite (400–1600) from the two section snapshots.

// Composite range needs each section's estimate as well as its bounds.
const fullRange = (r) => finiteRange(r) && Number.isFinite(r.estimate);

function ExamReport({ go }) {
  const session = usePracticeSession();
  const exam = session.exam;

  if (!exam || exam.results.length < exam.sections.length) {
    return (
      <Page width="narrow">
        <EmptyState
          icon="file-text"
          title="No completed exam"
          body="Finish both sections of a full SAT to see your composite score."
          action={<Button onClick={() => go('practice-setup')}>Start a full SAT</Button>}
        />
      </Page>
    );
  }

  const rw = exam.results.find((r) => r.section === 'rw');
  const math = exam.results.find((r) => r.section === 'math');
  const ordered = [rw, math].filter(Boolean);
  const total = compositeScore(rw?.scaled, math?.scaled);
  const totalRange = fullRange(rw?.scaledRange) && fullRange(math?.scaledRange)
    ? compositeRange(rw.scaledRange, math.scaledRange)
    : null;
  const counts = tally(ordered.flatMap((s) => s.review));
  const leave = (view) => { session.reset(); go(view); };

  return (
    <Page>
      <ResultHeader
        meta={['Full SAT', 'Today']}
        title="You finished the full test"
        subtitle="A calibrated estimate with a likely range. Official scores use College Board’s item-level scoring."
        score={{ value: total, max: 1600, label: 'Estimated score', hint: rangeHint(totalRange) }}
        stats={outcomeStats(counts, {
          extra: ordered.map((s) => ({ label: SECTION_LABEL[s.section], value: s.scaled, color: SECTION_COLOR[s.section] })),
        })}
        actions={(
          <>
            <Button variant="secondary" onClick={() => leave('dashboard')}>Back to home</Button>
            <Button onClick={() => leave('practice-setup')}>New test</Button>
          </>
        )}
      />

      {ordered.map((s) => (
        <SectionResult key={s.section} result={s} />
      ))}
    </Page>
  );
}

export default ExamReport;
