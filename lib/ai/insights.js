'use client';

import React from 'react';
import { aiAsk, aiStatus } from './bridge';

// Study insights, derived from the user's per-category / per-skill performance.
//
// Two tiers:
//   • baseline — deterministic best/worst read, always available offline.
//   • ai       — a richer, specific study plan from the user's OWN connected
//                ChatGPT/Grok (desktop only). Generated client-side, then cached
//                in localStorage and reused for the rest of the calendar day
//                ("refreshed daily"). A manual refresh bypasses the cache.

const MODEL = { chatgpt: 'gpt-5.5', grok: 'grok-4.5' };

function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function cacheKey(scope) {
  return `strix.insight.${scope}`;
}

function readCache(scope) {
  try {
    const raw = localStorage.getItem(cacheKey(scope));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(scope, value) {
  try {
    localStorage.setItem(cacheKey(scope), JSON.stringify(value));
  } catch {
    /* storage full / unavailable — insight just won't persist */
  }
}

// Prefer ChatGPT, fall back to Grok. Returns null if nothing is connected.
async function pickProvider() {
  let status;
  try {
    status = await aiStatus();
  } catch {
    return null;
  }
  if (status?.codex) return { provider: 'chatgpt', model: MODEL.chatgpt };
  if (status?.grok) return { provider: 'grok', model: MODEL.grok };
  return null;
}

// Pull the first balanced {...} block out of a model reply and parse it.
function parseInsight(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const actions = Array.isArray(obj.actions)
      ? obj.actions.map((a) => String(a)).filter(Boolean).slice(0, 5)
      : [];
    const out = {
      summary: obj.summary ? String(obj.summary) : '',
      strength: obj.strength ? String(obj.strength) : '',
      focus: obj.focus ? String(obj.focus) : '',
      actions,
    };
    return out.summary || out.focus || actions.length ? out : null;
  } catch {
    return null;
  }
}

const SYSTEM = [
  'You are an SAT performance analyst and study coach.',
  'You are given a JSON summary of one student\'s accuracy, broken down by topic.',
  'Return a short, specific, encouraging-but-honest study insight.',
  'Be concrete: name the actual weakest topic and say what to practice next and why.',
  'Output ONLY valid JSON, no markdown, no code fences, matching exactly:',
  '{"summary": string, "strength": string, "focus": string, "actions": string[]}',
  'summary: 1-2 sentences on where they stand. strength: their best topic and why.',
  'focus: the single topic to study next and why. actions: 2-4 short, concrete next steps.',
].join(' ');

// useInsight — drives the insight card.
//   scope    : stable cache key, e.g. "section:rw" or "cat:rw:INI"
//   payload  : plain object of the performance data fed to the model
//   baseline : deterministic fallback object (same shape as a parsed insight) or null
//   ready    : only attempt generation once the underlying data has loaded
//
// Returns { status, insight, source, generatedAt, error, refresh, canAi }.
//   status: 'idle' | 'loading' | 'ready'
//   source: 'ai' | 'baseline' | null
export function useInsight({ scope, payload, baseline, ready = true }) {
  const [state, setState] = React.useState({
    status: 'idle',
    insight: baseline ?? null,
    source: baseline ? 'baseline' : null,
    generatedAt: null,
    error: null,
    canAi: false,
  });

  const sig = React.useMemo(() => JSON.stringify(payload ?? {}), [payload]);

  const run = React.useCallback(
    async (force) => {
      const provider = await pickProvider();
      if (!provider) {
        setState({ status: 'ready', insight: baseline ?? null, source: baseline ? 'baseline' : null, generatedAt: null, error: null, canAi: false });
        return;
      }

      const cached = readCache(scope);
      if (!force && cached?.insight && cached.day === localDay()) {
        setState({ status: 'ready', insight: cached.insight, source: 'ai', generatedAt: cached.at, error: null, canAi: true });
        return;
      }

      setState((s) => ({ ...s, status: 'loading', canAi: true, error: null }));
      let res;
      try {
        res = await aiAsk({
          provider: provider.provider,
          model: provider.model,
          system: SYSTEM,
          messages: [{ role: 'user', content: sig }],
        });
      } catch (err) {
        res = { ok: false, error: err?.message };
      }

      const insight = res?.ok ? parseInsight(res.text) : null;
      if (insight) {
        const at = new Date().toISOString();
        writeCache(scope, { day: localDay(), at, model: provider.model, insight });
        setState({ status: 'ready', insight, source: 'ai', generatedAt: at, error: null, canAi: true });
      } else {
        // Keep yesterday's cached insight if we have one; otherwise show baseline.
        setState({
          status: 'ready',
          insight: cached?.insight ?? baseline ?? null,
          source: cached?.insight ? 'ai' : baseline ? 'baseline' : null,
          generatedAt: cached?.at ?? null,
          error: res?.ok ? 'Could not read the AI response' : res?.error || 'AI request failed',
          canAi: true,
        });
      }
    },
    // baseline/sig are the meaningful inputs; scope is stable.
    [scope, sig, baseline],
  );

  React.useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(false);
  }, [ready, run]);

  const refresh = React.useCallback(() => run(true), [run]);
  return { ...state, refresh };
}
