'use client';
import { Button, Icon, List, ListRow, Metric } from '@/components/sixteen';
import s from './Study.module.css';

/** Finish screen: score, the words from this session, and what to do next. */
export default function SessionSummary({ results, onAgain, onBack, starting, error }) {
  const correct = results.filter((r) => r.correct).length;
  const missed = results.length - correct;

  return (
    <div className={s.summary}>
      <div className={s.summaryHead}>
        <span className={s.summaryIcon}><Icon name="circle-check" size={22} /></span>
        <h1 className={s.summaryTitle}>Session complete</h1>
        <p className={s.summaryBody}>Words you missed or studied will come back on a schedule so they stick.</p>
      </div>

      <div className={s.metrics}>
        <Metric label="Correct" value={correct} unit={`of ${results.length}`} />
        <Metric label="To revisit" value={missed} />
      </div>

      <div className={s.summaryActions}>
        <Button variant="secondary" onClick={onBack}>Back to Vocabulary</Button>
        <Button variant="primary" icon={<Icon name="play" size={13} />} loading={starting} onClick={onAgain}>
          Practice again
        </Button>
      </div>

      {error && <p className={s.error} role="alert">{error}</p>}

      {results.length > 0 && (
        <List>
          {results.map((r, i) => (
            <ListRow
              key={`${r.word}-${i}`}
              leading={(
                <Icon
                  name={r.correct ? 'check' : 'x'}
                  size={15}
                  style={{ color: r.correct ? 'var(--success)' : 'var(--error)' }}
                />
              )}
              title={r.word}
              meta={r.correct ? 'Correct' : 'Missed'}
            />
          ))}
        </List>
      )}
    </div>
  );
}
