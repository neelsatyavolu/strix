'use client';
import { Button, Card, Icon } from '@/components/sixteen';
import s from './Home.module.css';

const MAX_CHIPS = 3;

// The hero: one recommended next step with a single primary action, plus a
// row of smaller secondary options (the lower-priority steps).
export function UpNext({ steps }) {
  const [primary, ...rest] = steps;
  if (!primary) return null;
  const chips = rest.filter((st) => st.chip).slice(0, MAX_CHIPS);

  return (
    <Card padding="none" className={s.hero}>
      <div className={s.heroMain}>
        <span className={s.heroIcon} aria-hidden="true">
          <Icon name={primary.icon} size={20} />
        </span>
        <div className={s.heroText}>
          <span className={s.kicker}>Up next</span>
          <h2 className={s.heroTitle}>{primary.title}</h2>
          {primary.body && <p className={s.heroBody}>{primary.body}</p>}
        </div>
        <div className={s.heroActions}>
          {primary.secondary && (
            <Button variant="ghost" onClick={primary.secondary.run}>{primary.secondary.label}</Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={primary.run}
            iconRight={<Icon name="arrow-right" size={15} />}
          >
            {primary.cta}
          </Button>
        </div>
      </div>
      {chips.length > 0 && (
        <div className={s.heroMore}>
          <span className={s.moreLabel}>Also</span>
          {chips.map((c) => (
            <button key={c.key} type="button" className={s.chip} onClick={c.run}>
              <Icon name={c.icon} size={13} />
              <span className={s.chipText}>{c.chip}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
