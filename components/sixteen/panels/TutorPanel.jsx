'use client';
import React from 'react';
import { Icon, IconButton, SegmentedControl, Avatar, Button, Select } from '@/components/sixteen';
import { ChatComposer } from '@/components/sixteen/chat/ChatComposer';
import { TutorPresence } from '@/components/sixteen/chat/TutorPresence';
import { ChatThread } from '@/components/sixteen/chat/ChatThread';
import { useAiConnection, CodeEntry, PROVIDER_LABEL, statusKey } from '@/components/sixteen/chat/AiConnect';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { aiAsk, aiStatus, aiModels, isDesktop, TUTOR_SYSTEM, questionContext, statsContext, historyContext, historyResultText, parseHistoryCall, stripHistoryMarker } from '@/lib/ai/bridge';
import { useStats, useHistory, fetchHistory } from '@/lib/data/hooks';
import { useTypingEmitter } from '@/lib/tutor/useTyping';
import s from './TutorPanel.module.css';

// TutorPanel — the right-side tutor sidebar (320px). The live chat (human tutor
// ↔ student) is owned by the parent via Supabase Realtime and passed in as
// `messages`/`onSend`; the AI tutor (the user's OWN ChatGPT/Grok subscription
// via the Electron bridge) is local. The AI tab only appears when `allowAI`
// (drills, never full modules) and never for tutors.

const AI_GREETING = { id: 'a1', side: 'theirs', text: "Hi, I'm your AI tutor. Stuck on something? Tell me what you're thinking and I'll help you reason through it.", time: '' };
const MAX_HOPS = 3;

function TutorPanel({ onClose, allowAI = true, role = 'student', selfId, messages: liveMessages = [], onSend: onLiveSend, peerName, peerTyping = false, peerOnline = false, onTyping }) {
  const isTutor = role === 'tutor';
  const aiAllowed = allowAI && !isTutor;
  const session = usePracticeSession();
  const { stats } = useStats();
  const { attempts } = useHistory(15);
  const desktop = isDesktop();
  const [tutorName, setTutorName] = React.useState('your tutor');

  React.useEffect(() => {
    if (isTutor) return;
    fetch('/api/tutor/invite').then((r) => r.json()).then((j) => {
      const t = j?.data?.tutors?.[0];
      const p = t && (Array.isArray(t.profiles) ? t.profiles[0] : t.profiles);
      if (p?.full_name) setTutorName(p.full_name);
    }).catch(() => {});
  }, [isTutor]);

  const [mode, setMode] = React.useState('ai'); // 'human' | 'ai'
  // Outside drills the AI tutor isn't available, so the pane is the human chat.
  const effMode = aiAllowed ? mode : 'human';
  const [aiProvider, setAiProvider] = React.useState('chatgpt'); // 'chatgpt' | 'grok'
  const [aiModel, setAiModel] = React.useState('gpt-6-astra');
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  const [thinking, setThinking] = React.useState(false);
  const conn = useAiConnection(aiProvider, setConnected, { connectFallback: 'Connection failed.' });
  const [aiMessages, setAiMessages] = React.useState([AI_GREETING]);

  // The live (human↔student) thread is owned by the parent; map raw rows to
  // bubble shape, with "mine" relative to whoever is signed in here.
  // Prefer clientKey for React keys so optimistic→saved id swaps don't remount.
  const liveDisplay = React.useMemo(
    () => (liveMessages || []).map((m) => ({
      id: m.clientKey || m.id,
      side: m.sender_id === selfId ? 'mine' : 'theirs',
      text: m.body,
      time: '',
    })),
    [liveMessages, selfId],
  );
  const liveMode = isTutor || effMode === 'human';
  const messages = liveMode ? liveDisplay : aiMessages;

  const [draft, setDraft] = React.useState('');
  const threadRef = React.useRef(null);

  // Typing indicator only flows on the live (human↔student) thread, not the AI.
  const typing = useTypingEmitter(onTyping);
  const onDraftChange = (v) => {
    setDraft(v);
    if (!liveMode) return;
    if (v.trim()) typing.bump(); else typing.stop();
  };

  const [MODELS, setModels] = React.useState({ chatgpt: [], grok: [] });
  React.useEffect(() => { aiModels().then(setModels).catch(() => {}); }, []);
  React.useEffect(() => {
    const choices = MODELS[aiProvider];
    if (choices.length) setAiModel((current) => (choices.some((m) => m.value === current) ? current : choices[0].value));
  }, [aiProvider, MODELS]);
  React.useEffect(() => { if (effMode === 'ai') aiStatus().then(setConnected); }, [effMode, aiProvider]);

  // Switching provider or tab drops any in-flight connect UI.
  const changeProvider = (p) => { setAiProvider(p); conn.reset(); };
  const changeMode = (m) => { setMode(m); conn.reset(); };

  const providerLabel = PROVIDER_LABEL[aiProvider];
  const connectedNow = connected[statusKey(aiProvider)];
  const modelLabel = MODELS[aiProvider].find((m) => m.value === aiModel)?.label || providerLabel;
  const tutorFirst = tutorName.split(' ')[0];
  const peerFirst = String(peerName || 'student').split(' ')[0];

  const send = async (text) => {
    const id = Date.now();
    threadRef.current?.pin();
    setDraft('');
    // Live thread (human tutor ↔ student): the parent owns send + optimistic UI.
    if (liveMode) { typing.stop(); onLiveSend?.(text); return; }

    setAiMessages((prev) => [...prev, { id, side: 'mine', text, time: '' }]);

    if (!connectedNow) {
      setAiMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: `Connect your ${providerLabel} account below to start.`, time: '' }]);
      return;
    }

    setThinking(true);
    try {
      const history = aiMessages.map((m) => ({ role: m.side === 'mine' ? 'user' : 'assistant', content: m.text }));
      const sel = session.current ? session.responses[session.current.id]?.value : null;
      const ctx = questionContext(session.current, sel);
      const today = `Today's date is ${new Date().toISOString().slice(0, 10)}.`;
      const system = [TUTOR_SYSTEM, today, statsContext(stats), historyContext(attempts), ctx].filter(Boolean).join('\n\n');

      // Agentic loop: the model can request history lookups (any scope) which we
      // run client-side and feed back, until it answers or we hit the hop cap.
      let convo = [...history, { role: 'user', content: text }];
      let reply = '';
      for (let hop = 0; ; hop++) {
        const res = await aiAsk({ provider: aiProvider, model: aiModel, system, messages: convo });
        if (!res?.ok) { reply = `Couldn't reach ${providerLabel}: ${res?.error || 'unknown error'}`; break; }
        const call = hop < MAX_HOPS ? parseHistoryCall(res.text) : null;
        if (!call) { reply = stripHistoryMarker(res.text); break; }
        const rows = await fetchHistory(call);
        convo = [...convo,
          { role: 'assistant', content: res.text },
          { role: 'user', content: historyResultText(rows, call) }];
      }
      setAiMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: reply, time: '' }]);
    } catch (e) {
      setAiMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: e.message || 'AI request failed.', time: '' }]);
    } finally {
      setThinking(false);
    }
  };

  const showComposer = liveMode || connectedNow;
  const placeholder = isTutor ? `Message ${peerFirst}` : (liveMode ? `Message ${tutorFirst}` : `Ask ${providerLabel}`);
  const empty = isTutor
    ? { title: `No messages with ${peerFirst} yet`, body: 'Say hello — it shows up in their tutor pane.' }
    : { title: 'No messages yet', body: tutorName === 'your tutor' ? 'Messages with your tutor show up here.' : `Say hi to ${tutorFirst}. They'll see it right away.` };

  return (
    <div className={s.panel}>
      <header className={s.header}>
        <div className={s.headRow}>
          <div className={s.headMain}>
            {isTutor ? (
              <>
                <Avatar name={peerName || 'Student'} size="sm" presence={peerOnline ? 'online' : 'offline'} />
                <span className={s.headText}>
                  <span className={s.headName}>{peerName || 'Student'}</span>
                  <span className={s.headSub}>{peerOnline ? 'Online now' : 'Offline'}</span>
                </span>
              </>
            ) : liveMode ? (
              <TutorPresence name={tutorName === 'your tutor' ? 'Your tutor' : tutorName} status={peerOnline ? 'online' : 'offline'} />
            ) : (
              <span className={s.aiTitle}>
                <span className={s.aiDot} data-on={connectedNow || undefined} />
                <span className={s.headName}>{modelLabel}</span>
              </span>
            )}
          </div>
          <IconButton size="sm" label={isTutor ? 'Collapse chat' : 'Hide tutor'} onClick={onClose}>
            <Icon name="x" size={14} />
          </IconButton>
        </div>

        {aiAllowed && (
          <SegmentedControl
            value={mode}
            onChange={changeMode}
            fullWidth
            size="sm"
            label="Chat with"
            options={[
              { value: 'human', label: tutorName === 'your tutor' ? 'Tutor' : `Tutor · ${tutorFirst}` },
              { value: 'ai', label: 'AI tutor' },
            ]}
          />
        )}

        {!liveMode && (
          <div className={s.aiControls}>
            <SegmentedControl
              value={aiProvider}
              onChange={changeProvider}
              size="sm"
              label="AI provider"
              options={[{ value: 'chatgpt', label: 'ChatGPT' }, { value: 'grok', label: 'Grok' }]}
            />
            {MODELS[aiProvider].length > 0 && (
              <Select
                size="sm"
                label="Model"
                value={aiModel}
                onChange={setAiModel}
                options={MODELS[aiProvider]}
                className={s.model}
              />
            )}
          </div>
        )}
      </header>

      <ChatThread
        ref={threadRef}
        messages={messages}
        thinking={!liveMode && thinking}
        typing={liveMode && peerTyping}
        empty={empty}
      />

      {showComposer ? (
        <ChatComposer value={draft} onChange={onDraftChange} onSend={send} placeholder={placeholder} />
      ) : (
        <div className={s.connect}>
          {conn.pasteOpen ? (
            <CodeEntry kind={aiProvider} desktop={desktop} conn={conn} />
          ) : (
            <>
              <p className={s.connectText}>
                Connect your own {providerLabel} account to get hints here. Strix uses your subscription — nothing extra to pay.
              </p>
              <Button variant="primary" fullWidth loading={conn.busy} disabled={conn.busy} onClick={conn.connect}>
                Connect {providerLabel}
              </Button>
            </>
          )}
          {conn.error && <p className={s.connectError} role="alert">{conn.error}</p>}
        </div>
      )}
    </div>
  );
}

export default TutorPanel;
