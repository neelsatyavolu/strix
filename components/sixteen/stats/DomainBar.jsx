'use client';
import React from 'react';

/**
 * DomainBar — horizontal segmented bar showing breakdown by category.
 * Each segment is { value, label, color }.
 */
export function DomainBar({
  segments,           // [{value, label, color}]
  height = 10,
  showLegend = true,
  style: styleProp,
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...styleProp }}>
      <div style={{
        display: 'flex', height,
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
        background: 'var(--sunken)',
      }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            width: `${(s.value / total) * 100}%`,
            background: s.color,
            borderRight: i < segments.length - 1 ? '2px solid var(--paper)' : 0,
          }}/>
        ))}
      </div>
      {showLegend && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {segments.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              font: 'var(--role-caption)', color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}/>
              {s.label}
              <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
