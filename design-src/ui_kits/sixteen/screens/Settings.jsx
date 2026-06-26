// Settings — appearance, account, practice defaults.

function Settings({ go, dark, setDark }) {
  const { Card, Toggle, SegmentedControl, Input, Avatar, Button, Badge } = window.SixteenDesignSystem_375889;
  const [theme, setTheme] = React.useState(dark ? 'dark' : 'light');
  React.useEffect(() => { setDark(theme === 'dark'); }, [theme]);

  const [warn5, setWarn5] = React.useState(true);
  const [pacing, setPacing] = React.useState(true);
  const [name, setName] = React.useState('Maya Patel');

  return (
    <div style={{padding: '28px 36px', maxWidth: 760}}>
      <h1 style={{margin:'0 0 22px', font:'var(--role-title-lg)'}}>Settings</h1>

      <SectionHead label="Profile" />
      <Card padding="lg" style={{marginBottom: 18}}>
        <div style={{display:'flex', alignItems:'center', gap: 14, marginBottom: 14}}>
          <Avatar name={name} size="lg" />
          <div style={{flex: 1}}>
            <div style={{font:'var(--role-title-sm)'}}>{name}</div>
            <div style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>maya@example.com</div>
          </div>
          <Button variant="secondary" size="sm">Sign out</Button>
        </div>
        <FieldRow label="Display name">
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
        </FieldRow>
        <FieldRow label="Target score">
          <Input value="1500" />
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
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-1)'}}>
          <div style={{display:'flex', alignItems:'center', gap: 12, flex: 1}}>
            <ProviderMark kind="chatgpt" />
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>ChatGPT</span>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', marginTop: 2}}>Connected as maya@example.com · GPT-5.5, GPT-5.4 mini</span>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap: 8}}>
            <Badge variant="success" size="sm">Connected</Badge>
            <Button variant="ghost">Disconnect</Button>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16, paddingTop: 14}}>
          <div style={{display:'flex', alignItems:'center', gap: 12, flex: 1}}>
            <ProviderMark kind="grok" />
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>Grok</span>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', marginTop: 2}}>Not connected · sign in with X to enable Grok 4.3</span>
            </div>
          </div>
          <Button variant="secondary">Connect Grok</Button>
        </div>
      </Card>

      <SectionHead label="Tutor mode" />
      <Card padding="lg">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16}}>
          <div style={{display:'flex', flexDirection:'column', flex: 1}}>
            <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>Active tutor</span>
            <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', marginTop: 2}}>Tutors can watch your practice and chat. They can't answer for you.</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap: 10}}>
            <Avatar name="Rachel Hsu" size="sm" presence="online"/>
            <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>Rachel Hsu</span>
            <Badge variant="success" size="sm">Online</Badge>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-1)'}}>
          <Button variant="ghost">Disconnect Rachel</Button>
          <Button variant="secondary" onClick={() => go('tutor-invite')}>Manage tutors</Button>
        </div>
      </Card>
    </div>
  );
}

function SectionHead({ label }) {
  return (
    <div style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', margin:'18px 0 8px'}}>
      {label}
    </div>
  );
}

function ProviderMark({ kind }) {
  const src = kind === 'chatgpt' ? '../../assets/chatgpt.svg' : '../../assets/grok.svg';
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

window.Settings = Settings;
