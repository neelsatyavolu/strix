'use client';
import { Card, List, Skeleton } from '@/components/sixteen';
import s from './Progress.module.css';

// Loading placeholders shaped like the Progress layouts.

export function MetricsSkeleton({ count = 4 }) {
  return (
    <Card padding="lg">
      <div className={s.metrics}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={s.skelStack}>
            <Skeleton width={72} height={12} />
            <Skeleton width={88} height={28} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <List>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.skelRow} style={{ padding: '14px 16px', borderTop: i ? '1px solid var(--border-1)' : 0 }}>
          <div className={s.skelStack} style={{ flex: 1 }}>
            <Skeleton width="40%" height={13} />
            <Skeleton width="22%" height={11} />
          </div>
          <Skeleton width={120} height={8} />
        </div>
      ))}
    </List>
  );
}

export function TabSkeleton() {
  return (
    <div className={s.tabBody} aria-busy="true" aria-label="Loading">
      <MetricsSkeleton />
      <Card padding="lg"><Skeleton height={200} /></Card>
      <ListSkeleton />
    </div>
  );
}
