'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { useInsight } from '@/lib/ai/insights';

// CategoryDetail — drill-down for one CB content domain. Shows skill-level
// accuracy, an AI/baseline study insight, and the full attempt history
// (which exact questions were right/wrong), paginated newest-first.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const DIFF_LABEL = { E: 'Easy', M: 'Medium', H: 'Hard' };
const DIFF_VARIANT = { E: 'success', M: 'warning', H: 'error' };

function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function fmtTime(ms) {
  if (!ms || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Deterministic skill read — the offline fallback. Matches parsed-insight shape.
function categoryBaseline(label, skills, totals) {
  const pool = (skills ?? []).filter((s) => s.done > 0);
  if (!pool.length) return null;
  const eligible = pool.filter((s) => s.done >= 3);
  const ranked = [...(eligible.length ? eligible : pool)].sort((a, b) => b.accuracy - a.accuracy);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const same = best.skill === worst.skill;
  return {
    summary: `You're at ${totals.accuracy}% across ${totals.done} ${label} question${totals.done === 1 ? '' : 's'}.`,
    strength: `${best.label} — ${best.accuracy}%.`,
    focus: same ? '' : `${worst.label} — ${worst.accuracy}%. This is your weakest skill in ${label}.`,
    actions: same
      ? [`Keep practicing ${label} to build a fuller picture`]
      : [`Target ${worst.label} questions next`, `Re-attempt the ${worst.label} ones you missed below`],
  };
}

function CategoryDetail({ go, section = 'rw', domain, label, studentId = null }) {
  const { Card, Badge, AccuracyRing, Button } = SixteenNS;
  const accent = section === 'rw' ? 'var(--rw-color)' : 'var(--math-color)';

  const [data, setData] = React.useState(null);
  const [attempts, setAttempts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [hasMore, setHasMore] = React.useState(false);

  const fetchPage = React.useCallback(async (offset) => {
    const sq = studentId ? `&studentId=${encodeURIComponent(studentId)}` : '';
    const res = await fetch(`/api/stats/category?section=${section}&domain=${domain}&limit=100&offset=${offset}${sq}`);
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'Failed to load category');
    return json.data;
  }, [section, domain, studentId]);

  React.useEffect(() => {
    let on = true;
    setLoading(true);
    setError(null);
    fetchPage(0)
      .then((d) => {
        if (!on) return;
        setData(d);
        setAttempts(d.attempts || []);
        setHasMore(!!d.hasMore);
      })
      .catch((e) => on && setError(e.message))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const d = await fetchPage(attempts.length);
      setAttempts((prev) => [...prev, ...(d.attempts || [])]);
      setHasMore(!!d.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const totals = data?.totals ?? { done: 0, correct: 0, accuracy: 0 };
  const skills = data?.skills ?? [];
  const baseline = React.useMemo(() => categoryBaseline(label, skills, totals), [label, skills, totals]);
  const payload = React.useMemo(() => ({
    category: label,
    section: SECTION_LABEL[section],
    accuracy: totals.accuracy,
    answered: totals.done,
    skills: skills.filter((s) => s.done > 0).map((s) => ({ skill: s.label, answered: s.done, accuracy: s.accuracy })),
    recentMistakes: attempts.filter((a) => !a.isCorrect).slice(0, 8).map((a) => ({
      skill: a.skillLabel, difficulty: DIFF_LABEL[a.difficulty] || a.difficulty, question: a.stem.slice(0, 180),
    })),
  }), [label, section, totals, skills, attempts]);
  const ins = useInsight({ scope: `cat:${section}:${domain}`, payload, baseline, ready: !loading && totals.done > 0 });

  return (
    <div style={{ padding: '28px 36px', maxWidth: 920, margin: '0 auto' }}>
      <button
        onClick={() => go('stats')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-secondary)', font: 'var(--role-label)', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" style={{ width: 15, height: 15 }} /> Back to Stats
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, font: 'var(--role-title-lg)' }}>{label}</h1>
        <Badge variant={section} dot>{SECTION_LABEL[section]}</Badge>
      </div>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : error ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>Couldn&apos;t load this category</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>{error}</div>
        </Card>
      ) : totals.done === 0 ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>No questions yet</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>Practice {label} questions to see your history and insights here.</div>
        </Card>
      ) : (
        <>
          <Card padding="lg" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              <AccuracyRing value={totals.accuracy} color={accent} label="Accuracy" />
              <div style={{ display: 'flex', gap: 28 }}>
                <Stat label="Answered" value={totals.done} />
                <Stat label="Correct" value={totals.correct} />
                <Stat label="Incorrect" value={totals.done - totals.correct} />
              </div>
            </div>
          </Card>

          <InsightCard title="Deeper insight" accent={accent} {...ins} />

          {skills.length > 0 && (
            <Card padding="lg" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 14px', font: 'var(--role-title-sm)' }}>By skill</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {skills.map((s, i) => (
                  <SkillRow key={s.skill + i} skill={s} accent={accent} best={i === 0 && skills.length > 1} worst={i === skills.length - 1 && skills.length > 1} />
                ))}
              </div>
            </Card>
          )}

          <Card padding="lg">
            <h2 style={{ margin: '0 0 4px', font: 'var(--role-title-sm)' }}>Question history</h2>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 14 }}>
              Showing {attempts.length} of {totals.done}, newest first
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {attempts.map((a, i) => (
                <AttemptRow key={i} a={a} first={i === 0} />
              ))}
            </div>
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>Load more</Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ font: 'var(--role-title-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function SkillRow({ skill, accent, best, worst }) {
  const { Badge } = SixteenNS;
  const tone = skill.accuracy >= 75 ? 'var(--success)' : skill.accuracy >= 55 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--role-body)', color: 'var(--text-primary)' }}>
          {skill.label}
          {best && <Badge variant="success" size="sm">Strongest</Badge>}
          {worst && <Badge variant="warning" size="sm">Focus</Badge>}
        </span>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {skill.correct}/{skill.done} · <span style={{ color: tone }}>{skill.accuracy}%</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--sunken)', overflow: 'hidden' }}>
        <div style={{ width: `${skill.accuracy}%`, height: '100%', background: accent, opacity: 0.85 }} />
      </div>
    </div>
  );
}

function AttemptRow({ a, first }) {
  const { Badge } = SixteenNS;
  const t = fmtTime(a.timeMs);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'flex-start',
      padding: '13px 0', borderTop: first ? 0 : '1px solid var(--border-1)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', marginTop: 1,
        background: a.isCorrect ? 'color-mix(in srgb, var(--success) 16%, transparent)' : 'color-mix(in srgb, var(--error) 16%, transparent)',
        color: a.isCorrect ? 'var(--success)' : 'var(--error)', flexShrink: 0,
      }}>
        <Icon name={a.isCorrect ? 'check' : 'x'} style={{ width: 13, height: 13 }} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <span style={{
          font: 'var(--role-body)', color: 'var(--text-primary)', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {a.stem || `${a.skillLabel} question`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
          {a.difficulty && <Badge variant={DIFF_VARIANT[a.difficulty] || 'neutral'} size="sm">{DIFF_LABEL[a.difficulty] || a.difficulty}</Badge>}
          <span>{a.skillLabel}</span>
          {a.type === 'mcq' ? (
            <span>
              You: <b style={{ color: a.isCorrect ? 'var(--success)' : 'var(--error)' }}>{a.yourAnswer || '—'}</b>
              {!a.isCorrect && a.correct ? <> · Correct: <b style={{ color: 'var(--text-secondary)' }}>{a.correct}</b></> : null}
            </span>
          ) : (
            <span>You: <b style={{ color: a.isCorrect ? 'var(--success)' : 'var(--error)' }}>{a.yourAnswer || '—'}</b>{!a.isCorrect && a.correct ? <> · Correct: <b style={{ color: 'var(--text-secondary)' }}>{a.correct}</b></> : null}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        <span>{ago(a.at)}</span>
        {t && <span>{t}</span>}
      </div>
    </div>
  );
}

export default CategoryDetail;
