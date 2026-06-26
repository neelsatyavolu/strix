'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { aiStatus, aiConnect, aiDisconnect, isDesktop } from '@/lib/ai/bridge';
import { useUpdates } from '@/lib/updates/useUpdates';

// Settings — appearance, account, practice defaults.

function Settings({ go, dark, setDark }) {
  const { Card, Toggle, SegmentedControl, Input, Avatar, Button, Badge } = SixteenNS;
  const { displayName, email, profile, signOut } = useProfile();

  const [theme, setTheme] = React.useState(dark ? 'dark' : 'light');
  React.useEffect(() => { setDark(theme === 'dark'); }, [theme]);

  const [warn5, setWarn5] = React.useState(true);
  const [pacing, setPacing] = React.useState(true);

  // Real AI connection status from the desktop bridge.
  const desktop = isDesktop();
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  const [busy, setBusy] = React.useState(null);   // 'chatgpt' | 'grok' | null
  const [aiError, setAiError] = React.useState({});  // { [kind]: message }
  const refreshAi = React.useCallback(() => aiStatus().then(setConnected).catch(() => {}), []);
  React.useEffect(() => { refreshAi(); }, [refreshAi]);

  const connectAi = async (kind) => {
    setBusy(kind);
    setAiError((e) => ({ ...e, [kind]: null }));
    try {
      const res = await aiConnect(kind);
      if (res && res.ok === false) throw new Error(res.error || 'Connection was cancelled.');
      await refreshAi();
    } catch (err) {
      setAiError((e) => ({ ...e, [kind]: err?.message || 'Could not connect.' }));
    } finally {
      setBusy(null);
    }
  };

  const disconnectAi = async (kind) => {
    setBusy(kind);
    try { await aiDisconnect(kind); await refreshAi(); }
    catch { /* status refresh below reflects reality */ }
    finally { setBusy(null); }
  };

  // Real connected tutors.
  const [tutors, setTutors] = React.useState([]);
  React.useEffect(() => {
    fetch('/api/tutor/invite')
      .then((r) => r.json())
      .then((j) => { if (j?.success) setTutors(j.data.tutors || []); })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await signOut();
    go('onboarding');
  };

  return (
    <div style={{padding: '28px 36px', maxWidth: 760}}>
      <h1 style={{margin:'0 0 22px', font:'var(--role-title-lg)'}}>Settings</h1>

      <SectionHead label="Profile" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <div style={{display:'flex', alignItems:'center', gap: 14, marginBottom: 14}}>
          <Avatar name={displayName} size="lg" />
          <div style={{flex: 1}}>
            <div style={{font:'var(--role-title-sm)'}}>{displayName}</div>
            <div style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{email}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
        <FieldRow label="Display name">
          <Input value={displayName} readOnly />
        </FieldRow>
        <FieldRow label="Target score">
          <Input value={profile?.target_score ?? ''} placeholder="Not set" readOnly />
        </FieldRow>
      </Card>

      <SectionHead label="Appearance" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16}}>
          <div style={{display:'flex', flexDirection:'column', flex: 1}}>
            <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>Theme</span>
            <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', marginTop: 2}}>Light, dark, or follow your system setting.</span>
          </div>
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { value:'light',  label:'Light' },
              { value:'dark',   label:'Dark' },
              { value:'system', label:'System' },
            ]}
          />
        </div>
      </Card>

      <SectionHead label="Software update" />
      <SoftwareUpdate Card={Card} Button={Button} Badge={Badge} />

      <SectionHead label="Practice" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <Toggle checked={warn5} onChange={setWarn5} label="Warn at 5 minutes left" description="The timer pulses when time is low." />
        <div style={{height: 12}}/>
        <Toggle checked={pacing} onChange={setPacing} label="Show live session stats" description="Floating panel on the question screen." />
        <div style={{height: 12}}/>
        <Toggle checked={false} label="Auto-end timed drills" description="When the clock hits zero, finish the session automatically." />
      </Card>

      <SectionHead label="AI tutor connections" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <p style={{margin:'0 0 14px', font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
          Connect a model to chat with an AI tutor during drills. AI tutors aren't available during full modules or scored sections.
        </p>
        <ProviderRow
          kind="chatgpt"
          name="ChatGPT"
          desktop={desktop}
          connected={connected.codex}
          busy={busy === 'chatgpt'}
          error={aiError.chatgpt}
          onConnect={() => connectAi('chatgpt')}
          onDisconnect={() => disconnectAi('chatgpt')}
          Badge={Badge}
          Button={Button}
          style={{paddingBottom: 14, borderBottom: '1px solid var(--border-1)'}}
        />
        <ProviderRow
          kind="grok"
          name="Grok"
          desktop={desktop}
          connected={connected.grok}
          busy={busy === 'grok'}
          error={aiError.grok}
          onConnect={() => connectAi('grok')}
          onDisconnect={() => disconnectAi('grok')}
          Badge={Badge}
          Button={Button}
          style={{paddingTop: 14}}
        />
      </Card>

      <SectionHead label="Tutor mode" />
      <Card padding="lg">
        <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
          Tutors can watch your practice and chat. They can't answer for you.
        </span>
        {tutors.length === 0 ? (
          <p style={{margin:'10px 0 0', font:'var(--role-body)', color:'var(--text-tertiary)'}}>No tutors connected yet.</p>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap: 12, marginTop: 12}}>
            {tutors.map((t, i) => {
              const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
              const tname = p?.full_name || 'Tutor';
              return (
                <div key={t.tutor_id || i} style={{display:'flex', alignItems:'center', gap: 10}}>
                  <Avatar name={tname} size="sm" presence="online" />
                  <div style={{flex: 1}}>
                    <div style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{tname}</div>
                    <div style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{p?.email || ''}</div>
                  </div>
                  <Badge variant="success" size="sm">Online</Badge>
                </div>
              );
            })}
          </div>
        )}
        <div style={{display:'flex', justifyContent:'flex-end', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-1)'}}>
          <Button variant="secondary" onClick={() => go('tutor-invite')}>Manage tutors</Button>
        </div>
      </Card>
    </div>
  );
}

function SoftwareUpdate({ Card, Button, Badge }) {
  const { desktop, status, progress, version, currentVersion, canInstall, check, install, openDownload } = useUpdates();

  if (!desktop) {
    return (
      <Card padding="lg" style={{ marginBottom: 18 }}>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
          You&apos;re using Strix on the web — it&apos;s always up to date. Download the Mac app for offline
          practice and automatic updates.
        </span>
      </Card>
    );
  }

  const line = {
    checking: 'Checking for updates…',
    available: `Version ${version || ''} found — downloading…`,
    downloading: `Downloading update… ${progress}%`,
    downloaded: `Update ${version || ''} is ready — restart to install.`,
    'up-to-date': "You're on the latest version.",
    error: version ? `Version ${version} is available to download.` : "Couldn't check for updates.",
  }[status] || (currentVersion ? `Version ${currentVersion}` : 'Up to date.');

  let action;
  if (canInstall) {
    action = <Button variant="primary" size="sm" onClick={install}>Restart to install</Button>;
  } else if (status === 'downloading' || status === 'available') {
    action = <Button variant="secondary" size="sm" disabled>{status === 'downloading' ? `Downloading ${progress}%` : 'Downloading…'}</Button>;
  } else if (status === 'error' && version) {
    action = <Button variant="primary" size="sm" onClick={openDownload}>Download</Button>;
  } else {
    action = (
      <Button variant="secondary" size="sm" onClick={check} disabled={status === 'checking'}>
        {status === 'checking' ? 'Checking…' : 'Check for updates'}
      </Button>
    );
  }

  return (
    <Card padding="lg" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>Strix for Mac</span>
            {currentVersion && <Badge variant="neutral" size="sm">{`v${currentVersion}`}</Badge>}
          </div>
          <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{line}</span>
        </div>
        {action}
      </div>
    </Card>
  );
}

function SectionHead({ label }) {
  return (
    <div style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', margin:'18px 0 8px'}}>
      {label}
    </div>
  );
}

function ProviderRow({ kind, name, desktop, connected, busy, error, onConnect, onDisconnect, Badge, Button, style }) {
  const caption = error
    ? error
    : !desktop
      ? 'Connect from the desktop app.'
      : connected ? 'Connected' : 'Not connected';
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16, ...style}}>
      <div style={{display:'flex', alignItems:'center', gap: 12, flex: 1}}>
        <ProviderMark kind={kind} />
        <div style={{display:'flex', flexDirection:'column'}}>
          <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{name}</span>
          <span style={{font:'var(--role-caption)', color: error ? 'var(--danger, #d4564a)' : 'var(--text-tertiary)', marginTop: 2}}>{caption}</span>
        </div>
      </div>
      {desktop && (
        connected ? (
          <div style={{display:'flex', alignItems:'center', gap: 10}}>
            <Badge variant="success" size="sm">Connected</Badge>
            <Button variant="secondary" size="sm" loading={busy} disabled={busy} onClick={onDisconnect}>Disconnect</Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" loading={busy} disabled={busy} onClick={onConnect}>Connect</Button>
        )
      )}
    </div>
  );
}

function ProviderMark({ kind }) {
  const src = kind === 'chatgpt' ? '/assets/chatgpt.svg' : '/assets/grok.svg';
  const alt = kind === 'chatgpt' ? 'ChatGPT' : 'Grok';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: 'var(--sunken)',
      display: 'grid', placeItems: 'center',
      flexShrink: 0,
    }}>
      <img src={src} alt={alt} style={{ width: 22, height: 22, objectFit: 'contain' }} />
    </div>
  );
}
function FieldRow({ label, children }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'150px 1fr', gap: 14, alignItems:'center', padding: '6px 0'}}>
      <span style={{font:'var(--role-body)', color:'var(--text-secondary)'}}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default Settings;
