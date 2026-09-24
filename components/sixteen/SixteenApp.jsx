'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import QuestionRW from './screens/QuestionRW';
import QuestionMath from './screens/QuestionMath';
import ScoreReport from './screens/ScoreReport';
import Review from './screens/Review';
import ExamBreak from './screens/ExamBreak';
import ExamReport from './screens/ExamReport';
import CategoryDetail from './screens/CategoryDetail';
import SessionDetail from './screens/SessionDetail';
import TestReview from './screens/TestReview';
import Settings from './screens/Settings';
import PracticeHub from './screens/practice/PracticeHub';
import ProgressHub from './screens/progress/ProgressHub';
import PlanHub from './screens/plan/PlanHub';
import TutorHub from './screens/tutor-hub/TutorHub';
import { useNavigation, NavProvider } from './session/Navigation';
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

// App — top-level shell. Sidebar + screen router + tutor pane.

// Screen ids from before the IA consolidation → [new screen, params]. Every old
// go('<id>') call keeps working and lands on the consolidated screen.
const ALIASES = {
  'practice-setup': ['practice', { tab: 'drill' }],
  'question-bank': ['practice', { tab: 'bank' }],
  'stats': ['progress', { tab: 'overview' }],
  'sessions': ['progress', { tab: 'history' }],
  'practice-modules': ['progress', { tab: 'full', kind: 'modules' }],
  'practice-sections': ['progress', { tab: 'full', kind: 'sections' }],
  'practice-tests': ['progress', { tab: 'full', kind: 'tests' }],
  'student-assignments': ['plan', {}],
  'tutor-assignments': ['plan', {}],
  'tutor-invite': ['tutor', {}],
  'tutor-chat': ['tutor', { tab: 'chat' }],
};

function resolveAlias(view, params) {
  const a = ALIASES[view];
  return a ? [a[0], { ...a[1], ...params }] : [view, params];
}

// Drill-in screens → the sidebar section they live under (also the Back target
// when there's no history, e.g. after a reload).
const PARENT = {
  'session-detail': 'progress',
  'category-detail': 'progress',
  'test-review': 'progress',
  'score-report': 'practice',
  'exam-report': 'practice',
  'exam-break': 'practice',
};

function App() {
  const NS = SixteenNS;
  const { AppShell, Titlebar, Sidebar, IconButton, AccountMenu, StudentSwitcher } = NS;
  const { profile, displayName, email, user, avatarUrl } = useProfile();
  const sessionLive = usePracticeSession();

  const nav = useNavigation(profile ? 'dashboard' : 'onboarding');
  const [view, viewProps] = resolveAlias(nav.view, nav.params);
  // Latest view for async callbacks (fetches, timers) that must not act on a stale one.
  const viewRef = React.useRef(view);
  React.useEffect(() => { viewRef.current = view; }, [view]);
  const { go: navGo, replace: navReplace, reset: navReset } = nav;
  const go = React.useCallback((v, props = {}) => {
    const [target, params] = resolveAlias(v, props);
    navGo(target, params);
  }, [navGo]);
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
          if (typeof window !== 'undefined') window.history.replaceState(window.history.state, '', '/app');
          navReset('dashboard');
        } else if (savedRole.current === 'tutor' && list.length > 0) {
          // Restore the persisted tutor mode (the URL redirect takes precedence).
          setRole('tutor');
          setTutorOn(true);
          const sw = savedWatch.current;
          setWatchedStudentId(
            sw && list.some((s) => s.id === sw) ? sw : (list.length === 1 ? list[0].id : null),
          );
          if (viewRef.current === 'onboarding') navReset('dashboard');
        }
      })
      .catch(() => {})
      .finally(() => { hydrated.current = true; });
  }, [navReset]);

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
      const t = setTimeout(() => navGo('live-session'), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      wasLive.current = false;
      if (viewRef.current === 'live-session') navReplace('dashboard');
    }, 600);
    return () => clearTimeout(t);
  }, [watchedIsLive, navGo, navReplace]);

  // Follow the student into a completed session they open, so teaching mode has
  // the same questions on both screens. Only moves the tutor when the student
  // switches sessions — the tutor can still browse away freely afterwards.
  const lastReviewRef = React.useRef(null);
  const tutorWatching = role === 'tutor' && !!watchedStudentId;
  React.useEffect(() => {
    if (!tutorWatching || !watchedReviewSessionId) { lastReviewRef.current = null; return undefined; }
    if (lastReviewRef.current === watchedReviewSessionId) return undefined;
    lastReviewRef.current = watchedReviewSessionId;
    const t = setTimeout(() => navGo('session-detail', { id: watchedReviewSessionId }), 0);
    return () => clearTimeout(t);
  }, [tutorWatching, watchedReviewSessionId, navGo]);

  // Entering tutor view auto-opens the chat with the student; with one student
  // we auto-select them, otherwise the sidebar switcher decides. Switching
  // perspective starts from Home, since every screen's data changes.
  const switchRole = (r) => {
    setRole(r);
    setTutorOn(r === 'tutor');
    if (r === 'tutor') {
      setWatchedStudentId((cur) => cur || (students.length === 1 ? students[0].id : null));
    } else {
      setWatchedStudentId(null);
    }
    navReset('dashboard');
  };

  // Join a live student from the banner — switches into tutor view watching them.
  const joinStudent = (id) => {
    setWatchedStudentId(id);
    setRole('tutor');
    setTutorOn(true);
    if (view === 'onboarding') navReset('dashboard');
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

  const I = (n) => React.createElement(Icon, { name: n, size: 17 });

  const onboarding = view === 'onboarding';

  // Dev seeding tab — visible only to allowlisted accounts (same list the
  // /api/dev/seed route enforces server-side). Unset env ⇒ hidden everywhere.
  const devEmails = (process.env.NEXT_PUBLIC_DEV_SEED_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const devEnabled = !!email && devEmails.includes(email.toLowerCase());

  const reviewDue = reviewQueue?.count ? reviewQueue.count : 0;
  const sidebarItems = isTutor
    ? [
        ...(watchedIsLive ? [{ id: 'live-session', label: 'Live now', icon: I('radio'), live: true }] : []),
        { id: 'dashboard', label: 'Home', icon: I('house') },
        { id: 'progress', label: 'Progress', icon: I('chart-line') },
        { id: 'review', label: 'Review', icon: I('rotate-ccw'), badge: reviewDue || undefined },
        { id: 'plan', label: 'Plan & assign', icon: I('calendar-check') },
      ]
    : [
        { id: 'dashboard', label: 'Home', icon: I('house') },
        { id: 'practice', label: 'Practice', icon: I('circle-play') },
        { id: 'review', label: 'Review', icon: I('rotate-ccw'), badge: reviewDue || undefined },
        { id: 'plan', label: 'Plan', icon: I('calendar-check') },
        { id: 'progress', label: 'Progress', icon: I('chart-line') },
        { id: 'vocabulary', label: 'Vocabulary', icon: I('book-a'), group: 'Study tools' },
        { id: 'tutor', label: 'Tutor', icon: I('message-circle'), dot: tutorUnread, group: 'Study tools' },
      ];
  const allSidebarItems = devEnabled
    ? [...sidebarItems, { id: 'dev', label: 'Developer', icon: I('wrench'), group: 'Developer' }]
    : sidebarItems;
  const sidebarId = PARENT[view] || view;

  const accountMenu = (
    <AccountMenu
      name={displayName}
      email={email}
      avatarUrl={avatarUrl}
      role={role}
      canTutor={canTutor}
      onSwitchRole={switchRole}
      theme={theme}
      onTheme={setTheme}
      onSettings={() => go('settings')}
    />
  );

  const sidebar = (
    <Sidebar
      items={allSidebarItems}
      activeId={sidebarId}
      onSelect={(id) => navReset(id)}
      header={isTutor ? (
        <StudentSwitcher
          students={students}
          value={watchedStudentId}
          onChange={(id) => { setWatchedStudentId(id); navReset('dashboard'); }}
          live={tutorWatch.liveStudents}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 6px' }}>
          <img src="/assets/app-icon.svg" width="22" height="22" alt="" style={{ borderRadius: 6 }} />
          <span style={{ font: 'var(--role-title-sm)', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Strix</span>
        </div>
      )}
      footer={accountMenu}
    />
  );

  // Toolbar: back (when there's somewhere to go back to), the page title, and
  // the tutor/chat toggle.
  const isDrillIn = !!PARENT[view] && !inModule;
  const showBack = !onboarding && !inModule && (nav.canGoBack || isDrillIn);
  const titlebar = (
    <Titlebar
      inset={onboarding || inModule}
      title={titleFor(view, viewProps)}
      crumb={isTutor && watchedStudentId ? watchedName : (isDrillIn ? titleFor(PARENT[view], {}) : null)}
      onBack={showBack ? () => nav.back(PARENT[view] || 'dashboard') : null}
      trailing={!onboarding && (
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton
            size="sm"
            active={tutorOn}
            label={tutorOn ? (isTutor ? 'Hide chat' : 'Hide tutor') : (isTutor ? 'Show chat' : 'Show tutor')}
            onClick={() => setTutorOn(!tutorOn)}
          >
            <Icon name="panel-right" size={16} />
          </IconButton>
          {tutorUnread && !tutorOn && (
            <span style={{
              position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%',
              background: 'var(--brand-blue)', boxShadow: '0 0 0 2px var(--surface-titlebar)',
              pointerEvents: 'none',
            }} />
          )}
        </span>
      )}
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
    case 'practice':        screen = <PracticeHub key={viewProps.tab} go={go} params={viewProps} {...watchProps} />; break;
    case 'progress':        screen = <ProgressHub go={go} params={viewProps} {...watchProps} />; break;
    case 'plan':            screen = <PlanHub go={go} role={role} {...watchProps} />; break;
    case 'tutor':           screen = <TutorHub go={go} params={viewProps} />; break;
    case 'vocabulary':      screen = <Vocabulary />; break;
    case 'rw-question':     screen = <QuestionRW key={sessionLive.activeModule?.key || 'rw'} go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'math-question':   screen = <QuestionMath key={sessionLive.activeModule?.key || 'math'} go={go} tutorOn={tutorOn} setTutorOn={setTutorOn} statsOn={statsOn} setStatsOn={setStatsOn} kind={viewProps.kind || 'drill'} role={role} />; break;
    case 'score-report':    screen = <ScoreReport go={go} />; break;
    case 'review':          screen = <Review go={go} {...watchProps} />; break;
    case 'exam-break':      screen = <ExamBreak go={go} />; break;
    case 'exam-report':     screen = <ExamReport go={go} />; break;
    case 'category-detail': screen = <CategoryDetail go={go} section={viewProps.section} domain={viewProps.domain} label={viewProps.label} {...watchProps} />; break;
    case 'session-detail':  screen = <SessionDetail go={go} id={viewProps.id} {...watchProps} />; break;
    case 'test-review':     screen = <TestReview go={go} rwId={viewProps.rwId} mathId={viewProps.mathId} {...watchProps} />; break;
    case 'live-session':    screen = <LiveTestView live={tutorWatch.watchedLive} studentName={watchedName} />; break;
    case 'settings':        screen = <Settings go={go} theme={theme} setTheme={setTheme} />; break;
    case 'dev':             screen = devEnabled ? <DevTab go={go} /> : <Dashboard go={go} />; break;
    default:                screen = <Dashboard go={go} />;
  }

  const navValue = { ...nav, view, params: viewProps, go };

  if (onboarding) {
    return (
      <NavProvider value={navValue}>
        <AppShell titlebar={titlebar} sidebar={null} variant="app">
          {screen}
        </AppShell>
      </NavProvider>
    );
  }

  // While tutoring: prompt to pick a student if none is selected; otherwise the
  // live mirror is a normal routed screen ('live-session'), so Progress/Home
  // stay freely browsable while the student practices.
  let mainContent = screen;
  if (isTutor && !watchedStudentId && view !== 'settings') {
    mainContent = <PickStudentPrompt students={students} onPick={setWatchedStudentId} />;
  }

  // Chat for the tutor pane: tutor↔watched-student when tutoring, else our own
  // tutor chat as the student.
  const chat = isTutor
    ? { messages: tutorWatch.messages, onSend: tutorWatch.sendChat, peerName: watchedName, peerTyping: tutorWatch.peerTyping, onTyping: tutorWatch.notifyTyping, peerOnline: !!tutorWatch.onlineStudents[watchedStudentId] || !!tutorWatch.liveStudents[watchedStudentId]?.active }
    : { messages: studentLive.messages, onSend: studentLive.sendChat, peerName: null, peerTyping: studentLive.peerTyping, onTyping: studentLive.notifyTyping, peerOnline: studentLive.peerOnline };

  return (
    <NavProvider value={navValue}>
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
    </NavProvider>
  );
}

// Quiet marker so the student knows the pointer on their screen is their tutor's.
function TeachingChip({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 70,
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px',
      background: 'var(--surface-popover)', border: '1px solid var(--border-1)', borderRadius: 999,
      boxShadow: 'var(--shadow-md)', font: 'var(--role-label)', color: 'var(--text-secondary)',
      pointerEvents: 'none',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} />
      Your tutor is pointing at your screen
    </div>
  );
}

// Shown to a tutor with several students before they pick one to watch.
function PickStudentPrompt({ students, onPick }) {
  const { EmptyState, List, ListRow, Avatar } = SixteenNS;
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <EmptyState
          icon="users"
          title="Choose a student"
          body="You'll see their progress here, and their live question when they start practicing."
        />
        <List>
          {students.map((s) => (
            <ListRow
              key={s.id}
              leading={<Avatar name={s.name} size="sm" />}
              title={s.name}
              onClick={() => onPick(s.id)}
            />
          ))}
        </List>
      </div>
    </div>
  );
}

const TITLES = {
  'onboarding': '',
  'dashboard': 'Home',
  'practice': 'Practice',
  'progress': 'Progress',
  'plan': 'Plan',
  'review': 'Review',
  'tutor': 'Tutor',
  'vocabulary': 'Vocabulary',
  'rw-question': 'Reading & Writing',
  'math-question': 'Math',
  'score-report': 'Results',
  'exam-break': 'Break',
  'exam-report': 'Full SAT results',
  'session-detail': 'Session',
  'test-review': 'Full SAT review',
  'live-session': 'Live now',
  'settings': 'Settings',
  'dev': 'Developer',
};

function titleFor(view, params) {
  if (view === 'category-detail') return params.label || 'Skill';
  return TITLES[view] ?? 'Strix';
}

export default App;
