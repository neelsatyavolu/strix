"use client";

import dynamic from "next/dynamic";
import { PracticeSessionProvider } from "@/components/sixteen/session/SessionContext";

// The Sixteen app is a stateful client SPA (the design's interactive click-thru).
// Render it client-only — there's no SSR benefit and it sidesteps window/document
// access during server render.
const SixteenApp = dynamic(() => import("@/components/sixteen/SixteenApp"), {
  ssr: false,
});

export default function AppMount() {
  return (
    <PracticeSessionProvider>
      <SixteenApp />
    </PracticeSessionProvider>
  );
}
