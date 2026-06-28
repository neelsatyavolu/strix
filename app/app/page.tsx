import AppMount from "@/components/AppMount";

// The Sixteen SPA — same surface the Mac app loads. Gated by ProfileContext to
// onboarding (email / Google) or the dashboard. The marketing landing lives at /.
export default function AppPage() {
  return (
    <div id="window">
      {/* Runs before paint: apply the saved appearance so the "Loading Strix…"
          screen (and first frame) match the persisted theme — SixteenApp only
          sets data-theme after it mounts, which is too late for the splash. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var d=document.documentElement;try{var t=localStorage.getItem('strix-theme');var dark=t==='dark'||((t===null||t==='system')&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)d.setAttribute('data-theme','dark');}catch(e){}})()",
        }}
      />
      <AppMount />
    </div>
  );
}
