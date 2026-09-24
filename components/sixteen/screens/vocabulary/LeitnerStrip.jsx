'use client';
import React from 'react';
import { leitnerSegments } from './words';
import s from './LeitnerStrip.module.css';

/** Segment fill: New = neutral, boxes = deepening blue, Known = success. */
function segmentColor(seg) {
  if (seg.id === 'new') return 'var(--border-2)';
  if (seg.id === 'known') return 'var(--success)';
  const pct = 22 + seg.level * 14;
  return `color-mix(in srgb, var(--brand-blue) ${pct}%, var(--surface-card))`;
}

/** Leitner boxes as one segmented bar with a legend of counts. */
export default function LeitnerStrip({ words }) {
  const segments = React.useMemo(() => leitnerSegments(words), [words]);
  const total = words.length;
  const filled = segments.filter((seg) => seg.count > 0);

  return (
    <div className={s.strip}>
      <div
        className={s.bar}
        role="img"
        aria-label={segments.map((seg) => `${seg.label}: ${seg.count}`).join(', ')}
      >
        {total === 0 ? null : filled.map((seg) => (
          <span
            key={seg.id}
            className={s.segment}
            title={`${seg.label} · ${seg.count} — ${seg.hint}`}
            style={{ flexGrow: seg.count, background: segmentColor(seg) }}
          />
        ))}
      </div>
      <ul className={s.legend}>
        {segments.map((seg) => (
          <li key={seg.id} className={s.item} title={seg.hint}>
            <span className={s.dot} style={{ background: segmentColor(seg) }} />
            <span className={s.label}>{seg.label}</span>
            <span className={s.count}>{seg.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
