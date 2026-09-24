'use client';
import React from 'react';
import { Button, List, ListRow, Section } from '@/components/sixteen';
import { useAiConnection, CodeEntry, ProviderMark, PROVIDER_LABEL, statusKey } from '@/components/sixteen/chat/AiConnect';
import { aiStatus, isDesktop } from '@/lib/ai/bridge';
import s from './Settings.module.css';

// AI connections — the student's own ChatGPT / Grok account, via the desktop
// bridge (or the paste-a-code flow on the web).

export default function AiSection() {
  const desktop = isDesktop();
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  React.useEffect(() => { aiStatus().then(setConnected).catch(() => {}); }, []);

  const chatgpt = useAiConnection('chatgpt', setConnected);
  const grok = useAiConnection('grok', setConnected);

  return (
    <Section
      title="AI tutor"
      description="Use your own ChatGPT or Grok subscription for hints during drills. Not available in full modules or scored sections."
    >
      <List>
        <ProviderRow kind="chatgpt" conn={chatgpt} connected={connected[statusKey('chatgpt')]} desktop={desktop} />
        <ProviderRow kind="grok" conn={grok} connected={connected[statusKey('grok')]} desktop={desktop} />
      </List>
    </Section>
  );
}

function ProviderRow({ kind, conn, connected, desktop }) {
  const subtitle = conn.error
    ? <span className={s.error}>{conn.error}</span>
    : (connected ? 'Connected' : 'Not connected');
  return (
    <>
      <ListRow
        leading={<ProviderMark kind={kind} />}
        title={PROVIDER_LABEL[kind]}
        subtitle={subtitle}
        trailing={connected ? (
          <Button variant="ghost" size="sm" loading={conn.busy} onClick={conn.disconnect}>Disconnect</Button>
        ) : (
          <Button variant="secondary" size="sm" loading={conn.busy} onClick={conn.connect}>Connect</Button>
        )}
      />
      {conn.pasteOpen && !connected && (
        <div className={s.extra}>
          <CodeEntry kind={kind} desktop={desktop} conn={conn} />
        </div>
      )}
    </>
  );
}
