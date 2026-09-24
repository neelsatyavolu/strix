'use client';
import { Page, PageHeader, Tabs } from '@/components/sixteen';
import { useNav } from '@/components/sixteen/session/Navigation';
import Stats from '../Stats';
import Sessions from '../Sessions';
import PracticeAnalysis from '../practice-analysis/PracticeAnalysis';

// Progress — looking back: score trend, per-section breakdowns, full-length
// attempts, and the full history of sessions.

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'rw', label: 'Reading & Writing' },
  { value: 'math', label: 'Math' },
  { value: 'full', label: 'Full-length' },
  { value: 'history', label: 'History' },
];

export default function ProgressHub({ go, params = {}, studentId = null, readOnly = false, studentName = null }) {
  const nav = useNav();
  const tab = TABS.some((t) => t.value === params.tab) ? params.tab : 'overview';
  const setTab = (t) => nav.replace('progress', { tab: t });
  const kind = ['modules', 'sections', 'tests'].includes(params.kind) ? params.kind : 'tests';

  return (
    <Page>
      <PageHeader
        title="Progress"
        subtitle={studentName ? `${studentName}'s scores, strengths, and practice history.` : 'Your scores, strengths, and practice history.'}
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} style={{ marginBottom: 24 }} />
      {tab === 'history' && <Sessions go={go} studentId={studentId} />}
      {tab === 'full' && <PracticeAnalysis go={go} kind={kind} studentId={studentId} readOnly={readOnly} />}
      {(tab === 'overview' || tab === 'rw' || tab === 'math') && <Stats go={go} studentId={studentId} />}
    </Page>
  );
}
