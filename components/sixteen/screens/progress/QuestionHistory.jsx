'use client';
import React from 'react';
import { Badge, Icon } from '@/components/sixteen';
import s from './QuestionHistory.module.css';

// One answered question in a category's history. Expands in place to show the
// full stem, choices (yours vs correct) and the explanation.

export const DIFF_LABEL = { E: 'Easy', M: 'Medium', H: 'Hard' };
const DIFF_VARIANT = { E: 'success', M: 'warning', H: 'error' };

function ago(iso) {
  if (!iso) return '';
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const m = sec / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function fmtTime(ms) {
  if (!ms || ms < 0) return null;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function AttemptRow({ a }) {
  const [open, setOpen] = React.useState(false);
  const t = fmtTime(a.timeMs);
  const q = a.question;
  const canExpand = !!q;
  const toggle = () => setOpen((o) => !o);
  // A div (not <button>) because the expanded stem is arbitrary block HTML.
  const buttonProps = canExpand
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-expanded': open,
        onClick: toggle,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        },
      }
    : {};

  return (
    <div className={s.item}>
      <div {...buttonProps} className={`${s.head} ${canExpand ? s.headButton : ''}`}>
        <span className={`${s.mark} ${a.isCorrect ? s.right : s.wrong}`} aria-label={a.isCorrect ? 'Correct' : 'Incorrect'}>
          <Icon name={a.isCorrect ? 'check' : 'x'} size={13} strokeWidth={2.5} />
        </span>
        <div className={s.main}>
          {open && q?.stemHtml ? (
            <div className={`cb-stem ${s.stemFull}`} dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
          ) : (
            <span className={s.stem}>{a.stem || `${a.skillLabel} question`}</span>
          )}
          <span className={s.meta}>
            {a.difficulty && (
              <Badge variant={DIFF_VARIANT[a.difficulty] || 'neutral'} size="sm">{DIFF_LABEL[a.difficulty] || a.difficulty}</Badge>
            )}
            <span>{a.skillLabel}</span>
            <span>
              Your answer <b className={a.isCorrect ? s.okText : s.badText}>{a.yourAnswer || '—'}</b>
              {!a.isCorrect && a.correct ? <> · Correct <b className={s.plainText}>{a.correct}</b></> : null}
            </span>
          </span>
        </div>
        <span className={s.side}>
          <span>{ago(a.at)}</span>
          {t && <span>{t}</span>}
          {canExpand && <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} />}
        </span>
      </div>
      {open && q && <ExpandedReview q={q} yourAnswer={a.yourAnswer} isCorrect={a.isCorrect} />}
    </div>
  );
}

function ExpandedReview({ q, yourAnswer, isCorrect }) {
  const [showExp, setShowExp] = React.useState(false);
  const isMcq = q.type === 'mcq';
  const correct = Array.isArray(q.correct) ? q.correct : [];

  return (
    <div className={s.review}>
      {q.stimulusHtml && (
        <div className={`cb-stem ${s.stimulus}`} dangerouslySetInnerHTML={{ __html: q.stimulusHtml }} />
      )}

      {isMcq && q.choices.length > 0 && (
        <div className={s.choices}>
          {q.choices.map((o) => {
            const isCorrectChoice = correct.includes(o.letter);
            const isYours = yourAnswer === o.letter;
            const tone = isCorrectChoice ? s.choiceRight : isYours ? s.choiceWrong : '';
            return (
              <div key={o.letter} className={`${s.choice} ${tone}`}>
                <span className={s.letter}>{o.letter}</span>
                <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                {isCorrectChoice ? <span className={s.choiceTag}>Correct</span>
                  : isYours ? <span className={s.choiceTag}>Your answer</span> : <span />}
              </div>
            );
          })}
        </div>
      )}

      {!isMcq && (
        <div className={s.spr}>
          <span>Your answer <b className={isCorrect ? s.okText : s.badText}>{yourAnswer || '—'}</b></span>
          <span>Correct <b className={s.okText}>{correct.join(' or ') || '—'}</b></span>
        </div>
      )}

      {q.rationaleHtml && (
        <div>
          <button type="button" onClick={() => setShowExp((v) => !v)} className={s.expToggle} aria-expanded={showExp}>
            <Icon name={showExp ? 'chevron-down' : 'chevron-right'} size={14} />
            {showExp ? 'Hide explanation' : 'Show explanation'}
          </button>
          {showExp && (
            <div className={`cb-stem ${s.rationale}`} dangerouslySetInnerHTML={{ __html: q.rationaleHtml }} />
          )}
        </div>
      )}
    </div>
  );
}
