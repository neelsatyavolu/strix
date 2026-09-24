'use client';
import { Button, Card, EmptyState, Icon, List, Metric, Page, PageHeader, Section, Skeleton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useReviewQueue } from '@/lib/data/hooks';
import { MATH_DOMAINS, RW_DOMAINS } from '@/lib/cb/domains';
import s from './Review.module.css';

// Review — spaced-repetition practice. Questions you've missed resurface here on
// a schedule; getting one right twice retires it. Runs one section at a time
// because the practice surface is section-specific.

const SECTIONS = [
  { id: 'rw', label: 'Reading & Writing', domains: RW_DOMAINS },
  { id: 'math', label: 'Math', domains: MATH_DOMAINS },
];

function Review({ go, studentId = null, readOnly = false, studentName = null }) {
  const session = usePracticeSession();
  const { queue, loading, reload } = useReviewQueue(studentId);
  const firstName = studentName ? studentName.split(' ')[0] : null;

  const count = queue?.count ?? 0;
  const bySection = queue?.bySection ?? { rw: 0, math: 0 };
  const byDomain = queue?.byDomain ?? [];
  // One primary action: the section with more due.
  const primary = (bySection.math || 0) > (bySection.rw || 0) ? 'math' : 'rw';

  const startReview = (section) => {
    if (readOnly) return;
    session.start({ mode: 'review', section });
    go(section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const subtitle = firstName
    ? `Questions ${firstName} missed come back on a schedule until they get them right.`
    : 'Questions you missed come back on a schedule until you get them right.';

  let body;
  if (loading && !queue) {
    body = <ReviewSkeleton />;
  } else if (!queue) {
    body = (
      <p className={s.error}>
        Couldn’t load the review queue.{' '}
        <Button variant="ghost" size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  } else if (count === 0) {
    body = (
      <List>
        <EmptyState
          icon="check-circle-2"
          title="All caught up"
          body={firstName
            ? `Nothing is due for ${firstName} right now. Missed questions show up here when it’s time to see them again.`
            : 'Nothing is due right now. Questions you miss in practice show up here when it’s time to see them again.'}
          action={!readOnly && (
            <Button variant="secondary" onClick={() => go('practice')} icon={<Icon name="play" size={13} />}>Practice instead</Button>
          )}
        />
      </List>
    );
  } else {
    body = (
      <Section
        title="Due now"
        description={readOnly ? `${firstName || 'Your student'} starts these from their own Review page.` : 'Review one section at a time.'}
      >
        <div className={s.grid}>
          {SECTIONS.map((sec) => (
            <SectionQueue
              key={sec.id}
              section={sec}
              due={bySection[sec.id] || 0}
              domains={byDomain.filter((d) => sec.domains[d.domain] != null)}
              primary={sec.id === primary}
              readOnly={readOnly}
              onStart={() => startReview(sec.id)}
            />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Review"
        subtitle={subtitle}
        actions={count > 0 && <Metric size="sm" label="Due now" value={count} />}
      />
      {body}
    </Page>
  );
}

function SectionQueue({ section, due, domains, primary, readOnly, onStart }) {
  return (
    <Card padding="lg" className={s.card}>
      <div className={s.cardHead}>
        <span className={cx(s.dot, s[section.id])} aria-hidden="true" />
        <h3 className={s.cardTitle}>{section.label}</h3>
      </div>
      <Metric value={due} unit={due === 1 ? 'question due' : 'questions due'} />
      {domains.length > 0 && (
        <ul className={s.domains}>
          {domains.map((d) => (
            <li key={d.domain} className={s.domain}>
              <span className={s.domainLabel}>{d.label}</span>
              <span className={s.domainCount}>{d.count}</span>
            </li>
          ))}
        </ul>
      )}
      {due === 0 ? (
        <p className={s.none}>Nothing due in {section.label}.</p>
      ) : !readOnly && (
        <Button
          variant={primary ? 'primary' : 'secondary'}
          icon={<Icon name="play" size={12} />}
          onClick={onStart}
          className={s.start}
        >
          Start review
        </Button>
      )}
    </Card>
  );
}

function ReviewSkeleton() {
  return (
    <div className={s.grid}>
      {[0, 1].map((i) => (
        <Card key={i} padding="lg" className={s.card}>
          <Skeleton width="40%" height={15} />
          <Skeleton width={72} height={28} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="65%" height={12} />
          <Skeleton width={120} height={32} radius={8} />
        </Card>
      ))}
    </div>
  );
}

export default Review;
