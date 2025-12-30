import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface SessionContextType {
  timeLeft: number;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  resetTimer: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const lastActivityRef = useRef<number>(Date.now());

  const INACTIVITY_PROMPT_LIMIT = 60 * 1000;
  const INACTIVITY_LOGOUT_LIMIT = 600 * 1000;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleActivity = useCallback(() => {
    if (isLocked) return;
    const now = Date.now();
    const inactiveTime = now - lastActivityRef.current;
    
    if (inactiveTime > INACTIVITY_PROMPT_LIMIT) {
      setIsLocked(true);
    }
    lastActivityRef.current = now;
  }, [isLocked]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity));

    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      const remaining = Math.max(0, Math.floor((INACTIVITY_LOGOUT_LIMIT - inactiveTime) / 1000));
      setTimeLeft(remaining);

      if (inactiveTime > INACTIVITY_LOGOUT_LIMIT) {
        onLogout();
      }
    }, 1000);

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [handleActivity, onLogout]);

  return (
    <SessionContext.Provider value={{ timeLeft, isLocked, setIsLocked, resetTimer }}>
      {children}
    </SessionContext.Provider>
  );
};
