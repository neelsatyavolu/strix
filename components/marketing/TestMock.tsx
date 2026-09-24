import { Bookmark, ChevronDown, EllipsisVertical, Highlighter } from "lucide-react";
import t from "./TestMock.module.css";

const OPTIONS = [
  { key: "A", text: "Murchison’s notebooks were valued mainly for their illustrations.", state: "" },
  { key: "B", text: "Murchison’s careful methods made a lasting scientific contribution.", state: "selected" },
  { key: "C", text: "Murchison was better known than her contemporaries in her lifetime.", state: "eliminated" },
  { key: "D", text: "Murchison preferred fieldwork to publishing her findings.", state: "" },
] as const;

function optionClass(state: (typeof OPTIONS)[number]["state"]) {
  if (state === "selected") return `${t.option} ${t.selected}`;
  if (state === "eliminated") return `${t.option} ${t.eliminated}`;
  return t.option;
}

// A Bluebook-style Reading and Writing question, drawn with the app's test
// palette (--test-*): navy header with the timer, passage | question split,
// question palette pill and Next in the footer.
export default function TestMock() {
  return (
    <div
      className={t.test}
      role="img"
      aria-label="The Strix test screen: Section 1, Module 1 of Reading and Writing with 28:14 left. A passage with a highlighted sentence sits beside question 8 of 27; choice B is selected and choice C is crossed out."
    >
      <div className={t.head}>
        <div className={t.section}>
          <span className={t.sectionLong}>Section 1, Module 1: Reading and Writing</span>
          <span className={t.sectionShort}>Module 1: Reading and Writing</span>
        </div>
        <div className={t.timer}>
          <span>28:14</span>
          <span className={t.hide}>Hide</span>
        </div>
        <div className={t.tools}>
          <span className={t.tool}>
            <Highlighter />
            <span>Highlight</span>
          </span>
          <span className={t.tool}>
            <EllipsisVertical />
            <span>More</span>
          </span>
        </div>
      </div>
      <div className={t.directions}>
        Directions <ChevronDown />
      </div>

      <div className={t.body}>
        <div className={t.passage}>
          The naturalist Charlotte Murchison kept meticulous field notebooks, recording tide times
          and the precise strata in which each fossil lay.{" "}
          <mark className="cb-hl">
            Far from being mere illustration, her annotated diagrams established a method of
            stratigraphic dating
          </mark>{" "}
          that her better-known contemporaries would later adopt without attribution.
        </div>
        <div className={t.qpane}>
          <div className={t.qbar}>
            <span className={t.qnum}>8</span>
            <span className={t.mark}>
              <Bookmark />
              Mark for Review
            </span>
            <span className={t.abc}>ABC</span>
          </div>
          <p className={t.stem}>Which choice best states the main idea of the text?</p>
          <div className={t.options}>
            {OPTIONS.map((o) => (
              <div key={o.key} className={optionClass(o.state)}>
                <span className={t.letter}>{o.key}</span>
                <span className={t.optText}>{o.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={t.foot}>
        <span className={t.student}>Maya Rao</span>
        <span className={t.palette}>
          Question 8 of 27 <ChevronDown />
        </span>
        <span className={t.nav}>
          <span className={`${t.navBtn} ${t.back}`}>Back</span>
          <span className={t.navBtn}>Next</span>
        </span>
      </div>
    </div>
  );
}
