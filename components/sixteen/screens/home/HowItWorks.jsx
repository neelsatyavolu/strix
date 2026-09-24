'use client';
import { Icon, Section } from '@/components/sixteen';
import s from './Home.module.css';

const STEPS = [
  { icon: 'circle-play', title: 'Practice', body: 'Drill one skill at a time, or take a full-length timed section.' },
  { icon: 'repeat', title: 'Review', body: 'Questions you miss come back for review right before you would forget them.' },
  { icon: 'chart-line', title: 'Track', body: 'Watch your accuracy by skill and your estimated score move over time.' },
];

// Shown to a brand-new student under the welcome step: the loop in one glance.
export function HowItWorks() {
  return (
    <Section title="How Strix works">
      <ol className={s.how}>
        {STEPS.map((st) => (
          <li key={st.title} className={s.howItem}>
            <span className={s.howIcon} aria-hidden="true"><Icon name={st.icon} size={16} /></span>
            <span className={s.howTitle}>{st.title}</span>
            <span className={s.howBody}>{st.body}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
