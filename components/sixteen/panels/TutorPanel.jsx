'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { aiAsk, aiConnect, aiSubmitCode, aiCancelConnect, aiStatus, isDesktop, TUTOR_SYSTEM, questionContext, statsContext, historyContext, historyResultText, parseHistoryCall, stripHistoryMarker } from '@/lib/ai/bridge';
import { useStats, useHistory, fetchHistory } from '@/lib/data/hooks';

// TutorPanel — the right-side tutor sidebar (320px). The live chat (human tutor
// ↔ student) is owned by the parent via Supabase Realtime and passed in as
// `messages`/`onSend`; the AI tutor (the user's OWN ChatGPT/Grok subscription
// via the Electron bridge) is local. The AI toggle only appears in drills.

function TutorPanel({ onClose, allowAI = true, role = 'student', selfId, messages: liveMessages = [], onSend: onLiveSend, peerName }) {
  const { MessageBubble, ThinkingBubble, ChatComposer, IconButton, SegmentedControl, TutorPresence, Avatar } = SixteenNS;
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
  const [aiProvider, setAiProvider] = React.useState('chatgpt'); // 'chatgpt' | 'grok'
  const [aiModel, setAiModel] = React.useState('gpt-5.5');
  const [showModelPicker, setShowModelPicker] = React.useState(false);
  const [connected, setConnected] = React.useState({ codex: false, grok: false });
  const [thinking, setThinking] = React.useState(false);

  // AI connection flow (browser sign-in + optional code paste, like Settings).
  const [aiConnecting, setAiConnecting] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteVal, setPasteVal] = React.useState('');
  const [connectError, setConnectError] = React.useState('');

  const [aiMessages, setAiMessages] = React.useState([
    { id: 'a1', side: 'theirs', text: "Hi, I'm your AI tutor. Stuck on something? Tell me what you're thinking and I'll help you reason through it.", time: 'now' },
  ]);

  // The live (human↔student) thread is owned by the parent; map raw rows to
  // bubble shape, with "mine" relative to whoever is signed in here.
  const liveDisplay = React.useMemo(
    () => (liveMessages || []).map((m) => ({ id: m.id, side: m.sender_id === selfId ? 'mine' : 'theirs', text: m.body, time: '' })),
    [liveMessages, selfId],
  );
  const liveMode = isTutor || mode === 'human';
  const messages = liveMode ? liveDisplay : aiMessages;

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
  // Reset any in-flight connect UI when the target provider or mode changes.
  React.useEffect(() => { setPasteOpen(false); setAiConnecting(false); setConnectError(''); }, [aiProvider, mode]);
  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, mode, thinking]);

  const providerLabel = aiProvider === 'chatgpt' ? 'ChatGPT' : 'Grok';
  const providerKey = aiProvider === 'chatgpt' ? 'codex' : 'grok';
  const connectedNow = connected[providerKey];
  const aiName = `AI · ${MODELS[aiProvider].find((m) => m.value === aiModel)?.label || providerLabel}`;

  const refreshStatus = async () => setConnected(await aiStatus());

  // Open the provider's sign-in. The loopback may finish it automatically, or
  // the user pastes the code their browser shows (x.ai's Grok flow does this).
  const onConnect = () => {
    setAiConnecting(true);
    setConnectError('');
    setPasteVal('');
    setPasteOpen(true);
    aiConnect(aiProvider)
      .then(async (res) => {
        if (res && res.ok === false) {
          const s = await aiStatus();
          if (!s[providerKey] && res.error && res.error !== 'Connection was cancelled.') {
            setConnectError(res.error);
          }
        }
        await refreshStatus();
      })
      .catch((e) => setConnectError(e?.message || 'Connection failed.'))
      .finally(() => { setAiConnecting(false); setPasteOpen(false); });
  };

  const onSubmitCode = async () => {
    const code = pasteVal.trim();
    if (!code) return;
    setAiConnecting(true);
    setConnectError('');
    try {
      const res = await aiSubmitCode(aiProvider, code);
      if (res && res.ok === false) throw new Error(res.error || 'That code did not work.');
      await refreshStatus();
      setPasteOpen(false);
    } catch (e) {
      setConnectError(e?.message || 'That code did not work.');
      setAiConnecting(false);
    }
  };

  const onCancelConnect = () => {
    setPasteOpen(false);
    setAiConnecting(false);
    aiCancelConnect(aiProvider).catch(() => {});
  };

  const send = async (text) => {
    const id = Date.now();
    setDraft('');
    // Live thread (human tutor ↔ student): the parent owns send + optimistic UI.
    if (liveMode) { onLiveSend?.(text); return; }

    setAiMessages((prev) => [...prev, { id, side: 'mine', text, time: 'now' }]);

    if (!desktop || !connectedNow) {
      setAiMessages((prev) => [...prev, {
        id: id + 1, side: 'theirs',
        text: !desktop ? 'The AI tutor runs in the Strix desktop app.' : `Connect your ${providerLabel} account above to start.`,
        time: 'now',
      }]);
      return;
    }

    setThinking(true);
    try {
      const history = aiMessages.map((m) => ({ role: m.side === 'mine' ? 'user' : 'assistant', content: m.text }));
      const sel = session.current ? session.responses[session.current.id]?.value : null;
      const ctx = questionContext(session.current, sel);
      const today = `Today's date is ${new Date().toISOString().slice(0, 10)}.`;
      const perf = statsContext(stats);
      const hist = historyContext(attempts);
      const system = [TUTOR_SYSTEM, today, perf, hist, ctx].filter(Boolean).join('\n\n');

      // Agentic loop: the model can request history lookups (any scope) which we
      // run client-side and feed back, until it answers or we hit the hop cap.
      const MAX_HOPS = 3;
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
      setAiMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: reply, time: 'now' }]);
    } catch (e) {
      setAiMessages((prev) => [...prev, { id: id + 1, side: 'theirs', text: e.message || 'AI request failed.', time: 'now' }]);
    } finally {
      setThinking(false);
    }
  };

  const showComposer = isTutor || mode === 'human' || (desktop && connectedNow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        position: 'relative',
        zIndex: 'var(--z-titlebar)',
        padding: '10px 14px 0',
        background: 'var(--surface-titlebar)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 26, paddingBottom: isTutor ? 10 : 0 }}>
          {isTutor
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <Avatar name={peerName || 'Student'} size="sm" presence="online" />
                <span style={{ font: 'var(--role-label)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peerName || 'Student'}</span>
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
        {messages.map((m) => <MessageBubble key={m.id} side={m.side} text={m.text} time={m.time} />)}
        {thinking && <ThinkingBubble />}
      </div>

      {showComposer ? (
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder={isTutor ? `Message ${String(peerName || 'student').split(' ')[0]}` : (mode === 'human' ? `Message ${tutorName.split(' ')[0]}` : `Ask ${providerLabel}`)}
        />
      ) : (
        <AiConnect
          desktop={desktop}
          providerLabel={providerLabel}
          onConnect={onConnect}
          busy={aiConnecting}
          pasteOpen={pasteOpen}
          pasteVal={pasteVal}
          onPasteChange={setPasteVal}
          onSubmitCode={onSubmitCode}
          onCancelConnect={onCancelConnect}
          error={connectError}
        />
      )}
    </div>
  );
}

function AiConnect({ desktop, providerLabel, onConnect, busy, pasteOpen, pasteVal, onPasteChange, onSubmitCode, onCancelConnect, error }) {
  const { Button, Input } = SixteenNS;
  return (
    <div style={{ padding: 14, borderTop: '1px solid var(--border-1)', background: 'var(--surface-sidebar)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ font: 'var(--role-caption)', color: error ? 'var(--error)' : 'var(--text-secondary)', lineHeight: 1.45 }}>
        {!desktop
          ? 'The AI tutor runs in the Strix desktop app.'
          : error
            ? error
            : pasteOpen
              ? `Finish signing in to ${providerLabel} in your browser. If it shows an authorization code, paste it here.`
              : `Connect your own ${providerLabel} account to tutor with it. Strix uses your subscription — nothing extra to pay.`}
      </span>
      {desktop && (pasteOpen ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            value={pasteVal}
            onChange={(e) => onPasteChange(e?.target ? e.target.value : e)}
            placeholder="Paste authorization code"
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmitCode(); }}
            style={{ flex: 1 }}
          />
          <Button variant="primary" size="sm" loading={busy} disabled={busy || !String(pasteVal || '').trim()} onClick={onSubmitCode}>Submit</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onCancelConnect}>Cancel</Button>
        </div>
      ) : (
        <Button variant="primary" fullWidth loading={busy} disabled={busy} onClick={onConnect}>
          Connect {providerLabel}
        </Button>
      ))}
    </div>
  );
}

export default TutorPanel;
