'use client';
import React from 'react';
import { Button, EmptyState, Skeleton } from '@/components/sixteen';

// Loading / message states for the full-bleed question screens. The loading
// skeleton mirrors the test layout (navy header, question column, footer) so
// the screen doesn't jump when the first question arrives.

const fill = { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--test-canvas)' };

export function TestLoading({ label = 'Loading questions…' }) {
  return (
    <div style={fill} role="status" aria-live="polite" aria-busy="true">
      <span style={srOnly}>{label}</span>
      <div style={{ height: 'var(--test-header-height)', background: 'var(--test-header)', flexShrink: 0 }} />
      <div style={{ height: 33, borderBottom: '1px solid var(--test-rule)', flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'hidden', padding: '32px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Skeleton width={30} height={28} radius={4} />
            <Skeleton height={1} style={{ flex: 1 }} />
          </div>
          <Skeleton width="92%" height={16} />
          <Skeleton width="86%" height={16} />
          <Skeleton width="58%" height={16} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={58} radius={8} />)}
          </div>
        </div>
      </div>
      <div style={{ height: 'var(--test-footer-height)', borderTop: '1px solid var(--test-rule)', flexShrink: 0 }} />
    </div>
  );
}

export function TestMessage({ title, body, onHome, homeLabel = 'Back to setup', icon = 'circle-alert' }) {
  return (
    <div style={{ ...fill, justifyContent: 'center' }}>
      <EmptyState
        icon={icon}
        title={title}
        body={body}
        action={onHome ? <Button variant="primary" onClick={onHome}>{homeLabel}</Button> : null}
      />
    </div>
  );
}

const srOnly = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0,
};

export default TestMessage;
