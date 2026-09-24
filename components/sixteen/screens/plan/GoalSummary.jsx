'use client';
import { Button, Card, EmptyState, Metric, Section } from '@/components/sixteen';
import s from './Plan.module.css';

// Goal — target score, latest estimate, points to go, and the test countdown.
// Guides the student to Settings when no goal is set.

function testDateHint(iso) {
  if (!iso) return 'Not set';
  // A bare YYYY-MM-DD is a calendar day — read it as local, not UTC midnight.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function GoalSummary({ plan, go, readOnly = false, firstName = null }) {
  const hasGoal = plan.target != null || plan.testDate != null;
  const toSettings = () => go('settings');

  if (!hasGoal) {
    return (
      <Section title="Goal">
        <Card padding="none">
          <EmptyState
            compact
            icon="flag"
            title={firstName ? `${firstName} hasn’t set a goal yet` : 'Set your goal'}
            body={firstName
              ? 'Once they add a target score and test date, the plan works toward them.'
              : 'Add a target score and test date so your plan knows what to aim for.'}
            action={!readOnly && <Button variant="secondary" size="sm" onClick={toSettings}>Open Settings</Button>}
          />
        </Card>
      </Section>
    );
  }

  const gap = plan.gap;
  return (
    <Section
      title="Goal"
      action={!readOnly && <Button variant="ghost" size="sm" onClick={toSettings}>Edit goal</Button>}
    >
      <Card padding="lg">
        <div className={s.metrics}>
          <Metric
            size="sm"
            label="Target score"
            value={plan.target ?? '—'}
            hint={plan.target == null ? 'Not set' : undefined}
          />
          <Metric
            size="sm"
            label="Current estimate"
            value={plan.currentEstimate ?? '—'}
            hint={plan.currentEstimate == null ? 'Finish a section to get one' : 'Latest total'}
          />
          {gap != null && (
            <Metric
              size="sm"
              label="To go"
              value={gap > 0 ? `+${gap}` : '0'}
              unit="pts"
              hint={gap > 0 ? 'Points to target' : 'At or above target'}
              color={gap > 0 ? undefined : 'var(--success)'}
            />
          )}
          <Metric
            size="sm"
            label="Test in"
            value={plan.daysUntilTest ?? '—'}
            unit={plan.daysUntilTest != null ? (plan.daysUntilTest === 1 ? 'day' : 'days') : undefined}
            hint={testDateHint(plan.testDate)}
          />
        </div>
      </Card>
    </Section>
  );
}
