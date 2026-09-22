'use client';

// Thin client wrapper over the Electron AI bridge (window.strix.ai), which
// talks to the user's OWN ChatGPT/Grok subscription from the main process.
// In a plain browser (no desktop shell) these throw / report "not available".

function ai() {
  if (typeof window === 'undefined') return null;
  const w = window;
  return w.strix?.ai || null;
}

export function isDesktop() {
  return typeof window !== 'undefined' && !!window.strix?.isDesktop;
}

// UI uses 'chatgpt' | 'grok'; the bridge uses 'codex' | 'grok'.
const PROVIDER = { chatgpt: 'codex', grok: 'grok' };
const toBridge = (p) => PROVIDER[p] || p;

// On the web (no desktop shell) the OAuth flow runs through our own /api/ai
// routes: connect() opens the provider's sign-in and returns right away; the
// user then pastes the callback link (ChatGPT) or code (Grok) into submitCode().
// (The desktop bridge instead keeps connect() pending on its loopback.)
async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: payload ? { 'content-type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  try {
    return await res.json();
  } catch {
    return { ok: res.ok };
  }
}

export async function aiStatus() {
  const b = ai();
  if (b) {
    try {
      return await b.status();
    } catch {
      return { codex: false, grok: false };
    }
  }
  try {
    const j = await fetch('/api/ai/status', { cache: 'no-store' }).then((r) => r.json());
    return { codex: !!j.codex, grok: !!j.grok };
  } catch {
    return { codex: false, grok: false };
  }
}

export async function aiModels() {
  const b = ai();
  if (b) return (await b.status()).models;
  const res = await fetch('/api/ai/models', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load AI models');
  return res.json();
}

export async function isConnected(uiProvider) {
  const s = await aiStatus();
  return !!s[toBridge(uiProvider)];
}

export async function aiConnect(uiProvider) {
  const p = toBridge(uiProvider);
  const b = ai();
  if (b) return b.connect(p);
  // Web: open a blank tab synchronously (inside the click) so popup blockers
  // allow it, then point it at the provider's sign-in once we have the URL.
  // (No 'noopener' — that makes window.open return null and lose the handle.)
  const popup = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
  let r;
  try {
    r = await postJson(`/api/ai/${p}/start`);
  } catch {
    popup?.close();
    return { ok: false, error: 'Could not reach the server. Try again.' };
  }
  if (!r?.authorizeUrl) {
    popup?.close();
    return { ok: false, error: r?.error || 'Could not start sign-in.' };
  }
  if (popup) popup.location.href = r.authorizeUrl;
  else if (typeof window !== 'undefined') window.open(r.authorizeUrl, '_blank');
  // Resolve now — the user pastes the callback/code into submitCode() next.
  return { ok: true, needsCode: true };
}

// Finish a connection with the callback link / code the user pasted.
export async function aiSubmitCode(uiProvider, code) {
  const p = toBridge(uiProvider);
  const b = ai();
  if (b) return b.submitCode(p, code);
  try {
    const j = await postJson(`/api/ai/${p}/complete`, { callback: code });
    return j?.ok ? { ok: true } : { ok: false, error: j?.error || 'That did not work.' };
  } catch {
    return { ok: false, error: 'Could not reach the server. Try again.' };
  }
}

// Abandon an in-flight connection attempt (paste field dismissed). On the web
// there's nothing server-side to cancel — the unused PKCE cookie just expires.
export async function aiCancelConnect(uiProvider) {
  const p = toBridge(uiProvider);
  const b = ai();
  if (b) return b.cancelConnect(p);
  return { ok: true };
}

export async function aiDisconnect(uiProvider) {
  const p = toBridge(uiProvider);
  const b = ai();
  if (b) return b.disconnect(p);
  try {
    return await postJson(`/api/ai/${p}/logout`);
  } catch {
    return { ok: false };
  }
}

export async function aiAsk({ provider, system, messages, model }) {
  const p = toBridge(provider);
  const b = ai();
  if (b) return b.ask({ provider: p, system, messages, model });
  try {
    return await postJson('/api/ai/ask', { provider: p, system, messages, model });
  } catch (e) {
    return { ok: false, error: e?.message || 'AI request failed.' };
  }
}

// Marker the model emits to request a practice-history lookup (client tool loop).
export const HISTORY_TOOL = '<<FETCH_HISTORY>>';

// System prompt — calm, Socratic SAT tutor. Never just hands over the answer.
export const TUTOR_SYSTEM = [
  'You are Strix, a calm, precise SAT tutor.',
  'You help students reason to the answer themselves — you guide, you do not just give the answer.',
  'When a student is stuck on a question, ask a pointed question or give one concrete hint at a time.',
  'Be concise and specific. No exclamation marks, no emoji, no cheerleading.',
  'If the student explicitly asks for the full solution and they have already attempted it, walk through the reasoning step by step.',
  'Use plain language. For math, show the key steps clearly.',
  'When recommending what to improve, weigh both accuracy and how many questions back each topic — do not over-index on a topic with only a handful of attempts.',
  'Ground every statement about the student in the data provided below. If the data needed to answer is not there, say so plainly and offer to look it up rather than guessing.',
  'You may be given the student\'s performance data, and — while they are on a question — the correct answer and the official explanation.',
  'Treat the answer key as private: use it only to steer your hints. Never state the correct choice or read out the explanation unless the student has already attempted the question and explicitly asks for the full solution.',
  'You can look up the student\'s full practice history at any scope. When you need it, reply with ONLY a line beginning with ' + HISTORY_TOOL + ' followed by a JSON object of filters, and nothing else.',
  'Filters (all optional): {"section":"rw"|"math","onlyWrong":true,"q":"keyword over topic/question","limit":number up to 200,"offset":number,"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}. {} returns the most recent overall.',
  'For time-based questions (today, this week, last month), derive since/until from the current date given below.',
  'The system answers with the matching questions; then continue helping the student. Use this whenever they ask about past questions, weak topics, or trends beyond the recent list already shown. Never show this lookup syntax to the student.',
].join(' ');

// Build a compact performance summary the tutor can reason over (scores,
// volume, weakest topics). Returns '' when there is nothing to report.
export function statsContext(stats) {
  if (!stats) return '';
  const pct = (correct, done) => (done ? Math.round((correct / done) * 100) : null);
  const lines = ["The student's performance so far (use it to personalize guidance; only raise it when relevant):"];

  const s = stats.scores || {};
  const scores = [];
  if (s.rw != null) scores.push(`Reading & Writing ${s.rw}`);
  if (s.math != null) scores.push(`Math ${s.math}`);
  if (s.total != null) scores.push(`Total ${s.total}`);
  if (scores.length) lines.push(`Latest practice scores — ${scores.join(', ')}.`);

  const totals = [];
  for (const [key, label] of [['rw', 'Reading & Writing'], ['math', 'Math']]) {
    const d = stats.sectionTotals?.[key];
    if (d && d.done) totals.push(`${label}: ${d.done} questions, ${pct(d.correct, d.done)}% correct`);
  }
  if (totals.length) lines.push(`Practice volume — ${totals.join('; ')}.`);

  const cats = [];
  for (const [key, label] of [['rw', 'R&W'], ['math', 'Math']]) {
    for (const c of stats.categories?.[key] || []) {
      if (c.done) cats.push({ name: `${label} · ${c.label}`, accuracy: c.accuracy, done: c.done });
    }
  }
  if (cats.length) {
    const sorted = [...cats].sort((a, b) => a.accuracy - b.accuracy);
    lines.push('Accuracy by topic (weakest first): ' +
      sorted.map((c) => `${c.name} ${c.accuracy}% (${c.done} q)`).join('; ') + '.');
  }

  if (stats.sessionCount) lines.push(`Sessions completed: ${stats.sessionCount}.`);

  const trend = [];
  for (const [key, label] of [['rw', 'Reading & Writing'], ['math', 'Math']]) {
    const ys = (stats.overTime || []).filter((o) => o.section === key && o.score != null).map((o) => o.score);
    if (ys.length >= 2) trend.push(`${label}: ${ys.slice(-6).join(' → ')}`);
  }
  if (trend.length) lines.push(`Score trend (older → newer): ${trend.join('; ')}.`);

  return lines.length > 1 ? lines.join('\n') : '';
}

// One attempt → one bullet line, shared by the ambient block and lookup results.
function attemptLine(a) {
  const sec = a.section === 'math' ? 'Math' : 'R&W';
  const day = String(a.at || '').slice(0, 10);
  const topic = [a.domainLabel, a.skillLabel].filter(Boolean).join(' · ') || sec;
  const diff = a.difficulty ? ` (${a.difficulty})` : '';
  const verdict = a.isCorrect ? 'correct' : `wrong — you: ${a.yourAnswer ?? '—'}, correct: ${a.correct || '—'}`;
  const stem = a.stem ? ` "${a.stem}"` : '';
  return `- ${day ? day + ' ' : ''}${sec} · ${topic}${diff}: ${verdict}.${stem}`;
}

// Ambient block: the student's most recent attempts. Deeper/filtered history is
// available on demand via the lookup tool. Returns '' when there's nothing.
export function historyContext(attempts) {
  if (!attempts || !attempts.length) return '';
  return [
    `The student's ${attempts.length} most recent practice questions (newest first; ask for more via a history lookup):`,
    ...attempts.map(attemptLine),
  ].join('\n');
}

// Result of a history lookup, fed back to the model as a user message.
export function historyResultText(attempts, args) {
  const f = JSON.stringify(args || {});
  if (!attempts || !attempts.length) return `History lookup ${f} returned no matching questions.`;
  return [`History lookup ${f} — ${attempts.length} questions (newest first):`, ...attempts.map(attemptLine)].join('\n');
}

// Detect a history-lookup request in a model reply. Returns the parsed filter
// object (possibly {}) when the marker is present, or null when it isn't.
export function parseHistoryCall(text) {
  const t = String(text || '');
  const i = t.indexOf(HISTORY_TOOL);
  if (i === -1) return null;
  const after = t.slice(i + HISTORY_TOOL.length);
  const start = after.indexOf('{');
  const end = after.lastIndexOf('}');
  if (start === -1 || end <= start) return {};
  try { return JSON.parse(after.slice(start, end + 1)); } catch { return {}; }
}

// Safety net: strip any leftover lookup syntax before showing a reply.
export function stripHistoryMarker(text) {
  const t = String(text || '');
  const i = t.indexOf(HISTORY_TOOL);
  if (i === -1) return t;
  return t.slice(0, i).trim() || 'What would you like to dig into?';
}

// Build a grounding system message from the current question (if any).
export function questionContext(q, selected) {
  if (!q) return '';
  const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const lines = [
    `The student is working on a ${q.section === 'math' ? 'Math' : 'Reading & Writing'} question (${q.domainLabel}${q.skillLabel ? ' · ' + q.skillLabel : ''}).`,
  ];
  if (q.stimulusHtml) lines.push(`Passage: ${strip(q.stimulusHtml)}`);
  lines.push(`Question: ${strip(q.stemHtml)}`);
  if (q.type === 'mcq' && q.choices?.length) {
    lines.push('Choices: ' + q.choices.map((c) => `${c.letter}) ${strip(c.html)}`).join('  '));
  }
  if (selected) lines.push(`The student currently has "${selected}" selected.`);
  if (q.correct?.length) {
    lines.push(`(Private — for your guidance only, never state outright) Correct answer: ${q.correct.join(' or ')}.`);
  }
  if (q.rationaleHtml) {
    lines.push(`(Private) Official College Board explanation: ${strip(q.rationaleHtml)}`);
  }
  lines.push('Use the answer key and explanation only to steer your hints, one step at a time. Do not reveal the correct choice or the explanation unless the student has already attempted this question and explicitly asks for the full solution.');
  return lines.join('\n');
}
