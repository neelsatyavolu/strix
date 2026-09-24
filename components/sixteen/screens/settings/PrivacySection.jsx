'use client';
import React from 'react';
import { Icon, List, ListRow, Section, Toggle } from '@/components/sixteen';
import s from './Settings.module.css';

// Privacy — the Mac app's anonymous usage stats opt-out (window.strix.analytics).
// Hidden on the web and in older desktop builds that don't have the bridge.

function bridge() {
  return typeof window === 'undefined' ? null : window.strix?.analytics || null;
}

export default function PrivacySection() {
  const [enabled, setEnabled] = React.useState(null); // null until the bridge answers

  React.useEffect(() => {
    const api = bridge();
    if (!api) return undefined;
    let alive = true;
    api.enabled()
      .then((on) => { if (alive) setEnabled(on !== false); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (enabled === null) return null;

  const change = (on) => {
    setEnabled(on);
    bridge()?.setEnabled(on)
      .then((saved) => setEnabled(saved !== false))
      .catch(() => setEnabled(!on));
  };

  return (
    <Section title="Privacy">
      <List>
        <ListRow
          leading={<span className={s.iconWell}><Icon name="shield-check" size={15} /></span>}
          title="Share anonymous usage stats"
          subtitle="Sends a daily ping with a random install ID, app version and macOS version. No personal data."
          trailing={<Toggle checked={enabled} onChange={change} />}
        />
      </List>
    </Section>
  );
}
