import React, { createContext, useContext, useState, useCallback } from 'react';

interface EarningsContextType {
  refreshHistory: () => void;
  setRefreshHistory: (callback: () => void) => void;
}

const EarningsContext = createContext<EarningsContextType | undefined>(undefined);

export function EarningsProvider({ children }: { children: React.ReactNode }) {
  const [refreshHistoryCallback, setRefreshHistoryCallback] = useState<(() => void) | null>(null);

  const refreshHistory = useCallback(() => {
    if (refreshHistoryCallback) {
      refreshHistoryCallback();
    }
  }, [refreshHistoryCallback]);

  const setRefreshHistory = useCallback((callback: () => void) => {
    setRefreshHistoryCallback(() => callback);
  }, []);

  return (
    <EarningsContext.Provider
      value={{
        refreshHistory,
        setRefreshHistory,
      }}
    >
      {children}
    </EarningsContext.Provider>
  );
}

export function useEarnings() {
  const context = useContext(EarningsContext);
  if (context === undefined) {
    throw new Error('useEarnings must be used within an EarningsProvider');
  }
  return context;
}