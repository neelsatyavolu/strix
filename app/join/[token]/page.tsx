import type { Metadata } from "next";
import TutorJoin from "@/components/tutor/TutorJoin";

export const metadata: Metadata = {
  title: "Join as a tutor — Strix",
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div id="window">
      <TutorJoin token={token} />
    </div>
  );
}
