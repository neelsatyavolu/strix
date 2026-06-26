// TutorPanel — the right-side tutor sidebar (320px). Header with presence,
// optional "viewing" indicator card, message stream, composer.
//
// In drill ("general practice") mode, the user can flip between a HUMAN
// tutor and an AI tutor (with a model picker). In module/section mode the
// AI toggle is hidden — only the human tutor is available there.

function TutorPanel({ onClose, allowAI = true, role = 'student' }) {
  const { MessageBubble, ChatComposer, IconButton, Badge, SegmentedControl, TutorPresence, Select, Avatar } = window.SixteenDesignSystem_375889;
  const data = window.SixteenData;
  const isTutor = role === 'tutor';
  const aiAllowed = allowAI && !isTutor;

  // From the tutor's seat, the student's messages are "theirs" and the
  // tutor's own messages are "mine" — flip the stored student-perspective log.
  const flip = (m) => isTutor ? { ...m, side: m.side === 'mine' ? 'theirs' : 'mine' } : m;

  const [mode, setMode] = React.useState('human');  // 'human' | 'ai'
  const [aiProvider, setAiProvider] = React.useState('chatgpt'); // 'chatgpt' | 'grok'
  const [aiModel, setAiModel] = React.useState('gpt-5');
  const [showModelPicker, setShowModelPicker] = React.useState(false);

  const [humanMessages, setHumanMessages] = React.useState(data.chat);
  const [aiMessages, setAiMessages] = React.useState([
    { id: 'a1', side: 'theirs', text: "Hi, I'm your AI tutor. Want me to walk you through the question you're stuck on?", time: 'now' },
  ]);
  const messages = mode === 'human' ? humanMessages : aiMessages;
  const setMessages = mode === 'human' ? setHumanMessages : setAiMessages;

  const [draft, setDraft] = React.useState('');
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, mode]);

  const send = (text) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, side: isTutor ? 'theirs' : 'mine', text, time: 'now' }]);
    setDraft('');
    if (isTutor) return;   // student waiting on a real tutor — no auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: id + 1, side: 'theirs',
        text: mode === 'human'
          ? "Got it — let me know if you want me to walk through that one."
          : `(${aiModel}) Try identifying the antecedent of "she" first — what does Vesta actually conclude?`,
        time: 'now',
      }]);
    }, 900);
  };

  // Model options per provider
  const MODELS = {
    chatgpt: [
      { value: 'gpt-5.5',       label: 'GPT-5.5' },
      { value: 'gpt-5.4-mini',  label: 'GPT-5.4 mini' },
    ],
    grok: [
      { value: 'grok-4.3',      label: 'Grok 4.3' },
    ],
  };
  // when provider flips, snap to that provider's first model
  React.useEffect(() => {
    setAiModel(MODELS[aiProvider][0].value);
  }, [aiProvider]);

  const providerLabel = aiProvider === 'chatgpt' ? 'ChatGPT' : 'Grok';
  const aiName = `AI · ${MODELS[aiProvider].find(m => m.value === aiModel)?.label || providerLabel}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 0',
        background: 'var(--surface-titlebar)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', minHeight: 26, paddingBottom: isTutor ? 10 : 0}}>
          {isTutor
            ? <div style={{display:'flex', alignItems:'center', gap: 8, flex: 1, minWidth: 0}}>
                <Avatar name="Maya Patel" size="sm" presence="online" />
                <span style={{font:'var(--role-label)', fontWeight: 600, color:'var(--text-primary)'}}>Maya Patel</span>
                <span style={{display:'inline-flex', alignItems:'center', gap:4, font:'var(--role-caption)', color:'var(--success)', marginLeft: 2}}>
                  <i data-lucide="eye" style={{width:12, height:12}}/> watching
                </span>
              </div>
            : (mode === 'human'
              ? <TutorPresence name={data.tutor.name} status="online" watching />
              : <div style={{display:'flex', alignItems:'center', gap: 8}}>
                  <span style={{width:8, height:8, borderRadius:'50%', background:'var(--brand-blue)'}}/>
                  <span style={{font:'var(--role-label)', color:'var(--text-primary)'}}>{aiName}</span>
                </div>)}
          <IconButton size="sm" variant="ghost" label={isTutor ? 'Leave tutor view' : 'Close tutor'} onClick={onClose}>
            <i data-lucide="x" style={{width:14, height:14}} />
          </IconButton>
        </div>

        {/* Mode switch — only when allowed (drills only, student side) */}
        {aiAllowed && (
          <div style={{padding: '8px 0 10px'}}>
            <SegmentedControl
              value={mode} onChange={setMode} fullWidth size="sm"
              options={[
                { value:'human', label:'Tutor · Rachel' },
                { value:'ai',    label:'AI tutor' },
              ]}
            />
          </div>
        )}

        {/* AI model row */}
        {!isTutor && mode === 'ai' && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding: '0 0 10px', gap: 8,
          }}>
            <SegmentedControl
              value={aiProvider} onChange={setAiProvider} size="sm"
              options={[
                { value:'chatgpt', label:'ChatGPT' },
                { value:'grok',    label:'Grok' },
              ]}
            />
            <button onClick={() => setShowModelPicker(p => !p)} style={{
              display:'inline-flex', alignItems:'center', gap: 4,
              padding: '3px 8px',
              background:'var(--sunken)',
              border: 0, borderRadius:'var(--radius-md)',
              font:'var(--role-caption)', fontWeight: 500,
              color:'var(--text-primary)', cursor:'pointer',
              whiteSpace:'nowrap',
            }}>
              {MODELS[aiProvider].find(m => m.value === aiModel)?.label}
              <span style={{fontSize: 9, color:'var(--text-tertiary)'}}>▾</span>
            </button>
            {showModelPicker && (
              <div style={{
                position:'absolute', right: 14, marginTop: 28, zIndex: 30,
                background:'var(--paper)', borderRadius:'var(--radius-md)',
                boxShadow:'var(--shadow-md)', padding: 4, minWidth: 160,
              }}>
                {MODELS[aiProvider].map(m => (
                  <button key={m.value} onClick={() => { setAiModel(m.value); setShowModelPicker(false); }} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
                    padding: '6px 10px', background:'transparent', border:0, cursor:'pointer',
                    font:'var(--role-body)', color:'var(--text-primary)', borderRadius: 4, textAlign:'left',
                  }}>
                    {m.label}
                    {m.value === aiModel && <i data-lucide="check" style={{width:14, height:14, color:'var(--brand-blue)'}}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* status strip removed — header presence already conveys watching/LIVE */}

      <div ref={streamRef} style={{ flex:1, overflow:'auto', padding: 14, display:'flex', flexDirection:'column', gap: 8, background:'var(--paper)' }}>
        {messages.map(m => { const fm = flip(m); return (
          <MessageBubble key={m.id} side={fm.side} text={fm.text} time={fm.time} />
        ); })}
      </div>
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSend={send}
        placeholder={isTutor ? 'Message Maya' : (mode === 'human' ? `Message ${data.tutor.name.split(' ')[0]}` : `Ask ${providerLabel}`)}
      />
    </div>
  );
}

window.TutorPanel = TutorPanel;
