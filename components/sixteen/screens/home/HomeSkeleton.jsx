'use client';
import { Card, List, Section, Skeleton } from '@/components/sixteen';
import s from './Home.module.css';

function RowSkeleton() {
  return (
    <div className={s.skelRow}>
      <Skeleton width={32} height={32} radius={8} />
      <div className={s.skelStack}>
        <Skeleton width="45%" height={13} />
        <Skeleton width="30%" height={11} />
      </div>
      <Skeleton width={36} height={13} />
    </div>
  );
}

// Loading placeholder shaped like the Home layout (hero, scores, two lists).
export function HomeSkeleton() {
  return (
    <>
      <Card padding="none" className={s.hero}>
        <div className={s.heroMain}>
          <Skeleton width={44} height={44} radius={12} />
          <div className={s.skelStack}>
            <Skeleton width={60} height={12} />
            <Skeleton width="55%" height={20} />
            <Skeleton width="75%" height={13} />
          </div>
          <Skeleton width={150} height={40} radius={8} />
        </div>
      </Card>
      <Section title="Estimated score">
        <Card padding="none" className={s.scoreCard}>
          <div className={s.scores}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={s.skelStack}>
                <Skeleton width={90} height={12} />
                <Skeleton width={i === 0 ? 140 : 100} height={i === 0 ? 44 : 30} />
              </div>
            ))}
          </div>
        </Card>
      </Section>
      <Section title="Skills to focus on">
        <List><RowSkeleton /><RowSkeleton /></List>
      </Section>
      <Section title="Recent activity">
        <List><RowSkeleton /><RowSkeleton /><RowSkeleton /></List>
      </Section>
    </>
  );
}
