'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';
import SessionStats from '@/components/sixteen/panels/SessionStats';

// QuestionRW — Bluebook-faithful Reading & Writing question screen.

function QuestionRW({ go, tutorOn, setTutorOn, statsOn, setStatsOn, kind = 'drill', role = 'student' }) {
  const isTutor = role === 'tutor';
  const NS = SixteenNS;
  const {
    TestHeader, DirectionsBar, Timer, IconButton, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = NS;
  const d = SixteenData;
  const q = d.rwQuestion;
  const mod = d.rwModule;

  const [seconds, setSeconds] = React.useState(28 * 60 + 14);
  const [hidden, setHidden] = React.useState(false);
  const [ans, setAns] = React.useState(isTutor ? 'B' : null);   // tutor watches Maya's pick
  const [elim, setElim] = React.useState(new Set(isTutor ? ['A'] : []));
  const [marked, setMarked] = React.useState(true);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [eliminator, setEliminator] = React.useState(false);
  const [directionsOpen, setDirectionsOpen] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const tog = (l) => { const s = new Set(elim); s.has(l) ? s.delete(l) : s.add(l); setElim(s); };

  const items = Array.from({length: mod.total}, (_, i) => {
    const n = i + 1;
    let status = 'unanswered';
    if (mod.answered.has(n)) status = 'answered';
    if (n === mod.current) status = 'current';
    return { n, status, marked: mod.marked.has(n) };
  });

  const I = (n, size = 18) => React.createElement(Icon, { name: n, size });

  return (
    <div style={{
      position:'relative', display:'flex', flexDirection:'column',
      height:'100%', background:'#FFFFFF',
    }}>
      <TestHeader
        sectionLabel={mod.title}
        timer={<Timer seconds={seconds} hidden={hidden} onToggleHide={() => setHidden(!hidden)} />}
        tools={<>
          <ToolBtn label="Annotate" icon="pencil-line" />
          <ToolBtn label="Tutor"     icon="message-circle" active={tutorOn} onClick={() => setTutorOn(!tutorOn)} />
          <ToolBtn label="More"      icon="more-vertical" />
        </>}
      />

      <DirectionsBar onDirections={() => setDirectionsOpen(d => !d)} />

      <div style={{ flex: 1, display:'grid', gridTemplateColumns:'1fr 1px 1fr', overflow:'hidden' }}>
        {/* Passage */}
        <div style={{ overflow:'auto', padding: '36px 56px 48px' }}>
          <p style={{
            fontFamily:'var(--font-passage)',
            fontSize: 17, lineHeight: 1.6, color:'#1D1D1F',
            margin: 0,
            textWrap: 'pretty',
          }}>
            {q.passage.split('there was no need to hurry').map((part, i, arr) => i === arr.length - 1 ? part : (
              <React.Fragment key={i}>
                {part}
                <mark style={{background:'#FFEB80', color:'inherit', padding:'1px 0'}}>there was no need to hurry</mark>
              </React.Fragment>
            ))}
          </p>
        </div>

        {/* Divider */}
        <div style={{background:'#C8C8CC'}}/>

        {/* Question */}
        <div style={{ overflow:'auto', padding: '24px 56px 48px', position:'relative' }}>
          <QuestionNumberBadge
            n={q.n}
            flag={isTutor ? (
              <span style={{display:'inline-flex', alignItems:'center', gap:6, font:'var(--role-caption)', color:'var(--test-flag)'}}>
                <Icon name="eye" style={{width:14, height:14}}/> Watching
              </span>
            ) : (<>
              <button onClick={() => setEliminator(e => !e)} title="Cross out answers" style={{
                display:'inline-flex', alignItems:'center', gap: 4,
                padding: '3px 8px',
                background: eliminator ? '#1D1D1F' : 'transparent',
                color: eliminator ? '#fff' : '#1D1D1F',
                border: '1px solid #1D1D1F', borderRadius: 3,
                cursor: 'pointer',
                font: 'var(--role-label)', fontSize: 12, fontWeight: 700,
                textDecoration: 'line-through',
                textDecorationThickness: '1.5px',
                marginRight: 8,
              }}>ABC</button>
              <FlagButton marked={marked} onClick={() => setMarked(!marked)} />
            </>)}
          />
          {isTutor && (
            <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', marginBottom: 14, background:'var(--brand-blue-soft)', borderRadius:'var(--radius-md)'}}>
              <Icon name="lock" style={{width:13, height:13, color:'var(--brand-blue)'}}/>
              <span style={{font:'var(--role-caption)', color:'var(--brand-ink)'}}>Maya selected <strong>B</strong>. You can see her work but can’t change her answer.</span>
            </div>
          )}
          <p style={{
            fontFamily:'var(--font-sans)',
            fontSize: 16, lineHeight: 1.5,
            color:'#1D1D1F', margin:'0 0 22px', fontWeight: 400,
          }}>{q.prompt}</p>
          <div style={{display:'flex', flexDirection:'column', gap: 10}}>
            {q.options.map(o => (
              <OptionRow
                key={o.letter}
                letter={o.letter}
                selected={ans === o.letter}
                eliminated={elim.has(o.letter)}
                showEliminator={!isTutor && eliminator}
                onSelect={isTutor ? undefined : () => setAns(o.letter)}
                onToggleEliminate={() => tog(o.letter)}
                style={isTutor ? { cursor:'default', pointerEvents: o.letter === ans ? 'auto' : 'none' } : undefined}
              >{o.text}</OptionRow>
            ))}
          </div>
        </div>

        {kind === 'drill' && statsOn && (
          <SessionStats
            answered={13} total={mod.total} accuracy={78} median={48}
            hidden={false} onToggle={() => setStatsOn(false)}
          />
        )}
        {kind === 'drill' && !statsOn && (
          <SessionStats hidden={true} onToggle={() => setStatsOn(true)} />
        )}
      </div>

      {/* Question palette popover */}
      {paletteOpen && (
        <div style={{
          position:'absolute', bottom: 'calc(var(--test-footer-height) + 12px)',
          left: '50%', transform:'translateX(-50%)', zIndex: 20,
        }}>
          <QuestionPalette
            items={items}
            onSelect={() => setPaletteOpen(false)}
            onReviewAll={() => setPaletteOpen(false)}
          />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{position:'absolute', inset: 0, background:'rgba(0,0,0,0.10)', zIndex: 10}} />}

      {/* Directions modal */}
      {directionsOpen && <DirectionsModal onClose={() => setDirectionsOpen(false)} />}

      <TestFooter
        studentName={d.student.name}
        current={mod.current} total={mod.total}
        onPalette={() => setPaletteOpen(o => !o)}
        paletteOpen={paletteOpen}
        onBack={() => {}}
        onNext={() => go('module-review')}
        nextLabel="Next"
      />
    </div>
  );
}

function ToolBtn({ label, icon, active = false, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
        padding: '4px 8px', height: 'auto',
        background: active ? 'rgba(255,255,255,0.18)' : (hover ? 'rgba(255,255,255,0.10)' : 'transparent'),
        color: '#fff', border: 0, cursor: 'pointer',
        borderRadius: 4,
        font: 'var(--role-caption)', fontWeight: 500, fontSize: 11,
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      <Icon name={icon} style={{width:18, height:18, color: '#fff'}}/>
      <span>{label}</span>
    </button>
  );
}

function DirectionsModal({ onClose }) {
  return (
    <div style={{position:'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display:'grid', placeItems:'center'}}>
      <div style={{
        width: 520, maxWidth: '90%', maxHeight: '80%',
        background: '#FFFFFF', borderRadius: 8, boxShadow: 'var(--shadow-xl)',
        overflow:'auto',
      }}>
        <div style={{padding: '16px 20px', borderBottom:'1px solid var(--border-1)', display:'flex', justifyContent:'space-between'}}>
          <h2 style={{margin:0, font:'var(--role-title-sm)'}}>Section Directions</h2>
          <button onClick={onClose} style={{border:0, background:'transparent', cursor:'pointer', fontSize: 18, color:'var(--text-secondary)'}}>×</button>
        </div>
        <div style={{padding: 20, font:'var(--role-body-lg)', color:'var(--ink-1)', lineHeight: 1.55}}>
          <p>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p>
          <p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
        </div>
      </div>
    </div>
  );
}

export default QuestionRW;
