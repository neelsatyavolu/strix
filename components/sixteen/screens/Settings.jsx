'use client';
import React from 'react';
import { Button, Icon, List, ListRow, Page, PageHeader, Section, SegmentedControl } from '@/components/sixteen';
import ClearDataDialog from './ClearDataDialog';
import AccountSection from './settings/AccountSection';
import StudyGoalSection from './settings/StudyGoalSection';
import AiSection from './settings/AiSection';
import SoftwareUpdateRow from './settings/SoftwareUpdateRow';
import s from './settings/Settings.module.css';

// Settings — Mac System Settings style: grouped rows for account, study goal,
// appearance, AI connections, tutors, updates, and data.

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function Settings({ go, theme, setTheme }) {
  // Connected tutors (for the Tutors row summary).
  const [tutorCount, setTutorCount] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/tutor/invite')
      .then((r) => r.json())
      .then((j) => { if (j?.success) setTutorCount((j.data.tutors || []).length); })
      .catch(() => {});
  }, []);

  // Clear-data dialog.
  const [clearOpen, setClearOpen] = React.useState(false);
  const [clearedMsg, setClearedMsg] = React.useState(null);

  const tutorSubtitle = tutorCount
    ? `${tutorCount} connected · invite link and permissions`
    : 'Invite a tutor to follow your practice and chat';

  return (
    <Page width="narrow">
      <PageHeader title="Settings" />

      <AccountSection onSignedOut={() => go('onboarding')} />

      <StudyGoalSection />

      <Section title="Appearance">
        <List>
          <ListRow
            leading={<span className={s.iconWell}><Icon name="sun-moon" size={15} /></span>}
            title="Theme"
            subtitle="Light, dark, or match your system"
            trailing={<SegmentedControl size="sm" value={theme} onChange={setTheme} options={THEME_OPTIONS} label="Theme" />}
          />
        </List>
      </Section>

      <AiSection />

      <Section title="Tutors">
        <List>
          <ListRow
            leading={<span className={s.iconWell}><Icon name="users" size={15} /></span>}
            title="Manage tutors"
            subtitle={tutorSubtitle}
            onClick={() => go('tutor', { tab: 'tutors' })}
          />
        </List>
      </Section>

      <Section title="Software update">
        <List>
          <SoftwareUpdateRow />
        </List>
      </Section>

      <Section title="Data">
        <List>
          <ListRow
            leading={<span className={s.iconWell}><Icon name="trash-2" size={15} /></span>}
            title="Clear practice data"
            subtitle={clearedMsg || 'Delete sessions, questions, and answers. This can’t be undone.'}
            trailing={(
              <Button variant="destructive" size="sm" onClick={() => { setClearedMsg(null); setClearOpen(true); }}>
                Clear data…
              </Button>
            )}
          />
        </List>
      </Section>

      {clearOpen && (
        <ClearDataDialog
          onClose={() => setClearOpen(false)}
          onCleared={(deleted) => setClearedMsg(`Deleted ${deleted} ${deleted === 1 ? 'session' : 'sessions'}.`)}
        />
      )}
    </Page>
  );
}

export default Settings;
