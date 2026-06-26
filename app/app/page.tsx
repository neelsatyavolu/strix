import AppMount from "@/components/AppMount";

// The Sixteen SPA — same surface the Mac app loads. Gated by ProfileContext to
// onboarding (email / Google) or the dashboard. The marketing landing lives at /.
export default function AppPage() {
  return (
    <div id="window">
      <AppMount />
    </div>
  );
}
