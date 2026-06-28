'use client';
import React from 'react';

// Bridges the active test screen's local UI state (highlights, strikethroughs,
// timer, calculator) up to SixteenApp, which folds it into the single live
// broadcast. `report(partial)` merges into the broadcast snapshot. Default is a
// no-op so screens render safely outside a broadcasting context.
const LiveBroadcastContext = React.createContext(() => {});

export function LiveBroadcastProvider({ report, children }) {
  return (
    <LiveBroadcastContext.Provider value={report || (() => {})}>
      {children}
    </LiveBroadcastContext.Provider>
  );
}

export function useLiveBroadcast() {
  return React.useContext(LiveBroadcastContext);
}
