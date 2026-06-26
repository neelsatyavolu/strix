'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { aiAsk, aiConnect, aiStatus, isDesktop, TUTOR_SYSTEM, questionContext } from '@/lib/ai/bridge';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';

// TutorPanel — the right-side tutor sidebar (320px). Human tutor (Phase 3 via
// Supabase Realtime) or AI tutor powered by the user's OWN ChatGPT/Grok
// subscription (Electron bridge). The AI toggle only appears in drills.

function TutorPanel({ onClose, allowAI = true, role = 'student' }) {
  const { MessageBubble, ChatComposer, IconButton, SegmentedControl, TutorPresence, Avatar } = SixteenNS;
  const isTutor = role === 'tutor';
  const aiAllowed = allowAI && !isTutor;
  const session = usePracticeSession();
  const { user, displayName } = useProfile();
  const desktop = isDesktop();
  const channelRef = React.useRef(null);
  const [tutorName, setTutorName] = React.useState('your tutor');

  React.useEffect(() => {
    if (isTutor) return;
    fetch('/api/tutor/invite').then((r) => r.json()).then((j) => {
      const t = j?.data?.tutors?.[0];
      const p = t && (Array.isArray(t.profiles) ? t.profiles[0] : t.profiles);
      if (p?.full_name) setTutorName(p.full_name);
    }).catch(() => {});
  }, [isTutor]);

  const flip = (m) => (isTutor ? { ...m, side: m.side === 'mine' ? 'theirs' : 'mine' } : m);

  const [mode, setMode] = React.useState('ai'); // 'human' | 'ai'
  const [aiProvider, setAiProvider] = React.useState('chatgpt'); // 'chatgpt' | 'grok'
  const [aiModel, setAiModel] = React.useState('gpt-5.5');
  const [showModelPicker, setShowModelPicker] = React.useState(false);
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  const [thinking, setThinking] = React.useState(false);

  const [humanMessages, setHumanMessages] = React.useState([]);
  const [aiMessages, setAiMessages] = React.useState([
    { id: 'a1', side: 'theirs', text: "Hi, I'm your AI tutor. Stuck on something? Tell me what you're thinking and I'll help you reason through it.", time: 'now' },
  ]);
  const messages = mode === 'human' ? humanMessages : aiMessages;
  const setMessages = mode === 'human' ? setHumanMessages : setAiMessages;

  const [draft, setDraft] = React.useState('');
  const streamRef = React.useRef(null);

  const MODELS = {
    chatgpt: [
      { value: 'gpt-5.5', label: 'GPT-5.5' },
      { value: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
    ],
    grok: [{ value: 'grok-4.3', label: 'Grok 4.3' }],
  };
  React.useEffect(() => { setAiModel(MODELS[aiProvider][0].value); /* eslint-disable-next-line */ }, [aiProvider]);
  React.useEffect(() => { if (mode === 'ai') aiStatus().then(setConnected); }, [mode, aiProvider]);
  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, mode, thinking]);

  // Student side of live human tutoring: open the realtime channel, load chat
  // history, and relay incoming tutor messages.
  React.useEffect(() => {
    if (isTutor || mode !== 'human' || !user?.id) return;
    let ch;
    loadMessages(user.id).then((msgs) =>
      setHumanMessages(msgs.map((m) => ({ id: m.id, side: m.sender_id === user.id ? 'mine' : 'theirs', text: m.body, time: '' }))),
    );
    ch = openTutorChannel({
      studentId: user.id,
      userId: user.id,
      role: 'student',
      onChat: (m) => setHumanMessages((prev) => [...prev, { id: m.id, side: m.sender_id === user.id ? 'mine' : 'theirs', text: m.body, time: '' }]),
    });
    channelRef.current = ch;
    return () => { ch?.close(); channelRef.current = null; };
  }, [mode, isTutor, user?.id]);

  // Broadcast the current question so a watching tutor sees what we're on.
  React.useEffect(() => {
    if (isTutor || mode !== 'human' || !channelRef.current) return;
    const q = session.current;
    if (!q) return;
    channelRef.current.sendSession({
      index: session.index,
      total: session.questions.length,
      section: q.section,
      domainLabel: q.domainLabel,
      stemHtml: q.stemHtml,
      stimulusHtml: q.stimulusHtml,
      choices: q.choices,
      selected: session.responses[q.id]?.value || null,
    });
  }, [mode, isTutor, session.current, session.index, session.responses]);

  const providerLabel = aiProvider === 'chatgpt' ? 'ChatGPT' : 'Grok';
  const providerKey = aiProvider === 'chatgpt' ? 'codex' : 'grok';
  const connectedNow = connected[providerKey];
  const aiName = `AI · ${MODELS[aiProvider].find((m) => m.value === aiModel)?.label || providerLabel}`;

  const refreshStatus = async () => setConnected(await aiStatus());
  const onConnect = async () => {
    try {
      await aiConnect(aiProvider);
      await refreshStatus();
    } catch (e) {
      setMessages((prev) => [...prev, { id: Date.now(), side: 'theirs', text: e.message || 'Connection failed.', time: 'now' }]);
    }
  };

  const send = async (text) => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, side: isTutor ? 'theirs' : 'mine', text, time: 'now' }]);
    setDraft('');
    if (isTutor) return;
    if (mode === 'human') {
      if (!user?.id) return;
      const saved = await saveMessage({ studentId: user.id, senderId: user.id, role: 'student', body: text });
      channelRef.current?.sendChat(saved || { id: String(id), sender_id: user.id, role: 'student', body: text });
      return;
    }

    if (!desktop || !connectedNow) {
      setMessages((prev) => [...prev, {
        id: id + 1, side: 'theirs',
        text: !desktop ? 'The AI tutor runs in the Proctorly desktop app.' : `Connect your ${providerLabel} account above to start.`,
        time: 'now',
      }]);
      return;
    }

    setThinking(true);
    try {
      const history = aiMessages.map((m) => ({ role: m.side === 'mine' ? 'user' : 'assistant', content: m.text }));
      const sel = session.current ? session.responses[session.current.id]?.value : null;
      const ctx = questionContext(session.current, sel);
      const res = await aiAsk({
        provider: aiProvider,
        model: aiModel,
        system: TUTOR_SYSTEM + (ctx ? '\n\n' + ctx : ''),
        messages: [...history, { role: 'user', content: text }],
      });
      const reply = res?.ok ? res.text : `Couldn't reach ${providerLabel}: ${res?.error || 'unknown error'}`;
      setMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: reply, time: 'now' }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: e.message || 'AI request failed.', time: 'now' }]);
    } finally {
      setThinking(false);
    }
  };

  const showComposer = isTutor || mode === 'human' || (desktop && connectedNow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 14px 0',
        background: 'var(--surface-titlebar)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 26, paddingBottom: isTutor ? 10 : 0 }}>
          {isTutor
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <Avatar name={displayName} size="sm" presence="online" />
                <span style={{ font: 'var(--role-label)', fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'var(--role-caption)', color: 'var(--success)', marginLeft: 2 }}>
                  <Icon name="eye" style={{ width: 12, height: 12 }} /> watching
                </span>
              </div>
            : (mode === 'human'
              ? <TutorPresence name={tutorName} status="online" watching />
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: connectedNow ? 'var(--brand-blue)' : 'var(--text-tertiary)' }} />
                  <span style={{ font: 'var(--role-label)', color: 'var(--text-primary)' }}>{aiName}</span>
                </div>)}
          <IconButton size="sm" variant="ghost" label={isTutor ? 'Leave tutor view' : 'Close tutor'} onClick={onClose}>
            <Icon name="x" style={{ width: 14, height: 14 }} />
          </IconButton>
        </div>

        {aiAllowed && (
          <div style={{ padding: '8px 0 10px' }}>
            <SegmentedControl
              value={mode} onChange={setMode} fullWidth size="sm"
              options={[{ value: 'human', label: tutorName === 'your tutor' ? 'Tutor' : `Tutor · ${tutorName.split(' ')[0]}` }, { value: 'ai', label: 'AI tutor' }]}
            />
          </div>
        )}

        {!isTutor && mode === 'ai' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 10px', gap: 8, position: 'relative' }}>
            <SegmentedControl
              value={aiProvider} onChange={setAiProvider} size="sm"
              options={[{ value: 'chatgpt', label: 'ChatGPT' }, { value: 'grok', label: 'Grok' }]}
            />
            <button onClick={() => setShowModelPicker((p) => !p)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
              background: 'var(--sunken)', border: 0, borderRadius: 'var(--radius-md)',
              font: 'var(--role-caption)', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {MODELS[aiProvider].find((m) => m.value === aiModel)?.label}
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>▾</span>
            </button>
            {showModelPicker && (
              <div style={{ position: 'absolute', right: 0, top: 30, zIndex: 30, background: 'var(--paper)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 4, minWidth: 160 }}>
                {MODELS[aiProvider].map((m) => (
                  <button key={m.value} onClick={() => { setAiModel(m.value); setShowModelPicker(false); }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    padding: '6px 10px', background: 'transparent', border: 0, cursor: 'pointer',
                    font: 'var(--role-body)', color: 'var(--text-primary)', borderRadius: 4, textAlign: 'left',
                  }}>
                    {m.label}
                    {m.value === aiModel && <Icon name="check" style={{ width: 14, height: 14, color: 'var(--brand-blue)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={streamRef} style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--paper)' }}>
        {messages.map((m) => { const fm = flip(m); return <MessageBubble key={m.id} side={fm.side} text={fm.text} time={fm.time} />; })}
        {thinking && <MessageBubble side="theirs" text="…" time="now" />}
      </div>

      {showComposer ? (
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder={isTutor ? `Message ${displayName.split(' ')[0]}` : (mode === 'human' ? `Message ${tutorName.split(' ')[0]}` : `Ask ${providerLabel}`)}
        />
      ) : (
        <AiConnect desktop={desktop} providerLabel={providerLabel} onConnect={onConnect} />
      )}
    </div>
  );
}

function AiConnect({ desktop, providerLabel, onConnect }) {
  const { Button } = SixteenNS;
  return (
    <div style={{ padding: 14, borderTop: '1px solid var(--border-1)', background: 'var(--surface-sidebar)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {desktop
          ? `Connect your own ${providerLabel} account to tutor with it. Proctorly uses your subscription — nothing extra to pay.`
          : 'The AI tutor runs in the Proctorly desktop app.'}
      </span>
      {desktop && (
        <Button variant="primary" fullWidth onClick={onConnect}>
          Connect {providerLabel}
        </Button>
      )}
    </div>
  );
}

export default TutorPanel;
