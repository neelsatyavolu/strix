'use client';
import { Page, PageHeader, Tabs } from '@/components/sixteen';
import { useNav } from '@/components/sixteen/session/Navigation';
import DrillTab from './DrillTab';
import FullLengthTab from './FullLengthTab';
import QuestionBank from './QuestionBank';
import { MODE_TO_KIND } from './practiceConfig';
import s from './Practice.module.css';

// Practice — everything you can start: skill drills, full-length practice
// (module / section / full SAT), and the question bank.

const TABS = [
  { value: 'drill', label: 'Drill' },
  { value: 'full', label: 'Full-length' },
  { value: 'bank', label: 'Question bank' },
];

const SUBTITLE = {
  drill: 'Pick a skill and work through a short set of questions.',
  full: 'Timed practice in the real SAT format — one module, a section, or the whole test.',
  bank: 'Look up any real College Board question and check the answer.',
};

// Legacy PracticeSetup params: a full-length `mode` opens the Full-length tab
// (the old 'practice-setup' alias always adds tab: 'drill').
function resolveTab(params) {
  if (MODE_TO_KIND[params.mode] && params.tab !== 'bank') return 'full';
  return TABS.some((t) => t.value === params.tab) ? params.tab : 'drill';
}

export default function PracticeHub({ go, params = {}, readOnly = false, studentId = null, studentName }) {
  const nav = useNav();
  const tab = resolveTab(params);
  const setTab = (t) => nav.replace('practice', { tab: t });
  const shared = { go, initial: params, readOnly, studentName };

  return (
    <Page>
      <PageHeader title="Practice" subtitle={SUBTITLE[tab]} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} style={{ marginBottom: 28 }} />
      <div className={s.body}>
        {tab === 'drill' && <DrillTab {...shared} studentId={studentId} />}
        {tab === 'full' && <FullLengthTab {...shared} />}
        {tab === 'bank' && <QuestionBank initialId={typeof params.id === 'string' ? params.id : ''} />}
      </div>
    </Page>
  );
}
