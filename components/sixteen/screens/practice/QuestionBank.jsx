'use client';
import React from 'react';
import { Button, EmptyState, Icon, Input, Section, Skeleton } from '@/components/sixteen';
import QuestionResult from './QuestionResult';
import s from './QuestionBank.module.css';

// Question bank — look up any College Board question by ID, then reveal the
// answer and explanation.
export default function QuestionBank({ initialId = '' }) {
  const [questionId, setQuestionId] = React.useState(initialId);
  const [question, setQuestion] = React.useState(null);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  const lookup = async (event) => {
    event?.preventDefault();
    const id = questionId.trim();
    setError(null);
    setShowAnswer(false);
    if (!id) {
      setQuestion(null);
      setError('Enter a question ID.');
      return;
    }

    setBusy(true);
    try {
      const params = new URLSearchParams({ id });
      const res = await fetch(`/api/questions?${params.toString()}`);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Question lookup failed');
      const q = json.data.question;
      setQuestion(q);
      // Question payloads no longer carry the key; this browse view fetches it
      // explicitly via the grading endpoint. Failure just shows "Unavailable".
      try {
        const revealRes = await fetch('/api/questions/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempts: [{ id: q.id, section: q.section }], reveal: true }),
        });
        const revealJson = await revealRes.json();
        const key = revealJson?.data?.results?.[0]?.key;
        if (key) setQuestion({ ...q, ...key });
      } catch { /* answer stays hidden; the question itself still renders */ }
    } catch (err) {
      setQuestion(null);
      setError(err instanceof Error ? err.message : 'Question lookup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Section title="Look up a question" description="Paste a College Board question ID to see the question, its answer, and the explanation.">
        <form onSubmit={lookup} className={s.form}>
          <Input
            id="question-bank-id"
            aria-label="Question ID"
            value={questionId}
            onChange={(event) => setQuestionId(event.target.value)}
            placeholder="e.g. 90748ee0-e643-48d5-b69f-c05398fbe6c2"
            icon={<Icon name="search" size={14} />}
            invalid={!!error}
            inputStyle={{ fontFamily: 'var(--font-mono)' }}
            className={s.input}
          />
          <Button type="submit" variant="primary" loading={busy}>Look up</Button>
        </form>
        {error && (
          <p role="alert" className={s.error}>
            <Icon name="alert-circle" size={14} /> {error}
          </p>
        )}
      </Section>

      <div className={s.body}>
        {busy && !question ? (
          <ResultSkeleton />
        ) : question ? (
          <QuestionResult
            question={question}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer((v) => !v)}
          />
        ) : (
          <EmptyState
            icon="database"
            title="No question loaded"
            body="Enter a question ID above and it will show up here."
          />
        )}
      </div>
    </>
  );
}

function ResultSkeleton() {
  return (
    <div className={s.result}>
      <div className={s.questionCol}>
        <Skeleton width={220} height={20} radius="var(--radius-pill)" />
        <Skeleton height={14} style={{ marginTop: 20 }} />
        <Skeleton height={14} width="92%" style={{ marginTop: 8 }} />
        <Skeleton height={14} width="70%" style={{ marginTop: 8 }} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={48} radius="var(--radius-md)" style={{ marginTop: i ? 10 : 22 }} />
        ))}
      </div>
      <Skeleton height={140} radius="var(--radius-lg)" />
    </div>
  );
}
