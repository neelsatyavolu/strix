import { Target, RotateCcw, CalendarCheck, Check } from "lucide-react";
import s from "./Landing.module.css";
import p from "./Practice.module.css";

const STEPS = [
  {
    icon: Target,
    title: "Drill any skill",
    body: "Pick a domain and skill, set the difficulty, and work real questions with the official explanations.",
  },
  {
    icon: RotateCcw,
    title: "Review what you missed",
    body: "Missed questions come back on a schedule until they stick. SAT vocabulary works the same way.",
  },
  {
    icon: CalendarCheck,
    title: "Follow a plan built from your results",
    body: "Progress shows accuracy by domain and skill, and your weekly plan turns it into the next thing to do.",
  },
] as const;

const SKILLS = [
  { name: "Boundaries", area: "Reading and Writing", domain: "rw", pct: 58 },
  { name: "Nonlinear functions", area: "Math", domain: "math", pct: 61 },
  { name: "Inferences", area: "Reading and Writing", domain: "rw", pct: 64 },
  { name: "Linear equations", area: "Math", domain: "math", pct: 88 },
] as const;

const WEEK = [
  { day: "M", state: "done" },
  { day: "T", state: "done" },
  { day: "W", state: "done" },
  { day: "T", state: "today" },
  { day: "F", state: "" },
  { day: "S", state: "" },
  { day: "S", state: "" },
] as const;

function dayClass(state: (typeof WEEK)[number]["state"]) {
  if (state === "done") return `${p.day} ${p.dayDone}`;
  if (state === "today") return `${p.day} ${p.dayToday}`;
  return p.day;
}

function PracticeVisual() {
  return (
    <div
      className={p.stage}
      role="img"
      aria-label="Strix practice views: focus skills ranked by accuracy with a Drill button, 12 review questions due today, and this week's plan with three of five sessions done."
    >
      <div className={p.card}>
        <div className={p.cardHead}>
          <span className={p.title}>Focus skills</span>
          <span className={p.caption}>Accuracy, last 30 days</span>
        </div>
        {SKILLS.map((k, i) => (
          <div key={k.name} className={p.row}>
            <i className={k.domain === "rw" ? p.dotRw : p.dotMath} />
            <span className={p.rowText}>
              {k.name}
              <small>{k.area}</small>
            </span>
            <span className={p.meter}>
              <i style={{ width: `${k.pct}%` }} />
            </span>
            <span className={p.value}>{k.pct}%</span>
            <span className={i === 0 ? p.drillPrimary : p.drill}>Drill</span>
          </div>
        ))}
      </div>

      <div className={p.pair}>
        <div className={p.card}>
          <span className={p.iconWell}>
            <RotateCcw />
          </span>
          <div className={p.bigNum}>12</div>
          <div className={p.caption}>Review questions due today</div>
        </div>
        <div className={p.card}>
          <div className={p.title}>This week</div>
          <div className={p.week}>
            {WEEK.map((d, i) => (
              <span key={i} className={dayClass(d.state)}>
                {d.state === "done" ? <Check /> : d.day}
              </span>
            ))}
          </div>
          <div className={p.caption}>3 of 5 sessions done</div>
        </div>
      </div>
    </div>
  );
}

export default function PracticeSection() {
  return (
    <section id="practice" className={s.section} aria-labelledby="practice-title">
      <div className={`${s.wrap} ${s.split}`}>
        <div>
          <p className={s.kicker}>Practice</p>
          <h2 id="practice-title" className={s.h2}>
            Practice that knows what to fix.
          </h2>
          <ul className={s.steps}>
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon aria-hidden />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <PracticeVisual />
        </div>
      </div>
    </section>
  );
}
