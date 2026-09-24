'use client';
import React from 'react';
import { Button, Page, Section } from '@/components/sixteen';
import { useTeach } from '@/components/tutor/TeachContext';
import { ResultHeader } from './result/ResultHeader';
import { DomainBreakdown } from './result/DomainBreakdown';
import { QuestionList } from './result/QuestionList';
import { ResultError, ResultSkeleton } from './result/ResultStates';
import { MODE_LABEL, formatDate, outcomeStats, rangeHint, tally } from './result/format';

// SessionDetail — read-only review of one persisted practice session (result +
// per-question right/wrong), loaded from /api/sessions/:id. Works for your own
// history and, for a tutor, a watched student's sessions (RLS-scoped).

function SessionDetail({ id, readOnly = false, studentName }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [attempt, setAttempt] = React.useState(0);
  const [filter, setFilter] = React.useState('all');
  const listRef = React.useRef(null);

  React.useEffect(() => {
    let on = true;
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!on) return;
        if (j?.success) setData(j.data);
        else setError(j?.error || 'Could not load this session.');
        setLoading(false);
      })
      .catch(() => { if (on) { setError('Could not load this session.'); setLoading(false); } });
    return () => { on = false; };
  }, [id, attempt]);

  const retry = () => { setError(null); setLoading(true); setAttempt((n) => n + 1); };

  // Teaching mode: the tutor can pull the student to a question ("Show student").
  // A new pull clears the filter and expands that question before scrolling.
  const teach = useTeach();
  const gotoQid = teach?.role === 'student' ? teach.goto?.qid : null;
  const gotoSeq = teach?.role === 'student' ? teach.goto?.n : null;
  const gotoKey = gotoQid ? `${gotoQid}:${gotoSeq ?? ''}` : null;
  const [seenGoto, setSeenGoto] = React.useState(null);
  if (gotoKey && gotoKey !== seenGoto) {
    setSeenGoto(gotoKey);
    setFilter('all');
  }
  React.useEffect(() => {
    if (!gotoQid) return;
    const el = document.querySelector(`[data-teach-question="${CSS.escape(gotoQid)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [gotoQid, gotoSeq]);

  if (loading) return <Page><ResultSkeleton /></Page>;
  if (error) {
    return (
      <Page width="narrow">
        <ResultError title="Couldn’t load this session" message={error} onRetry={retry} />
      </Page>
    );
  }

  const section = data.section || 'rw';
  const isDrill = (data.mode || 'drill') === 'drill';
  const showScaled = !isDrill && data.scaled != null;
  // For a targeted drill every question shares one domain — surface it.
  const drillCat = isDrill ? (data.review || []).find((r) => r.question?.domainLabel)?.question?.domainLabel : null;
  const counts = tally(data.review);
  const whose = readOnly && studentName ? `${studentName}’s` : 'Your';

  const reviewMistakes = () => {
    setFilter('incorrect');
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <Page>
      <ResultHeader
        section={section}
        meta={[MODE_LABEL[data.mode] || data.mode, drillCat, formatDate(data.createdAt)]}
        title={`${data.correct} of ${data.total} correct`}
        subtitle={`${whose} answers, question by question. Skipped questions aren’t saved.`}
        score={showScaled
          ? { value: data.scaled, max: 800, label: 'Estimated score', hint: rangeHint(data.scaledRange), domain: section }
          : { value: data.accuracy, label: 'Accuracy', domain: section }}
        stats={outcomeStats(counts)}
        actions={counts.incorrect > 0 && (
          <Button onClick={reviewMistakes}>Review mistakes</Button>
        )}
      />

      {data.byDomain?.length > 0 && (
        <Section title="By domain">
          <DomainBreakdown domains={data.byDomain} section={section} />
        </Section>
      )}

      <div ref={listRef} style={{ marginTop: 36, scrollMarginTop: 16 }}>
        <Section title="Questions" description="Open any question to see the answer and explanation.">
          <QuestionList
            review={data.review}
            filter={filter}
            onFilterChange={setFilter}
            revealQid={gotoQid}
            revealSeq={gotoSeq}
            emptyTitle="No questions recorded for this session"
          />
        </Section>
      </div>
    </Page>
  );
}

export default SessionDetail;
