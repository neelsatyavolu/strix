'use client';
import React from 'react';
import { Button, Icon, Input, List, ListRow, Section } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { updateTargetScore } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';
import s from './Settings.module.css';

// Study goal — target score and test date. Both pace the study plan.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function StudyGoalSection() {
  return (
    <Section title="Study goal" description="Your plan paces practice toward these.">
      <List>
        <TargetRow />
        <TestDateRow />
      </List>
    </Section>
  );
}

// Editable value synced to a saved profile field; `dirty` shows the Save button.
function useSavedField(saved) {
  const [value, setValue] = React.useState(saved);
  // Re-seed when the saved value changes (after a save/refresh).
  const [seed, setSeed] = React.useState(saved);
  if (seed !== saved) { setSeed(saved); setValue(saved); }
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  return { value, setValue, dirty: value.trim() !== saved, saving, setSaving, error, setError };
}

function TargetRow() {
  const { profile, refresh } = useProfile();
  const saved = profile?.target_score == null ? '' : String(profile.target_score);
  const f = useSavedField(saved);

  const save = async () => {
    if (!f.dirty) return;
    const trimmed = f.value.trim();
    f.setError(null);
    f.setSaving(true);
    try {
      const res = await updateTargetScore(trimmed === '' ? null : Number(trimmed));
      if (!res.ok) { f.setError(res.error || 'Could not save.'); return; }
      await refresh();
    } finally {
      f.setSaving(false);
    }
  };

  return (
    <ListRow
      leading={<span className={s.iconWell}><Icon name="target" size={15} /></span>}
      title="Target score"
      subtitle={f.error ? <span className={s.error}>{f.error}</span> : 'Between 400 and 1600'}
      trailing={(
        <form className={s.inlineForm} onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input
            size="sm"
            type="number"
            min={400}
            max={1600}
            step={10}
            value={f.value}
            placeholder="Not set"
            aria-label="Target score"
            invalid={!!f.error}
            onChange={(e) => f.setValue(e.target.value)}
            className={s.scoreInput}
            inputStyle={{ fontVariantNumeric: 'tabular-nums' }}
          />
          {f.dirty && <Button type="submit" variant="primary" size="sm" loading={f.saving}>Save</Button>}
        </form>
      )}
    />
  );
}

function TestDateRow() {
  const { profile, refresh, user } = useProfile();
  const raw = profile?.test_date || '';
  const saved = ISO_DATE.test(raw) ? raw : '';
  const f = useSavedField(saved);

  const save = async () => {
    if (!f.dirty) return;
    const v = f.value.trim();
    if (v && !ISO_DATE.test(v)) { f.setError('Pick a valid date.'); return; }
    if (!user?.id) { f.setError('You must be signed in.'); return; }
    f.setError(null);
    f.setSaving(true);
    try {
      const { error } = await createClient()
        .from('profiles')
        .update({ test_date: v || null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) { f.setError(error.message || 'Could not save.'); return; }
      await refresh();
    } finally {
      f.setSaving(false);
    }
  };

  const subtitle = f.error
    ? <span className={s.error}>{f.error}</span>
    : (saved ? 'Clear it if your date changes' : "Optional — add it when you've registered");

  return (
    <ListRow
      leading={<span className={s.iconWell}><Icon name="calendar" size={15} /></span>}
      title="Test date"
      subtitle={subtitle}
      trailing={(
        <form className={s.inlineForm} onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Input
            size="sm"
            type="date"
            min={todayIso()}
            value={f.value}
            aria-label="Test date"
            invalid={!!f.error}
            onChange={(e) => f.setValue(e.target.value)}
            className={s.dateInput}
          />
          {f.dirty && <Button type="submit" variant="primary" size="sm" loading={f.saving}>Save</Button>}
        </form>
      )}
    />
  );
}
