import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/marketing/ThemeToggle";
import { LandingFooter } from "@/components/marketing/Closing";
import { GITHUB_URL } from "@/components/marketing/links";
import { PREPAINT } from "@/components/marketing/StrixLanding";
import s from "@/components/marketing/Landing.module.css";
import p from "@/components/marketing/Privacy.module.css";
import "@/components/marketing/landing.css";

export const metadata: Metadata = {
  title: "Privacy — Strix Prep",
  description:
    "What Strix stores for your account, and the anonymous, cookieless usage stats it counts.",
};

export default function PrivacyPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <div className={s.page}>
        <header className={s.nav}>
          <div className={`${s.wrap} ${p.header}`}>
            <Link className={s.brand} href="/" aria-label="Strix Prep home">
              <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
              <span>
                Strix <span className={s.brandMuted}>Prep</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className={`${s.narrow} ${p.body}`}>
          <h1 className={p.title}>Privacy</h1>
          <p className={p.intro}>
            What Strix keeps for your account, and the anonymous numbers it counts.
          </p>

          <h2>Your account</h2>
          <p>
            When you sign up, your email address and your practice (sessions, answers, scores and
            study goal) are saved in Strix’s database so they follow you between the Mac app and
            the web. Tutors you invite can see it within the permissions you set. You can delete your
            practice history any time in Settings → Clear practice data.
          </p>

          <h2>AI tutor</h2>
          <p>
            If you connect ChatGPT or Grok, the sign-in is kept in your browser’s cookies (web) or
            your Mac’s Keychain (Mac app), and hint requests go to that provider under your own
            account.
          </p>

          <h2>Anonymous usage stats</h2>
          <p>
            Strix counts visits and Mac app installs with its own analytics service at{" "}
            <strong>analytics.n3el.dev</strong>, run by the developer. These stats aren’t shared with
            ad or tracking companies.
          </p>
          <ul>
            <li>
              <strong>Website and web app:</strong> the page address (without any query string),
              the referring site, and a coarse country, browser and device type. Clicks on the
              Mac download are counted.
            </li>
            <li>
              <strong>Mac app:</strong> once a day, a random install ID, the app version, the
              macOS version and the chip type.
            </li>
            <li>
              <strong>Never sent:</strong> your name, email, account, answers, scores or anything
              you type. No cookies are used and no IP addresses are stored.
            </li>
          </ul>
          <p>
            To turn it off in the Mac app, open Settings → Privacy and switch off “Share anonymous
            usage stats”. That stops the daily ping and page counts inside the app. On the web the
            counts are cookieless and anonymous; blocking analytics.n3el.dev in your browser stops
            them.
          </p>

          <h2>Source</h2>
          <p>
            Strix is open source, so you can check all of this in the code on{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>

          <p className={p.updated}>Last updated September 23, 2026.</p>
        </main>
        <LandingFooter authed={false} />
      </div>
    </>
  );
}
