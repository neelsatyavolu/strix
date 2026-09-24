'use client';

import React from 'react';
import { Icon } from '@/components/sixteen/Icon';
import { Button } from '@/components/sixteen/core/Button';
import { IconButton } from '@/components/sixteen/core/IconButton';
import { useUpdates } from '@/lib/updates/useUpdates';
import s from './UpdatePopup.module.css';

// Bottom-right toast for the desktop auto-updater. Shows when an update has
// downloaded (offer Restart) or — on a build that can't self-install — when one
// is available to download manually. Dismissable; re-appears as state advances.
export default function UpdatePopup() {
  const { desktop, status, progress, version, canInstall, install, openDownload } = useUpdates();
  const [dismissedKey, setDismissedKey] = React.useState(null);

  if (!desktop) return null;

  // What, if anything, to show — and a key so a dismissed toast re-appears when
  // the situation changes (e.g. download finishes).
  let mode = null;
  if (status === 'downloaded' && canInstall) mode = 'ready';
  else if (status === 'downloading' && progress > 0) mode = 'progress';
  else if (status === 'error' && version) mode = 'manual';
  if (!mode) return null;

  const key = `${mode}:${version || ''}:${mode === 'progress' ? '' : 'x'}`;
  if (dismissedKey === key) return null;

  const dismiss = () => setDismissedKey(key);

  const title = {
    ready: 'Update ready to install',
    progress: 'Downloading update',
    manual: 'A new version is available',
  }[mode];
  const sub = {
    ready: `Strix ${version || ''} will apply when you restart.`,
    progress: `${progress}%`,
    manual: 'Download the latest Strix for Mac to update.',
  }[mode];

  return (
    <div className={s.wrap} role="status" aria-live="polite">
      <div className={s.card}>
        <span className={s.icon}>
          <Icon name={mode === 'ready' ? 'rotate-cw' : 'download'} size={16} />
        </span>
        <div className={s.body}>
          <div className={s.title}>{title}</div>
          <div className={s.sub}>{sub}</div>
          {mode === 'progress' ? (
            <div className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className={s.fill} style={{ width: `${progress}%` }} />
            </div>
          ) : (
            <div className={s.actions}>
              {mode === 'ready'
                ? <Button variant="primary" size="sm" onClick={install}>Restart now</Button>
                : <Button variant="primary" size="sm" onClick={openDownload}>Download</Button>}
              <Button variant="ghost" size="sm" onClick={dismiss}>Later</Button>
            </div>
          )}
        </div>
        <IconButton size="sm" label="Dismiss" onClick={dismiss} className={s.close}>
          <Icon name="x" size={14} />
        </IconButton>
      </div>
    </div>
  );
}
