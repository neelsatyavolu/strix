import type { SupabaseClient } from "@supabase/supabase-js";

// Resolve whose data a stats/sessions request should read. By default a request
// is scoped to the caller. When a `studentId` is supplied, the caller must be an
// active tutor of that student (verified via the is_tutor_of RLS helper).
//
// Returns the target user id, or an error + HTTP status to return as-is.
export async function resolveTargetUser(
  supabase: SupabaseClient,
  selfId: string,
  studentId: string | null,
): Promise<{ targetId: string } | { error: string; status: number }> {
  if (!studentId || studentId === selfId) return { targetId: selfId };
  const { data: ok, error } = await supabase.rpc("is_tutor_of", { student: studentId });
  if (error) return { error: error.message, status: 500 };
  if (!ok) return { error: "Not allowed to view this student", status: 403 };
  return { targetId: studentId };
}
