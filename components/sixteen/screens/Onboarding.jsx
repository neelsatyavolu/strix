'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';

// Onboarding — first-run create-account flow. 4 steps → Dashboard.

function Onboarding({ go }) {
  const { Button, Input, SegmentedControl, Badge } = SixteenNS;
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('student');   // 'student' | 'tutor'
  const [target, setTarget] = React.useState(1400);
  const [testDate, setTestDate] = React.useState('aug');

  const steps = ['welcome', 'account', 'goal', 'ready'];
  const cur = steps[step];
  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div style={{
      position:'relative', height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'var(--canvas)', overflow:'auto', padding: 24,
    }}>
      {/* progress dots */}
      <div style={{position:'absolute', top: 24, display:'flex', gap: 6}}>
        {steps.map((s, i) => (
          <span key={s} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            background: i <= step ? 'var(--brand-blue)' : 'var(--border-2)',
            transition: 'all var(--dur-base) var(--ease-out)',
          }}/>
        ))}
      </div>

      <div style={{width: 'min(440px, 100%)', display:'flex', flexDirection:'column', gap: 22}}>
        {cur === 'welcome' && (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap: 18}}>
            <img src="/assets/app-icon.svg" width="84" height="84" style={{borderRadius: 20, boxShadow:'var(--shadow-md)'}}/>
            <div>
              <h1 style={{margin:'0 0 8px', font:'var(--role-title-lg)'}}>Welcome to Proctorly</h1>
              <p style={{margin:0, font:'var(--role-body-lg)', color:'var(--text-secondary)', lineHeight: 1.5}}>
                Official SAT questions, the real test interface, and a tutor who can actually watch you work.
              </p>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={next}>Get started</Button>
            <button onClick={() => go('dashboard')} style={{font:'var(--role-label)', color:'var(--text-secondary)', background:'transparent', border:0, cursor:'pointer'}}>
              I already have an account
            </button>
          </div>
        )}

        {cur === 'account' && (
          <div style={{display:'flex', flexDirection:'column', gap: 16}}>
            <div>
              <h1 style={{margin:'0 0 6px', font:'var(--role-title-md)'}}>Create your account</h1>
              <p style={{margin:0, font:'var(--role-body)', color:'var(--text-secondary)'}}>Takes about a minute.</p>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap: 8}}>
              <button style={ssoBtn()}><AppleGlyph/> Continue with Apple</button>
              <button style={ssoBtn()}><GoogleGlyph/> Continue with Google</button>
            </div>

            <div style={{display:'flex', alignItems:'center', gap: 12}}>
              <div style={{flex:1, height:1, background:'var(--border-1)'}}/>
              <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>or</span>
              <div style={{flex:1, height:1, background:'var(--border-1)'}}/>
            </div>

            <Field label="Full name"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Maya Patel" /></Field>
            <Field label="Email"><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></Field>
            <Field label="Password"><Input type="password" placeholder="At least 8 characters" /></Field>

            <Field label="I'm a">
              <SegmentedControl
                value={role} onChange={setRole} fullWidth
                options={[
                  { value:'student', label:'Student' },
                  { value:'tutor',   label:'Tutor' },
                ]}
              />
            </Field>
            <p style={{margin:'-4px 0 0', font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
              {role === 'student'
                ? 'You can invite a tutor to watch your sessions any time.'
                : "You'll get a code to connect to a student. You can also practice yourself."}
            </p>

            <div style={{display:'flex', gap: 8, marginTop: 6}}>
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button variant="primary" fullWidth onClick={next}>Continue</Button>
            </div>
          </div>
        )}

        {cur === 'goal' && (
          <div style={{display:'flex', flexDirection:'column', gap: 18}}>
            <div>
              <h1 style={{margin:'0 0 6px', font:'var(--role-title-md)'}}>What are you aiming for?</h1>
              <p style={{margin:0, font:'var(--role-body)', color:'var(--text-secondary)'}}>We'll pace your practice toward it. You can change this later.</p>
            </div>

            <div style={{background:'var(--paper)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-xs)', padding: 20}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 8}}>
                <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)'}}>Target score</span>
                <span style={{fontFamily:'var(--font-mono)', fontWeight:600, fontSize: 28, color:'var(--brand-blue)', fontVariantNumeric:'tabular-nums'}}>{target}</span>
              </div>
              <input type="range" min="800" max="1600" step="10" value={target}
                onChange={e => setTarget(Number(e.target.value))}
                style={{width:'100%', accentColor:'var(--brand-blue)'}}/>
              <div style={{display:'flex', justifyContent:'space-between', font:'var(--role-caption)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)'}}>
                <span>800</span><span>1600</span>
              </div>
            </div>

            <Field label="When's your test?">
              <SegmentedControl
                value={testDate} onChange={setTestDate} fullWidth
                options={[
                  { value:'aug', label:'Aug' },
                  { value:'oct', label:'Oct' },
                  { value:'dec', label:'Dec' },
                  { value:'mar', label:'Mar' },
                  { value:'none', label:'Not sure' },
                ]}
              />
            </Field>

            <div style={{display:'flex', gap: 8, marginTop: 6}}>
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button variant="primary" fullWidth onClick={next}>Continue</Button>
            </div>
          </div>
        )}

        {cur === 'ready' && (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap: 18}}>
            <div style={{width: 72, height: 72, borderRadius:'50%', background:'var(--success-soft)', display:'grid', placeItems:'center'}}>
              <Icon name="check" style={{width:34, height:34, color:'var(--success)'}}/>
            </div>
            <div>
              <h1 style={{margin:'0 0 8px', font:'var(--role-title-lg)'}}>You're all set{name ? `, ${name.split(' ')[0]}` : ''}.</h1>
              <p style={{margin:0, font:'var(--role-body-lg)', color:'var(--text-secondary)', lineHeight: 1.5}}>
                {role === 'tutor'
                  ? 'Connect to a student from Settings, or start a practice session yourself.'
                  : `We've set your target to ${target}. Start with a short drill to calibrate.`}
              </p>
            </div>
            <div style={{display:'flex', gap: 8, width:'100%'}}>
              <Button variant="secondary" fullWidth onClick={() => go('dashboard')}>Go to home</Button>
              <Button variant="primary" fullWidth onClick={() => go('practice-setup')}>Start practicing</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap: 6}}>
      <span style={{font:'var(--role-label)', color:'var(--text-secondary)'}}>{label}</span>
      {children}
    </label>
  );
}

function ssoBtn() {
  return {
    display:'flex', alignItems:'center', justifyContent:'center', gap: 10,
    padding: '10px 14px', width:'100%',
    background:'var(--paper)', border:'1px solid var(--border-2)', borderRadius:'var(--radius-md)',
    font:'var(--role-body)', fontWeight: 590, color:'var(--text-primary)', cursor:'pointer',
  };
}
function AppleGlyph() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.9 8.5c0-1.6 1.3-2.4 1.4-2.4-.8-1.1-2-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5 1.5-.8 2-1.6c.7-.9.9-1.8.9-1.9 0 0-1.8-.7-1.8-2.8zM9.3 3.7c.4-.5.7-1.2.6-2-.6 0-1.4.4-1.8.9-.4.4-.8 1.2-.7 1.9.7.1 1.4-.3 1.9-.8z"/></svg>;
}
function GoogleGlyph() {
  return <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>;
}

export default Onboarding;
