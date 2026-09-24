'use client';
import { Badge, Button, Card, Icon } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import s from './QuestionBank.module.css';

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const DIFFICULTY_LABEL = { E: 'Easy', M: 'Medium', H: 'Hard' };

/** QuestionResult — the looked-up question beside a reveal-on-demand answer panel. */
export default function QuestionResult({ question, showAnswer, onToggleAnswer }) {
  const correctSet = new Set(question.correct || []);
  const hasAnswer = question.correct?.length > 0 || question.rationaleHtml;

  return (
    <div className={s.result}>
      <div className={s.questionCol}>
        <QuestionMeta question={question} />

        {question.stimulusHtml && (
          <div className={cx('cb-passage', s.stimulus)} dangerouslySetInnerHTML={{ __html: question.stimulusHtml }} />
        )}

        <div className={cx('cb-stem', s.stem)} dangerouslySetInnerHTML={{ __html: question.stemHtml }} />

        {question.type === 'spr' ? (
          <div className={s.spr}>Student-produced response — no answer choices.</div>
        ) : (
          <div className={s.choices}>
            {question.choices.map((choice) => (
              <ChoiceRow key={choice.letter} choice={choice} correct={showAnswer && correctSet.has(choice.letter)} />
            ))}
          </div>
        )}
      </div>

      <Card padding="lg" className={s.answerCard}>
        <div className={s.answerHead}>
          <span className={s.answerTitle}>Answer</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasAnswer}
            onClick={onToggleAnswer}
            icon={<Icon name={showAnswer ? 'eye-off' : 'eye'} size={13} />}
          >
            {showAnswer ? 'Hide' : 'Reveal'}
          </Button>
        </div>
        {showAnswer ? (
          <AnswerPanel question={question} />
        ) : (
          <p className={s.answerHidden}>
            {hasAnswer ? 'Try it first, then reveal the answer and explanation.' : 'The answer isn’t available for this question.'}
          </p>
        )}
      </Card>
    </div>
  );
}

function QuestionMeta({ question }) {
  return (
    <div className={s.meta}>
      <Badge variant={question.section === 'math' ? 'math' : 'rw'}>
        {SECTION_LABEL[question.section] || question.section}
      </Badge>
      <Badge variant="neutral">{DIFFICULTY_LABEL[question.difficulty] || question.difficulty}</Badge>
      {question.domainLabel && <Badge variant="neutral">{question.domainLabel}</Badge>}
      {question.skillLabel && <Badge variant="neutral">{question.skillLabel}</Badge>}
      <span className={s.qid}>{question.id}</span>
    </div>
  );
}

function ChoiceRow({ choice, correct }) {
  return (
    <div className={cx(s.choice, correct && s.choiceCorrect)}>
      <span className={s.letter}>{choice.letter}</span>
      <span className={cx('cb-choice', s.choiceText)} dangerouslySetInnerHTML={{ __html: choice.html }} />
      {correct && <Badge variant="success" size="sm">Correct</Badge>}
    </div>
  );
}

function AnswerPanel({ question }) {
  return (
    <div className={s.answer}>
      <div className={s.answerKey}>
        <span className={s.answerKeyLabel}>Correct answer</span>
        <span className={s.answerKeyValue}>
          {question.correct?.length ? question.correct.join(', ') : 'Unavailable'}
        </span>
      </div>
      {question.rationaleHtml && (
        <div className={cx('cb-stem', s.rationale)} dangerouslySetInnerHTML={{ __html: question.rationaleHtml }} />
      )}
    </div>
  );
}
