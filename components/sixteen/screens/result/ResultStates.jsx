'use client';
import { Button, EmptyState, Skeleton } from '@/components/sixteen';
import s from './ResultStates.module.css';

/** ResultSkeleton — loading shape matching ResultHeader + breakdown + question list. */
export function ResultSkeleton({ rows = 6 }) {
  return (
    <div aria-busy="true" aria-label="Loading results">
      <div className={s.head}>
        <Skeleton width={180} height={16} />
        <Skeleton width={280} height={28} style={{ marginTop: 10 }} />
        <Skeleton width={360} height={14} style={{ marginTop: 10 }} />
      </div>
      <div className={s.band}>
        <Skeleton width={150} height={48} radius={8} />
        {[0, 1, 2].map((i) => <Skeleton key={i} width={72} height={36} radius={8} />)}
      </div>
      <Skeleton width={120} height={18} />
      <div className={s.rows}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={s.row}>
            <Skeleton width={36} height={16} />
            <Skeleton width={`${40 + ((i * 17) % 35)}%`} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** ResultError — inline load failure with a retry. */
export function ResultError({ title, message, onRetry }) {
  return (
    <EmptyState
      icon="circle-alert"
      title={title}
      body={message}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}
