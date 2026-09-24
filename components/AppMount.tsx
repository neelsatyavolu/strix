"use client";

import { useEffect, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { PracticeSessionProvider } from "@/components/sixteen/session/SessionContext";
import { ProfileProvider, useProfile } from "@/components/sixteen/session/ProfileContext";

// Desktop auto-update toast — inert in a plain browser.
const UpdatePopup = dynamic(() => import("@/components/sixteen/updates/UpdatePopup"), {
  ssr: false,
});

// The Sixteen app is a stateful client SPA. Render it client-only — there's no
// SSR benefit and it sidesteps window/document access during server render.
const SixteenApp = dynamic(() => import("@/components/sixteen/SixteenApp"), {
  ssr: false,
});

function Gate() {
  const { loading } = useProfile();
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading Strix"
        style={{
          height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 14, background: "var(--surface-app)", WebkitAppRegion: "drag",
        } as CSSProperties}
      >
        <style>{"@keyframes strix-splash{0%,100%{opacity:.55;transform:scale(.97)}50%{opacity:1;transform:scale(1)}}@media (prefers-reduced-motion:reduce){.strix-splash{animation:none!important}}"}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/app-icon.svg"
          width={56}
          height={56}
          alt=""
          className="strix-splash"
          style={{ borderRadius: 13, boxShadow: "var(--shadow-sm)", animation: "strix-splash 1.6s var(--ease-in-out) infinite" }}
        />
        <span style={{ font: "var(--role-label)", color: "var(--text-tertiary)" }}>Loading Strix…</span>
      </div>
    );
  }
  return <SixteenApp />;
}

export default function AppMount() {
  useEffect(() => {
    const w = window as unknown as { strix?: { isDesktop?: boolean } };
    if (w.strix?.isDesktop) {
      document.documentElement.classList.add("desktop");
    }
  }, []);

  return (
    <ProfileProvider>
      <PracticeSessionProvider>
        <Gate />
        <UpdatePopup />
      </PracticeSessionProvider>
    </ProfileProvider>
  );
}
