'use client';
import React from 'react';
import { Card, Button, Input, SegmentedControl, Icon, Badge, Page, PageHeader, Section, List, ListRow } from '@/components/sixteen';

// DevTab — seed fabricated practice activity for a target account so the read
// surfaces (Progress, History, Session detail, Full-length analysis) can be
// tested with realistic history. Gated to allowlisted accounts in SixteenApp + the API.

const KINDS = [
  { value: 'section', label: 'Practice section' },
  { value: 'module', label: 'Practice module' },
  { value: 'test', label: 'Full test' },
];
const SECTIONS = [
  { value: 'rw', label: 'Reading & Writing' },
  { value: 'math', label: 'Math' },
];
const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 };
const labelStyle = { font: 'var(--role-label)', color: 'var(--text-secondary)' };

function fmtDate(iso) {
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  const when = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${when} · ${days === 0 ? 'today' : `${days}d ago`}`;
}

function Field({ id, label, children }) {
  return (
    <div style={fieldStyle}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {children}
    </div>
  );
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
      const entries = json.data.sessions.map((sess, i) => ({ key: `${stamp}-${i}`, kind, ...sess }));
      setLog((prev) => [...entries, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setBusy(false);
    }
  };

  const kindLabel = (k) => KINDS.find((x) => x.value === k)?.label ?? k;

  return (
    <Page width="narrow">
      <PageHeader
        title="Developer"
        subtitle="Seed completed practice into an account to test Progress, History, and review screens. Undo it any time from Settings → Clear data."
      />

      <Section title="Seed activity" description="Real College Board questions are drawn, so a full test takes a few seconds.">
        <Card padding="lg">
          <form
            onSubmit={(e) => { e.preventDefault(); add(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <Field id="dev-email" label="Target account email">
              <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </Field>

            <div style={fieldStyle}>
              <span style={labelStyle}>Activity</span>
              <SegmentedControl options={KINDS} value={kind} onChange={setKind} fullWidth label="Activity" />
            </div>

            {kind !== 'test' && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Section</span>
                <SegmentedControl options={SECTIONS} value={section} onChange={setSection} fullWidth label="Section" />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field id="dev-score" label="Score (%)">
                <Input id="dev-score" type="number" min={0} max={100} value={scorePct} onChange={(e) => setScorePct(e.target.value)} />
              </Field>
              <Field id="dev-days" label="Days ago">
                <Input id="dev-days" type="number" min={0} max={365} value={daysAgo} onChange={(e) => setDaysAgo(e.target.value)} placeholder="Random (0–60)" />
              </Field>
            </div>

            {error && (
              <p role="alert" style={{ margin: 0, font: 'var(--role-body)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="circle-alert" size={14} /> {error}
              </p>
            )}

            <div>
              <Button type="submit" loading={busy} icon={<Icon name="plus" size={14} />}>
                {kind === 'test' ? 'Add full test (R&W + Math)' : `Add ${kindLabel(kind).toLowerCase()}`}
              </Button>
            </div>
          </form>
        </Card>
      </Section>

      {log.length > 0 && (
        <Section title="Seeded this session" action={<Badge>{log.length}</Badge>}>
          <List>
            {log.map((row) => (
              <ListRow
                key={row.key}
                title={`${kindLabel(row.kind)} · ${SECTION_LABEL[row.section] || row.section}`}
                subtitle={`${fmtDate(row.createdAt)} · ${row.questionCount} questions`}
                meta={`${row.accuracy}% · ${row.scaledScore}`}
              />
            ))}
          </List>
        </Section>
      )}
    </Page>
  );
}
