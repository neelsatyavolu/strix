'use client';
import React from 'react';
import { Card, Button, Input, SegmentedControl, Icon } from '@/components/sixteen';

// DevTab — seed fabricated practice activity for a target account so the read
// surfaces (Stats, Sessions, Session detail, Practice analysis) can be tested
// with realistic history. Gated to allowlisted accounts in SixteenApp + the API.

const KINDS = [
  { value: 'section', label: 'Practice section' },
  { value: 'module', label: 'Practice module' },
  { value: 'test', label: 'Full test' },
];
const SECTIONS = [
  { value: 'rw', label: 'Reading & Writing' },
  { value: 'math', label: 'Math' },
];
const SECTION_LABEL = { rw: 'R&W', math: 'Math' };

const labelStyle = { font: 'var(--role-label)', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' };
const fieldStyle = { display: 'flex', flexDirection: 'column', minWidth: 0 };

function fmtDate(iso) {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  const when = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${when} (${days === 0 ? 'today' : `${days}d ago`})`;
}

export default function DevTab() {
  const [email, setEmail] = React.useState('');
  const [kind, setKind] = React.useState('section');
  const [section, setSection] = React.useState('rw');
  const [scorePct, setScorePct] = React.useState('75');
  const [daysAgo, setDaysAgo] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [log, setLog] = React.useState([]); // newest first

  const add = async () => {
    setError(null);
    const pct = Number(scorePct);
    if (!email.trim()) return setError('Enter a target email.');
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return setError('Score must be 0–100.');
    const body = { email: email.trim(), kind, scorePct: pct };
    if (kind !== 'test') body.section = section;
    if (daysAgo.trim() !== '') {
      const d = Number(daysAgo);
      if (!Number.isInteger(d) || d < 0 || d > 365) return setError('Days ago must be 0–365.');
      body.daysAgo = d;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/dev/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Seed failed');
      const stamp = Date.now();
      const entries = json.data.sessions.map((s, i) => ({
        key: `${stamp}-${i}`,
        kind,
        ...s,
      }));
      setLog((prev) => [...entries, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setBusy(false);
    }
  };

  const kindLabel = (k) => KINDS.find((x) => x.value === k)?.label ?? k;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ font: 'var(--role-title)', color: 'var(--text-primary)' }}>Dev — seed activity</div>
        <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginTop: 4 }}>
          Fabricate completed practice for a target account to test Stats, Sessions, and review surfaces.
          Real College Board questions are drawn, so a full test takes a few seconds. Everything is reversible
          via Settings → Clear data.
        </div>
      </div>

      <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Target account email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Activity</label>
          <SegmentedControl options={KINDS} value={kind} onChange={setKind} fullWidth />
        </div>

        {kind !== 'test' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Section</label>
            <SegmentedControl options={SECTIONS} value={section} onChange={setSection} fullWidth />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Score (%)</label>
            <Input type="number" min={0} max={100} value={scorePct} onChange={(e) => setScorePct(e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Days ago (blank = random)</label>
            <Input type="number" min={0} max={365} value={daysAgo} onChange={(e) => setDaysAgo(e.target.value)} placeholder="random 0–60" />
          </div>
        </div>

        {error && (
          <div style={{ font: 'var(--role-label)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="alert-circle" size={14} /> {error}
          </div>
        )}

        <div>
          <Button onClick={add} loading={busy} icon={<Icon name="plus" size={14} />}>
            {kind === 'test' ? 'Add full test (R&W + Math)' : `Add ${kindLabel(kind).toLowerCase()}`}
          </Button>
        </div>
      </Card>

      {log.length > 0 && (
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ font: 'var(--role-title-sm)', color: 'var(--text-primary)' }}>
            Seeded this session ({log.length})
          </div>
          {log.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '8px 0', borderBottom: '1px solid var(--border-2)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ font: 'var(--role-label)', color: 'var(--text-primary)' }}>
                  {kindLabel(s.kind)} · {SECTION_LABEL[s.section]}
                </span>
                <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                  {fmtDate(s.createdAt)} · {s.questionCount} questions
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, font: 'var(--role-label)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <span>{s.accuracy}% acc</span>
                <span style={{ color: 'var(--text-primary)' }}>{s.scaledScore}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
