'use client';
import React from 'react';
import { Icon } from '@/components/sixteen';
import s from './ExplainPanel.module.css';

// AI "explain my mistake" for a missed question. Calls /api/ai/explain, which
// uses the user's connected ChatGPT/Grok subscription, and keeps the result in
// local state so reopening the same review doesn't re-ask.

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
    <div className={s.wrap}>
      {state.status === 'idle' && (
        <button type="button" onClick={ask} className={s.link}>
          <Icon name="sparkles" size={14} /> Explain my mistake
        </button>
      )}
      {state.status === 'loading' && (
        <div className={s.pending}>Thinking through this one…</div>
      )}
      {state.status === 'error' && (
        <div className={s.error}>
          {state.error}{' '}
          <button type="button" onClick={ask} className={s.link}>Try again</button>
        </div>
      )}
      {state.status === 'done' && (
        <div className={s.answer}>
          <div className={s.answerHead}>
            <Icon name="sparkles" size={13} /> AI explanation
          </div>
          <div className={s.answerText}>{state.text}</div>
        </div>
      )}
    </div>
  );
}

export default ExplainPanel;
