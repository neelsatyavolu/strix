'use client';
import React from 'react';
import { Button, Input, SegmentedControl, Icon } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { signUp, signIn } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';
import s from './Onboarding.module.css';

// Loopback port the desktop app listens on to catch the Google OAuth redirect.
const DESKTOP_OAUTH_PORT = 41639;
const EMAIL_RE = /\S+@\S+\.\S+/;
const STEPS = ['welcome', 'account', 'goal', 'ready'];

// Onboarding — first-run create-account flow (real Supabase auth via the Vercel
// server actions). welcome → account → goal → ready, plus a sign-in path.

function Onboarding({ go }) {
  const { refresh } = useProfile();

  const [mode, setMode] = React.useState('onboard'); // 'onboard' | 'signin'
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({ name: '', email: '', password: '', role: 'student', target: 1400, testDate: '' });
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [googleBusy, setGoogleBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const cur = STEPS[step];
  const next = () => setStep((n) => Math.min(STEPS.length - 1, n + 1));
  const back = () => { setError(''); setStep((n) => Math.max(0, n - 1)); };
  const switchMode = (m) => { setMode(m); setError(''); setFieldErrors({}); };

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const validate = (keys) => {
    const errs = {};
    if (keys.includes('name') && !form.name.trim()) errs.name = 'Enter your name.';
    if (keys.includes('email') && !EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.';
    if (keys.includes('password') && form.password.length < 8) errs.password = 'Use at least 8 characters.';
    if (keys.includes('passwordAny') && !form.password) errs.password = 'Enter your password.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onAccountContinue = () => {
    setError('');
    if (validate(['name', 'email', 'password'])) next();
  };

  const onCreateAccount = async () => {
    setError('');
    setBusy(true);
    const { email, password, name, role, target, testDate } = form;
    const res = await signUp({ email, password, fullName: name, role, targetScore: target, testDate: testDate || null });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Could not create your account.'); return; }
    await refresh();
    next();
  };

  const onSignIn = async () => {
    setError('');
    if (!validate(['email', 'passwordAny'])) return;
    setBusy(true);
    const res = await signIn(form.email, form.password);
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Wrong email or password.'); return; }
    await refresh();
    go('dashboard');
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    const supabase = createClient();
    const desktop = typeof window !== 'undefined' && !!window.strix?.isDesktop;
    const redirectTo = desktop
      ? `http://127.0.0.1:${DESKTOP_OAUTH_PORT}/auth/callback`
      : `${window.location.origin}/auth/callback`;
    try {
      const { data, error: oErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: desktop },
      });
      if (oErr) throw oErr;
      if (!desktop) return; // the browser is now redirecting to Google
      // Desktop: open Google in the system browser; the loopback returns the code.
      const cbUrl = await window.strix.auth.google(data.url);
      const code = new URL(cbUrl).searchParams.get('code');
      if (!code) throw new Error('Google sign-in was cancelled.');
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw exErr;
      await refresh();
      go('dashboard');
    } catch (e) {
      setError(e?.message || 'Google sign-in failed.');
      setGoogleBusy(false);
    }
  };

  const shared = { form, set, fieldErrors, busy, googleBusy, onGoogle: handleGoogle };

  let content;
  if (mode === 'signin') content = <SignInStep {...shared} onSubmit={onSignIn} onCreate={() => switchMode('onboard')} />;
  else if (cur === 'welcome') content = <WelcomeStep onStart={next} onSignIn={() => switchMode('signin')} />;
  else if (cur === 'account') content = <AccountStep {...shared} onSubmit={onAccountContinue} onBack={back} onSignIn={() => switchMode('signin')} />;
  else if (cur === 'goal') content = <GoalStep {...shared} onSubmit={onCreateAccount} onBack={back} />;
  else content = <ReadyStep form={form} go={go} />;

  return (
    <div className={s.screen}>
      <div className={s.column}>
        {mode === 'onboard' && <ProgressDots step={step} />}
        {error && (
          <div className={s.alert} role="alert">
            <Icon name="circle-alert" size={15} />
            <span>{error}</span>
          </div>
        )}
        <div key={mode === 'signin' ? 'signin' : cur} className={s.step}>{content}</div>
      </div>
    </div>
  );
}

function ProgressDots({ step }) {
  return (
    <div className={s.dots} role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
      {STEPS.map((id, i) => (
        <span key={id} className={s.dot} data-state={i === step ? 'current' : i < step ? 'done' : undefined} />
      ))}
    </div>
  );
}

function Heading({ title, subtitle, icon = true }) {
  return (
    <div className={s.heading}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon && <img src="/assets/app-icon.svg" width="44" height="44" alt="" className={s.iconSm} />}
      <h1 className={s.title}>{title}</h1>
      {subtitle && <p className={s.subtitle}>{subtitle}</p>}
    </div>
  );
}

function WelcomeStep({ onStart, onSignIn }) {
  return (
    <div className={s.center}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/app-icon.svg" width="88" height="88" alt="Strix" className={s.iconLg} />
      <div className={s.heading}>
        <h1 className={s.titleLg}>Welcome to Strix</h1>
        <p className={s.subtitle}>Official SAT questions, the real test interface, and a tutor who can actually watch you work.</p>
      </div>
      <div className={s.stack}>
        <Button variant="primary" size="lg" fullWidth onClick={onStart} autoFocus>Get started</Button>
        <p className={s.switchLine}>
          Already have an account? <button type="button" className={s.link} onClick={onSignIn}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      {children}
      {error
        ? <span id={`${id}-msg`} className={s.fieldError}>{error}</span>
        : hint && <span id={`${id}-msg`} className={s.hint}>{hint}</span>}
    </div>
  );
}

function TextField({ id, label, hint, error, value, onChange, ...rest }) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <Input
        id={id}
        size="lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        {...rest}
      />
    </Field>
  );
}

function GoogleButton({ onClick, busy }) {
  return (
    <>
      <button type="button" className={s.sso} onClick={onClick} disabled={busy}>
        <GoogleGlyph /> {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
      <div className={s.divider}><span>or</span></div>
    </>
  );
}

function AccountStep({ form, set, fieldErrors, busy, googleBusy, onGoogle, onSubmit, onBack, onSignIn }) {
  return (
    <form className={s.stack} noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Heading title="Create your account" subtitle="Takes about a minute." />
      <GoogleButton onClick={onGoogle} busy={googleBusy} />
      <TextField id="ob-name" label="Full name" autoComplete="name" autoFocus value={form.name} onChange={set('name')} error={fieldErrors.name} />
      <TextField id="ob-email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={fieldErrors.email} />
      <TextField id="ob-password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" value={form.password} onChange={set('password')} error={fieldErrors.password} />
      <Field id="ob-role" label="I'm a" hint={form.role === 'student' ? 'You can invite a tutor any time.' : "Students connect you by sharing an invite link. You can practice too."}>
        <SegmentedControl value={form.role} onChange={set('role')} fullWidth label="I'm a" options={[{ value: 'student', label: 'Student' }, { value: 'tutor', label: 'Tutor' }]} />
      </Field>
      <div className={s.actions}>
        <Button variant="ghost" size="lg" onClick={onBack} disabled={busy}>Back</Button>
        <Button type="submit" variant="primary" size="lg" fullWidth>Continue</Button>
      </div>
      <p className={s.switchLine}>
        Already have an account? <button type="button" className={s.link} onClick={onSignIn}>Sign in</button>
      </p>
    </form>
  );
}

function SignInStep({ form, set, fieldErrors, busy, googleBusy, onGoogle, onSubmit, onCreate }) {
  return (
    <form className={s.stack} noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Heading title="Welcome back" subtitle="Sign in to your Strix account." />
      <GoogleButton onClick={onGoogle} busy={googleBusy} />
      <TextField id="si-email" label="Email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={form.email} onChange={set('email')} error={fieldErrors.email} />
      <TextField id="si-password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} error={fieldErrors.password} />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>Sign in</Button>
      <p className={s.switchLine}>
        New to Strix? <button type="button" className={s.link} onClick={onCreate}>Create an account</button>
      </p>
    </form>
  );
}

function GoalStep({ form, set, busy, onSubmit, onBack }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form className={s.stack} noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Heading title="What are you aiming for?" subtitle="We'll pace your practice toward it. You can change this later in Settings." icon={false} />
      <div className={s.targetCard}>
        <div className={s.targetHead}>
          <label htmlFor="ob-target" className={s.label}>Target score</label>
          <output htmlFor="ob-target" className={s.targetValue}>{form.target}</output>
        </div>
        <input
          id="ob-target"
          type="range"
          min="800"
          max="1600"
          step="10"
          value={form.target}
          onChange={(e) => set('target')(Number(e.target.value))}
          className={s.range}
        />
        <div className={s.rangeScale}><span>800</span><span>1600</span></div>
      </div>
      <TextField id="ob-date" label="Test date" type="date" min={today} hint="Optional — leave blank if you haven't registered yet." value={form.testDate} onChange={set('testDate')} />
      <div className={s.actions}>
        <Button variant="ghost" size="lg" onClick={onBack} disabled={busy}>Back</Button>
        <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>Create account</Button>
      </div>
    </form>
  );
}

function ReadyStep({ form, go }) {
  const first = form.name.trim().split(' ')[0];
  const body = form.role === 'tutor'
    ? "When a student shares their invite link, open it to connect. Meanwhile you can practice yourself."
    : `Your target is ${form.target}. Start with a short drill so we can see where you are.`;
  return (
    <div className={s.center}>
      <span className={s.check}><Icon name="check" size={30} strokeWidth={2.5} /></span>
      <div className={s.heading}>
        <h1 className={s.titleLg}>You&rsquo;re all set{first ? `, ${first}` : ''}</h1>
        <p className={s.subtitle}>{body}</p>
      </div>
      <div className={s.actions}>
        <Button variant="secondary" size="lg" fullWidth onClick={() => go('dashboard')}>Go to Home</Button>
        <Button variant="primary" size="lg" fullWidth onClick={() => go('practice-setup')} autoFocus>Start practicing</Button>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" /><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" /><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" /><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" /></svg>;
}

export default Onboarding;
