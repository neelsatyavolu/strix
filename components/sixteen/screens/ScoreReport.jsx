'use client';
import { Button, EmptyState, Page, Section } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { ResultHeader } from './result/ResultHeader';
import { DomainBreakdown } from './result/DomainBreakdown';
import { QuestionList } from './result/QuestionList';
import { MODE_LABEL, SECTION_LABEL, outcomeStats, rangeHint, tally } from './result/format';

// ScoreReport — drill report or scaled section report, from the live session.

function ScoreReport({ go }) {
  const session = usePracticeSession();
  if (session.status === 'submitted' && session.result) {
    return <Report go={go} session={session} />;
  }
  return (
    <Page width="narrow">
      <EmptyState
        icon="chart-column"
        title="No results yet"
        body="Finish a practice session to see your score and review."
        action={<Button onClick={() => go('practice-setup')}>Start practicing</Button>}
      />
    </Page>
  );
}

function Report({ go, session }) {
  const r = session.result;
  const mode = session.config?.mode;
  const isDrill = mode === 'drill' || mode === 'review';
  const isEstimate = !isDrill && r.scaled != null;
  const counts = tally(r.review);
  const leave = (view, params) => { session.reset(); go(view, params); };

  const routedLabel = r.m2Variant === 'hard' ? 'Module 2B (harder)' : r.m2Variant === 'easy' ? 'Module 2A (easier)' : null;
  const title = isDrill
    ? `You answered ${r.correct} of ${r.total} correctly`
    : isEstimate ? 'You finished the section' : 'You finished Module 1';
  const subtitle = isDrill
    ? 'Review what you missed — the explanations are what move your score.'
    : isEstimate
      ? `A calibrated estimate with a likely range${routedLabel ? `; you were routed to ${routedLabel}` : ''}. Official scores use College Board’s item-level scoring.`
      : 'Module 1 shows raw accuracy only — a section score needs both modules.';

  const score = isEstimate
    ? { value: r.scaled, max: 800, label: 'Estimated score', hint: rangeHint(r.scaledRange), domain: r.section }
    : { value: r.accuracy, label: 'Accuracy', domain: r.section };

  return (
    <Page>
      <ResultHeader
        section={r.section}
        meta={[MODE_LABEL[mode] || null, 'Today']}
        title={title}
        subtitle={subtitle}
        score={score}
        stats={outcomeStats(counts, { timeMs: r.elapsedMs || null })}
        actions={(
          <>
            <Button variant="secondary" onClick={() => leave('dashboard')}>Back to home</Button>
            <Button onClick={() => leave('practice-setup', { domain: r.section })}>
              {isDrill ? 'Practice again' : 'New section'}
            </Button>
          </>
        )}
      />

      <Section title="By domain" description={`How you did across ${SECTION_LABEL[r.section] || 'each domain'}.`}>
        <DomainBreakdown domains={r.byDomain} section={r.section} />
      </Section>

      <Section title="Questions" description="Open any question to see the answer and explanation.">
        <QuestionList review={r.review} />
      </Section>
    </Page>
  );
}

export default ScoreReport;
