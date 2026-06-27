import {
  LogIn,
  ArrowDownToLine,
  Globe,
  Check,
  House,
  Target,
  ChartLine,
  MessagesSquare,
  Settings,
  Play,
  BookOpen,
  SquareFunction,
  ArrowRight,
  Highlighter,
  Slash,
  Flag,
  Grip,
  GitBranch,
  Gauge,
  Timer,
  Calculator,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ScrollReveal from "./ScrollReveal";
import "./landing.css";

// Where every "enter the app" button goes. /app mounts the same Sixteen SPA the
// Mac app runs — it gates to onboarding (email / Google) or the dashboard.
const ENTER = "/app";

// The hosted Mac build (electron-builder generic publish → strixprep.com/downloads).
const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL || "https://strixprep.com/downloads/Strix-Prep.dmg";

// Accuracy ring — a stroked arc with a centered percentage. Pure SVG so it
// renders on the server (the design source drew this with an inline script).
function Ring({ pct, color = "var(--brand-blue)" }: { pct: number; color?: string }) {
  const r = 15.9155;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-1)" strokeWidth="3.4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ font: "600 9px var(--font-mono)", fill: "var(--ink-1)" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function StrixLanding({ authed }: { authed: boolean }) {
  const enterLabel = authed ? "Go to Dashboard" : "Open the web app";
  const navLabel = authed ? "Go to Dashboard" : "Log in";

  return (
    <>
      {/* Runs before paint: re-enable normal document scrolling (globals.css
          locks <body> to the floating app window used by /app) and apply the
          saved appearance so there's no flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var d=document.documentElement;d.setAttribute('data-page','landing');try{if(localStorage.getItem('strix-landing-theme')==='dark')d.setAttribute('data-theme','dark');}catch(e){}})()",
        }}
      />

      <div className="strix-landing">
        {/* ───────────  NAV  ─────────── */}
        <header className="nav">
          <div className="wrap nav-inner">
            <a className="nav-brand" href="#top" aria-label="Strix Prep">
              <img src="/assets/logo-mark.svg" alt="" />
              <span className="nav-wordmark">
                Strix <span>Prep</span>
              </span>
            </a>
            <nav className="nav-links">
              <a className="nav-link" href="#practice">Practice</a>
              <a className="nav-link" href="#modules">Modules</a>
              <a className="nav-link" href="#test">Test surface</a>
              <a className="nav-link" href="#tutoring">Tutoring</a>
              <a className="nav-link" href="#stats">Stats</a>
            </nav>
            <div className="nav-actions">
              <ThemeToggle />
              <a className="btn btn-ghost" href={ENTER}>
                <LogIn />
                {navLabel}
              </a>
              <a className="btn btn-primary" href={DOWNLOAD_URL}>
                <ArrowDownToLine />
                Download for Mac
              </a>
            </div>
          </div>
        </header>

        <main id="top">
          {/* ───────────  HERO  ─────────── */}
          <section className="hero">
            <div className="wrap">
              <span className="eyebrow">
                <span className="dot" />
                Mac-native · Digital SAT
              </span>
              <h1>Practice the real SAT, the way it&apos;s actually tested.</h1>
              <p className="sub">
                Strix Prep pulls real College Board questions, runs full adaptive modules, and
                scores them on the 400–1600 scale — in a sharp, focused app on your Mac or right in
                your browser.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary btn-lg" href={DOWNLOAD_URL}>
                  <ArrowDownToLine />
                  Download for Mac
                </a>
                <a className="btn btn-secondary btn-lg" href={ENTER}>
                  <Globe />
                  {enterLabel}
                </a>
              </div>
              <div className="hero-note">
                <Check size={14} style={{ color: "var(--success)" }} />
                Free to practice — sign in with email or Google to save progress.
              </div>
            </div>

            {/* macOS app window mockup */}
            <div className="window-stage reveal">
              <div className="win">
                <div className="win-titlebar">
                  <div className="traffic">
                    <i className="r" />
                    <i className="y" />
                    <i className="g" />
                  </div>
                  <div className="win-title">Strix Prep</div>
                </div>
                <div className="win-body">
                  {/* sidebar */}
                  <aside className="sb">
                    <div className="sb-head">
                      <img src="/assets/app-icon.svg" alt="" />
                      <span>Strix Prep</span>
                    </div>
                    <nav className="sb-nav">
                      <div className="sb-item active"><House />Home</div>
                      <div className="sb-item"><Target />Practice</div>
                      <div className="sb-item"><ChartLine />Stats</div>
                      <div className="sb-item"><MessagesSquare />Tutor</div>
                      <div className="sb-item"><Settings />Settings</div>
                    </nav>
                    <div className="sb-foot">
                      <div className="sb-avatar">M</div>
                      <div className="who">
                        Maya R.<small>Target 1500</small>
                      </div>
                    </div>
                  </aside>
                  {/* dashboard */}
                  <div className="dash">
                    <h2>Good evening, Maya.</h2>
                    <p className="greet-sub">You&apos;ve answered 412 questions. Keep the streak going.</p>

                    <div className="card score-card">
                      <div className="score">
                        <span className="num">1410</span>
                        <span className="lab">Estimated total</span>
                      </div>
                      <div className="vrule" />
                      <div className="score">
                        <span className="num sm rw">710</span>
                        <span className="lab">Reading &amp; Writing</span>
                      </div>
                      <div className="score">
                        <span className="num sm math">700</span>
                        <span className="lab">Math</span>
                      </div>
                      <div style={{ flex: 1 }} />
                      <a className="btn btn-primary" href={ENTER}>
                        <Play />
                        New session
                      </a>
                    </div>

                    <div className="dash-grid">
                      <div className="card">
                        <div className="mini-head">
                          <span className="eb">Reading &amp; Writing</span>
                          <span className="badge-dot badge-rw"><i />R&amp;W</span>
                        </div>
                        <div className="ring-row">
                          <Ring pct={78} color="var(--rw-color)" />
                          <div className="ring-stats">
                            <div className="statline"><span className="v">228</span><span className="k">Questions done</span></div>
                            <div className="statline"><span className="v">81%</span><span className="k">Last · Information &amp; Ideas</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="card">
                        <div className="mini-head">
                          <span className="eb">Math</span>
                          <span className="badge-dot badge-math"><i />Math</span>
                        </div>
                        <div className="ring-row">
                          <Ring pct={74} color="var(--math-color)" />
                          <div className="ring-stats">
                            <div className="statline"><span className="v">184</span><span className="k">Questions done</span></div>
                            <div className="statline"><span className="v">76%</span><span className="k">Last · Algebra</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  TRUST STRIP  ─────────── */}
          <section className="strip">
            <div className="wrap strip-inner">
              <div className="strip-item"><span className="v">College Board</span><span className="k">Real questions, fetched live</span></div>
              <div className="strip-sep" />
              <div className="strip-item"><span className="v mono">400–1600</span><span className="k">Scored on the real scale</span></div>
              <div className="strip-sep" />
              <div className="strip-item"><span className="v">R&amp;W + Math</span><span className="k">Every domain &amp; skill</span></div>
              <div className="strip-sep" />
              <div className="strip-item"><span className="v">Adaptive</span><span className="k">Module 1 → 2A / 2B routing</span></div>
            </div>
          </section>

          {/* ───────────  REAL QUESTIONS  ─────────── */}
          <section className="section" id="practice">
            <div className="wrap">
              <div className="split">
                <div className="split-text">
                  <span className="eyebrow"><span className="dot" />Real questions</span>
                  <h2 className="section-title">Not a question bank someone wrote to look like the SAT.</h2>
                  <p className="section-lede">
                    Strix Prep draws straight from the official College Board question bank and caches
                    each item for your own practice. The same stems, the same passages, the same answer
                    choices you&apos;ll see on test day.
                  </p>
                  <ul className="feature-list">
                    <li><span className="chk"><Check /></span><span className="ft"><b>Both sections, every category.</b> <span>Reading &amp; Writing and Math, filtered by domain and skill.</span></span></li>
                    <li><span className="chk"><Check /></span><span className="ft"><b>Pick your difficulty.</b> <span>Drill easy, medium, hard, or a mix — and choose how many questions.</span></span></li>
                    <li><span className="chk"><Check /></span><span className="ft"><b>Real rationales.</b> <span>Every answer comes with the official explanation when you review.</span></span></li>
                  </ul>
                </div>
                <div className="split-vis">
                  {/* practice setup mini */}
                  <div className="card" style={{ padding: 22 }}>
                    <div className="mini-head"><span className="eb">New session</span></div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <div style={{ flex: 1, padding: 14, border: "1px solid var(--rw-color)", background: "var(--rw-soft)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--rw-color)" }}>
                          <BookOpen size={17} />
                          <b style={{ font: "var(--role-label)", color: "var(--rw-color)" }}>Reading &amp; Writing</b>
                        </div>
                        <div style={{ font: "var(--role-caption)", color: "var(--text-secondary)", marginTop: 6 }}>Information &amp; Ideas · Craft · Expression · Conventions</div>
                      </div>
                      <div style={{ flex: 1, padding: 14, border: "1px solid var(--border-2)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--math-color)" }}>
                          <SquareFunction size={17} />
                          <b style={{ font: "var(--role-label)", color: "var(--math-color)" }}>Math</b>
                        </div>
                        <div style={{ font: "var(--role-caption)", color: "var(--text-secondary)", marginTop: 6 }}>Algebra · Advanced · Problem-Solving · Geometry</div>
                      </div>
                    </div>
                    <div style={{ font: "var(--role-caption)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-tertiary)", marginBottom: 8 }}>Difficulty</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      <span className="badge-dot" style={{ background: "var(--sunken)", color: "var(--ink-2)" }}>Easy</span>
                      <span className="badge-dot" style={{ background: "var(--brand-blue)", color: "#fff" }}>Medium</span>
                      <span className="badge-dot" style={{ background: "var(--sunken)", color: "var(--ink-2)" }}>Hard</span>
                      <span className="badge-dot" style={{ background: "var(--sunken)", color: "var(--ink-2)" }}>Mixed</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ font: "var(--role-numeric)", color: "var(--text-secondary)" }}>10 questions · ~14 min</span>
                      <span className="btn btn-primary" style={{ pointerEvents: "none" }}>Start practice<ArrowRight /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  TEST SURFACE  ─────────── */}
          <section className="section alt" id="test">
            <div className="wrap">
              <div className="section-head center">
                <span className="eyebrow"><span className="dot" />The test surface</span>
                <h2 className="section-title">It feels like the real thing — because it works like it.</h2>
                <p className="section-lede">
                  Strix Prep mirrors the digital-SAT testing app&apos;s functional vocabulary: a timer up
                  top, the passage and question side by side, and every tool you&apos;ll reach for on test
                  day.
                </p>
              </div>

              <div style={{ marginTop: 44 }} className="reveal">
                <div className="test">
                  <div className="test-head">
                    <span className="ttl">Reading &amp; Writing — Module 1</span>
                    <span className="test-timer">28:14</span>
                    <div className="test-tools">
                      <span className="test-tool"><Highlighter />Highlight</span>
                      <span className="test-tool"><Slash />Eliminate</span>
                      <span className="test-tool"><Flag />Mark</span>
                    </div>
                  </div>
                  <div className="test-body">
                    <div className="passage">
                      <span className="num">Question 8 of 27</span>
                      The naturalist Charlotte Murchison kept meticulous field notebooks, recording tide
                      times and the precise strata in which each fossil lay.{" "}
                      <span className="hl">Far from being mere illustration, her annotated diagrams established a method of stratigraphic dating</span>{" "}
                      that her better-known contemporaries would later adopt without attribution.
                    </div>
                    <div className="test-divider" />
                    <div className="qpane">
                      <p className="q">Which choice best states the main idea of the text?</p>
                      <div className="opt"><span className="key">A</span><span className="txt">Murchison&apos;s notebooks were valued mainly for their illustrations.</span></div>
                      <div className="opt sel"><span className="key">B</span><span className="txt">Murchison&apos;s careful methods made a lasting scientific contribution.</span></div>
                      <div className="opt elim"><span className="key">C</span><span className="txt">Murchison was more famous than her contemporaries in her lifetime.</span></div>
                      <div className="opt"><span className="key">D</span><span className="txt">Murchison preferred fieldwork to publishing her findings.</span></div>
                    </div>
                  </div>
                  <div className="test-foot">
                    <span className="palette-pill"><Grip />Question 8 of 27</span>
                    <button className="next-btn">Next<ArrowRight /></button>
                  </div>
                </div>

                <div className="callouts">
                  <div className="callout">
                    <span className="h"><Highlighter />Highlighter</span>
                    <p>Mark up any passage. Your annotations stay with the question.</p>
                  </div>
                  <div className="callout">
                    <span className="h"><Slash />Answer eliminator</span>
                    <p>Strike through choices you&apos;ve ruled out to narrow the field.</p>
                  </div>
                  <div className="callout">
                    <span className="h"><Flag />Mark for review</span>
                    <p>Flag anything to revisit before the module&apos;s timer runs out.</p>
                  </div>
                  <div className="callout">
                    <span className="h"><Grip />Question palette</span>
                    <p>Jump to any question and see what&apos;s answered, flagged, or blank.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  MODULES + FEATURE GRID  ─────────── */}
          <section className="section" id="modules">
            <div className="wrap">
              <div className="section-head">
                <span className="eyebrow"><span className="dot" />Adaptive modules &amp; scoring</span>
                <h2 className="section-title">Run a full section. Get a score that means something.</h2>
                <p className="section-lede">
                  Module 1 routes you into an easier or harder Module 2 the same way the real test does
                  — then converts your raw result to the 400–1600 scale.
                </p>
              </div>

              <div className="feat-grid">
                <div className="feat rw">
                  <span className="ic"><BookOpen /></span>
                  <h3>Reading &amp; Writing</h3>
                  <p>Two modules of 27 questions, 32 minutes each. Passage-based, across all four R&amp;W domains.</p>
                </div>
                <div className="feat math">
                  <span className="ic"><SquareFunction /></span>
                  <h3>Math</h3>
                  <p>Two modules of 22 questions, 35 minutes each. KaTeX rendering, grid-in entry, and a reference sheet.</p>
                </div>
                <div className="feat">
                  <span className="ic"><GitBranch /></span>
                  <h3>Adaptive routing</h3>
                  <p>Clear Module 1 and you&apos;re routed to the harder Module 2B; fall short and you get 2A — exactly like test day.</p>
                </div>
                <div className="feat">
                  <span className="ic"><Gauge /></span>
                  <h3>Scored 400–1600</h3>
                  <p>Each section maps to 200–800 on a representative curve, combined into a total estimate.</p>
                </div>
                <div className="feat">
                  <span className="ic"><Timer /></span>
                  <h3>Real timing</h3>
                  <p>Separately timed modules, a soft pulse under five minutes, and a 10-minute break between sections.</p>
                </div>
                <div className="feat">
                  <span className="ic"><Calculator /></span>
                  <h3>Calculator &amp; reference</h3>
                  <p>The Desmos graphing calculator and the official reference sheet, right where Math expects them.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  TUTORING  ─────────── */}
          <section className="section alt" id="tutoring">
            <div className="wrap">
              <div className="section-head center">
                <span className="eyebrow"><span className="dot" />Tutoring, two ways</span>
                <h2 className="section-title">Study with the help you already have.</h2>
                <p className="section-lede">
                  Bring your own AI subscription, or invite a real tutor to watch your session live.
                  Either way, the help sits in a sidebar — it never answers for you.
                </p>
              </div>

              <div className="tutor-grid">
                {/* AI tutor */}
                <div className="tutor-card">
                  <span className="tag">AI tutor</span>
                  <h3>Connect your own ChatGPT or Grok</h3>
                  <p>
                    No extra fees and no keys to manage — Strix Prep talks to the subscription you
                    already pay for. The tutor is calm and Socratic, and it won&apos;t hand you the answer
                    during a scored module.
                  </p>
                  <div className="provider-row">
                    <span className="provider"><img src="/assets/chatgpt.svg" style={{ width: 17, height: 17 }} alt="" />ChatGPT</span>
                    <span className="provider">
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "var(--ink-1)" }}>
                        <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
                      </svg>
                      Grok
                    </span>
                  </div>
                  <div className="chat">
                    <div className="bubble theirs"><span className="who">You</span>Why is B right and not D for question 8?</div>
                    <div className="bubble mine"><span className="who">Tutor</span>Let&apos;s not jump to B yet. What does the passage actually claim her diagrams did? Find that line first.</div>
                    <div className="bubble theirs">They &quot;established a method of stratigraphic dating.&quot;</div>
                  </div>
                </div>

                {/* Human tutor */}
                <div className="tutor-card">
                  <span className="tag">Live human tutor</span>
                  <h3>Invite a tutor to watch in real time</h3>
                  <p>
                    Generate a link and your tutor joins your session live — they see the question, your
                    selections, and the timer as it happens, and can chat in the sidebar. They can never
                    submit an answer for you.
                  </p>
                  <div className="perm-list">
                    <div className="perm">
                      <span className="lab">Can watch your session<small>Sees your live question, answers, and timer</small></span>
                      <span className="toggle"><i /></span>
                    </div>
                    <div className="perm">
                      <span className="lab">Can chat with you<small>Send messages in the session sidebar</small></span>
                      <span className="toggle"><i /></span>
                    </div>
                    <div className="perm">
                      <span className="lab">Can answer for you<small>Locked — answering is always yours alone</small></span>
                      <span className="toggle locked"><i /></span>
                    </div>
                  </div>
                  <div className="link-row">
                    <span className="link-field"><LinkIcon />strixprep.com/join/8f3c…d20a</span>
                    <span className="btn btn-secondary" style={{ pointerEvents: "none" }}><Copy />Copy</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  STATS  ─────────── */}
          <section className="section" id="stats">
            <div className="wrap">
              <div className="split rev">
                <div className="split-vis">
                  <div className="card" style={{ padding: 22 }}>
                    <div className="mini-head">
                      <span className="eb">Estimated total · last 12 sessions</span>
                      <span className="badge-dot" style={{ background: "var(--success-soft)", color: "var(--success)" }}><i style={{ background: "var(--success)" }} />+90</span>
                    </div>
                    <svg className="spark" viewBox="0 0 320 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="var(--brand-blue)" stopOpacity="0.16" />
                          <stop offset="1" stopColor="var(--brand-blue)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,118 L29,110 L58,114 L87,96 L116,88 L145,92 L174,72 L203,64 L232,56 L261,52 L290,40 L320,30 L320,150 L0,150 Z" fill="url(#sparkfill)" />
                      <path d="M0,118 L29,110 L58,114 L87,96 L116,88 L145,92 L174,72 L203,64 L232,56 L261,52 L290,40 L320,30" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="domain-rings">
                      <div className="domain-ring">
                        <Ring pct={81} color="var(--rw-color)" />
                        <div className="meta"><div className="v">81%</div><div className="k">R&amp;W accuracy</div></div>
                      </div>
                      <div className="domain-ring">
                        <Ring pct={76} color="var(--math-color)" />
                        <div className="meta"><div className="v">76%</div><div className="k">Math accuracy</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="split-text">
                  <span className="eyebrow"><span className="dot" />Stats that tell you where to look</span>
                  <h2 className="section-title">Watch your score move, and know exactly why.</h2>
                  <p className="section-lede">
                    Every session is saved and broken down by domain, skill, and median time — so you can
                    see which categories are pulling your score and drill them directly.
                  </p>
                  <ul className="feature-list">
                    <li><span className="chk"><Check /></span><span className="ft"><b>Score over time.</b> <span>Your estimated total across every scored section.</span></span></li>
                    <li><span className="chk"><Check /></span><span className="ft"><b>Per-category accuracy.</b> <span>A heatmap of where you&apos;re strong and where to drill next.</span></span></li>
                    <li><span className="chk"><Check /></span><span className="ft"><b>Median time per question.</b> <span>See where you&apos;re spending the minutes that cost you.</span></span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────  BRAND BAND  ─────────── */}
          <section className="brand-band">
            <div className="wrap-narrow">
              <img className="owl" src="/assets/app-icon.svg" alt="Strix Prep" />
              <span className="eyebrow"><span className="dot" style={{ background: "rgba(255,255,255,0.5)" }} />Strix · the genus of true owls</span>
              <h2>Calm, precise, and watchful — the way good study feels.</h2>
              <p>
                The owl has always been the emblem of wisdom and patient attention. Strix Prep is built
                in that spirit: no streak confetti, no cheering, no anxious framing. Just the real test,
                your real progress, and a quiet place to do the work.
              </p>
            </div>
          </section>

          {/* ───────────  DOWNLOAD CTA  ─────────── */}
          <section className="cta" id="download">
            <div className="wrap-narrow">
              <img className="app-icon" src="/assets/app-icon.svg" alt="Strix Prep" />
              <h2>Bring the real SAT wherever you study.</h2>
              <p>
                Run Strix Prep as a Mac app or right in your browser — your progress, stats, and tutors
                follow you across both. Practice for free, and sign in with email or Google when you&apos;re
                ready to save your work.
              </p>
              <div className="cta-actions">
                <a className="btn btn-primary btn-lg" href={DOWNLOAD_URL}>
                  <ArrowDownToLine />
                  Download for Mac
                </a>
                <a className="btn btn-secondary btn-lg" href={ENTER}>
                  <Globe />
                  {enterLabel}
                </a>
              </div>
              <div className="cta-meta">Mac app or any modern browser · free to practice</div>
            </div>
          </section>
        </main>

        {/* ───────────  FOOTER  ─────────── */}
        <footer className="footer">
          <div className="wrap">
            <div className="footer-top">
              <div className="footer-brand">
                <a className="nav-brand" href="#top" aria-label="Strix Prep">
                  <img src="/assets/logo-mark.svg" alt="" />
                  <span className="nav-wordmark">Strix <span>Prep</span></span>
                </a>
                <p>
                  A Mac-native digital-SAT practice app. Real College Board questions, adaptive modules,
                  and tutoring that never answers for you.
                </p>
              </div>
              <div className="footer-cols">
                <div className="footer-col">
                  <h4>Product</h4>
                  <a href="#practice">Practice</a>
                  <a href="#modules">Adaptive modules</a>
                  <a href="#test">Test surface</a>
                  <a href="#stats">Stats</a>
                </div>
                <div className="footer-col">
                  <h4>Tutoring</h4>
                  <a href="#tutoring">AI tutor</a>
                  <a href="#tutoring">Live human tutor</a>
                  <a href="#tutoring">Invite a tutor</a>
                </div>
                <div className="footer-col">
                  <h4>Get started</h4>
                  <a href={DOWNLOAD_URL}>Download for Mac</a>
                  <a href={ENTER}>Open the web app</a>
                  <a href={ENTER}>Log in</a>
                  <a href={ENTER}>Create account</a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 Strix Prep</span>
              <span className="legal">
                Questions are fetched from the College Board question bank for your own personal
                practice and are © College Board. Strix Prep is an independent study tool and is not
                affiliated with or endorsed by the College Board. Score conversions use a representative
                curve and are an estimate.
              </span>
            </div>
          </div>
        </footer>

        <ScrollReveal />
      </div>
    </>
  );
}
