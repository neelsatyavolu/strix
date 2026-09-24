import Image from "next/image";
import { Brand } from "./LandingNav";
import { PrimaryCtas } from "./Hero";
import { DOWNLOAD_URL, ENTER } from "./links";
import s from "./Landing.module.css";

export function ScoringNote() {
  return (
    <section id="scoring" className={s.scoring} aria-labelledby="scoring-title">
      <div className={`${s.wrap} ${s.scoringInner}`}>
        <div className={s.scale}>
          <span className={s.scaleNum}>400–1600</span>
          <span className={s.scaleCaption}>200–800 per section, like the real SAT</span>
        </div>
        <div>
          <h2 id="scoring-title" className={s.scoringTitle}>
            An honest estimate, not a promise.
          </h2>
          <p className={s.scoringBody}>
            When you finish a module, Strix converts your result to the 200–800 section scale
            using a representative curve and adds the sections into a 400–1600 total. It’s a
            calibrated estimate for tracking your progress, not an official College Board score.
          </p>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ authed }: { authed: boolean }) {
  return (
    <section className={s.final} aria-labelledby="final-title">
      <div className={s.narrow}>
        <Image className={s.appIcon} src="/assets/app-icon.svg" alt="" width={96} height={96} />
        <h2 id="final-title" className={s.h2}>
          Start practicing tonight.
        </h2>
        <p className={s.lede}>
          Free on your Mac or in any modern browser. Your progress, plan and tutors follow you
          between both.
        </p>
        <PrimaryCtas authed={authed} />
      </div>
    </section>
  );
}

export function LandingFooter({ authed }: { authed: boolean }) {
  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div className={s.footerTop}>
          <Brand />
          <nav className={s.footerLinks} aria-label="Footer">
            <a href={DOWNLOAD_URL}>Download for Mac</a>
            <a href={ENTER}>{authed ? "Go to Dashboard" : "Open the web app"}</a>
            {!authed && <a href={ENTER}>Sign in</a>}
          </nav>
        </div>
        <p className={s.legal}>
          Questions are fetched from the College Board question bank for your own personal practice
          and are © College Board. Strix Prep is an independent study tool and is not affiliated
          with or endorsed by the College Board. Score conversions use a representative curve and
          are an estimate.
        </p>
        <p className={s.copy}>© 2026 Strix Prep</p>
      </div>
    </footer>
  );
}
