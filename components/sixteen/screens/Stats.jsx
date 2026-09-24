'use client';
import React from 'react';
import { Button } from '@/components/sixteen';
import { useStats, useSessions } from '@/lib/data/hooks';
import OverviewTab from './progress/OverviewTab';
import SectionTab from './progress/SectionTab';
import { TabSkeleton } from './progress/Skeletons';
import s from './progress/Progress.module.css';

// Stats — loads practice stats for the Progress hub and renders the tab it's
// given: 'overview', or one section ('rw' | 'math'). The hub owns the tabs.

function Stats(props) {
  // Remounting the body re-runs the data hooks, which is how Retry refetches.
  const [attempt, setAttempt] = React.useState(0);
  return <StatsBody key={attempt} {...props} onRetry={() => setAttempt((a) => a + 1)} />;
}

function StatsBody({ go, tab = 'overview', studentId = null, readOnly = false, studentName = null, onTabChange, onRetry }) {
  const { stats, loading } = useStats(studentId);
  const { sessions, loading: sessionsLoading } = useSessions(50, studentId);

  const waiting = (loading && !stats) || (tab === 'overview' && sessionsLoading && !sessions.length);
  if (waiting) return <TabSkeleton />;
  if (!stats) {
    return (
      <div className={s.error} role="alert">
        <span>Couldn&rsquo;t load progress. Check your connection and try again.</span>
        <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  const shared = { stats, go, studentId, readOnly, studentName };
  if (tab === 'rw' || tab === 'math') return <SectionTab key={tab} section={tab} {...shared} />;
  return <OverviewTab {...shared} sessions={sessions} onTabChange={onTabChange ?? (() => {})} />;
}

export default Stats;
