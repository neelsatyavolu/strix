'use client';
import { Button, EmptyState, List, ListRow, Section, Skeleton } from '@/components/sixteen';
import { SectionMark } from './SectionMark';
import s from './Home.module.css';
import { SECTION_LABEL, accuracyColor, plural, relTime, sessionTitle } from './helpers';

const RECENT_COUNT = 5;

function subtitle(sess) {
  const parts = [SECTION_LABEL[sess.section] || sess.section, relTime(sess.created_at)];
  if (sess.score_total) parts.push(plural(sess.score_total, 'question'));
  if (sess.mode === 'mock-full' && sess.scaled_score != null) parts.push(`Score ${sess.scaled_score}`);
  return parts.join(' · ');
}

// The last few sessions; each opens its detail, "See all" opens History.
export function RecentActivity({ sessions, loading = false, readOnly, firstName, go }) {
  const recent = sessions.slice(0, RECENT_COUNT);
  return (
    <Section
      title="Recent activity"
      action={recent.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => go('progress', { tab: 'history' })}>See all</Button>
      )}
    >
      <List>
        {recent.length === 0 && loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className={s.skelRow}>
              <Skeleton width={32} height={32} radius={8} />
              <Skeleton width="45%" height={13} />
            </div>
          ))
        ) : recent.length === 0 ? (
          <EmptyState
            compact
            icon="history"
            title="No sessions yet"
            body={readOnly
              ? `${firstName}'s drills and full sections will show up here.`
              : 'Your drills and full sections will show up here.'}
          />
        ) : recent.map((sess) => {
          const acc = sess.accuracy ?? 0;
          return (
            <ListRow
              key={sess.id}
              leading={<SectionMark section={sess.section} />}
              title={sessionTitle(sess)}
              subtitle={subtitle(sess)}
              meta={<span style={{ color: accuracyColor(acc) }}>{acc}%</span>}
              onClick={() => go('session-detail', { id: sess.id })}
            />
          );
        })}
      </List>
    </Section>
  );
}
