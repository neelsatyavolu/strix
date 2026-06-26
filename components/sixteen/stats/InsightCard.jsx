'use client';
import { Card, Badge, Icon } from '@/components/sixteen';

// Presentational insight card. Renders an AI- or baseline-derived study read
// ({ summary, strength, focus, actions }) with a consistent layout, plus the
// AI freshness/refresh affordance. Data + generation live in useInsight.

function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function InsightCard({ title = 'Insights', accent = 'var(--brand-blue)', status, insight, source, generatedAt, error, canAi, refresh }) {
  const loading = status === 'loading';

  return (
    <Card padding="lg" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
            background: 'var(--brand-blue-soft)', color: accent, flexShrink: 0,
          }}>
            <Icon name="sparkles" style={{ width: 15, height: 15 }} />
          </span>
          <h2 style={{ margin: 0, font: 'var(--role-title-sm)' }}>{title}</h2>
          {source === 'ai' && <Badge variant="brand" size="sm">AI</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
          {loading && <span>Analyzing…</span>}
          {!loading && source === 'ai' && generatedAt && <span>Updated {ago(generatedAt)}</span>}
          {canAi && refresh && (
            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh insight"
              style={{
                display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 6,
                background: 'transparent', border: '1px solid var(--border-1)',
                cursor: loading ? 'default' : 'pointer', color: 'var(--text-secondary)', opacity: loading ? 0.5 : 1,
              }}
            >
              <Icon name="refresh-cw" style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>

      {!insight ? (
        <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)', padding: '4px 0' }}>
          {loading ? 'Reading your results…' : 'Answer a few more questions to unlock insights.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {insight.summary && (
            <p style={{ margin: 0, font: 'var(--role-body)', color: 'var(--text-primary)', lineHeight: 1.55 }}>{insight.summary}</p>
          )}

          {(insight.strength || insight.focus) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {insight.strength && (
                <Pillar label="Strongest" color="var(--success)" icon="trending-up" text={insight.strength} />
              )}
              {insight.focus && (
                <Pillar label="Study next" color="var(--warning)" icon="target" text={insight.focus} />
              )}
            </div>
          )}

          {insight.actions?.length > 0 && (
            <div>
              <div style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                What to do
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {insight.actions.map((a, i) => (
                  <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
                    <Icon name="arrow-right" style={{ width: 14, height: 14, color: accent, marginTop: 3, flexShrink: 0 }} />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!canAi && (
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-1)', paddingTop: 10 }}>
              Connect ChatGPT or Grok in the tutor panel for AI-powered insights that refresh daily.
            </div>
          )}
          {error && (
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{error}</div>
          )}
        </div>
      )}
    </Card>
  );
}

function Pillar({ label, color, icon, text }) {
  return (
    <div style={{ background: 'var(--sunken)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
        <Icon name={icon} style={{ width: 14, height: 14 }} />
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>{label}</span>
      </div>
      <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
