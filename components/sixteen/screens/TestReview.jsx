'use client';
import React from 'react';
import { Button, Page } from '@/components/sixteen';
import { compositeScore, compositeRange } from '@/lib/scoring/curve';
import { ResultHeader } from './result/ResultHeader';
import { SectionResult } from './result/SectionResult';
import { ResultError, ResultSkeleton } from './result/ResultStates';
import { SECTION_COLOR, SECTION_LABEL, finiteRange, formatDate, outcomeStats, rangeHint, tally } from './result/format';

// TestReview — read-only review of a full SAT (both sections together), loaded
// from the two persisted half-sessions. Composes the 400–1600 composite from
// each half and lays out both section breakdowns and question reviews.

// The API returns each half's range as { lower, upper }; the composite also
// needs the half's estimate, which is its scaled score.
const withEstimate = (h) =>
  finiteRange(h?.scaledRange) && Number.isFinite(h.scaled) ? { estimate: h.scaled, ...h.scaledRange } : null;

function TestReview({ rwId, mathId, readOnly = false, studentName }) {
  const [halves, setHalves] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [attempt, setAttempt] = React.useState(0);
  const [filter, setFilter] = React.useState('all');
  const listRef = React.useRef(null);

  React.useEffect(() => {
    let on = true;
    const ids = [rwId, mathId].filter(Boolean);
    Promise.all(ids.map((id) => fetch(`/api/sessions/${id}`).then((r) => r.json())))
      .then((results) => {
        if (!on) return;
        const ok = results.filter((j) => j?.success).map((j) => j.data);
        if (!ok.length) setError(results[0]?.error || 'Could not load this test.');
        else setHalves(ok);
        setLoading(false);
      })
      .catch(() => { if (on) { setError('Could not load this test.'); setLoading(false); } });
    return () => { on = false; };
  }, [rwId, mathId, attempt]);

  const retry = () => { setError(null); setLoading(true); setAttempt((n) => n + 1); };

  if (loading) return <Page><ResultSkeleton /></Page>;
  if (error) {
    return (
      <Page width="narrow">
        <ResultError title="Couldn’t load this test" message={error} onRetry={retry} />
      </Page>
    );
  }

  const rw = halves.find((h) => h.section === 'rw') || null;
  const math = halves.find((h) => h.section === 'math') || null;
  const ordered = [rw, math].filter(Boolean);
  const total = rw && math ? compositeScore(rw.scaled, math.scaled) : null;
  const rwRange = withEstimate(rw);
  const mathRange = withEstimate(math);
  const totalRange = rwRange && mathRange ? compositeRange(rwRange, mathRange) : null;
  const counts = tally(ordered.flatMap((h) => h.review));
  const date = formatDate(ordered[0]?.createdAt);
  const whose = readOnly && studentName ? `${studentName}’s` : 'Your';

  const reviewMistakes = () => {
    setFilter('incorrect');
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <Page>
      <ResultHeader
        meta={['Full SAT', date]}
        title="Full SAT review"
        subtitle={`${whose} full-length test, section by section. Scores are calibrated estimates with a likely range.`}
        score={{ value: total ?? '—', max: 1600, label: total != null ? 'Estimated score' : 'One section missing', hint: rangeHint(totalRange) }}
        stats={outcomeStats(counts, {
          extra: ordered.map((h) => ({ label: SECTION_LABEL[h.section], value: h.scaled ?? '—', color: SECTION_COLOR[h.section] })),
        })}
        actions={counts.incorrect > 0 && (
          <Button onClick={reviewMistakes}>Review mistakes</Button>
        )}
      />

      <div ref={listRef} style={{ scrollMarginTop: 16 }}>
        {ordered.map((h) => (
          <SectionResult key={h.section} result={h} filter={filter} onFilterChange={setFilter} />
        ))}
      </div>
    </Page>
  );
}

export default TestReview;
