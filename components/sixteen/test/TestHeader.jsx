'use client';
import React from 'react';
import { Icon } from '../Icon';
import { cx } from '../core/cx';
import s from './chrome.module.css';

/**
 * TestHeader — the navy bar at the top of every practice / module screen.
 * Mirrors Bluebook's layout: section name (left), timer above "Hide" (center),
 * tool buttons (right). Use `directions` for the gray bar below the header.
 */
export function TestHeader({
  sectionLabel = 'Section 1, Module 1: Reading and Writing',
  timer,
  tools,
  user,
  style: styleProp,
}) {
  return (
    <header className={s.header} style={styleProp}>
      <div className={s.headerLeft}>
        <span className={s.sectionLabel} title={sectionLabel}>{sectionLabel}</span>
      </div>
      <div className={s.headerCenter}>{timer}</div>
      <div className={s.headerRight}>
        {tools}
        {user && (
          <span className={s.headerUser}>
            <span className={s.dot} />
            {user.name}
          </span>
        )}
      </div>
    </header>
  );
}

/**
 * ToolButton — icon-over-label control in the navy header (Annotate,
 * Calculator, Exit…). `inert` renders a non-interactive replica, used by the
 * tutor's read-only mirror so its header matches the student's.
 */
export function ToolButton({ label, icon, active = false, inert = false, onClick, title }) {
  return (
    <button
      type="button"
      onClick={inert ? undefined : onClick}
      title={title || label}
      aria-pressed={active || undefined}
      tabIndex={inert ? -1 : undefined}
      aria-hidden={inert || undefined}
      className={cx(s.tool, active && s.toolActive, inert && s.toolStatic)}
    >
      <Icon name={icon} className={s.toolIcon} size={18} />
      <span>{label}</span>
    </button>
  );
}

/**
 * DirectionsBar — the thin bar Bluebook puts directly under the header.
 * Has a "Directions" button on the left and a horizontal divider.
 */
export function DirectionsBar({ onDirections, right = null, style: styleProp }) {
  return (
    <div className={s.directions} style={styleProp}>
      <button type="button" onClick={onDirections} className={s.directionsBtn}>
        Directions
        <Icon name="chevron-down" size={14} />
      </button>
      <div className={s.directionsRight}>{right}</div>
    </div>
  );
}
