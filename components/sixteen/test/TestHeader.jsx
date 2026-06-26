'use client';
import React from 'react';

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
    <header style={{
      height: 'var(--test-header-height)',
      background: 'var(--test-header)',
      color: 'var(--test-header-fg)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 18px',
      gap: 16,
      ...styleProp,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          font: 'var(--role-body)', fontWeight: 600,
          color: '#fff', fontSize: 15,
        }}>
          {sectionLabel}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {timer}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18 }}>
        {tools}
        {user && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4, font: 'var(--role-caption)', color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}/>
            {user.name}
          </span>
        )}
      </div>
    </header>
  );
}

/**
 * DirectionsBar — the thin gray bar Bluebook puts directly under the header.
 * Has a "Directions" button on the left and a horizontal divider.
 */
export function DirectionsBar({ onDirections, right = null, style: styleProp }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--test-rule)',
      background: 'var(--test-canvas)',
      padding: '4px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      ...styleProp,
    }}>
      <button onClick={onDirections} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        font: 'var(--role-label)', fontWeight: 500,
        color: 'var(--ink-1)', background: 'transparent', border: 0, padding: '4px 0',
        cursor: 'pointer',
      }}>
        Directions
        <span style={{display:'inline-flex', fontSize: 11}}>▾</span>
      </button>
      <div style={{display:'flex', alignItems:'center', gap: 10}}>{right}</div>
    </div>
  );
}
