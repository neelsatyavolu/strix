'use client';
import React from 'react';
import { aiStatus, aiConnect, aiSubmitCode, aiCancelConnect, aiDisconnect } from '@/lib/ai/bridge';
import { Button } from '../core/Button';
import { Input } from '../core/Input';
import s from './AiConnect.module.css';
import { cx } from '../core/cx';

// Shared ChatGPT / Grok sign-in flow (Settings + the tutor pane). The desktop
// loopback may finish sign-in automatically; otherwise the user pastes the code
// or callback link their browser shows.

export const PROVIDER_LABEL = { chatgpt: 'ChatGPT', grok: 'Grok' };
/** Key for a provider in aiStatus()'s { codex, grok } result. */
export const statusKey = (kind) => (kind === 'chatgpt' ? 'codex' : 'grok');

/**
 * useAiConnection — connect/paste/cancel/disconnect state for one provider.
 * `onStatus` receives the fresh aiStatus() result after every change.
 */
export function useAiConnection(kind, onStatus, { connectFallback = 'Could not connect.' } = {}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteVal, setPasteVal] = React.useState('');

  const refresh = React.useCallback(async () => {
    const st = await aiStatus();
    onStatus?.(st);
    return st;
  }, [onStatus]);

  const connect = () => {
    setBusy(true);
    setError('');
    setPasteVal('');
    setPasteOpen(true);
    aiConnect(kind)
      .then(async (res) => {
        const st = await refresh();
        if (st[statusKey(kind)]) {
          // Connected outright (desktop loopback) — no code to paste.
          setPasteOpen(false);
        } else if (res && res.ok === false && res.error && res.error !== 'Connection was cancelled.') {
          setError(res.error);
        }
        // Otherwise keep the paste field open for the callback link / code.
      })
      .catch((err) => setError(err?.message || connectFallback))
      .finally(() => setBusy(false));
  };

  const submit = async () => {
    const code = pasteVal.trim();
    if (!code) return;
    setBusy(true);
    setError('');
    try {
      const res = await aiSubmitCode(kind, code);
      if (res && res.ok === false) throw new Error(res.error || 'That code did not work.');
      await refresh();
      setPasteOpen(false);
    } catch (err) {
      setError(err?.message || 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setPasteOpen(false);
    setBusy(false);
    aiCancelConnect(kind).catch(() => {});
  };

  const disconnect = async () => {
    setBusy(true);
    try { await aiDisconnect(kind); await refresh(); } catch { /* status refresh reflects reality */ }
    finally { setBusy(false); }
  };

  /** Drop any in-flight connect UI (e.g. when the target provider changes). */
  const reset = () => { setPasteOpen(false); setBusy(false); setError(''); };

  return { busy, error, pasteOpen, pasteVal, setPasteVal, connect, submit, cancel, disconnect, reset };
}

// What to paste depends on platform + provider: on the desktop the loopback
// usually finishes sign-in automatically (pasting is the fallback); on the web
// the user copies the callback link (ChatGPT) or the code (Grok) the browser shows.
export function pasteHelp(desktop, kind) {
  const label = PROVIDER_LABEL[kind] || 'the provider';
  if (desktop) return `Finish signing in to ${label} in your browser. If it shows an authorization code, paste it here.`;
  return kind === 'chatgpt'
    ? "Sign in to ChatGPT in the new tab. It'll redirect to a page that won't load — copy that page's full address and paste it here."
    : 'Sign in to Grok in the new tab, then paste the authorization code it shows you here.';
}

/** CodeEntry — help line + paste field + Submit/Cancel for one provider. */
export function CodeEntry({ kind, desktop, conn, className }) {
  const placeholder = !desktop && kind === 'chatgpt' ? 'Paste the callback link' : 'Paste authorization code';
  return (
    <form
      className={cx(s.entry, className)}
      onSubmit={(e) => { e.preventDefault(); conn.submit(); }}
    >
      <p className={s.help}>{pasteHelp(desktop, kind)}</p>
      <div className={s.entryRow}>
        <Input
          size="sm"
          value={conn.pasteVal}
          onChange={(e) => conn.setPasteVal(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus
        />
        <Button type="submit" variant="primary" size="sm" loading={conn.busy} disabled={conn.busy || !conn.pasteVal.trim()}>
          Submit
        </Button>
        <Button variant="ghost" size="sm" disabled={conn.busy} onClick={conn.cancel}>Cancel</Button>
      </div>
    </form>
  );
}

/** ProviderMark — the provider's logo in a small rounded well. */
export function ProviderMark({ kind, size = 32 }) {
  const src = kind === 'chatgpt' ? '/assets/chatgpt.svg' : '/assets/grok.svg';
  return (
    <span className={s.mark} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} />
    </span>
  );
}
