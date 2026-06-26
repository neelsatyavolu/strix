'use client';

// Thin client wrapper over the Electron AI bridge (window.proctorly.ai), which
// talks to the user's OWN ChatGPT/Grok subscription from the main process.
// In a plain browser (no desktop shell) these throw / report "not available".

function ai() {
  if (typeof window === 'undefined') return null;
  const w = window;
  return w.proctorly?.ai || null;
}

export function isDesktop() {
  return typeof window !== 'undefined' && !!window.proctorly?.isDesktop;
}

// UI uses 'chatgpt' | 'grok'; the bridge uses 'codex' | 'grok'.
const PROVIDER = { chatgpt: 'codex', grok: 'grok' };
const toBridge = (p) => PROVIDER[p] || p;

export async function aiStatus() {
  const b = ai();
  if (!b) return { codex: false, grok: false };
  try {
    return await b.status();
  } catch {
    return { codex: false, grok: false };
  }
}

export async function isConnected(uiProvider) {
  const s = await aiStatus();
  return !!s[toBridge(uiProvider)];
}

export async function aiConnect(uiProvider) {
  const b = ai();
  if (!b) throw new Error('The AI tutor runs in the Proctorly desktop app.');
  return b.connect(toBridge(uiProvider));
}

export async function aiDisconnect(uiProvider) {
  const b = ai();
  if (!b) return { ok: false };
  return b.disconnect(toBridge(uiProvider));
}

export async function aiAsk({ provider, system, messages, model }) {
  const b = ai();
  if (!b) throw new Error('The AI tutor runs in the Proctorly desktop app.');
  return b.ask({ provider: toBridge(provider), system, messages, model });
}

// System prompt — calm, Socratic SAT tutor. Never just hands over the answer.
export const TUTOR_SYSTEM = [
  'You are Proctorly, a calm, precise SAT tutor.',
  'You help students reason to the answer themselves — you guide, you do not just give the answer.',
  'When a student is stuck on a question, ask a pointed question or give one concrete hint at a time.',
  'Be concise and specific. No exclamation marks, no emoji, no cheerleading.',
  'If the student explicitly asks for the full solution and they have already attempted it, walk through the reasoning step by step.',
  'Use plain language. For math, show the key steps clearly.',
].join(' ');

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
  lines.push('Do not reveal which choice is correct unless the student has attempted it and asks; prefer guiding them.');
  return lines.join('\n');
}
