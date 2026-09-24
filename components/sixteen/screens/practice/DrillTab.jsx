'use client';
import React from 'react';
import { SegmentedControl, Section, Skeleton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useStats } from '@/lib/data/hooks';
import StartBar from './StartBar';
import s from './Practice.module.css';
import {
  BASE_CATS, COUNT_OPTIONS, DIFFICULTY_OPTIONS, SECTION_LABEL, SECTION_OPTIONS, TIMING_OPTIONS,
  drillMinutes, timingHint, validSection,
} from './practiceConfig';

const DIFF_IDS = new Set(DIFFICULTY_OPTIONS.map((o) => o.value));
const COUNTS = new Set(COUNT_OPTIONS.map((o) => Number(o.value)));

// Drill — pick a section, a skill, difficulty + count, then start.
export default function DrillTab({ go, initial = {}, readOnly = false, studentId = null, studentName }) {
  const session = usePracticeSession();
  const { stats, loading } = useStats(studentId);
  const [section, setSection] = React.useState(() => validSection(initial.domain));
  const [cat, setCat] = React.useState(initial.category || null);
  const [diff, setDiff] = React.useState(() => (DIFF_IDS.has(initial.difficulty) ? initial.difficulty : 'all'));
  const [count, setCount] = React.useState(() => (COUNTS.has(Number(initial.count)) ? Number(initial.count) : 10));
  const [timed, setTimed] = React.useState('untimed'); // 'untimed' | 'per-q' | 'total'

  const cats = stats?.categories?.[section]?.length ? stats.categories[section] : BASE_CATS[section];
  const selected = cats.find((c) => c.id === cat) || cats[0];
  const statsPending = loading && !stats;

  const start = () => {
    session.start({ section, mode: 'drill', category: selected.id, difficulty: diff, count, timing: timed });
    go(section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const diffWord = diff === 'all' ? '' : `${DIFFICULTY_OPTIONS.find((o) => o.value === diff).label} `;
  const minutes = drillMinutes({ section, count, timing: timed });
  const title = `${count} ${diffWord}questions · ${selected.label}`;
  const detail = [
    SECTION_LABEL[section],
    diff === 'all' && 'adaptive difficulty',
    timed === 'untimed' ? 'untimed' : 'timed',
    `~${minutes} min`,
  ].filter(Boolean).join(' · ');
  const accuracyOwner = readOnly && studentName ? `${studentName}'s` : 'Your';

  return (
    <>
      <SegmentedControl
        label="Section"
        options={SECTION_OPTIONS}
        value={section}
        onChange={(v) => { setSection(v); setCat(null); }}
        className={s.sectionPicker}
      />

      <div className={s.drillGrid}>
        <Section title="Skill" description={`${accuracyOwner} accuracy is shown for each skill.`}>
          <div role="radiogroup" aria-label="Skill" className={s.options}>
            {cats.map((c) => (
              <SkillRow
                key={c.id}
                cat={c}
                selected={c.id === selected.id}
                pending={statsPending}
                onSelect={() => setCat(c.id)}
              />
            ))}
          </div>
        </Section>

        <Section title="Options" className={s.drillOptions}>
          <div className={s.fields}>
            <Field label="Difficulty">
              <SegmentedControl label="Difficulty" options={DIFFICULTY_OPTIONS} value={diff} onChange={setDiff} fullWidth />
            </Field>
            <Field label="Questions">
              <SegmentedControl
                label="Questions"
                options={COUNT_OPTIONS}
                value={String(count)}
                onChange={(v) => setCount(Number(v))}
                fullWidth
              />
            </Field>
            <Field label="Timing" hint={timingHint({ section, count, timing: timed })}>
              <SegmentedControl label="Timing" options={TIMING_OPTIONS} value={timed} onChange={setTimed} fullWidth />
            </Field>
          </div>
        </Section>
      </div>

      <StartBar
        title={title}
        detail={detail}
        label="Start drill"
        onStart={start}
        readOnly={readOnly}
        studentName={studentName}
      />
    </>
  );
}

function SkillRow({ cat, selected, pending, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(s.option, selected && s.optionSelected)}
    >
      <span className={cx(s.radio, selected && s.radioOn)} aria-hidden="true" />
      <span className={s.optionMain}>
        <span className={s.optionTitle}>{cat.label}</span>
        {pending ? (
          <Skeleton width={80} height={10} style={{ marginTop: 4 }} />
        ) : (
          <span className={s.optionSub}>{cat.done ? `${cat.done} answered` : 'Not practiced yet'}</span>
        )}
      </span>
      {!pending && cat.done > 0 && (
        <span className={s.optionMeta}>
          {cat.accuracy}%<span className={s.optionMetaUnit}> correct</span>
        </span>
      )}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={s.fieldHint}>{hint}</span>}
    </div>
  );
}
