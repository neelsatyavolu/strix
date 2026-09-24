'use client';
import { Section } from '@/components/sixteen';
import { DomainBreakdown } from './DomainBreakdown';
import { QuestionList } from './QuestionList';
import { SECTION_COLOR, SECTION_LABEL, finiteRange } from './format';
import s from './SectionResult.module.css';

const ROUTED = { hard: 'Module 2B (harder)', easy: 'Module 2A (easier)' };

/**
 * SectionResult — one section of a full SAT: its scaled score, domain
 * breakdown, and question list. `filter` / `onFilterChange` are forwarded to
 * QuestionList so both halves can share one filter.
 */
export function SectionResult({ result: r, filter, onFilterChange }) {
  const description = [
    `${r.correct} of ${r.total} correct`,
    finiteRange(r.scaledRange) ? `likely ${r.scaledRange.lower}–${r.scaledRange.upper}` : null,
    ROUTED[r.m2Variant] || null,
  ].filter(Boolean).join(' · ');

  return (
    <Section
      className={s.section}
      title={SECTION_LABEL[r.section]}
      description={description}
      action={(
        <span className={s.score}>
          <span className={s.value} style={{ color: SECTION_COLOR[r.section] }}>{r.scaled ?? '—'}</span>
          <span className={s.max}>/ 800</span>
        </span>
      )}
    >
      <DomainBreakdown domains={r.byDomain} section={r.section} />
      <div className={s.questions}>
        <QuestionList
          review={r.review}
          filter={filter}
          onFilterChange={onFilterChange}
          emptyTitle="No questions recorded for this section"
        />
      </div>
    </Section>
  );
}
