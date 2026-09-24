import { ArrowUp, MousePointer2, PencilLine, Highlighter, Type } from "lucide-react";
import s from "./Landing.module.css";
import h from "./Help.module.css";

const TEACH_TOOLS = [
  { label: "Laser", icon: MousePointer2, active: false },
  { label: "Draw", icon: PencilLine, active: true },
  { label: "Highlight", icon: Highlighter, active: false },
  { label: "Label", icon: Type, active: false },
] as const;

function AiTutorVisual() {
  return (
    <div
      className={h.pane}
      role="img"
      aria-label="The AI tutor pane connected to ChatGPT. The student asks why B is right for question 8, and the tutor answers with a guiding question instead of the answer."
    >
      <div className={h.paneHead}>
        <span className={h.paneTitle}>Tutor</span>
        <span className={h.providers}>
          <span className={`${h.provider} ${h.providerOn}`}>
            <i className={`${h.logo} ${h.logoChatgpt}`} />
            ChatGPT
          </span>
          <span className={h.provider}>
            <i className={`${h.logo} ${h.logoGrok}`} />
            Grok
          </span>
        </span>
      </div>
      <div className={h.chat}>
        <div className={`${h.bubble} ${h.mine}`}>Why is B right and not D on question 8?</div>
        <div className={`${h.bubble} ${h.theirs}`}>
          Let’s check the passage first. What does it say her diagrams actually did?
        </div>
        <div className={`${h.bubble} ${h.mine}`}>They “established a method of stratigraphic dating.”</div>
      </div>
      <div className={h.composer}>
        <span>Ask about this question…</span>
        <span className={h.send}>
          <ArrowUp />
        </span>
      </div>
    </div>
  );
}

function LiveTutorVisual() {
  return (
    <div
      className={h.pane}
      role="img"
      aria-label="A live session with Ms. Lee watching. She has circled the words stratigraphic dating on the student's passage and is pointing at the question with a laser pointer while the student picks choice B."
    >
      <div className={h.paneHead}>
        <span className={h.presence}>
          <i className={h.liveDot} />
          Ms. Lee <span className={h.muted}>· watching</span>
        </span>
        <span className={h.teachBar}>
          {TEACH_TOOLS.map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              className={active ? `${h.teachTool} ${h.teachOn}` : h.teachTool}
              title={label}
            >
              <Icon />
            </span>
          ))}
        </span>
      </div>
      <div className={h.passage}>
        Far from being mere illustration, her annotated diagrams established a method of{" "}
        <span className={h.circled}>
          stratigraphic dating
          <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden>
            <path d="M18 34 C 20 10, 170 4, 188 26 C 200 44, 120 58, 60 54 C 20 51, 4 40, 24 18" />
          </svg>
        </span>{" "}
        that her contemporaries would later adopt.
      </div>
      <div className={h.question}>
        <span className={h.laserAnchor}>
          <i className={h.laser} />
        </span>
        Which choice best states the main idea of the text?
      </div>
      <div className={h.choices}>
        <span className={`${h.choice} ${h.choiceOn}`}>
          <i>B</i>Her careful methods made a lasting scientific contribution.
        </span>
      </div>
    </div>
  );
}

export default function HelpSection() {
  return (
    <section id="help" className={s.section} aria-labelledby="help-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <p className={s.kicker}>Tutoring</p>
          <h2 id="help-title" className={s.h2}>
            Help when you want it.
          </h2>
          <p className={s.lede}>
            Bring your own AI, or bring in a real tutor. Either way, the help sits beside the
            question — the answer is always yours to give.
          </p>
        </div>
        <div className={h.grid}>
          <article className={h.card}>
            <p className={h.label}>AI tutor</p>
            <h3 className={h.title}>Use the ChatGPT or Grok you already pay for.</h3>
            <p className={h.body}>
              Connect your own subscription — no API keys, no extra fees. It’s calm and Socratic,
              and it won’t hand you the answer during a scored module.
            </p>
            <AiTutorVisual />
          </article>
          <article className={h.card}>
            <p className={h.label}>Live tutor</p>
            <h3 className={h.title}>Invite a tutor to watch live.</h3>
            <p className={h.body}>
              Share a link and your tutor sees your question, answers and timer as you work. They
              can point, draw and highlight right on your screen, but can never answer for you.
            </p>
            <LiveTutorVisual />
          </article>
        </div>
      </div>
    </section>
  );
}
