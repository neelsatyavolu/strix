import LandingNav from "./LandingNav";
import Hero from "./Hero";
import TestSection from "./TestSection";
import PracticeSection from "./PracticeSection";
import HelpSection from "./HelpSection";
import { ScoringNote, FinalCta, LandingFooter } from "./Closing";
import ScrollReveal from "./ScrollReveal";
import { THEME_KEY } from "./theme";
import s from "./Landing.module.css";
import "./landing.css";

// Runs before paint: re-enable normal document scrolling (globals.css locks
// <body> to the app frame used by /app) and apply the saved appearance — or the
// system appearance when nothing is saved — so there's no flash.
const PREPAINT = `(function(){var d=document.documentElement;d.setAttribute('data-page','landing');try{var t=localStorage.getItem('${THEME_KEY}');var dark=t==='dark'||(t!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)d.setAttribute('data-theme','dark');}catch(e){}})()`;

export default function StrixLanding({ authed }: { authed: boolean }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <div className={s.page}>
        <a className={s.skip} href="#main">
          Skip to content
        </a>
        <LandingNav authed={authed} />
        <main id="main">
          <Hero authed={authed} />
          <TestSection />
          <PracticeSection />
          <HelpSection />
          <ScoringNote />
          <FinalCta authed={authed} />
        </main>
        <LandingFooter authed={authed} />
        <ScrollReveal />
      </div>
    </>
  );
}
