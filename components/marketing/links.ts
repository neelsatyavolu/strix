// Where every "enter the app" button goes. /app mounts the same Sixteen SPA the
// Mac app runs — it gates to onboarding (email / Google) or the dashboard.
export const ENTER = "/app";

// What Strix stores and the anonymous usage stats it counts.
export const PRIVACY = "/privacy";

// The hosted Mac build (electron-builder generic publish → strixprep.com/downloads).
// Public source repository (MIT).
export const GITHUB_URL = "https://github.com/neelsatyavolu/strix";

export const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL || "https://strixprep.com/downloads/Strix-Prep.dmg";
