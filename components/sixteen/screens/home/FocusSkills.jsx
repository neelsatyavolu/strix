'use client';
import { Button, EmptyState, List, ListRow, Section } from '@/components/sixteen';
import { SectionMark } from './SectionMark';
import { SECTION_LABEL, accuracyColor, plural } from './helpers';

// The weakest skills by recent accuracy, each one click from a focused drill.
export function FocusSkills({ focus, readOnly, firstName, onPractice }) {
  return (
    <Section
      title="Skills to focus on"
      description={`Where ${readOnly ? `${firstName}'s` : 'your'} recent accuracy is lowest.`}
    >
      <List>
        {focus.length === 0 ? (
          <EmptyState
            compact
            icon="target"
            title="No weak spots to call out yet"
            body="After a few questions in a topic, the ones that need work show up here."
          />
        ) : focus.map((f) => {
          const acc = f.accuracy ?? 0;
          return (
            <ListRow
              key={`${f.section}-${f.id}`}
              leading={<SectionMark section={f.section} />}
              title={f.label}
              subtitle={`${SECTION_LABEL[f.section]} · ${plural(f.attempts, 'question')} answered`}
              meta={<span style={{ color: accuracyColor(acc) }}>{acc}%</span>}
              trailing={readOnly ? null : (
                <Button variant="secondary" size="sm" onClick={() => onPractice(f)}>Practice</Button>
              )}
            />
          );
        })}
      </List>
    </Section>
  );
}
