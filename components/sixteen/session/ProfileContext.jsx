'use client';

import React from 'react';
import { getSessionProfile, signOut as doSignOut } from '@/lib/auth/actions';

// Holds the signed-in user's session + profile (from Supabase via the Vercel
// server actions). Gates the app: until `loading` is false we don't know whether
// to show onboarding or the app.

const ProfileContext = React.createContext(null);

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

export function ProfileProvider({ children }) {
  const [state, setState] = React.useState({ loading: true, user: null, profile: null });

  const refresh = React.useCallback(async () => {
    try {
      const sp = await getSessionProfile();
      setState({ loading: false, user: sp?.user || null, profile: sp?.profile || null });
    } catch {
      setState({ loading: false, user: null, profile: null });
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const signOut = React.useCallback(async () => {
    await doSignOut();
    setState({ loading: false, user: null, profile: null });
  }, []);

  const value = {
    ...state,
    refresh,
    signOut,
    displayName: state.profile?.full_name || 'You',
    email: state.profile?.email || state.user?.email || '',
  };
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export default ProfileProvider;
