'use client';
import { Card, Badge, Icon, IconButton, Skeleton } from '@/components/sixteen';
import s from './Insight.module.css';

// Presentational insight card. Renders an AI- or baseline-derived study read
// ({ summary, strength, focus, actions }) with a consistent layout, plus the
// AI freshness/refresh affordance. Data + generation live in useInsight.

function ago(iso) {
  if (!iso) return '';
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 90) return 'just now';
  const m = sec / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function InsightCard({
  title = 'Insights', accent = 'var(--brand-blue)',
  status, insight, source, generatedAt, error, canAi, refresh,
  className, style,
}) {
  const loading = status === 'loading';

  return (
    <Card padding="lg" className={className} style={style}>
      <div className={s.head}>
        <div className={s.titleRow}>
          <span className={s.mark} style={{ color: accent }}>
            <Icon name="sparkles" size={14} />
          </span>
          <h3 className={s.title}>{title}</h3>
          {source === 'ai' && <Badge variant="brand" size="sm">AI</Badge>}
        </div>
        <div className={s.meta}>
          {loading && <span>Analyzing…</span>}
          {!loading && source === 'ai' && generatedAt && <span>Updated {ago(generatedAt)}</span>}
          {canAi && refresh && (
            <IconButton size="sm" label="Refresh insight" onClick={refresh} disabled={loading}>
              <Icon name="refresh-cw" size={13} />
            </IconButton>
          )}
        </div>
      </div>

      {!insight ? (
        loading ? (
          <div className={s.body} aria-busy="true">
            <Skeleton width="90%" />
            <Skeleton width="65%" />
          </div>
        ) : (
          <p className={s.muted}>Answer a few more questions to unlock insights.</p>
        )
      ) : (
        <div className={s.body}>
          {insight.summary && <p className={s.summary}>{insight.summary}</p>}

          {(insight.strength || insight.focus) && (
            <div className={s.pillars}>
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
              <div className={s.actionsLabel}>What to do</div>
              <ul className={s.actions}>
                {insight.actions.map((a, i) => (
                  <li key={i} className={s.action}>
                    <Icon name="arrow-right" size={14} className={s.actionIcon} style={{ color: accent }} />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!canAi && (
            <p className={s.footnote}>
              Connect ChatGPT or Grok in the tutor panel for AI insights that refresh daily.
            </p>
          )}
          {error && <p className={s.footnote}>{error}</p>}
        </div>
      )}
    </Card>
  );
}

function Pillar({ label, color, icon, text }) {
  return (
    <div className={s.pillar}>
      <span className={s.pillarLabel} style={{ color }}>
        <Icon name={icon} size={14} />
        {label}
      </span>
      <span className={s.pillarText}>{text}</span>
    </div>
  );
}
