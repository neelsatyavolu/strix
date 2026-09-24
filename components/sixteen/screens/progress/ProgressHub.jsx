'use client';
import { Page, PageHeader, Tabs } from '@/components/sixteen';
import { useNav } from '@/components/sixteen/session/Navigation';
import Stats from '../Stats';
import Sessions from '../Sessions';
import PracticeAnalysis from '../practice-analysis/PracticeAnalysis';

// Progress — looking back: score trend, per-section breakdowns, full-length
// attempts, and the full history of sessions. The hub owns the page chrome and
// tabs; `params.tab` picks the view, `params.kind` the full-length type.

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'rw', label: 'Reading & Writing' },
  { value: 'math', label: 'Math' },
  { value: 'full', label: 'Full-length' },
  { value: 'history', label: 'History' },
];

const KINDS = ['modules', 'sections', 'tests'];

export default function ProgressHub({ go, params = {}, studentId = null, readOnly = false, studentName = null }) {
  const nav = useNav();
  const tab = TABS.some((t) => t.value === params.tab) ? params.tab : 'overview';
  const kind = KINDS.includes(params.kind) ? params.kind : 'tests';
  const setTab = (t) => nav.replace('progress', { ...params, tab: t });
  const setKind = (k) => nav.replace('progress', { ...params, tab: 'full', kind: k });
  const watch = { studentId, readOnly, studentName };

  return (
    <Page>
      <PageHeader
        title="Progress"
        subtitle={studentName
          ? `${studentName}'s scores, strengths, and practice history.`
          : 'Your scores, strengths, and practice history.'}
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} style={{ marginBottom: 28 }} />
      {tab === 'history' && <Sessions go={go} {...watch} />}
      {tab === 'full' && <PracticeAnalysis go={go} kind={kind} onKindChange={setKind} {...watch} />}
      {(tab === 'overview' || tab === 'rw' || tab === 'math') && (
        <Stats go={go} tab={tab} onTabChange={setTab} {...watch} />
      )}
    </Page>
  );
}
