"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { PracticeSessionProvider } from "@/components/sixteen/session/SessionContext";

// The Sixteen app is a stateful client SPA (the design's interactive click-thru).
// Render it client-only — there's no SSR benefit and it sidesteps window/document
// access during server render.
const SixteenApp = dynamic(() => import("@/components/sixteen/SixteenApp"), {
  ssr: false,
});

export default function AppMount() {
  useEffect(() => {
    const w = window as unknown as { proctorly?: { isDesktop?: boolean } };
    if (w.proctorly?.isDesktop) {
      document.documentElement.classList.add("desktop");
    }
  }, []);

  return (
    <PracticeSessionProvider>
      <SixteenApp />
    </PracticeSessionProvider>
  );
}
