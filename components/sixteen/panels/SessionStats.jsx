'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';

// Live "session stats" sidebar — appears next to the question column,
// shows accuracy, time, and category breakdown for the current session.

function SessionStats({ answered = 13, total = 27, accuracy = 78, median = 48, hidden = false, onToggle }) {
  const { StatCard, DomainBar, AccuracyRing, IconButton } = SixteenNS;
  if (hidden) {
    return (
      <div style={{
        position: 'absolute', left: 18, bottom: 'calc(var(--test-footer-height) + 12px)', zIndex: 5,
      }}>
        <button onClick={onToggle} title="Show session stats" style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--paper)',
          boxShadow: 'var(--shadow-sm)', border: 0, cursor: 'pointer',
          display: 'grid', placeItems: 'center', color: 'var(--brand-blue)',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="20" x2="6" y2="13"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="18" y1="20" x2="18" y2="9"></line>
          </svg>
        </button>
      </div>
    );
  }
  return (
    <aside style={{
      position: 'absolute', left: 18, bottom: 'calc(var(--test-footer-height) + 12px)', width: 250, zIndex: 5,
      background: 'var(--paper)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>Session stats</span>
        <button onClick={onToggle} title="Hide" style={{ width:20, height:20, borderRadius: 4, border:0, background:'transparent', cursor:'pointer', color:'var(--text-tertiary)' }}>
          <Icon name="x" style={{width:14, height:14}}/>
        </button>
      </div>
      <div style={{display:'flex', alignItems:'center', gap: 14}}>
        <AccuracyRing value={accuracy} size={64} stroke={7} />
        <div style={{display:'flex', flexDirection:'column', gap: 6}}>
          <StatCard label="Answered" value={`${answered}/${total}`} size="sm" />
          <StatCard label="Median time" value={median} unit="s" size="sm" />
        </div>
      </div>
      <div>
        <span style={{font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)', color:'var(--text-tertiary)', display:'block', marginBottom: 6}}>Breakdown</span>
        <DomainBar segments={[
          { value: 10, label:'Correct',   color:'var(--correct)'  },
          { value: 2,  label:'Incorrect', color:'var(--incorrect)'},
          { value: 1,  label:'Skipped',   color:'var(--unanswered)'},
        ]}/>
      </div>
      <div style={{padding: '8px 0 0', borderTop: '1px solid var(--border-1)', display:'flex', justifyContent:'space-between', font:'var(--role-caption)', color:'var(--text-secondary)'}}>
        <span>Pace</span><span style={{fontFamily:'var(--font-mono)', color:'var(--success)'}}>+22s faster</span>
      </div>
    </aside>
  );
}

export default SessionStats;
