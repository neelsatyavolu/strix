'use client';
import React from 'react';
import { Badge, Button, Card, Icon, Input } from '@/components/sixteen';

const FIELD = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
};

const LABEL = {
  font: 'var(--role-eyebrow)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
  color: 'var(--text-tertiary)',
};

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const DIFFICULTY_LABEL = { E: 'Easy', M: 'Medium', H: 'Hard' };

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
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ font: 'var(--role-title)', color: 'var(--text-primary)' }}>Question Bank</div>
          </div>
          {question && (
            <Badge variant={question.section === 'math' ? 'math' : 'rw'} size="lg">
              {SECTION_LABEL[question.section] || question.section}
            </Badge>
          )}
        </div>

        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <form onSubmit={lookup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 10, alignItems: 'end' }}>
            <div style={FIELD}>
              <label htmlFor="question-bank-id" style={LABEL}>Question ID</label>
              <Input
                id="question-bank-id"
                value={questionId}
                onChange={(event) => setQuestionId(event.target.value)}
                placeholder="90748ee0-e643-48d5-b69f-c05398fbe6c2"
                icon={<Icon name="search" size={14} />}
                invalid={!!error}
                inputStyle={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <Button type="submit" loading={busy} icon={<Icon name="search" size={14} />} style={{ height: 30 }}>
              Look up
            </Button>
          </form>

          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--role-label)', color: 'var(--error)' }}>
              <Icon name="alert-circle" size={14} /> {error}
            </div>
          )}
        </Card>

        {question ? (
          <QuestionResult question={question} showAnswer={showAnswer} onToggleAnswer={() => setShowAnswer((v) => !v)} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card padding="xl" style={{ minHeight: 280, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--sunken)',
          color: 'var(--text-tertiary)',
          display: 'grid',
          placeItems: 'center',
        }}>
          <Icon name="database" size={20} />
        </div>
        <div style={{ font: 'var(--role-title-sm)', color: 'var(--text-primary)' }}>No question loaded</div>
      </div>
    </Card>
  );
}

function QuestionResult({ question, showAnswer, onToggleAnswer }) {
  const correctSet = new Set(question.correct || []);
  const hasAnswer = question.correct?.length > 0 || question.rationaleHtml;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
      <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        <QuestionMeta question={question} />

        {question.stimulusHtml && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={LABEL}>Stimulus</div>
            <div className="cb-passage" style={{ color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: question.stimulusHtml }} />
          </section>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={LABEL}>Question</div>
          <div className="cb-stem" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: question.stemHtml }} />
        </section>

        {question.type === 'spr' ? (
          <div style={{
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            background: 'var(--sunken)',
            font: 'var(--role-body)',
            color: 'var(--text-secondary)',
          }}>
            Student-produced response
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.choices.map((choice) => (
              <ChoiceRow
                key={choice.letter}
                choice={choice}
                correct={showAnswer && correctSet.has(choice.letter)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ font: 'var(--role-title-sm)', color: 'var(--text-primary)' }}>Answer</div>
          <Button
            variant={showAnswer ? 'secondary' : 'primary'}
            size="sm"
            disabled={!hasAnswer}
            onClick={onToggleAnswer}
            icon={<Icon name={showAnswer ? 'eye-off' : 'eye'} size={13} />}
          >
            {showAnswer ? 'Hide answer' : 'Show answer'}
          </Button>
        </div>

        {showAnswer ? (
          <AnswerPanel question={question} />
        ) : (
          <div style={{
            minHeight: 96,
            display: 'grid',
            placeItems: 'center',
            border: '1px dashed var(--border-2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)',
            font: 'var(--role-label)',
          }}>
            Hidden
          </div>
        )}
      </Card>
    </div>
  );
}

function QuestionMeta({ question }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <Badge variant={question.section === 'math' ? 'math' : 'rw'}>
        {SECTION_LABEL[question.section] || question.section}
      </Badge>
      <Badge variant="neutral">{DIFFICULTY_LABEL[question.difficulty] || question.difficulty}</Badge>
      {question.domainLabel && <Badge variant="neutral">{question.domainLabel}</Badge>}
      {question.skillLabel && <Badge variant="neutral">{question.skillLabel}</Badge>}
      <span style={{ marginLeft: 'auto', font: 'var(--role-caption)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
        {question.id}
      </span>
    </div>
  );
}

function ChoiceRow({ choice, correct }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '13px 15px',
      borderRadius: 'var(--radius-md)',
      border: `1.5px solid ${correct ? 'var(--success)' : 'var(--border-2)'}`,
      background: correct ? 'var(--success-soft)' : 'var(--paper)',
    }}>
      <span style={{
        flex: '0 0 auto',
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        border: `1.5px solid ${correct ? 'var(--success)' : 'var(--border-3)'}`,
        background: correct ? 'var(--success)' : 'transparent',
        color: correct ? '#fff' : 'var(--text-primary)',
        font: 'var(--role-label)',
        fontWeight: 700,
      }}>
        {choice.letter}
      </span>
      <span className="cb-choice" style={{ flex: 1, color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: choice.html }} />
      {correct && <Badge variant="success" size="sm">Correct</Badge>}
    </div>
  );
}

function AnswerPanel({ question }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--success-soft)',
        color: 'var(--success)',
      }}>
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
          Correct answer
        </span>
        <span style={{ font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)' }}>
          {question.correct?.length ? question.correct.join(', ') : 'Unavailable'}
        </span>
      </div>

      {question.rationaleHtml && (
        <div className="cb-stem" style={{ fontSize: 14, color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: question.rationaleHtml }} />
      )}
    </div>
  );
}
