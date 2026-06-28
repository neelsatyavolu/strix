'use client';
import React from 'react';
import { Icon } from '@/components/sixteen';

// AI "explain my mistake" for a missed question. Calls /api/ai/explain, which
// uses the user's connected ChatGPT/Grok subscription, and keeps the result in
// local state so reopening the same review doesn't re-ask.

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent',
  border: 0, cursor: 'pointer', font: 'var(--role-label)', color: 'var(--brand-blue)', padding: '4px 0',
};

export function ExplainPanel({ question, choice }) {
  const [state, setState] = React.useState({ status: 'idle', text: '', error: '' });

  const ask = async () => {
    if (state.status === 'loading') return;
    setState({ status: 'loading', text: '', error: '' });
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: {
            stemHtml: question.stemHtml,
            choices: question.choices,
            correct: question.correct,
            type: question.type,
            domainLabel: question.domainLabel,
            skillLabel: question.skillLabel,
          },
          choice: choice ?? null,
        }),
      });
      const json = await res.json();
      if (json?.ok) setState({ status: 'done', text: json.text, error: '' });
      else setState({ status: 'error', text: '', error: json?.error || 'Could not get an explanation.' });
    } catch {
      setState({ status: 'error', text: '', error: 'Could not reach the AI service.' });
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {state.status === 'idle' && (
        <button onClick={ask} style={linkBtn}>
          <Icon name="sparkles" size={14} /> Explain my mistake
        </button>
      )}
      {state.status === 'loading' && (
        <div style={{ font: 'var(--role-label)', color: 'var(--text-tertiary)', padding: '4px 0' }}>Thinking through this one…</div>
      )}
      {state.status === 'error' && (
        <div style={{ font: 'var(--role-caption)', color: 'var(--text-secondary)', padding: '4px 0' }}>
          {state.error}{' '}
          <button onClick={ask} style={linkBtn}>Try again</button>
        </div>
      )}
      {state.status === 'done' && (
        <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--role-label)', color: 'var(--brand-blue)', marginBottom: 6 }}>
            <Icon name="sparkles" size={13} /> AI explanation
          </div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-body)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{state.text}</div>
        </div>
      )}
    </div>
  );
}

export default ExplainPanel;
