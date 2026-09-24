'use client';
import React from 'react';
import { Avatar, Button, Icon, List, ListRow, Section } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import s from './Settings.module.css';

// Account — name, email, profile picture, sign out.

const AVATAR_MAX_BYTES = 1024 * 1024;

export default function AccountSection({ onSignedOut }) {
  const { displayName, email, signOut, refresh, user, avatarUrl } = useProfile();
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(null);
  const [signingOut, setSigningOut] = React.useState(false);

  const pickAvatar = () => fileInputRef.current?.click();

  // Profile picture upload — direct to Supabase Storage (RLS-guarded), max 1MB.
  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';  // let the user re-pick the same file later
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith('image/')) { setAvatarError('Please choose an image file.'); return; }
    if (file.size > AVATAR_MAX_BYTES) { setAvatarError('Image must be 1MB or smaller.'); return; }
    if (!user?.id) { setAvatarError('You must be signed in to change your picture.'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${user.id}/avatar`;  // one file per user; upsert overwrites
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust so the CDN serves the new image after an overwrite.
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (dbErr) throw dbErr;
      await refresh();
    } catch (err) {
      setAvatarError(err?.message || 'Could not update your picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    onSignedOut();
  };

  return (
    <Section title="Account">
      <List>
        <ListRow
          leading={(
            <button type="button" className={s.avatarBtn} onClick={pickAvatar} disabled={uploading} aria-label="Change profile picture">
              <Avatar name={displayName} src={avatarUrl} size="lg" />
              <span className={s.avatarEdit}><Icon name="camera" size={16} /></span>
            </button>
          )}
          title={displayName}
          subtitle={avatarError ? <span className={s.error}>{avatarError}</span> : email}
          trailing={(
            <Button variant="secondary" size="sm" loading={uploading} onClick={pickAvatar}>
              {uploading ? 'Uploading…' : 'Change photo'}
            </Button>
          )}
        />
        <ListRow
          leading={<span className={s.iconWell}><Icon name="log-out" size={15} /></span>}
          title="Sign out"
          subtitle="You can sign back in any time."
          trailing={<Button variant="outline" size="sm" loading={signingOut} onClick={handleSignOut}>Sign out</Button>}
        />
      </List>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onAvatarChange}
        className={s.hidden}
      />
    </Section>
  );
}
