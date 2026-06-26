// TutorInvite — copy link + email invite + how-it-works.

function TutorInvite({ go }) {
  const { Card, Button, Input, Badge, Toggle, Avatar } = window.SixteenDesignSystem_375889;
  const [email, setEmail] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [canAnnotate, setCanAnnotate] = React.useState(false);
  const [canSeeStats, setCanSeeStats] = React.useState(true);

  const link = 'sixteen.app/tutor/maya-7K3F';

  return (
    <div style={{ padding: '28px 36px', maxWidth: 760 }}>
      <button onClick={() => go('dashboard')} style={{font:'var(--role-label)', color:'var(--text-secondary)', background:'transparent', border:0, cursor:'pointer', marginBottom: 6}}>← Home</button>
      <h1 style={{margin:'0 0 4px', font:'var(--role-title-lg)'}}>Invite a tutor</h1>
      <p style={{margin:'0 0 24px', font:'var(--role-body-lg)', color:'var(--text-secondary)'}}>
        Anyone with this link can watch your practice and chat with you. They won't be able to answer for you.
      </p>

      <Card padding="lg" style={{marginBottom: 16}}>
        <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Share link</span>
        <div style={{display:'flex', gap: 8, marginTop: 8}}>
          <Input value={link} readOnly variant="sunken" />
          <Button variant={copied ? 'secondary' : 'primary'} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </Card>

      <Card padding="lg" style={{marginBottom: 16}}>
        <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Or invite by email</span>
        <div style={{display:'flex', gap: 8, marginTop: 8}}>
          <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="rachel@example.com" />
          <Button variant="primary" disabled={!email}>Send invite</Button>
        </div>
      </Card>

      <Card padding="lg" style={{marginBottom: 16}}>
        <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>What they can do</span>
        <div style={{display:'flex', flexDirection:'column', gap: 14, marginTop: 10}}>
          <Toggle checked={true} label="See the question you're on" description="Always on — this is the point of tutor mode." disabled />
          <Toggle checked={canSeeStats} onChange={setCanSeeStats} label="See your live session stats" description="Accuracy, time per question, and the breakdown panel." />
          <Toggle checked={canAnnotate} onChange={setCanAnnotate} label="Annotate the passage with you" description="Tutor can highlight text directly in your reading pane." />
          <Toggle checked={false} label="Answer questions for you" description="Tutors can never answer. This is permanent." disabled />
        </div>
      </Card>

      <Card padding="md">
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          <Avatar name="Rachel Hsu" presence="online"/>
          <div style={{flex:1}}>
            <div style={{font:'var(--role-body)', color:'var(--text-primary)'}}>Rachel Hsu</div>
            <div style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Joined yesterday · 4 sessions watched</div>
          </div>
          <Badge variant="success" dot>Online</Badge>
          <Button variant="secondary" onClick={() => go('tutor-chat')}>Open chat</Button>
        </div>
      </Card>
    </div>
  );
}

window.TutorInvite = TutorInvite;
