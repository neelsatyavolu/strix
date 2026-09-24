'use client';
import { Button, Icon, Page, PageHeader, Skeleton } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useStats, useSessions, useReviewQueue, useAssignments } from '@/lib/data/hooks';
import { buildSteps } from './home/nextSteps';
import { greeting, openAssignments, plural } from './home/helpers';
import { UpNext } from './home/UpNext';
import { PendingList } from './home/PendingList';
import { ScoreSummary } from './home/ScoreSummary';
import { FocusSkills } from './home/FocusSkills';
import { RecentActivity } from './home/RecentActivity';
import { HowItWorks } from './home/HowItWorks';
import { HomeSkeleton } from './home/HomeSkeleton';
import s from './home/Home.module.css';

// Home — what to do next (one recommended step) and where the student stands
// (score estimate, weakest skills, recent sessions). A tutor watching a student
// (readOnly) sees the same picture in third person, with no start actions.

function statusLine(stats, { readOnly, firstName }) {
  const done = stats?.sectionTotals?.overall?.done
    ?? (stats?.sectionTotals?.rw?.done || 0) + (stats?.sectionTotals?.math?.done || 0);
  if (!(stats?.sessionCount > 0)) {
    return readOnly
      ? `${firstName} hasn't practiced yet.`
      : 'Welcome to Strix. Your first session takes about ten minutes.';
  }
  const overall = stats.sectionTotals?.overall;
  const acc = overall?.recentAccuracy ?? overall?.accuracy;
  const parts = [`${plural(done, 'question')} answered`];
  if (acc != null) parts.push(`${acc}% recent accuracy`);
  return parts.join(' · ');
}

function Dashboard({ go, studentId = null, readOnly = false, studentName = null }) {
  const { displayName } = useProfile();
  // When a tutor is watching a student, address the student, not the tutor.
  const firstName = ((studentName || displayName) || '').split(' ')[0] || 'there';

  const session = usePracticeSession();
  const { stats, loading: statsLoading } = useStats(studentId);
  const { sessions, loading: sessionsLoading } = useSessions(6, studentId);
  const { queue: reviewQueue, loading: queueLoading } = useReviewQueue(studentId);
  const { assignments, loading: assignmentsLoading } = useAssignments();
  // Wait for everything that can change the recommended step, so the hero
  // doesn't swap once a slower request lands. (Cached revisits are instant.)
  const loading = statsLoading || queueLoading || (!readOnly && assignmentsLoading);

  const reviewDue = reviewQueue?.count ?? 0;
  const focus = stats?.focus || [];
  const hasData = (stats?.sessionCount || 0) > 0;
  const failed = !statsLoading && !stats;

  // One-click launch into a focused drill on a recommended weak skill.
  const launchFocus = (f) => {
    if (readOnly) return;
    session.start({ section: f.section, mode: 'drill', category: f.id, difficulty: 'all', count: 10 });
    go(f.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  // A drill / review / assignment left unfinished can be picked back up (never in
  // a tutor's read-only view — the snapshot belongs to the signed-in account).
  const resumeNow = () => {
    const snap = session.resume();
    if (snap) go(snap.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const allSteps = readOnly ? [] : buildSteps(
    {
      resumable: session.resumable,
      assignments: openAssignments(assignments),
      reviewDue,
      focus,
      hasData,
      scores: stats?.scores,
      firstName,
    },
    { resume: resumeNow, discard: session.discardResumable, launchFocus, go },
  );
  // Without stats we can't tell a new student from a failed load: no welcome.
  const steps = failed ? allSteps.filter((st) => st.key !== 'welcome') : allSteps;

  const header = (
    <PageHeader
      title={readOnly ? (studentName || 'Student') : `${greeting()}, ${firstName}`}
      subtitle={
        loading ? <Skeleton width={260} height={14} style={{ marginTop: 4 }} />
          : failed ? null
            : statusLine(stats, { readOnly, firstName })
      }
      actions={readOnly || !hasData ? null : (
        <Button variant="secondary" onClick={() => go('practice')} icon={<Icon name="play" size={13} />}>
          Start practice
        </Button>
      )}
    />
  );

  if (loading) {
    return <Page>{header}<HomeSkeleton /></Page>;
  }

  return (
    <Page>
      {header}
      {failed && (
        <div className={s.error} role="alert">
          <span>We couldn&apos;t load {readOnly ? `${firstName}'s` : 'your'} progress just now.</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      )}

      {readOnly ? (
        <PendingList studentId={studentId} firstName={firstName} reviewDue={reviewDue} focus={focus} go={go} />
      ) : (
        <UpNext steps={steps} />
      )}

      {failed ? (
        <RecentActivity sessions={sessions} loading={sessionsLoading} readOnly={readOnly} firstName={firstName} go={go} />
      ) : !readOnly && !hasData ? (
        <HowItWorks />
      ) : (
        <>
          <ScoreSummary stats={stats} readOnly={readOnly} firstName={firstName} go={go} />
          <FocusSkills focus={focus} readOnly={readOnly} firstName={firstName} onPractice={launchFocus} />
          <RecentActivity sessions={sessions} loading={sessionsLoading} readOnly={readOnly} firstName={firstName} go={go} />
        </>
      )}
    </Page>
  );
}

export default Dashboard;
