'use client';

import React from 'react';
import { Download, RotateCw, X } from 'lucide-react';
import { useUpdates } from '@/lib/updates/useUpdates';

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

  return (
    <div style={wrap} role="status" aria-live="polite">
      <div style={card}>
        <div style={iconBox}>
          {mode === 'ready' ? <RotateCw size={18} /> : <Download size={18} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={title}>
            {mode === 'ready' && 'Update ready to install'}
            {mode === 'progress' && 'Downloading update…'}
            {mode === 'manual' && 'A new version is available'}
          </div>
          <div style={sub}>
            {mode === 'ready' && `Strix ${version || ''} will apply on restart.`}
            {mode === 'progress' && `${progress}%`}
            {mode === 'manual' && 'Download the latest Strix for Mac to update.'}
          </div>
          {mode === 'progress' && (
            <div style={barTrack}>
              <div style={{ ...barFill, width: `${progress}%` }} />
            </div>
          )}
          {mode !== 'progress' && (
            <div style={actions}>
              {mode === 'ready' ? (
                <button style={primaryBtn} onClick={install}>Restart now</button>
              ) : (
                <button style={primaryBtn} onClick={openDownload}>Download</button>
              )}
              <button style={ghostBtn} onClick={dismiss}>Later</button>
            </div>
          )}
        </div>
        <button style={closeBtn} aria-label="Dismiss" onClick={dismiss}>
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

const wrap = {
  position: 'fixed',
  right: 18,
  bottom: 18,
  zIndex: 9999,
  maxWidth: 360,
};
const card = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: 14,
  background: 'var(--surface-card, #fff)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
};
const iconBox = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--brand-blue-soft)',
  color: 'var(--brand-blue)',
};
const title = { font: 'var(--role-label)', color: 'var(--ink-1)', fontWeight: 600 };
const sub = { font: 'var(--role-caption)', color: 'var(--text-secondary)', marginTop: 2 };
const actions = { display: 'flex', gap: 8, marginTop: 12 };
const primaryBtn = {
  border: 0,
  cursor: 'pointer',
  height: 32,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--brand-blue)',
  color: '#fff',
  font: 'var(--role-label)',
  fontWeight: 590,
};
const ghostBtn = {
  border: '1px solid var(--border-2)',
  cursor: 'pointer',
  height: 32,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--ink-2)',
  font: 'var(--role-label)',
};
const closeBtn = {
  flexShrink: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  color: 'var(--text-tertiary)',
  padding: 2,
  marginLeft: 2,
};
const barTrack = {
  marginTop: 10,
  height: 4,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--sunken)',
  overflow: 'hidden',
};
const barFill = {
  height: '100%',
  background: 'var(--brand-blue)',
  transition: 'width var(--dur-fast, 0.15s) var(--ease-out, ease)',
};
