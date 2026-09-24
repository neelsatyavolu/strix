'use client';
import { Icon } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import s from './Home.module.css';

// Small tinted tile identifying a row's SAT section (R&W violet, Math green).
export function SectionMark({ section }) {
  const math = section === 'math';
  return (
    <span className={cx(s.mark, math ? s.markMath : s.markRw)} title={math ? 'Math' : 'Reading & Writing'}>
      <Icon name={math ? 'sigma' : 'book-open-text'} size={15} />
    </span>
  );
}
