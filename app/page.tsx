import StrixLanding from "@/components/marketing/StrixLanding";
import { getSessionProfile } from "@/lib/auth/actions";

// Marketing landing. Reads the session so the entry buttons read "Go to
// Dashboard" when you're already signed in (vs. "Log in" / "Open the web app").
// Every entry button points at /app, which mounts the same SPA the Mac app runs.
export default async function Home() {
  const session = await getSessionProfile();
  return <StrixLanding authed={Boolean(session?.user)} />;
}
