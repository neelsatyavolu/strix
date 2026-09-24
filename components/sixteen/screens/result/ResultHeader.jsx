'use client';
import { Badge, Metric, ScoreBadge } from '@/components/sixteen';
import { SECTION_LABEL } from './format';
import s from './ResultHeader.module.css';

/**
 * ResultHeader — the top of every result / review screen: what this was
 * (section · mode · date), a title, the big score, outcome counts, and the
 * next action.
 *
 * score: { value, max?, label, hint?, domain? } — with `max` it renders a
 *   ScoreBadge (scaled score); without, a Metric with a % unit (accuracy).
 * stats: [{ label, value, color? }]
 */
export function ResultHeader({ section, meta = [], title, subtitle, score, stats = [], actions }) {
  const metaText = meta.filter(Boolean).join(' · ');
  return (
    <header className={s.header}>
      <div className={s.top}>
        <div className={s.text}>
          {(section || metaText) && (
            <div className={s.meta}>
              {section && (
                <Badge variant={section} dot size="sm">{SECTION_LABEL[section]}</Badge>
              )}
              {metaText && <span>{metaText}</span>}
            </div>
          )}
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>

      {(score || stats.length > 0) && (
        <div className={s.band}>
          {score && <ScoreBlock score={score} />}
          {stats.length > 0 && (
            <div className={s.stats}>
              {stats.map((st) => (
                <Metric key={st.label} size="sm" label={st.label} value={st.value} color={st.color} />
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function ScoreBlock({ score }) {
  return (
    <div className={s.score}>
      {score.max ? (
        <ScoreBadge value={score.value} max={score.max} label={score.label} domain={score.domain} size="lg" />
      ) : (
        <Metric
          size="lg"
          label={score.label}
          value={score.value}
          unit="%"
          color={score.domain ? `var(--${score.domain}-color)` : undefined}
        />
      )}
      {score.hint && <span className={s.hint}>{score.hint}</span>}
    </div>
  );
}
