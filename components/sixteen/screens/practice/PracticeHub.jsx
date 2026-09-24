'use client';
import { Page, PageHeader, Tabs } from '@/components/sixteen';
import { useNav } from '@/components/sixteen/session/Navigation';
import PracticeSetup from '../PracticeSetup';
import QuestionBank from '../QuestionBank';

// Practice — everything you can start: skill drills, full-length practice
// (module / section / full SAT), and the question bank.

const TABS = [
  { value: 'drill', label: 'Drill' },
  { value: 'full', label: 'Full-length' },
  { value: 'bank', label: 'Question bank' },
];

export default function PracticeHub({ go, params = {}, readOnly = false }) {
  const nav = useNav();
  const tab = TABS.some((t) => t.value === params.tab) ? params.tab : 'drill';
  const setTab = (t) => nav.replace('practice', { tab: t });

  return (
    <Page>
      <PageHeader title="Practice" subtitle="Drill a skill, run a timed module or section, or browse real questions." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} style={{ marginBottom: 24 }} />
      {tab === 'bank' ? <QuestionBank /> : <PracticeSetup go={go} initial={params} readOnly={readOnly} />}
    </Page>
  );
}
