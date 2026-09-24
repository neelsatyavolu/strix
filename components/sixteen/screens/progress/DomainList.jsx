'use client';
import { List, ListRow, DomainBar } from '@/components/sixteen';
import { SECTION_SHORT, recentAcc, accuracyTone } from '@/components/sixteen/stats/shared';
import s from './Progress.module.css';

// Rows of content domains (or skills) with their recent accuracy. Rows with
// practice data open the category drill-in.

export const sectionColor = (section) => (section === 'math' ? 'var(--math-color)' : 'var(--rw-color)');

/** Accuracy bar + figure for the right side of a row. */
export function AccuracyMeta({ pct, color, bar = true }) {
  return (
    <span className={s.barMeta}>
      {bar && (
        <span className={s.barTrack}>
          <DomainBar segments={[{ value: pct ?? 0, label: 'Accuracy', color }]} total={100} height={6} showLegend={false} />
        </span>
      )}
      <span className={s.pct} style={{ color: pct == null ? 'var(--text-tertiary)' : accuracyTone(pct) }}>
        {pct == null ? '—' : `${pct}%`}
      </span>
    </span>
  );
}

/**
 * DomainList — cats: [{ id, code, label, done, accuracy, recentAccuracy, section }].
 * `section` on each cat (or the `section` prop) picks the color and drill-in target.
 * `showSection` adds a section dot + short label (for mixed R&W/Math lists).
 */
export function DomainList({ cats, go, section: sectionProp, showSection = false, bar = true }) {
  return (
    <List>
      {cats.map((c) => {
        const section = c.section ?? sectionProp;
        const clickable = c.done > 0 && !!c.code;
        const pct = c.done > 0 ? recentAcc(c) : null;
        const answered = c.done > 0 ? `${c.done} answered` : 'Not practiced yet';
        return (
          <ListRow
            key={`${section}-${c.id ?? c.code}`}
            leading={showSection ? <span className={s.dot} style={{ background: sectionColor(section) }} /> : null}
            title={c.label}
            subtitle={showSection ? `${SECTION_SHORT[section] ?? section} · ${answered}` : answered}
            meta={<AccuracyMeta pct={pct} color={sectionColor(section)} bar={bar} />}
            trailing={clickable ? null : <span className={s.chevSpacer} />}
            onClick={clickable ? () => go('category-detail', { section, domain: c.code, label: c.label }) : undefined}
          />
        );
      })}
    </List>
  );
}
