'use client';
import React from 'react';
import { Metric } from '@/components/sixteen';
import s from './ActivityGrid.module.css';

// ActivityGrid — practice sessions per day as a week-column heatmap (rows are
// weekdays, the last column is this week), plus a few activity figures.

const WEEKS = 16;
const DAY = 24 * 3600 * 1000;
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function startOfDay(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function countByDay(sessions) {
  return (sessions ?? []).reduce((acc, sess) => {
    const t = new Date(sess.created_at).getTime();
    if (Number.isNaN(t)) return acc;
    const key = startOfDay(t);
    return { ...acc, [key]: (acc[key] || 0) + 1 };
  }, {});
}

function level(v) {
  if (!v) return s.l0;
  if (v === 1) return s.l1;
  if (v === 2) return s.l2;
  return s.l3;
}

export default function ActivityGrid({ sessions }) {
  // Captured once per mount; the grid doesn't need to roll over at midnight.
  const [today] = React.useState(() => startOfDay(Date.now()));
  const { weeks, months, totals } = React.useMemo(() => {
    const counts = countByDay(sessions);
    const todayDow = new Date(today).getDay();
    // Sunday that starts the first column.
    const first = startOfDay(today - (todayDow + (WEEKS - 1) * 7) * DAY + 2 * 3600 * 1000);
    const cols = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const t = startOfDay(first + (w * 7 + d) * DAY + 2 * 3600 * 1000); // DST-safe
        return { t, v: counts[t] || 0, future: t > today };
      }),
    );
    const monthLabels = cols.map((col, i) => {
      const m = new Date(col[0].t).getMonth();
      const prev = i === 0 ? null : new Date(cols[i - 1][0].t).getMonth();
      return i === 0 || m !== prev ? new Date(col[0].t).toLocaleDateString(undefined, { month: 'short' }) : '';
    });
    const days = cols.flat().filter((c) => !c.future);
    const weekStart = cols[cols.length - 1][0].t;
    return {
      weeks: cols,
      months: monthLabels,
      totals: {
        sessions: days.reduce((a, c) => a + c.v, 0),
        activeDays: days.filter((c) => c.v > 0).length,
        thisWeek: days.filter((c) => c.t >= weekStart).reduce((a, c) => a + c.v, 0),
      },
    };
  }, [sessions, today]);

  return (
    <div className={s.wrap}>
      <div className={s.gridWrap}>
        <div className={s.grid} style={{ gridTemplateColumns: `auto repeat(${WEEKS}, var(--cell))` }}>
          <span />
          {months.map((m, i) => <span key={`m${i}`} className={s.month}>{m}</span>)}
          {WEEKDAY_LABELS.map((label, d) => (
            <React.Fragment key={`r${d}`}>
              <span className={s.weekday}>{label}</span>
              {weeks.map((col, w) => {
                const c = col[d];
                const date = new Date(c.t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <span
                    key={`${w}-${d}`}
                    className={c.future ? s.future : `${s.cell} ${level(c.v)}`}
                    title={c.future ? undefined : `${date}: ${c.v} session${c.v === 1 ? '' : 's'}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className={s.legend} aria-hidden="true">
          Less
          <span className={`${s.cell} ${s.l0}`} />
          <span className={`${s.cell} ${s.l1}`} />
          <span className={`${s.cell} ${s.l2}`} />
          <span className={`${s.cell} ${s.l3}`} />
          More
        </div>
      </div>
      <div className={s.figures}>
        <Metric size="sm" label="This week" value={totals.thisWeek} unit={totals.thisWeek === 1 ? 'session' : 'sessions'} />
        <Metric size="sm" label={`Last ${WEEKS} weeks`} value={totals.sessions} unit={totals.sessions === 1 ? 'session' : 'sessions'} />
        <Metric size="sm" label="Active days" value={totals.activeDays} />
      </div>
    </div>
  );
}
