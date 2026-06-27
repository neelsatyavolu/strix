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
import ExamBreak from './screens/ExamBreak';
import ExamReport from './screens/ExamReport';
import Stats from './screens/Stats';
import CategoryDetail from './screens/CategoryDetail';
import TutorInvite from './screens/TutorInvite';
import TutorChat from './screens/TutorChat';
import Settings from './screens/Settings';
import TutorPanel from './panels/TutorPanel';
import LiveStudentsBanner from './panels/LiveStudentsBanner';
import LiveQuestionView from '@/components/tutor/LiveQuestionView';
import SessionStats from './panels/SessionStats';
import { useProfile } from './session/ProfileContext';
import { usePracticeSession } from './session/SessionContext';
import { useStudentLive } from '@/lib/tutor/useStudentLive';
import { useTutorWatch } from '@/lib/tutor/useTutorWatch';

// App — top-level Sixteen UI kit shell. Sidebar + screen router + tutor pane.

function App() {
  const NS = SixteenNS;
  const { AppShell, Titlebar, Sidebar, IconButton, Avatar } = NS;
  const { profile, displayName, email, user } = useProfile();
  const sessionLive = usePracticeSession();

  const [view, setView] = React.useState(profile ? 'dashboard' : 'onboarding');
  const [viewProps, setViewProps] = React.useState({});
  const [dark, setDark] = React.useState(false);
  const [tutorOn, setTutorOn] = React.useState(false);
  const [statsOn, setStatsOn] = React.useState(true);
  const [role, setRole] = React.useState('student');   // 'student' | 'tutor'
  const [students, setStudents] = React.useState([]);  // [{ id, name }] who added me as tutor
  const [watchedStudentId, setWatchedStudentId] = React.useState(null);
  const canTutor = students.length > 0;

  // You can only enter "Tutor view" once a student has added you as their tutor —
  // otherwise the toggle would just let you watch yourself.
  React.useEffect(() => {
    fetch('/api/tutor/students')
      .then((r) => r.json())
      .then((j) => {
        if (!j?.success) return;
        setStudents((j.data.students || []).map((s) => {
          const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          return { id: s.student_id, name: p?.full_name || p?.email || 'Student' };
        }));
      })
      .catch(() => {});
  }, []);

  // If tutor access goes away, fall back to the student view.
  React.useEffect(() => {
    if (!canTutor && role === 'tutor') { setRole('student'); setTutorOn(false); setWatchedStudentId(null); }
  }, [canTutor, role]);

  // Broadcast our own live practice state so a watching tutor stays in sync; and
  // (if we're a tutor) subscribe to our students' channels for the live banner.
  const live = React.useMemo(() => {
    const q = sessionLive.current;
    if (sessionLive.status !== 'active' || !q) return { active: false };
    return {
      active: true,
      index: sessionLive.index,
      total: sessionLive.questions.length,
      section: q.section,
      domainLabel: q.domainLabel,
      stemHtml: q.stemHtml,
      stimulusHtml: q.stimulusHtml,
      choices: q.choices,
      selected: sessionLive.responses[q.id]?.value || null,
    };
    // `questions` is a fresh [] each render while idle — depend on its length
    // (a stable primitive) instead so we don't re-broadcast every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLive.status, sessionLive.current, sessionLive.index, sessionLive.questions.length, sessionLive.responses]);

  const studentLive = useStudentLive(user?.id, live);
  const tutorWatch = useTutorWatch(students, watchedStudentId, user?.id);

  const watchedName = students.find((s) => s.id === watchedStudentId)?.name || 'your student';
  const watchedLiveMeta = watchedStudentId ? tutorWatch.liveStudents[watchedStudentId] : null;
  const watchedIsLive = !!(watchedLiveMeta && watchedLiveMeta.active);

  // Entering tutor view auto-opens the chat with the student; with one student
  // we auto-select them, otherwise the header picker decides.
  const switchRole = (r) => {
    setRole(r);
    setTutorOn(r === 'tutor');
    if (r === 'tutor') {
      if (view === 'onboarding') setView('dashboard');
      setWatchedStudentId((cur) => cur || (students.length === 1 ? students[0].id : null));
    } else {
      setWatchedStudentId(null);
    }
  };

  // Join a live student from the banner — switches into tutor view watching them.
  const joinStudent = (id) => {
    setWatchedStudentId(id);
    setRole('tutor');
    setTutorOn(true);
    if (view === 'onboarding') setView('dashboard');
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
    'exam-break': 'home',
    'exam-report': 'home',
    'stats': 'stats',
    'category-detail': 'stats',
    'tutor-chat': 'tutor',
    'tutor-invite': 'tutor',
    'settings': 'settings',
  }[view] || 'home';

  const isTutor = role === 'tutor';
  const watching = isTutor && !!watchedStudentId;

  // is the current view "inside a module"? (test surface) — never while tutoring,
  // so the sidebar/app chrome stays put when watching a student.
  const inModule = !isTutor && (view === 'rw-question' || view === 'math-question');
  const inDrill = inModule && (viewProps.kind || 'drill') === 'drill';

  const I = (n) => React.createElement(Icon, { name: n, size: 16 });

  React.useEffect(() => { void 0; }, [view, tutorOn, dark, role]);

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
        {!onboarding && isTutor && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            <Icon name="eye" style={{ width: 13, height: 13, color: 'var(--text-tertiary)' }} />
            <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>Viewing</span>
            <select
              value={watchedStudentId || ''}
              onChange={(e) => setWatchedStudentId(e.target.value || null)}
              style={{
                font: 'var(--role-label)', color: 'var(--text-primary)', background: 'var(--sunken)',
                border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', padding: '3px 6px', cursor: 'pointer',
              }}
            >
              {students.length !== 1 && <option value="">Select student…</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{tutorWatch.liveStudents[s.id]?.active ? ' • live' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        {!onboarding && canTutor && (
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

  // When watching an idle student, the normal screens render that student's
  // data, read-only (they can't start practice or change anything).
  const watchProps = watching ? { studentId: watchedStudentId, readOnly: true } : {};

  let screen;
  switch (view) {
    case 'onboarding':      screen = <Onboarding go={go} />; break;
    case 'dashboard':       screen = <Dashboard go={go} {...watchProps} />; break;
    case 'practice-setup':  screen = <PracticeSetup go={go} initial={viewProps} {...watchProps} />; break;
    case 'rw-question':     screen = <QuestionRW go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'math-question':   screen = <QuestionMath go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'module-review':   screen = <ModuleReview go={go} />; break;
    case 'score-report':    screen = <ScoreReport go={go} />; break;
    case 'exam-break':      screen = <ExamBreak go={go} />; break;
    case 'exam-report':     screen = <ExamReport go={go} />; break;
    case 'stats':           screen = <Stats go={go} {...watchProps} />; break;
    case 'category-detail': screen = <CategoryDetail go={go} section={viewProps.section} domain={viewProps.domain} label={viewProps.label} {...watchProps} />; break;
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

  // Main content while tutoring: live question if the student is mid-section,
  // a "pick a student" prompt if none is selected, else their read-only screens.
  let mainContent = screen;
  if (isTutor) {
    if (!watchedStudentId) mainContent = <PickStudentPrompt students={students} onPick={setWatchedStudentId} />;
    else if (watchedIsLive) mainContent = <LiveQuestionView live={tutorWatch.watchedLive} studentName={watchedName} />;
  }

  // Chat for the tutor pane: tutor↔watched-student when tutoring, else our own
  // tutor chat as the student.
  const chat = isTutor
    ? { messages: tutorWatch.messages, onSend: tutorWatch.sendChat, peerName: watchedName }
    : { messages: studentLive.messages, onSend: studentLive.sendChat, peerName: null };

  return (
    <>
      {canTutor && (
        <LiveStudentsBanner
          students={students}
          liveStudents={tutorWatch.liveStudents}
          watchedStudentId={watching ? watchedStudentId : null}
          onJoin={joinStudent}
        />
      )}
      <AppShell
        titlebar={titlebar}
        sidebar={inModule ? null : sidebar}
        tutorPane={tutorOn ? (
          <TutorPanel
            onClose={() => isTutor ? switchRole('student') : setTutorOn(false)}
            allowAI={!isTutor && (!inModule || inDrill)}
            role={role}
            selfId={user?.id}
            messages={chat.messages}
            onSend={chat.onSend}
            peerName={chat.peerName}
          />
        ) : null}
        variant={inModule ? 'test' : 'app'}
      >
        {mainContent}
      </AppShell>
    </>
  );
}

// Shown to a tutor with several students before they pick one to watch.
function PickStudentPrompt({ students, onPick }) {
  const { Card, Button } = SixteenNS;
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24 }}>
      <Card padding="lg" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ font: 'var(--role-title-sm)', color: 'var(--text-primary)', marginBottom: 4 }}>Pick a student to watch</div>
        <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 14 }}>
          You&rsquo;ll see their progress here, and their live question when they start practicing.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.map((s) => (
            <Button key={s.id} variant="secondary" fullWidth onClick={() => onPick(s.id)}>{s.name}</Button>
          ))}
        </div>
      </Card>
    </div>
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
    'exam-break': 'Strix — Break',
    'exam-report': 'Strix — Full SAT',
    'stats': 'Strix — Stats',
    'category-detail': 'Strix — Stats',
    'tutor-chat': 'Strix — Tutor',
    'tutor-invite': 'Strix — Tutor',
    'settings': 'Strix — Settings',
  })[view] || 'Strix';
}

export default App;
