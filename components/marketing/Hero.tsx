import { ArrowDownToLine, Globe } from "lucide-react";
import AppWindowMock from "./AppWindowMock";
import { DOWNLOAD_URL, ENTER } from "./links";
import s from "./Landing.module.css";

export function PrimaryCtas({ authed }: { authed: boolean }) {
  return (
    <div className={s.ctaRow}>
      <a className={`${s.btn} ${s.primary} ${s.lg}`} href={DOWNLOAD_URL}>
        <ArrowDownToLine aria-hidden />
        Download for Mac
      </a>
      <a className={`${s.btn} ${s.secondary} ${s.lg}`} href={ENTER}>
        <Globe aria-hidden />
        {authed ? "Go to Dashboard" : "Open the web app"}
      </a>
    </div>
  );
}

export default function Hero({ authed }: { authed: boolean }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.wrap}>
        <h1 id="hero-title" className={s.heroTitle}>
          Practice the real SAT.
        </h1>
        <p className={s.heroSub}>
          Real College Board questions, a test screen that works like Bluebook, and adaptive
          modules scored on the 400–1600 scale. On your Mac or in your browser.
        </p>
        <PrimaryCtas authed={authed} />
        <p className={s.fineprint}>Free. Sign in with email or Google to save your progress.</p>
      </div>
      <div className={`${s.stage} reveal`}>
        <AppWindowMock />
      </div>
    </section>
  );
}
