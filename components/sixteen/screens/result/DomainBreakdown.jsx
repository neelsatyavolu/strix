'use client';
import { DomainBar } from '@/components/sixteen/stats/DomainBar';
import { SECTION_COLOR } from './format';
import s from './DomainBreakdown.module.css';

/**
 * DomainBreakdown — accuracy per domain: label, a correct-vs-total bar, and
 * the tally. domains: [{ domain, label, correct, total }]
 */
export function DomainBreakdown({ domains = [], section }) {
  const color = SECTION_COLOR[section] || 'var(--brand-blue)';
  if (!domains.length) return null;
  return (
    <div className={s.list}>
      {domains.map((d) => {
        const pct = d.total ? Math.round((d.correct / d.total) * 100) : 0;
        const segments = [
          { value: d.correct, label: 'Correct', color },
          { value: d.total - d.correct, label: 'Missed', color: 'transparent' },
        ].filter((seg) => seg.value > 0);
        return (
          <div key={d.domain || d.label} className={s.row}>
            <span className={s.label}>{d.label}</span>
            <DomainBar segments={segments} height={6} showLegend={false} />
            <span className={s.figures}>
              <span className={s.pct}>{pct}%</span>
              <span className={s.count}>{d.correct} of {d.total}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
