'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import PracticeSetup from './screens/PracticeSetup';
import QuestionRW from './screens/QuestionRW';
import QuestionMath from './screens/QuestionMath';
import ModuleReview from './screens/ModuleReview';
import ScoreReport from './screens/ScoreReport';
import Stats from './screens/Stats';
import TutorInvite from './screens/TutorInvite';
import TutorChat from './screens/TutorChat';
import Settings from './screens/Settings';
import TutorPanel from './panels/TutorPanel';
import SessionStats from './panels/SessionStats';
import { useProfile } from './session/ProfileContext';

// App — top-level Sixteen UI kit shell. Sidebar + screen router + tutor pane.

function App() {
  const NS = SixteenNS;
  const { AppShell, Titlebar, Sidebar, IconButton, Avatar } = NS;
  const { profile, displayName, email } = useProfile();

  const [view, setView] = React.useState(profile ? 'dashboard' : 'onboarding');
  const [viewProps, setViewProps] = React.useState({});
  const [dark, setDark] = React.useState(false);
  const [tutorOn, setTutorOn] = React.useState(false);
  const [statsOn, setStatsOn] = React.useState(true);
  const [role, setRole] = React.useState('student');   // 'student' | 'tutor'

  // Entering tutor view auto-opens the chat with the student.
  const switchRole = (r) => {
    setRole(r);
    setTutorOn(r === 'tutor');
    if (r === 'tutor' && (view === 'onboarding')) setView('dashboard');
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  const go = (v, props = {}) => { setView(v); setViewProps(props); };

  // map view → sidebar id
  const sidebarId = {
    'dashboard': 'home',
    'practice-setup': 'home',
    'rw-question': 'rw',
    'math-question': 'math',
    'module-review': 'rw',
    'score-report': 'home',
    'stats': 'stats',
    'tutor-chat': 'tutor',
    'tutor-invite': 'tutor',
    'settings': 'settings',
  }[view] || 'home';

  // is the current view "inside a module"? (test surface)
  const inModule = view === 'rw-question' || view === 'math-question';
  const inDrill = inModule && (viewProps.kind || 'drill') === 'drill';

  const I = (n) => React.createElement(Icon, { name: n, size: 16 });

  React.useEffect(() => { void 0; }, [view, tutorOn, dark, role]);

  const isTutor = role === 'tutor';
  const onboarding = view === 'onboarding';

  const sidebar = (
    <Sidebar
      items={[
        { id:'home',     label:'Home',                  icon: I('home'),            group:'Practice' },
        { id:'rw',       label:'Reading & Writing',     icon: I('book-open'),       group:'Practice' },
        { id:'math',     label:'Math',                  icon: I('square-function'), group:'Practice' },
        { id:'stats',    label:'Stats',                 icon: I('bar-chart-3'),     group:'You' },
        { id:'tutor',    label:'Tutor',                 icon: I('message-circle'),  group:'You' },
        { id:'settings', label:'Settings',              icon: I('settings'),        group:'You' },
      ]}
      activeId={sidebarId}
      onSelect={(id) => {
        if (id === 'home')     go('dashboard');
        else if (id === 'rw')   go('practice-setup', { domain: 'rw' });
        else if (id === 'math') go('practice-setup', { domain: 'math' });
        else if (id === 'stats') go('stats');
        else if (id === 'tutor') go('tutor-invite');
        else if (id === 'settings') go('settings');
      }}
      header={<>
        <img src="/assets/app-icon.svg" width="24" height="24" style={{borderRadius: 6}} />
        <div style={{display:'flex', flexDirection:'column'}}>
          <span style={{font:'var(--role-title-sm)', color:'var(--text-primary)'}}>Strix</span>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Practice for the SAT</span>
        </div>
      </>}
      footer={<button onClick={() => go('settings')} style={{display:'flex', gap:8, alignItems:'center', width:'100%', padding:'6px 8px', borderRadius:'var(--radius-md)', background:'transparent', border:0, cursor:'pointer', textAlign:'left'}}>
        <Avatar name={displayName} size="sm" />
        <div style={{display:'flex', flexDirection:'column', flex:1, minWidth:0}}>
          <span style={{font:'var(--role-label)', color:'var(--text-primary)'}}>{displayName}</span>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis'}}>{email}</span>
        </div>
        <Icon name="settings-2" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
      </button>}
    />
  );

  const { SegmentedControl } = NS;
  const titlebar = (
    <Titlebar
      title={titleFor(view, isTutor)}
      trailing={<>
        {!onboarding && (
          <div style={{marginRight: 6}}>
            <SegmentedControl
              size="sm"
              value={role}
              onChange={switchRole}
              options={[
                { value:'student', label:'Student' },
                { value:'tutor',   label:'Tutor view' },
              ]}
            />
          </div>
        )}
        {!isTutor && (
          <IconButton size="sm" variant={tutorOn ? 'solid' : 'ghost'} label={tutorOn ? 'Hide tutor' : 'Show tutor'} onClick={() => setTutorOn(!tutorOn)}>
            {I('message-circle')}
          </IconButton>
        )}
        <IconButton size="sm" variant="ghost" label="Dark mode" onClick={() => setDark(d => !d)}>
          {dark ? I('sun') : I('moon')}
        </IconButton>
      </>}
    />
  );

  let screen;
  switch (view) {
    case 'onboarding':      screen = <Onboarding go={go} />; break;
    case 'dashboard':       screen = <Dashboard go={go} />; break;
    case 'practice-setup':  screen = <PracticeSetup go={go} initial={viewProps} />; break;
    case 'rw-question':     screen = <QuestionRW go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'math-question':   screen = <QuestionMath go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'module-review':   screen = <ModuleReview go={go} />; break;
    case 'score-report':    screen = <ScoreReport go={go} />; break;
    case 'stats':           screen = <Stats go={go} />; break;
    case 'tutor-invite':    screen = <TutorInvite go={go} />; break;
    case 'tutor-chat':      screen = <TutorChat go={go} />; break;
    case 'settings':        screen = <Settings go={go} dark={dark} setDark={setDark} />; break;
    default:                screen = <Dashboard go={go} />;
  }

  if (onboarding) {
    return (
      <AppShell titlebar={titlebar} sidebar={null} variant="app">
        {screen}
      </AppShell>
    );
  }

  return (
    <AppShell
      titlebar={titlebar}
      sidebar={inModule ? null : sidebar}
      tutorPane={tutorOn ? <TutorPanel onClose={() => isTutor ? switchRole('student') : setTutorOn(false)} allowAI={!isTutor && (!inModule || inDrill)} role={role} /> : null}
      variant={inModule ? 'test' : 'app'}
    >
      {screen}
    </AppShell>
  );
}

function titleFor(view, isTutor) {
  if (isTutor) return 'Strix — Tutor view';
  return ({
    'onboarding': 'Strix',
    'dashboard': 'Strix',
    'practice-setup': 'Strix — New session',
    'rw-question': 'Strix — Reading & Writing',
    'math-question': 'Strix — Math',
    'module-review': 'Strix — Module review',
    'score-report': 'Strix — Score report',
    'stats': 'Strix — Stats',
    'tutor-chat': 'Strix — Tutor',
    'tutor-invite': 'Strix — Tutor',
    'settings': 'Strix — Settings',
  })[view] || 'Strix';
}

export default App;
