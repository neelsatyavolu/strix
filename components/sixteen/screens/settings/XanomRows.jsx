'use client';
import React from 'react';
import { Button, Icon, ListRow } from '@/components/sixteen';
import { createClient } from '@/lib/supabase/client';
import { startXanom, readXanomError, clearXanomParams } from '@/components/sixteen/session/xanom';
import s from './Settings.module.css';

// Xanom account rows for Settings > Account: linked state, or convert / link.

const MANAGE_URL = 'https://accounts.xanom.co/';

export default function XanomRows({ userId }) {
  const [link, setLink] = React.useState(undefined); // undefined = loading, null = not linked
  const [error, setError] = React.useState(readXanomError);
  const [busy, setBusy] = React.useState(null);
  React.useEffect(() => { clearXanomParams(); }, []);

  React.useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    createClient()
      .from('xanom_links')
      .select('xanom_email')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => { if (live) setLink(data ?? null); });
    return () => { live = false; };
  }, [userId]);

  if (link === undefined) return null;

  if (link) {
    return (
      <ListRow
        leading={<span className={s.iconWell}><Icon name="shield-check" size={15} /></span>}
        title="Signed in with Xanom"
        subtitle={link.xanom_email || 'Linked'}
        trailing={(
          <a className={s.textLink} href={MANAGE_URL} target="_blank" rel="noopener noreferrer">
            Manage at accounts.xanom.co
          </a>
        )}
      />
    );
  }

  const go = (intent) => { setError(null); setBusy(intent); startXanom(intent, '/app#/settings'); };

  return (
    <>
      <ListRow
        leading={<span className={s.iconWell}><Icon name="shield-check" size={15} /></span>}
        title="Convert to Xanom account"
        subtitle={error ? <span className={s.error}>{error}</span> : 'One sign-in for Strix and the other Xanom apps.'}
        trailing={<Button variant="primary" size="sm" loading={busy === 'convert'} onClick={() => go('convert')}>Convert</Button>}
      />
      <ListRow
        leading={<span className={s.iconWell}><Icon name="link" size={15} /></span>}
        title="Link an existing Xanom account"
        subtitle="For a Xanom account under a different email."
        trailing={<Button variant="outline" size="sm" loading={busy === 'link'} onClick={() => go('link')}>Link</Button>}
      />
    </>
  );
}
