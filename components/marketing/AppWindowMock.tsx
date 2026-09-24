import Image from "next/image";
import {
  House,
  CirclePlay,
  RotateCcw,
  CalendarCheck,
  ChartLine,
  BookA,
  MessageCircle,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import m from "./AppMock.module.css";

type NavItem = { label: string; icon: LucideIcon; badge?: number; active?: boolean };

const NAV: readonly NavItem[] = [
  { label: "Home", icon: House, active: true },
  { label: "Practice", icon: CirclePlay },
  { label: "Review", icon: RotateCcw, badge: 12 },
  { label: "Plan", icon: CalendarCheck },
  { label: "Progress", icon: ChartLine },
];
const TOOLS: readonly NavItem[] = [
  { label: "Vocabulary", icon: BookA },
  { label: "Tutor", icon: MessageCircle },
];

const FOCUS = [
  { skill: "Boundaries", domain: "rw", area: "Standard English Conventions", pct: 58 },
  { skill: "Nonlinear functions", domain: "math", area: "Advanced Math", pct: 61 },
  { skill: "Inferences", domain: "rw", area: "Information and Ideas", pct: 64 },
] as const;

const RECENT = [
  { title: "Math · Module 2 (harder)", when: "Yesterday", value: "690" },
  { title: "Transitions drill", when: "Sep 20", value: "9/10" },
  { title: "Vocabulary · 20 words", when: "Sep 19", value: "18/20" },
] as const;

function NavRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <div className={`${m.item} ${item.active ? m.itemActive : ""}`}>
      <Icon />
      <span>{item.label}</span>
      {item.badge != null && <span className={m.badge}>{item.badge}</span>}
    </div>
  );
}

export function TrafficLights() {
  return (
    <span className={m.traffic}>
      <i className={m.red} />
      <i className={m.yellow} />
      <i className={m.green} />
    </span>
  );
}

function Sidebar() {
  return (
    <div className={m.sidebar}>
      <TrafficLights />
      <div className={m.brandRow}>
        <Image src="/assets/app-icon.svg" alt="" width={22} height={22} />
        Strix
      </div>
      <div className={m.group}>
        {NAV.map((it) => (
          <NavRow key={it.label} item={it} />
        ))}
      </div>
      <div className={m.group}>
        <div className={m.groupLabel}>Study tools</div>
        {TOOLS.map((it) => (
          <NavRow key={it.label} item={it} />
        ))}
      </div>
      <div className={m.account}>
        <span className={m.avatar}>M</span>
        <span className={m.who}>
          Maya Rao
          <small>Target 1500</small>
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className={m.content}>
      <div>
        <div className={m.pageTitle}>Good evening, Maya</div>
        <div className={m.pageSub}>12 reviews due · 24 days until test day</div>
      </div>

      <div className={m.grid}>
        <div className={`${m.card} ${m.upNext}`}>
          <div className={m.caption}>Up next</div>
          <div className={m.cardTitle}>Boundaries drill</div>
          <div className={m.cardSub}>Reading and Writing · 6 of 10 answered</div>
          <div className={m.bar}>
            <i style={{ width: "60%" }} />
          </div>
          <div className={m.actions}>
            <span className={m.btnPrimary}>
              <Play />
              Resume
            </span>
            <span className={m.btnSecondary}>Review 12 due</span>
          </div>
        </div>

        <div className={m.card}>
          <div className={m.caption}>Estimated score</div>
          <div className={m.metricRow}>
            <span className={m.metric}>1410</span>
            <span className={m.delta}>+60 this month</span>
          </div>
          <div className={m.split}>
            <span>
              <i className={m.dotRw} />
              Reading and Writing <b>710</b>
            </span>
            <span>
              <i className={m.dotMath} />
              Math <b>700</b>
            </span>
          </div>
        </div>

        <div className={`${m.card} ${m.listCard}`}>
          <div className={m.cardHead}>Focus skills</div>
          {FOCUS.map((f) => (
            <div key={f.skill} className={m.row}>
              <i className={f.domain === "rw" ? m.dotRw : m.dotMath} />
              <span className={m.rowText}>
                {f.skill}
                <small>{f.area}</small>
              </span>
              <span className={m.meter}>
                <i style={{ width: `${f.pct}%` }} />
              </span>
              <span className={m.rowValue}>{f.pct}%</span>
            </div>
          ))}
        </div>

        <div className={`${m.card} ${m.listCard} ${m.recent}`}>
          <div className={m.cardHead}>Recent</div>
          {RECENT.map((r) => (
            <div key={r.title} className={m.row}>
              <span className={m.rowText}>
                {r.title}
                <small>{r.when}</small>
              </span>
              <span className={m.rowValue}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The hero product shot: the new Strix app window (tinted sidebar, toolbar,
// Home dashboard), built in HTML/CSS so it stays crisp and theme-aware.
export default function AppWindowMock() {
  return (
    <div
      className={m.window}
      role="img"
      aria-label="The Strix app: a sidebar with Home, Practice, Review, Plan, Progress, Vocabulary and Tutor, and a Home screen showing the next drill to resume, an estimated score of 1410, and the skills to focus on."
    >
      <Sidebar />
      <div className={m.main}>
        <div className={m.toolbar}>
          <TrafficLights />
          Home
        </div>
        <Dashboard />
      </div>
    </div>
  );
}
