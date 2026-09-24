'use client';
import React from 'react';
import { Button, Icon } from '@/components/sixteen';
import { ExplainPanel } from '@/components/sixteen/stats/ExplainPanel';
import TeachRegion from '@/components/tutor/TeachRegion';
import { useTeach } from '@/components/tutor/TeachContext';
import { regionId } from '@/lib/tutor/anchors';
import { cx } from '@/components/sixteen/core/cx';
import s from './QuestionDetail.module.css';

/**
 * QuestionDetail — the full per-question review (passage, stem, your answer vs
 * the key, explanation, AI explain). Teach regions keep tutor annotations
 * anchored; a tutor in teaching mode can pull the student to this question.
 */
export function QuestionDetail({ item }) {
  const [open, setOpen] = React.useState(false);
  const teach = useTeach();
  const { question: q, response, isCorrect } = item;
  const yourLetter = response?.value;
  const isMcq = q.type !== 'spr' && (q.choices?.length ?? 0) > 0;
  const correct = Array.isArray(q.correct) ? q.correct : [];
  const showStudent = teach?.role === 'tutor' && teach.on;

  return (
    <div className={s.detail}>
      {(q.difficulty || showStudent) && (
        <div className={s.head}>
          {q.difficulty && <span className={s.caption}>Difficulty {q.difficulty}</span>}
          {showStudent && (
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="eye" size={13} />}
              onClick={() => teach.gotoQuestion(q.id)}
              title="Scroll your student to this question"
              style={{ marginLeft: 'auto' }}
            >
              Show student
            </Button>
          )}
        </div>
      )}

      {q.stimulusHtml && (
        <TeachRegion id={regionId(q.id, 'passage')}>
          <div className={cx('cb-passage', s.passage)} dangerouslySetInnerHTML={{ __html: q.stimulusHtml }} />
        </TeachRegion>
      )}

      <TeachRegion id={regionId(q.id, 'stem')}>
        <div className={cx('cb-stem', s.stem)} dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
      </TeachRegion>

      {isMcq ? (
        <div className={s.choices}>
          {q.choices.map((o) => {
            const isKey = correct.includes(o.letter);
            const isYours = yourLetter === o.letter;
            return (
              <TeachRegion key={o.letter} id={regionId(q.id, `choice-${o.letter}`)}>
                <div className={cx(s.choice, isKey ? s.key : isYours && s.yours)}>
                  <span className={s.letter}>{o.letter}</span>
                  <span className={cx('cb-choice', s.choiceText)} dangerouslySetInnerHTML={{ __html: o.html }} />
                  {isKey ? <span className={s.tag}>Correct</span>
                    : isYours ? <span className={s.tag}>Your answer</span> : null}
                </div>
              </TeachRegion>
            );
          })}
        </div>
      ) : (
        <TeachRegion id={regionId(q.id, 'spr')} className={s.spr}>
          <div>
            <span className={s.sprLabel}>Your answer </span>
            <span className={cx(s.sprValue, isCorrect ? s.good : s.bad)}>{yourLetter || '—'}</span>
          </div>
          <div>
            <span className={s.sprLabel}>Correct </span>
            <span className={cx(s.sprValue, s.good)}>{correct.join(' or ') || '—'}</span>
          </div>
        </TeachRegion>
      )}

      {q.rationaleHtml && (
        <button type="button" className={s.toggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
          {open ? 'Hide explanation' : 'Show explanation'}
        </button>
      )}
      {open && q.rationaleHtml && (
        <div className={cx('cb-stem', s.rationale)} dangerouslySetInnerHTML={{ __html: q.rationaleHtml }} />
      )}

      {!isCorrect && <ExplainPanel question={q} choice={yourLetter} />}
    </div>
  );
}
