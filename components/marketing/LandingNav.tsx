import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import GitHubMark from "./GitHubMark";
import { DOWNLOAD_URL, ENTER, GITHUB_URL } from "./links";
import s from "./Landing.module.css";

const ANCHORS = [
  { href: "#test", label: "The test" },
  { href: "#practice", label: "Practice" },
  { href: "#help", label: "Tutoring" },
  { href: "#scoring", label: "Scoring" },
] as const;

export function Brand() {
  return (
    <a className={s.brand} href="#main" aria-label="Strix Prep, back to top">
      <Image src="/assets/logo-mark.svg" alt="" width={26} height={26} />
      <span>
        Strix <span className={s.brandMuted}>Prep</span>
      </span>
    </a>
  );
}

export default function LandingNav({ authed }: { authed: boolean }) {
  return (
    <header className={s.nav}>
      <div className={`${s.wrap} ${s.navInner}`}>
        <Brand />
        <nav className={s.navLinks} aria-label="Sections">
          {ANCHORS.map((a) => (
            <a key={a.href} className={s.navLink} href={a.href}>
              {a.label}
            </a>
          ))}
        </nav>
        <div className={s.navActions}>
          <ThemeToggle />
          <a
            className={`${s.btn} ${s.ghost} ${s.navGithub}`}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Strix Prep on GitHub (opens in a new tab)"
          >
            <GitHubMark />
            <span className={s.navGithubLabel}>GitHub</span>
          </a>
          <a className={`${s.btn} ${s.ghost}`} href={ENTER}>
            {authed ? "Dashboard" : "Sign in"}
          </a>
          <a
            className={`${s.btn} ${s.primary} ${s.navDownload}`}
            href={DOWNLOAD_URL}
            aria-label="Download Strix Prep for Mac"
          >
            Download
          </a>
        </div>
      </div>
    </header>
  );
}
