'use client';
import React from 'react';
import { Icon } from '../Icon';
import s from './dialogs.module.css';

// Math-only pieces: the grid-in answer box and the reference sheet popover.

/** GridIn — student-produced response input. */
export function GridIn({ value, onChange }) {
  const id = React.useId();
  return (
    <div className={s.gridIn}>
      <label htmlFor={id} className={s.fieldLabel}>Enter your answer</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="text"
        placeholder="e.g. 3/4 or 0.75"
        autoComplete="off"
        className={s.answerBox}
      />
      <p className={s.fieldHint}>
        Student-produced response. Fractions and decimals are both accepted.
      </p>
    </div>
  );
}

const FORMULAS = [
  ['Area of a circle', 'A = πr²'],
  ['Circumference', 'C = 2πr'],
  ['Pythagorean theorem', 'a² + b² = c²'],
  ['Slope-intercept form', 'y = mx + b'],
  ['Quadratic formula', 'x = (−b ± √(b² − 4ac)) / 2a'],
  ['Distance', 'd = √((x₂−x₁)² + (y₂−y₁)²)'],
];

/** FormulaSheet — the Math reference sheet, pinned top-right under the header. */
export function FormulaSheet({ onClose }) {
  return (
    <div className={s.sheet} role="dialog" aria-labelledby="reference-sheet-title">
      <div className={s.dialogHead}>
        <span id="reference-sheet-title" className={s.dialogTitle}>Reference Sheet</span>
        <button type="button" onClick={onClose} aria-label="Close reference sheet" className={s.close}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className={s.sheetBody}>
        {FORMULAS.map(([name, formula]) => (
          <div key={name} className={s.sheetRow}>
            <span className={s.sheetName}>{name}</span>
            <span className={s.sheetFormula}>{formula}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
