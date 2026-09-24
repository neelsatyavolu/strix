'use client';
import React from 'react';

/**
 * DomainBar — horizontal segmented bar showing a breakdown.
 * Each segment is { value, label, color }. Segments fill the bar by their
 * share of the sum, or of `total` when given (e.g. total={100} for a single
 * accuracy bar, leaving the rest as track).
 */
export function DomainBar({
  segments,           // [{value, label, color}]
  total: totalProp,   // optional denominator; defaults to the sum of segments
  height = 8,
  showLegend = true,
  style: styleProp,
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0);
  const total = (totalProp ?? sum) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...styleProp }}>
      <div style={{
        display: 'flex', gap: segments.length > 1 ? 2 : 0, height,
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
        background: 'var(--sunken)',
      }}>
        {segments.map((s, i) => (
          s.value > 0 && (
            <div key={i} style={{
              width: `${Math.min(100, (s.value / total) * 100)}%`,
              background: s.color,
              transition: 'width var(--dur-base, 200ms) var(--ease-out, ease-out)',
            }}/>
          )
        ))}
      </div>
      {showLegend && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {segments.map((s, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              font: 'var(--role-caption)', color: 'var(--text-secondary)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}/>
              {s.label}
              <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
