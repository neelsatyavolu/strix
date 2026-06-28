'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import Highlightable from '@/components/sixteen/test/Highlightable';
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';

const NOOP = () => {};

// Read-only mirror of a watched student's exact test screen. Driven entirely by
// the live broadcast payload; every interaction is disabled.
export default function LiveTestView({ live, studentName = 'your student' }) {
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = SixteenNS;
  const first = String(studentName).split(' ')[0];
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  if (!live || live.active === false) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--test-canvas)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: 360 }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>{first} isn’t in a section right now</div>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>This view will fill in the moment they start a module.</div>
        </div>
      </div>
    );
  }

  const isMath = live.section === 'math';
  const sectionLabel = live.sectionLabel || (isMath ? 'Math' : 'Reading & Writing');
  const elimSet = new Set(live.eliminated || []);
  const palette = live.palette || [];
  const items = palette.map((p, i) => ({
    n: i + 1,
    status: p.current ? 'current' : p.answered ? 'answered' : 'unanswered',
    marked: !!p.flagged,
    onClick: NOOP,
  }));
  const calc = live.calc;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--test-canvas)' }}>
      <TestHeader
        sectionLabel={sectionLabel}
        timer={live.timerRunning === false || live.seconds == null ? null : <Timer seconds={live.seconds} hidden={false} onToggleHide={NOOP} />}
        tools={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', font: 'var(--role-caption)', paddingRight: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          Watching {first} · read-only
        </span>}
      />
      <DirectionsBar onDirections={NOOP} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (!isMath && live.stimulusHtml) ? '1fr 1px 1fr' : '1fr', overflow: 'hidden' }}>
        {!isMath && live.stimulusHtml && (
          <>
            <div style={{ overflow: 'auto', padding: '36px 56px 48px' }}>
              <Highlightable className="cb-passage" html={live.stimulusHtml} active={false} value={live.marks?.passage} onChange={NOOP} />
            </div>
            <div style={{ background: 'var(--test-divider)' }} />
          </>
        )}
        <div style={{ overflow: 'auto', padding: isMath ? '32px 24px 48px' : '24px 56px 48px', position: 'relative' }}>
          <div style={{ maxWidth: isMath ? 760 : undefined, margin: isMath ? '0 auto' : undefined }}>
            <QuestionNumberBadge
              n={(live.index ?? 0) + 1}
              flag={<FlagButton marked={!!live.flagged} onClick={NOOP} />}
            />
            <Highlightable className="cb-stem" html={live.stemHtml} active={false} value={live.marks?.stem} onChange={NOOP} />

            {live.type === 'spr' ? (
              <div style={{ marginTop: 24, maxWidth: 320 }}>
                <label style={{ display: 'block', font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Student’s answer</label>
                <div style={{ width: '100%', padding: '12px 14px', font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)', color: 'var(--test-ink)', background: 'var(--test-canvas)', border: '2px solid var(--border-2)', borderRadius: 'var(--radius-md)', minHeight: 22 }}>
                  {live.selected || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                {(live.choices || []).map((o) => (
                  <OptionRow
                    key={o.letter}
                    letter={o.letter}
                    selected={live.selected === o.letter}
                    eliminated={elimSet.has(o.letter)}
                    showEliminator={elimSet.size > 0}
                    onSelect={NOOP}
                    onToggleEliminate={NOOP}
                  >
                    <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                  </OptionRow>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMath && calc?.open && <DesmosPanel readOnly state={calc.state} pos={calc.pos} size={calc.size} onClose={NOOP} />}

      {paletteOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette items={items} title={sectionLabel} onSelect={NOOP} onReviewAll={NOOP} />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 10 }} />}

      <TestFooter
        studentName={studentName}
        current={(live.index ?? 0) + 1}
        total={live.total}
        onPalette={() => setPaletteOpen((o) => !o)}
        paletteOpen={paletteOpen}
        onBack={NOOP}
        onNext={NOOP}
        nextDisabled
        nextLabel="—"
      />
    </div>
  );
}
