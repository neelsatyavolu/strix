'use client';

import React from 'react';

// Teaching-mode state, shared with whatever question surface is on screen.
// The tutor's half comes from useTeachTutor, the student's from useTeachStudent;
// consumers only read `on`, `strokes`, `laser` and (tutor only) the tools.
const TeachContext = React.createContext(null);

export function TeachProvider({ value, children }) {
  return <TeachContext.Provider value={value}>{children}</TeachContext.Provider>;
}

export function useTeach() {
  return React.useContext(TeachContext);
}
