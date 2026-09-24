'use client';
import React from 'react';
import { Badge, Button, ListRow } from '@/components/sixteen';
import { useUpdates } from '@/lib/updates/useUpdates';
import s from './Settings.module.css';

// Software update — desktop auto-updater status + the one relevant action.

const AppIcon = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/assets/app-icon.svg" alt="" className={s.appIcon} />
);

export default function SoftwareUpdateRow() {
  const { desktop, status, progress, version, currentVersion, canInstall, check, install, openDownload } = useUpdates();

  if (!desktop) {
    return (
      <ListRow
        leading={<AppIcon />}
        title="Strix on the web"
        subtitle="Always up to date. Get the Mac app for offline practice and automatic updates."
      />
    );
  }

  const line = {
    checking: 'Checking for updates…',
    available: `Version ${version || ''} found — downloading…`,
    downloading: `Downloading update… ${progress}%`,
    downloaded: `Update ${version || ''} is ready — restart to install.`,
    'up-to-date': "You're on the latest version.",
    error: version ? `Version ${version} is available to download.` : "Couldn't check for updates.",
  }[status] || (currentVersion ? `Version ${currentVersion}` : 'Up to date.');

  let action;
  if (canInstall) {
    action = <Button variant="primary" size="sm" onClick={install}>Restart to install</Button>;
  } else if (status === 'downloading' || status === 'available') {
    action = <Button variant="secondary" size="sm" disabled>{status === 'downloading' ? `Downloading ${progress}%` : 'Downloading…'}</Button>;
  } else if (status === 'error' && version) {
    action = <Button variant="primary" size="sm" onClick={openDownload}>Download</Button>;
  } else {
    action = (
      <Button variant="secondary" size="sm" onClick={check} loading={status === 'checking'}>
        Check for updates
      </Button>
    );
  }

  return (
    <ListRow
      leading={<AppIcon />}
      title={(
        <span className={s.titleWithBadge}>
          Strix for Mac
          {currentVersion && <Badge size="sm" className="tnum">{`v${currentVersion}`}</Badge>}
        </span>
      )}
      subtitle={line}
      trailing={action}
    />
  );
}
