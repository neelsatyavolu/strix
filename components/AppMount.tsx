"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { PracticeSessionProvider } from "@/components/sixteen/session/SessionContext";
import { ProfileProvider, useProfile } from "@/components/sixteen/session/ProfileContext";

// The Sixteen app is a stateful client SPA. Render it client-only — there's no
// SSR benefit and it sidesteps window/document access during server render.
const SixteenApp = dynamic(() => import("@/components/sixteen/SixteenApp"), {
  ssr: false,
});

function Gate() {
  const { loading } = useProfile();
  if (loading) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--surface-app)" }}>
        <span style={{ font: "var(--role-body)", color: "var(--text-secondary)" }}>Loading Strix…</span>
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
      </PracticeSessionProvider>
    </ProfileProvider>
  );
}
