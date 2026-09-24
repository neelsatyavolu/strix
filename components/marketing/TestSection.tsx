import { GitBranch, Highlighter, Bookmark, Calculator } from "lucide-react";
import TestMock from "./TestMock";
import s from "./Landing.module.css";

const POINTS = [
  {
    icon: GitBranch,
    title: "Adaptive modules",
    body: "How you do on Module 1 decides whether Module 2 is easier or harder — just like test day.",
  },
  {
    icon: Highlighter,
    title: "Highlight and cross out",
    body: "Mark up passages and strike through choices you’ve ruled out.",
  },
  {
    icon: Bookmark,
    title: "Mark for review",
    body: "Flag questions, then jump back from the question palette before time runs out.",
  },
  {
    icon: Calculator,
    title: "Desmos and reference sheet",
    body: "The graphing calculator and formula sheet are right where Math expects them.",
  },
] as const;

export default function TestSection() {
  return (
    <section id="test" className={s.section} aria-labelledby="test-title">
      <div className={s.wrap}>
        <div className={s.head}>
          <p className={s.kicker}>Test day, every day</p>
          <h2 id="test-title" className={s.h2}>
            The real test, not a lookalike.
          </h2>
          <p className={s.lede}>
            Every question comes from the College Board question bank, on a screen that works like
            Bluebook: the timer up top, passage beside question, and the same tools. Reading and
            Writing runs 27 questions in 32 minutes a module; Math, 22 in 35.
          </p>
        </div>
        <div className={`${s.visual} reveal`}>
          <TestMock />
        </div>
        <ul className={s.points}>
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className={s.point}>
              <Icon aria-hidden />
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
