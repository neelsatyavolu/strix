'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import PracticeSetup from './screens/PracticeSetup';
import QuestionRW from './screens/QuestionRW';
import QuestionMath from './screens/QuestionMath';
import ScoreReport from './screens/ScoreReport';
import StudyPlan from './screens/StudyPlan';
import Review from './screens/Review';
import TutorAssignments from './screens/TutorAssignments';
import StudentAssignments from './screens/StudentAssignments';
import ExamBreak from './screens/ExamBreak';
import ExamReport from './screens/ExamReport';
import Stats from './screens/Stats';
import Sessions from './screens/Sessions';
import PracticeTests from './screens/PracticeTests';
import PracticeModules from './screens/PracticeModules';
import PracticeSections from './screens/PracticeSections';
import QuestionBank from './screens/QuestionBank';
import CategoryDetail from './screens/CategoryDetail';
import SessionDetail from './screens/SessionDetail';
import TestReview from './screens/TestReview';
import TutorInvite from './screens/TutorInvite';
import TutorChat from './screens/TutorChat';
import Settings from './screens/Settings';
import DevTab from './screens/DevTab';
import Vocabulary from './screens/Vocabulary';
import TutorPanel from './panels/TutorPanel';
import LiveStudentsBanner from './panels/LiveStudentsBanner';
import LiveTestView from '@/components/tutor/LiveTestView';
import SessionStats from './panels/SessionStats';
import { useProfile } from './session/ProfileContext';
import { usePracticeSession } from './session/SessionContext';
import { useReviewQueue } from '@/lib/data/hooks';
import { LiveBroadcastProvider } from './session/LiveBroadcastContext';
import { useStudentLive } from '@/lib/tutor/useStudentLive';
import { useTutorWatch } from '@/lib/tutor/useTutorWatch';
import { useTeachTutor } from '@/lib/tutor/useTeachMode';
import { TeachProvider } from '@/components/tutor/TeachContext';
import TeachLayer from '@/components/tutor/TeachLayer';
import TeachToolbar from '@/components/tutor/TeachToolbar';

// App — top-level Sixteen UI kit shell. Sidebar + screen router + tutor pane.

function App() {
  const NS = SixteenNS;
  const { AppShell, Titlebar, Sidebar, IconButton, Avatar } = NS;
  const { profile, displayName, email, user, avatarUrl } = useProfile();
  const sessionLive = usePracticeSession();

  const [view, setView] = React.useState(profile ? 'dashboard' : 'onboarding');
  const [viewProps, setViewProps] = React.useState({});
  const [theme, setThemeState] = React.useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('strix-theme') : null;
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    } catch {
      return 'system';
    }
  });  // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = React.useState(() => (
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  ));
  const [tutorOn, setTutorOn] = React.useState(false);
  const [statsOn, setStatsOn] = React.useState(true);
  const [role, setRole] = React.useState('student');   // 'student' | 'tutor'
  const [students, setStudents] = React.useState([]);  // [{ id, name }] who added me as tutor
  const [watchedStudentId, setWatchedStudentId] = React.useState(null);
  const canTutor = students.length > 0;

  // Latest UI snapshot reported by the active test screen (highlights, elim,
  // timer, calculator). Folded into the live broadcast below.
  const [liveUi, setLiveUi] = React.useState({});
  const report = React.useCallback((partial) => {
    setLiveUi((prev) => ({
      ...prev,
      ...partial,
      // `calc` arrives as separate partials (open / state / geometry) — deep-merge
      // so a later update never clobbers fields an earlier one set.
      ...(partial.calc ? { calc: { ...prev.calc, ...partial.calc } } : {}),
    }));
  }, []);

  // A fresh accept-invite redirect (/app?watch=<id>) lands straight in Tutor view
  // watching that student — read once on mount.
  const initialWatch = React.useRef(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('watch') : null,
  );

  // Restore the last student/tutor mode (and watched student) so reloading the
  // app doesn't drop tutors back into the student view. Read once on mount;
  // actually applied after the students list loads (a tutor must still have a
  // student). `hydrated` gates the persist effect so the default 'student' state
  // never clobbers a saved 'tutor' before the async restore runs.
  const savedRole = React.useRef(
    typeof window !== 'undefined' ? window.localStorage.getItem('strix-role') : null,
  );
  const savedWatch = React.useRef(
    typeof window !== 'undefined' ? window.localStorage.getItem('strix-watch') : null,
  );
  const hydrated = React.useRef(false);

  // You can only enter "Tutor view" once a student has added you as their tutor —
  // otherwise the toggle would just let you watch yourself.
  React.useEffect(() => {
    fetch('/api/tutor/students')
      .then((r) => r.json())
      .then((j) => {
        if (!j?.success) return;
        const list = (j.data.students || []).map((s) => {
          const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          return {
            id: s.student_id,
            name: p?.full_name || p?.email || 'Student',
            targetScore: p?.target_score ?? null,
            testDate: p?.test_date ?? null,
          };
        });
        setStudents(list);
        const watch = initialWatch.current;
        initialWatch.current = null;
        if (watch && list.some((s) => s.id === watch)) {
          setRole('tutor');
          setTutorOn(true);
          setWatchedStudentId(watch);
          setView((v) => (v === 'onboarding' ? 'dashboard' : v));
          if (typeof window !== 'undefined') window.history.replaceState({}, '', '/app');
        } else if (savedRole.current === 'tutor' && list.length > 0) {
          // Restore the persisted tutor mode (the URL redirect takes precedence).
          setRole('tutor');
          setTutorOn(true);
          const sw = savedWatch.current;
          setWatchedStudentId(
            sw && list.some((s) => s.id === sw) ? sw : (list.length === 1 ? list[0].id : null),
          );
          setView((v) => (v === 'onboarding' ? 'dashboard' : v));
        }
      })
      .catch(() => {})
      .finally(() => { hydrated.current = true; });
  }, []);

  // If tutor access goes away, fall back to the student view.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!canTutor && role === 'tutor') { setRole('student'); setTutorOn(false); setWatchedStudentId(null); }
  }, [canTutor, role]);

  // Persist the student/tutor mode (and watched student) across reloads. Gated on
  // `hydrated` so the initial default 'student' render doesn't overwrite a saved
  // 'tutor' before the students fetch restores it.
  React.useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem('strix-role', role);
      if (watchedStudentId) window.localStorage.setItem('strix-watch', watchedStudentId);
      else window.localStorage.removeItem('strix-watch');
    } catch { /* localStorage unavailable */ }
  }, [role, watchedStudentId]);

  // Broadcast our own live practice state so a watching tutor stays in sync; and
  // (if we're a tutor) subscribe to our students' channels for the live banner.
  const live = React.useMemo(() => {
    const q = sessionLive.current;
    if (sessionLive.status !== 'active' || !q) {
      // Not practicing, but reviewing a completed session — tell a watching
      // tutor which one so they can open it alongside and teach on it.
      if (role !== 'tutor' && view === 'session-detail' && viewProps.id) {
        return { active: true, mode: 'review', sessionId: viewProps.id };
      }
      return { active: false };
    }
    const resp = sessionLive.responses[q.id] || {};
    // Fields derivable from the session are computed here so they never depend on
    // the active screen's report() timing.
    const base = q.section === 'math' ? 'Math' : 'Reading & Writing';
    const label = sessionLive.activeModule?.label;
    const sectionLabel = label === 'Drill' ? `${base} — Drill` : `${base}, ${label || 'Module 1'}`;
    const palette = sessionLive.questions.map((x, i) => ({
      answered: !!sessionLive.responses[x.id]?.value,
      flagged: !!sessionLive.responses[x.id]?.flagged,
      current: i === sessionLive.index,
    }));
    return {
      active: true,
      mode: 'practice',
      // Question id so a watching tutor can fetch the answer key (students
      // never receive keys in the sanitized practice payload).
      id: q.id,
      index: sessionLive.index,
      total: sessionLive.questions.length,
      section: q.section,
      domainLabel: q.domainLabel,
      stemHtml: q.stemHtml,
      stimulusHtml: q.stimulusHtml,
      choices: q.choices,
      selected: resp.value || null,
      flagged: !!resp.flagged,
      type: q.type === 'spr' ? 'spr' : 'mcq',
      sectionLabel,
      palette,
      // Genuinely screen-local UI (highlights, strikethroughs, timer, calculator)
      // arrives via the active screen's report(); undefined until it reports.
      marks: liveUi.marks,
      eliminated: liveUi.eliminated,
      annotateActive: liveUi.annotateActive,
      seconds: liveUi.seconds,
      timerRunning: liveUi.timerRunning,
      calc: liveUi.calc,
    };
    // `questions` is a fresh [] each render while idle — depend on its length
    // (a stable primitive) instead so we don't re-broadcast every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLive.status, sessionLive.current, sessionLive.index, sessionLive.questions.length, sessionLive.responses, sessionLive.activeModule, liveUi, role, view, viewProps.id]);

  const studentLive = useStudentLive(user?.id, live, role === 'student' && tutorOn);
  const tutorWatch = useTutorWatch(students, watchedStudentId, user?.id);

  // Unread tutor message indicator (student only): dot on the Tutor tab + the
  // top-bar chat toggle when a message lands while the chat is collapsed.
  const tutorUnread = role === 'student' && studentLive.unread;

  const watchedName = students.find((s) => s.id === watchedStudentId)?.name || 'your student';
  const watchedLiveMeta = watchedStudentId ? tutorWatch.liveStudents[watchedStudentId] : null;
  // Only an actual practice module opens the live mirror. A student reviewing a
  // completed session is "present", not "in a section".
  const watchedIsLive = !!(watchedLiveMeta && watchedLiveMeta.active && (watchedLiveMeta.mode || 'practice') === 'practice');
  const watchedReviewSessionId = watchedLiveMeta?.active && watchedLiveMeta.mode === 'review'
    ? watchedLiveMeta.sessionId
    : null;

  // Auto-open Live Session as soon as the watched student goes live. Leaving
  // waits a beat after useTutorWatch's session-idle debounce so we never bounce
  // off the view on presence/channel flaps.
  const wasLive = React.useRef(false);
  React.useEffect(() => {
    if (watchedIsLive === wasLive.current) return undefined;
    if (watchedIsLive) {
      wasLive.current = true;
      // Async so we don't sync-setState inside the effect body (React 19 lint).
      const t = setTimeout(() => setView('live-session'), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      wasLive.current = false;
      setView((v) => (v === 'live-session' ? 'dashboard' : v));
    }, 600);
    return () => clearTimeout(t);
  }, [watchedIsLive]);

  // Follow the student into a completed session they open, so teaching mode has
  // the same questions on both screens. Only moves the tutor when the student
  // switches sessions — the tutor can still browse away freely afterwards.
  const lastReviewRef = React.useRef(null);
  const tutorWatching = role === 'tutor' && !!watchedStudentId;
  React.useEffect(() => {
    if (!tutorWatching || !watchedReviewSessionId) { lastReviewRef.current = null; return undefined; }
    if (lastReviewRef.current === watchedReviewSessionId) return undefined;
    lastReviewRef.current = watchedReviewSessionId;
    const t = setTimeout(() => {
      setView('session-detail');
      setViewProps({ id: watchedReviewSessionId });
    }, 0);
    return () => clearTimeout(t);
  }, [tutorWatching, watchedReviewSessionId]);

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

  const setTheme = React.useCallback((next) => {
    setThemeState(next);
    try { window.localStorage.setItem('strix-theme', next); } catch { /* localStorage unavailable */ }
  }, []);

  // Track the OS color scheme so 'system' resolves live.
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const dark = theme === 'system' ? systemDark : theme === 'dark';

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  const go = (v, props = {}) => { setView(v); setViewProps(props); };

  // map view → sidebar id
  const sidebarId = {
    'dashboard': 'home',
    'practice-setup': 'practice',
    'vocabulary': 'vocabulary',
    'plan': 'plan',
    'review': 'review',
    'tutor-assignments': 'assignments',
    'student-assignments': 'assignments',
    'rw-question': 'practice',
    'math-question': 'practice',
    'score-report': 'home',
    'exam-break': 'home',
    'exam-report': 'home',
    'stats': 'stats',
    'sessions': 'sessions',
    'practice-tests': 'practice-tests',
    'practice-modules': 'practice-modules',
    'practice-sections': 'practice-sections',
    'question-bank': 'question-bank',
    'category-detail': 'stats',
    'session-detail': 'stats',
    'test-review': 'practice-tests',
    'live-session': 'live-session',
    'tutor-chat': 'tutor',
    'tutor-invite': 'tutor',
    'settings': 'settings',
    'dev': 'dev',
  }[view] || 'home';

  const isTutor = role === 'tutor';
  const watching = isTutor && !!watchedStudentId;

  // Teaching mode. Ink is scoped to the live question while practicing and to
  // the open session while reviewing; a scope change wipes the board.
  const teachScope = view === 'live-session'
    ? (tutorWatch.watchedLive?.id || null)
    : (view === 'session-detail' && viewProps.id ? `session:${viewProps.id}` : null);
  const teachTutor = useTeachTutor({
    send: watching && teachScope ? tutorWatch.teachSend : null,
    scope: teachScope,
  });
  const teach = isTutor ? teachTutor : studentLive.teach;

  // Replay the current lesson to a student who just came back online.
  const studentOnline = !!tutorWatch.onlineStudents[watchedStudentId];
  const wasOnlineRef = React.useRef(false);
  const resync = teachTutor.resync;
  React.useEffect(() => {
    if (studentOnline && !wasOnlineRef.current) resync();
    wasOnlineRef.current = studentOnline;
  }, [studentOnline, resync]);
  // Review due-count for the sidebar badge — the watched student's when tutoring,
  // otherwise the signed-in student's own.
  const { queue: reviewQueue } = useReviewQueue(watching ? watchedStudentId : null);

  // is the current view "inside a module"? (test surface) — never while tutoring,
  // so the sidebar/app chrome stays put when watching a student.
  const inModule = !isTutor && (view === 'rw-question' || view === 'math-question');
  const inDrill = inModule && (viewProps.kind || 'drill') === 'drill';

  const I = (n) => React.createElement(Icon, { name: n, size: 16 });

  React.useEffect(() => { void 0; }, [view, tutorOn, dark, role]);

  const onboarding = view === 'onboarding';

  // Dev seeding tab — visible only to allowlisted accounts (same list the
  // /api/dev/seed route enforces server-side). Unset env ⇒ hidden everywhere.
  const devEmails = (process.env.NEXT_PUBLIC_DEV_SEED_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const devEnabled = !!email && devEmails.includes(email.toLowerCase());

  const reviewDue = reviewQueue?.count ? reviewQueue.count : 0;
  const sidebarItems = [
    // Dashboard — overview + records
    { id:'home',     label:'Home',        icon: I('home'),         group:'Dashboard' },
    { id:'stats',    label:'Stats',       icon: I('bar-chart-3'),  group:'Dashboard' },
    { id:'sessions', label:'Sessions',    icon: I('list'),         group:'Dashboard' },
    { id:'assignments', label:'Assignments', icon: I('clipboard-list'), group:'Dashboard' },
    // Studying — targeted drills + the study loop (Study Plan + Review render the
    // watched student's data read-only when tutoring)
    { id:'practice', label:'Practice',          icon: I('book-open'),       group:'Studying' },
    { id:'vocabulary', label:'Vocabulary',      icon: I('library'),         group:'Studying' },
    { id:'question-bank', label:'Question Bank', icon: I('database'),        group:'Studying' },
    { id:'plan',     label:'Study Plan',        icon: I('target'),          group:'Studying' },
    { id:'review',   label:'Review',            icon: I('rotate-ccw'),      group:'Studying', badge: reviewDue || undefined },
    // Full Practice — timed, exam-shaped surfaces
    { id:'practice-modules',  label:'Practice Modules',  icon: I('package'),        group:'Full Practice' },
    { id:'practice-sections', label:'Practice Sections', icon: I('layers'),         group:'Full Practice' },
    { id:'practice-tests',    label:'Practice Exams',     icon: I('graduation-cap'), group:'Full Practice' },
    // You — people + config
    { id:'tutor',    label:'Tutor',    icon: I('message-circle'), group:'You', dot: tutorUnread },
    { id:'settings', label:'Settings', icon: I('settings'),       group:'You' },
  ];
  if (devEnabled) sidebarItems.push({ id:'dev', label:'Dev', icon: I('wrench'), group:'You' });
  // While watching a live student, pin a "Live Session" tab to the very top.
  if (isTutor && watchedIsLive) {
    sidebarItems.unshift({ id:'live-session', label:'Live Session', icon: I('radio'), group:'Live', live: true });
  }

  const sidebar = (
    <Sidebar
      items={sidebarItems}
      activeId={sidebarId}
      onSelect={(id) => {
        if (id === 'live-session') go('live-session');
        else if (id === 'home')     go('dashboard');
        else if (id === 'plan') go('plan');
        else if (id === 'review') go('review');
        else if (id === 'assignments') go(isTutor ? 'tutor-assignments' : 'student-assignments');
        else if (id === 'practice') go('practice-setup');
        else if (id === 'vocabulary') go('vocabulary');
        else if (id === 'question-bank') go('question-bank');
        else if (id === 'stats') go('stats');
        else if (id === 'practice-tests') go('practice-tests');
        else if (id === 'practice-modules') go('practice-modules');
        else if (id === 'practice-sections') go('practice-sections');
        else if (id === 'sessions') go('sessions');
        else if (id === 'tutor') go('tutor-invite');
        else if (id === 'settings') go('settings');
        else if (id === 'dev') go('dev');
      }}
      header={<>
        <img src="/assets/app-icon.svg" width="24" height="24" style={{borderRadius: 6}} />
        <div style={{display:'flex', flexDirection:'column'}}>
          <span style={{font:'var(--role-title-sm)', color:'var(--text-primary)'}}>Strix</span>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Practice for the SAT</span>
        </div>
      </>}
      footer={<button onClick={() => go('settings')} style={{display:'flex', gap:8, alignItems:'center', width:'100%', padding:'6px 8px', borderRadius:'var(--radius-md)', background:'transparent', border:0, cursor:'pointer', textAlign:'left'}}>
        <Avatar name={displayName} src={avatarUrl} size="sm" />
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
        {!onboarding && (
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <IconButton
              size="sm"
              variant={tutorOn ? 'solid' : 'ghost'}
              label={tutorOn ? (isTutor ? 'Collapse chat' : 'Hide tutor') : (isTutor ? 'Show chat' : 'Show tutor')}
              onClick={() => setTutorOn(!tutorOn)}
            >
              {I('message-circle')}
            </IconButton>
            {tutorUnread && !tutorOn && (
              <span style={{
                position: 'absolute', top: 1, right: 1, width: 8, height: 8, borderRadius: '50%',
                background: 'var(--brand-blue)', boxShadow: '0 0 0 2px var(--surface-titlebar)',
                pointerEvents: 'none',
              }} />
            )}
          </span>
        )}
        <IconButton size="sm" variant="ghost" label="Dark mode" onClick={() => setTheme(dark ? 'light' : 'dark')}>
          {dark ? I('sun') : I('moon')}
        </IconButton>
      </>}
    />
  );

  // When watching an idle student, the normal screens render that student's
  // data, read-only (they can't start practice or change anything).
  const watchedStudent = students.find((s) => s.id === watchedStudentId) || null;
  const watchProps = watching
    ? {
        studentId: watchedStudentId,
        readOnly: true,
        studentName: watchedName,
        studentProfile: watchedStudent
          ? { target_score: watchedStudent.targetScore, test_date: watchedStudent.testDate }
          : null,
      }
    : {};

  let screen;
  switch (view) {
    case 'onboarding':      screen = <Onboarding go={go} />; break;
    case 'dashboard':       screen = <Dashboard go={go} {...watchProps} />; break;
    case 'practice-setup':  screen = <PracticeSetup go={go} initial={viewProps} {...watchProps} />; break;
    case 'vocabulary':      screen = <Vocabulary />; break;
    case 'rw-question':     screen = <QuestionRW key={sessionLive.activeModule?.key || 'rw'} go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'math-question':   screen = <QuestionMath key={sessionLive.activeModule?.key || 'math'} go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'score-report':    screen = <ScoreReport go={go} />; break;
    case 'plan':            screen = <StudyPlan go={go} {...watchProps} />; break;
    case 'review':          screen = <Review go={go} {...watchProps} />; break;
    case 'tutor-assignments': screen = <TutorAssignments go={go} {...watchProps} />; break;
    case 'student-assignments': screen = <StudentAssignments go={go} />; break;
    case 'exam-break':      screen = <ExamBreak go={go} />; break;
    case 'exam-report':     screen = <ExamReport go={go} />; break;
    case 'stats':           screen = <Stats go={go} {...watchProps} />; break;
    case 'sessions':        screen = <Sessions go={go} {...watchProps} />; break;
    case 'practice-tests':  screen = <PracticeTests go={go} {...watchProps} />; break;
    case 'practice-modules': screen = <PracticeModules go={go} {...watchProps} />; break;
    case 'practice-sections': screen = <PracticeSections go={go} {...watchProps} />; break;
    case 'question-bank':    screen = <QuestionBank go={go} />; break;
    case 'category-detail': screen = <CategoryDetail go={go} section={viewProps.section} domain={viewProps.domain} label={viewProps.label} {...watchProps} />; break;
    case 'session-detail':  screen = <SessionDetail go={go} id={viewProps.id} {...watchProps} />; break;
    case 'test-review':     screen = <TestReview go={go} rwId={viewProps.rwId} mathId={viewProps.mathId} {...watchProps} />; break;
    case 'live-session':    screen = <LiveTestView live={tutorWatch.watchedLive} studentName={watchedName} />; break;
    case 'tutor-invite':    screen = <TutorInvite go={go} />; break;
    case 'tutor-chat':      screen = <TutorChat go={go} />; break;
    case 'settings':        screen = <Settings go={go} theme={theme} setTheme={setTheme} />; break;
    case 'dev':             screen = devEnabled ? <DevTab go={go} /> : <Dashboard go={go} />; break;
    default:                screen = <Dashboard go={go} />;
  }

  if (onboarding) {
    return (
      <AppShell titlebar={titlebar} sidebar={null} variant="app">
        {screen}
      </AppShell>
    );
  }

  // While tutoring: prompt to pick a student if none is selected; otherwise the
  // live mirror is a normal routed screen ('live-session'), so Stats/Dashboard
  // stay freely browsable while the student practices.
  let mainContent = screen;
  if (isTutor && !watchedStudentId && view !== 'tutor-invite' && view !== 'settings') {
    mainContent = <PickStudentPrompt students={students} onPick={setWatchedStudentId} />;
  }

  // Chat for the tutor pane: tutor↔watched-student when tutoring, else our own
  // tutor chat as the student.
  const chat = isTutor
    ? { messages: tutorWatch.messages, onSend: tutorWatch.sendChat, peerName: watchedName, peerTyping: tutorWatch.peerTyping, onTyping: tutorWatch.notifyTyping, peerOnline: !!tutorWatch.onlineStudents[watchedStudentId] || !!tutorWatch.liveStudents[watchedStudentId]?.active }
    : { messages: studentLive.messages, onSend: studentLive.sendChat, peerName: null, peerTyping: studentLive.peerTyping, onTyping: studentLive.notifyTyping, peerOnline: studentLive.peerOnline };

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
            onClose={() => setTutorOn(false)}
            allowAI={!isTutor && (!inModule || inDrill)}
            role={role}
            selfId={user?.id}
            messages={chat.messages}
            onSend={chat.onSend}
            peerName={chat.peerName}
            peerTyping={chat.peerTyping}
            peerOnline={chat.peerOnline}
            onTyping={chat.onTyping}
          />
        ) : null}
        variant={inModule ? 'test' : 'app'}
      >
        <TeachProvider value={teach}>
          <LiveBroadcastProvider report={report}>
            {mainContent}
          </LiveBroadcastProvider>
          <TeachLayer />
          {isTutor ? <TeachToolbar /> : <TeachingChip active={!!teach?.on} />}
        </TeachProvider>
      </AppShell>
    </>
  );
}

// Quiet marker so the student knows the pointer on their screen is their tutor's.
function TeachingChip({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 70,
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px',
      background: 'var(--paper)', border: '1px solid var(--border-1)', borderRadius: 999,
      boxShadow: 'var(--shadow-md)', font: 'var(--role-label)', color: 'var(--text-secondary)',
      pointerEvents: 'none',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b30' }} />
      Your tutor is pointing at your screen
    </div>
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
    'plan': 'Strix — Study Plan',
    'review': 'Strix — Review',
    'tutor-assignments': 'Strix — Assignments',
    'student-assignments': 'Strix — Assignments',
    'practice-setup': 'Strix — New session',
    'vocabulary': 'Strix — Vocabulary',
    'rw-question': 'Strix — Reading & Writing',
    'math-question': 'Strix — Math',
    'score-report': 'Strix — Score report',
    'exam-break': 'Strix — Break',
    'exam-report': 'Strix — Full SAT',
    'stats': 'Strix — Stats',
    'sessions': 'Strix — Sessions',
    'practice-tests': 'Strix — Practice Exams',
    'practice-modules': 'Strix — Practice Modules',
    'practice-sections': 'Strix — Practice Sections',
    'question-bank': 'Strix — Question Bank',
    'category-detail': 'Strix — Stats',
    'tutor-chat': 'Strix — Tutor',
    'tutor-invite': 'Strix — Tutor',
    'settings': 'Strix — Settings',
    'dev': 'Strix — Dev',
  })[view] || 'Strix';
}

export default App;
