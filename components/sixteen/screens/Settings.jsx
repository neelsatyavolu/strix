'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { updateTargetScore } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { aiStatus, aiConnect, aiSubmitCode, aiCancelConnect, aiDisconnect, isDesktop } from '@/lib/ai/bridge';
import { useUpdates } from '@/lib/updates/useUpdates';

// Settings — appearance, account, practice defaults.

function Settings({ go, dark, setDark }) {
  const { Card, Toggle, SegmentedControl, Input, Avatar, Button, Badge } = SixteenNS;
  const { displayName, email, profile, signOut, refresh, user, avatarUrl } = useProfile();

  const [theme, setTheme] = React.useState(dark ? 'dark' : 'light');
  React.useEffect(() => { setDark(theme === 'dark'); }, [theme]);

  // Editable target score, seeded from the saved profile.
  const savedTarget = profile?.target_score ?? null;
  const [target, setTarget] = React.useState(savedTarget == null ? '' : String(savedTarget));
  const [targetSaving, setTargetSaving] = React.useState(false);
  const [targetError, setTargetError] = React.useState(null);
  React.useEffect(() => {
    setTarget(savedTarget == null ? '' : String(savedTarget));
  }, [savedTarget]);

  const targetDirty = target.trim() !== (savedTarget == null ? '' : String(savedTarget));

  const saveTarget = async () => {
    const trimmed = target.trim();
    const score = trimmed === '' ? null : Number(trimmed);
    setTargetError(null);
    setTargetSaving(true);
    try {
      const res = await updateTargetScore(score);
      if (!res.ok) { setTargetError(res.error || 'Could not save.'); return; }
      await refresh();
    } finally {
      setTargetSaving(false);
    }
  };

  const [warn5, setWarn5] = React.useState(true);
  const [pacing, setPacing] = React.useState(true);

  // Real AI connection status from the desktop bridge.
  const desktop = isDesktop();
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  const [busy, setBusy] = React.useState(null);   // 'chatgpt' | 'grok' | null
  const [aiError, setAiError] = React.useState({});  // { [kind]: message }
  const [pasteOpen, setPasteOpen] = React.useState({});  // { [kind]: bool } — show code field
  const [pasteVal, setPasteVal] = React.useState({});    // { [kind]: string }
  const refreshAi = React.useCallback(() => aiStatus().then(setConnected).catch(() => {}), []);
  React.useEffect(() => { refreshAi(); }, [refreshAi]);

  const bridgeKey = (kind) => (kind === 'chatgpt' ? 'codex' : 'grok');

  // Open the provider's sign-in in the browser. The loopback may finish it
  // automatically, or the user can paste the code their browser shows.
  const connectAi = (kind) => {
    setBusy(kind);
    setAiError((e) => ({ ...e, [kind]: null }));
    setPasteVal((s) => ({ ...s, [kind]: '' }));
    setPasteOpen((s) => ({ ...s, [kind]: true }));
    aiConnect(kind)
      .then(async (res) => {
        if (res && res.ok === false) {
          const s = await aiStatus();
          // Only surface real failures — not a cancel we triggered via paste.
          if (!s[bridgeKey(kind)] && res.error && res.error !== 'Connection was cancelled.') {
            setAiError((e) => ({ ...e, [kind]: res.error }));
          }
        }
        await refreshAi();
      })
      .catch((err) => setAiError((e) => ({ ...e, [kind]: err?.message || 'Could not connect.' })))
      .finally(() => {
        setBusy(null);
        setPasteOpen((s) => ({ ...s, [kind]: false }));
      });
  };

  const submitCode = async (kind) => {
    const code = (pasteVal[kind] || '').trim();
    if (!code) return;
    setBusy(kind);
    setAiError((e) => ({ ...e, [kind]: null }));
    try {
      const res = await aiSubmitCode(kind, code);
      if (res && res.ok === false) throw new Error(res.error || 'That code did not work.');
      await refreshAi();
      setPasteOpen((s) => ({ ...s, [kind]: false }));
      // aiConnect's promise resolves via cancel(); its finally clears busy.
    } catch (err) {
      setAiError((e) => ({ ...e, [kind]: err?.message || 'That code did not work.' }));
      setBusy(null);
    }
  };

  const cancelConnect = (kind) => {
    setPasteOpen((s) => ({ ...s, [kind]: false }));
    setBusy(null);
    aiCancelConnect(kind).catch(() => {});
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

  // Profile picture upload — direct to Supabase Storage (RLS-guarded), max 1MB.
  const AVATAR_MAX_BYTES = 1024 * 1024;
  const fileInputRef = React.useRef(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(null);

  const pickAvatar = () => fileInputRef.current?.click();

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';  // let the user re-pick the same file later
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Image must be 1MB or smaller.');
      return;
    }
    if (!user?.id) {
      setAvatarError('You must be signed in to change your picture.');
      return;
    }
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const path = `${user.id}/avatar`;  // one file per user; upsert overwrites
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust so the CDN serves the new image after an overwrite.
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (dbErr) throw dbErr;
      await refresh();
    } catch (err) {
      setAvatarError(err?.message || 'Could not update your picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div style={{padding: '28px 36px', maxWidth: 760}}>
      <h1 style={{margin:'0 0 22px', font:'var(--role-title-lg)'}}>Settings</h1>

      <SectionHead label="Profile" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <div style={{display:'flex', alignItems:'center', gap: 14, marginBottom: 14}}>
          <button
            type="button"
            onClick={pickAvatar}
            disabled={avatarUploading}
            title="Change picture"
            style={{padding: 0, border: 0, background: 'transparent', borderRadius: '50%', cursor: avatarUploading ? 'default' : 'pointer', lineHeight: 0, opacity: avatarUploading ? 0.6 : 1}}
          >
            <Avatar name={displayName} src={avatarUrl} size="lg" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onAvatarChange}
            style={{display: 'none'}}
          />
          <div style={{flex: 1}}>
            <div style={{font:'var(--role-title-sm)'}}>{displayName}</div>
            <div style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{email}</div>
            {avatarError && (
              <div style={{font:'var(--role-caption)', color:'var(--danger, #d4564a)', marginTop: 2}}>{avatarError}</div>
            )}
          </div>
          <Button variant="secondary" size="sm" loading={avatarUploading} disabled={avatarUploading} onClick={pickAvatar}>
            {avatarUploading ? 'Uploading…' : 'Change'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
        <FieldRow label="Display name">
          <Input value={displayName} readOnly />
        </FieldRow>
        <FieldRow label="Target score">
          <div style={{display:'flex', flexDirection:'column', gap: 6}}>
            <div style={{display:'flex', alignItems:'center', gap: 8}}>
              <Input
                type="number"
                min={400}
                max={1600}
                step={10}
                value={target}
                placeholder="Not set"
                onChange={(e) => setTarget(e?.target ? e.target.value : e)}
                onKeyDown={(e) => { if (e.key === 'Enter' && targetDirty) saveTarget(); }}
                style={{flex: 1}}
              />
              {targetDirty && (
                <Button variant="primary" size="sm" loading={targetSaving} disabled={targetSaving} onClick={saveTarget}>Save</Button>
              )}
            </div>
            {targetError && (
              <span style={{font:'var(--role-caption)', color:'var(--danger, #d4564a)'}}>{targetError}</span>
            )}
          </div>
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
          connected={connected.codex}
          busy={busy === 'chatgpt'}
          error={aiError.chatgpt}
          onConnect={() => connectAi('chatgpt')}
          onDisconnect={() => disconnectAi('chatgpt')}
          Badge={Badge}
          Button={Button}
          style={{paddingBottom: 14, borderBottom: '1px solid var(--border-1)'}}
        />
        {pasteOpen.chatgpt && (
          <CodeEntry
            kind="chatgpt"
            desktop={desktop}
            value={pasteVal.chatgpt || ''}
            busy={busy === 'chatgpt'}
            onChange={(v) => setPasteVal((s) => ({ ...s, chatgpt: v }))}
            onSubmit={() => submitCode('chatgpt')}
            onCancel={() => cancelConnect('chatgpt')}
            Input={Input}
            Button={Button}
          />
        )}
        <ProviderRow
          kind="grok"
          name="Grok"
          connected={connected.grok}
          busy={busy === 'grok'}
          error={aiError.grok}
          onConnect={() => connectAi('grok')}
          onDisconnect={() => disconnectAi('grok')}
          Badge={Badge}
          Button={Button}
          style={{paddingTop: 14}}
        />
        {pasteOpen.grok && (
          <CodeEntry
            kind="grok"
            desktop={desktop}
            value={pasteVal.grok || ''}
            busy={busy === 'grok'}
            onChange={(v) => setPasteVal((s) => ({ ...s, grok: v }))}
            onSubmit={() => submitCode('grok')}
            onCancel={() => cancelConnect('grok')}
            Input={Input}
            Button={Button}
          />
        )}
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

function ProviderRow({ kind, name, connected, busy, error, onConnect, onDisconnect, Badge, Button, style }) {
  const caption = error ? error : connected ? 'Connected' : 'Not connected';
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16, ...style}}>
      <div style={{display:'flex', alignItems:'center', gap: 12, flex: 1}}>
        <ProviderMark kind={kind} />
        <div style={{display:'flex', flexDirection:'column'}}>
          <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{name}</span>
          <span style={{font:'var(--role-caption)', color: error ? 'var(--danger, #d4564a)' : 'var(--text-tertiary)', marginTop: 2}}>{caption}</span>
        </div>
      </div>
      {connected ? (
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <Badge variant="success" size="sm">Connected</Badge>
          <Button variant="secondary" size="sm" loading={busy} disabled={busy} onClick={onDisconnect}>Disconnect</Button>
        </div>
      ) : (
        <Button variant="primary" size="sm" loading={busy} disabled={busy} onClick={onConnect}>Connect</Button>
      )}
    </div>
  );
}

// What to paste depends on platform + provider. On the desktop the loopback
// usually finishes sign-in automatically and pasting is the fallback; on the
// web there's no loopback, so the user copies the callback link (ChatGPT) or
// the authorization code (Grok) their browser shows.
function pasteHelp(desktop, kind) {
  if (desktop) return 'Finish in your browser. If it shows an authorization code, paste it here.';
  return kind === 'chatgpt'
    ? "Sign in to ChatGPT in the new tab. It'll redirect to a page that won't load — copy that page's full address and paste it here."
    : 'Sign in to Grok in the new tab, then paste the authorization code it shows you here.';
}

function CodeEntry({ kind, desktop, value, busy, onChange, onSubmit, onCancel, Input, Button }) {
  const placeholder = !desktop && kind === 'chatgpt' ? 'Paste the callback link' : 'Paste authorization code';
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 8, padding: '12px 0 4px'}}>
      <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
        {pasteHelp(desktop, kind)}
      </span>
      <div style={{display:'flex', alignItems:'center', gap: 8}}>
        <Input
          value={value}
          onChange={(e) => onChange(e?.target ? e.target.value : e)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
          style={{flex: 1}}
        />
        <Button variant="primary" size="sm" loading={busy} disabled={busy || !String(value || '').trim()} onClick={onSubmit}>Submit</Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
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
