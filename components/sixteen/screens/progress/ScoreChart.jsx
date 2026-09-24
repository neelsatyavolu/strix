'use client';
import React from 'react';
import s from './ScoreChart.module.css';

// ScoreChart — hand-rolled SVG line of score estimates over time. Measures its
// own width so text and dots render at true size (no stretched viewBox).
// points: [{ at: ISO string, score: number }] oldest → newest.

const PAD = { top: 20, right: 20, bottom: 28, left: 44 };
const STEPS = [10, 20, 25, 50, 100, 200];
const DATE_FMT = { month: 'short', day: 'numeric' };

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, DATE_FMT);
}

// Nice y-axis bounds + ticks, clamped to the score scale.
function yScale(scores, scaleMin, scaleMax) {
  const dataLo = Math.min(...scores);
  const dataHi = Math.max(...scores);
  const span = Math.max(40, dataHi - dataLo);
  const step = STEPS.find((st) => span / st <= 4) ?? 200;
  const lo = Math.max(scaleMin, Math.floor((dataLo - span * 0.15) / step) * step);
  const hi = Math.min(scaleMax, Math.ceil((dataHi + span * 0.15) / step) * step);
  const top = hi > lo ? hi : lo + step;
  const ticks = [];
  for (let v = lo; v <= top; v += step) ticks.push(v);
  return { lo, hi: top, ticks };
}

// Evenly spaced x-label indices, always including the first and last point.
function labelIndices(n, maxLabels) {
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i);
  const k = Math.max(2, maxLabels);
  return Array.from({ length: k }, (_, i) => Math.round((i * (n - 1)) / (k - 1)));
}

function useWidth() {
  const ref = React.useRef(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export default function ScoreChart({ points, color = 'var(--brand-blue)', scaleMin = 400, scaleMax = 1600, height = 220 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = React.useState(null);
  const gradId = `score-fill-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const scores = points.map((p) => p.score);
  const { lo, hi, ticks } = yScale(scores, scaleMin, scaleMax);
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const n = points.length;
  const xAt = (i) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.score).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(n - 1).toFixed(1)},${PAD.top + innerH} L${xAt(0).toFixed(1)},${PAD.top + innerH} Z`;
  const xLabels = labelIndices(n, Math.max(2, Math.floor(innerW / 72)));
  const last = n - 1;
  const active = hover ?? last;

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - PAD.left;
    const i = n === 1 ? 0 : Math.round((x / innerW) * (n - 1));
    setHover(Math.min(last, Math.max(0, i)));
  };

  return (
    <div ref={ref} className={s.wrap} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className={s.svg}
          role="img"
          aria-label={`Score estimate over ${n} sections, from ${scores[0]} to ${scores[last]}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.14 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} className={s.grid} />
              <text x={PAD.left - 10} y={yAt(t)} className={s.yLabel}>{t}</text>
            </g>
          ))}

          {xLabels.map((i) => (
            <text
              key={i}
              x={xAt(i)}
              y={height - 8}
              className={s.xLabel}
              textAnchor={n > 1 && i === 0 ? 'start' : n > 1 && i === last ? 'end' : 'middle'}
            >
              {fmtDate(points[i].at)}
            </text>
          ))}

          {n > 1 && <path d={area} fill={`url(#${gradId})`} />}
          {n > 1 && <path d={line} className={s.line} style={{ stroke: color }} />}

          {hover != null && (
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + innerH} className={s.cursor} />
          )}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(p.score)}
              r={i === active ? 4.5 : 3}
              className={i === active ? s.dotActive : s.dot}
              style={{ stroke: color, fill: i === active ? color : undefined }}
            />
          ))}
        </svg>
      )}

      {width > 0 && (
        <div
          className={s.tip}
          style={{
            left: Math.min(width - 60, Math.max(60, xAt(active))),
            top: yAt(points[active].score) - 12,
          }}
        >
          <span className={s.tipValue}>{points[active].score}</span>
          <span className={s.tipDate}>{fmtDate(points[active].at)}</span>
        </div>
      )}
    </div>
  );
}
