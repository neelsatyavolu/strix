// A tutor row from GET /api/tutor/invite → { name, email }.
export function tutorProfile(t) {
  const p = Array.isArray(t?.profiles) ? t.profiles[0] : t?.profiles;
  return { name: p?.full_name || p?.email || 'Tutor', email: p?.email || '' };
}
