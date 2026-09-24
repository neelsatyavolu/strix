'use client';
import React from 'react';
import {
  Badge, Button, Card, EmptyState, List, ListRow, Metric, Page, PageHeader, Section,
} from '@/components/sixteen';
import { AccuracyRing } from '@/components/sixteen/stats/AccuracyRing';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { SECTION_LABEL } from '@/components/sixteen/stats/shared';
import { useInsight } from '@/lib/ai/insights';
import { AccuracyMeta, sectionColor } from './progress/DomainList';
import { AttemptRow, DIFF_LABEL } from './progress/QuestionHistory';
import { MetricsSkeleton, ListSkeleton } from './progress/Skeletons';
import p from './progress/Progress.module.css';

// CategoryDetail — drill-in for one CB content domain. Shows skill-level
// accuracy, an AI/baseline study insight, and the full attempt history
// (which exact questions were right/wrong), paginated newest-first.

// Deterministic skill read — the offline fallback. Matches parsed-insight shape.
function categoryBaseline(label, skills, totals) {
  const pool = (skills ?? []).filter((sk) => sk.done > 0);
  if (!pool.length) return null;
  const eligible = pool.filter((sk) => sk.done >= 3);
  const ranked = [...(eligible.length ? eligible : pool)].sort((a, b) => b.accuracy - a.accuracy);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const same = best.skill === worst.skill;
  return {
    summary: `You're at ${totals.accuracy}% across ${totals.done} ${label} question${totals.done === 1 ? '' : 's'}.`,
    strength: `${best.label} — ${best.accuracy}%.`,
    focus: same ? '' : `${worst.label} — ${worst.accuracy}%. This is your weakest skill in ${label}.`,
    actions: same
      ? [`Keep practicing ${label} to build a fuller picture`]
      : [`Target ${worst.label} questions next`, `Re-attempt the ${worst.label} ones you missed below`],
  };
}

function CategoryDetail({ go, section = 'rw', domain, label, studentId = null, readOnly = false, studentName = null }) {
  const accent = sectionColor(section);

  const [data, setData] = React.useState(null);
  const [attempts, setAttempts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [moreError, setMoreError] = React.useState(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [reload, setReload] = React.useState(0);

  const fetchPage = React.useCallback(async (offset) => {
    const sq = studentId ? `&studentId=${encodeURIComponent(studentId)}` : '';
    const res = await fetch(`/api/stats/category?section=${section}&domain=${domain}&limit=100&offset=${offset}${sq}`);
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'Failed to load category');
    return json.data;
  }, [section, domain, studentId]);

  React.useEffect(() => {
    let on = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchPage(0)
      .then((d) => {
        if (!on) return;
        setData(d);
        setAttempts(d.attempts || []);
        setHasMore(!!d.hasMore);
      })
      .catch((e) => on && setError(e.message))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [fetchPage, reload]);

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const d = await fetchPage(attempts.length);
      setAttempts((prev) => [...prev, ...(d.attempts || [])]);
      setHasMore(!!d.hasMore);
    } catch (e) {
      setMoreError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const totals = React.useMemo(() => data?.totals ?? { done: 0, correct: 0, accuracy: 0 }, [data]);
  const skills = React.useMemo(() => data?.skills ?? [], [data]);
  const baseline = React.useMemo(() => categoryBaseline(label, skills, totals), [label, skills, totals]);
  const payload = React.useMemo(() => ({
    category: label,
    section: SECTION_LABEL[section],
    accuracy: totals.accuracy,
    answered: totals.done,
    skills: skills.filter((sk) => sk.done > 0).map((sk) => ({ skill: sk.label, answered: sk.done, accuracy: sk.accuracy })),
    recentMistakes: attempts.filter((a) => !a.isCorrect).slice(0, 8).map((a) => ({
      skill: a.skillLabel, difficulty: DIFF_LABEL[a.difficulty] || a.difficulty, question: a.stem.slice(0, 180),
    })),
  }), [label, section, totals, skills, attempts]);
  const ins = useInsight({ scope: `cat:${section}:${domain}${studentId ? `:${studentId}` : ''}`, payload, baseline, ready: !loading && totals.done > 0 });

  const sectionName = SECTION_LABEL[section] ?? section;
  const subtitle = studentName
    ? `${sectionName} · ${studentName}'s accuracy by skill and every question answered.`
    : `${sectionName} · Accuracy by skill and every question you've answered.`;

  let body;
  if (loading) {
    body = (
      <div className={p.tabBody} aria-busy="true">
        <MetricsSkeleton />
        <ListSkeleton rows={3} />
        <ListSkeleton rows={5} />
      </div>
    );
  } else if (error) {
    body = (
      <div className={p.error} role="alert">
        <span>Couldn&rsquo;t load this category. {error}</span>
        <Button variant="secondary" size="sm" onClick={() => setReload((n) => n + 1)}>Retry</Button>
      </div>
    );
  } else if (totals.done === 0) {
    body = (
      <EmptyState
        icon="list-checks"
        title="No questions yet"
        body={readOnly
          ? `${studentName || 'This student'} hasn't answered any ${label} questions yet.`
          : `Practice ${label} questions to see your history and insights here.`}
        action={readOnly ? null : <Button onClick={() => go('practice', { tab: 'drill' })}>Start a drill</Button>}
      />
    );
  } else {
    body = (
      <div className={p.tabBody}>
        <Card padding="lg">
          <div className={p.metricsWithLead}>
            <AccuracyRing value={totals.accuracy} color={accent} size={76} stroke={7} label="Accuracy" />
            <div className={p.metrics}>
              <Metric label="Answered" value={totals.done} />
              <Metric label="Correct" value={totals.correct} />
              <Metric label="Incorrect" value={totals.done - totals.correct} />
            </div>
          </div>
        </Card>

        <InsightCard title="Insight" accent={accent} {...ins} />

        {skills.length > 0 && (
          <Section title="By skill">
            <List>
              {skills.map((sk, i) => (
                <ListRow
                  key={sk.skill + i}
                  title={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {sk.label}
                      {i === 0 && skills.length > 1 && <Badge variant="success" size="sm">Strongest</Badge>}
                      {i === skills.length - 1 && skills.length > 1 && <Badge variant="warning" size="sm">Focus</Badge>}
                    </span>
                  }
                  subtitle={`${sk.correct} of ${sk.done} correct`}
                  meta={<AccuracyMeta pct={sk.done > 0 ? sk.accuracy : null} color={accent} />}
                />
              ))}
            </List>
          </Section>
        )}

        <Section title="Question history" description={`Showing ${attempts.length} of ${totals.done}, newest first. Select a question to review it.`}>
          <List>
            {attempts.map((a, i) => <AttemptRow key={`${a.at}-${i}`} a={a} />)}
          </List>
          {moreError && <p className={p.caption} style={{ marginTop: 12 }}>Couldn&rsquo;t load more: {moreError}</p>}
          {hasMore && (
            <div className={p.loadMore}>
              <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>Load more</Button>
            </div>
          )}
        </Section>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader title={label || 'Skill'} subtitle={subtitle} />
      {body}
    </Page>
  );
}

export default CategoryDetail;
