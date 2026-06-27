'use client';

// Read-only view of the question a watched student is currently on. Driven by
// the `session` broadcast on their realtime channel. `live` is null until the
// first broadcast arrives.
export default function LiveQuestionView({ live, studentName = 'your student' }) {
  const card = {
    background: 'var(--paper)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)', padding: 20,
  };
  const first = String(studentName).split(' ')[0];

  return (
    <div style={{ overflow: 'auto', padding: '24px 28px', maxWidth: 920, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
        <span style={{ font: 'var(--role-label)', color: 'var(--text-secondary)' }}>Watching {studentName}</span>
      </div>

      {!live ? (
        <div style={{ ...card, color: 'var(--text-secondary)' }}>
          Loading {first}&rsquo;s current question…
        </div>
      ) : (
        <div style={card}>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Question {(live.index ?? 0) + 1} of {live.total} · {live.domainLabel || (live.section === 'math' ? 'Math' : 'Reading & Writing')}
          </div>
          {live.stimulusHtml && (
            <div className="cb-passage" style={{ marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: live.stimulusHtml }} />
          )}
          {live.stemHtml && <div className="cb-stem" dangerouslySetInnerHTML={{ __html: live.stemHtml }} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {(live.choices || []).map((c) => (
              <div key={c.letter} style={{
                display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${live.selected === c.letter ? 'var(--brand-blue)' : 'var(--border-2)'}`,
                background: live.selected === c.letter ? 'var(--brand-blue-soft)' : 'transparent',
              }}>
                <span style={{ fontWeight: 700 }}>{c.letter}</span>
                <span className="cb-choice" dangerouslySetInnerHTML={{ __html: c.html }} />
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
            You can guide {first} but can&rsquo;t answer for them.
          </p>
        </div>
      )}
    </div>
  );
}
