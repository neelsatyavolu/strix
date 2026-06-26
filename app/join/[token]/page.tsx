import TutorJoin from "@/components/tutor/TutorJoin";

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
