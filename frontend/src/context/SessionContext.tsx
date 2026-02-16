import React, { createContext, useContext, useState } from "react";
import type { TopicResponse, SessionState } from "@/types/session";

interface SessionContextType {
  currentTopic: TopicResponse | null;
  setCurrentTopic: (topic: TopicResponse | null) => void;
  remainingSeconds: number;
  setRemainingSeconds: React.Dispatch<React.SetStateAction<number>>;
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  breakModalOpen: boolean;
  setBreakModalOpen: (open: boolean) => void;

  // 🔥 NEW EMOTION STATES
  emotionMonitoringEnabled: boolean;
  setEmotionMonitoringEnabled: (v: boolean) => void;
  emotionStatus: string;
  setEmotionStatus: (v: string) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [currentTopic, setCurrentTopic] = useState<TopicResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [breakModalOpen, setBreakModalOpen] = useState(false);

  // 🔥 NEW
  const [emotionMonitoringEnabled, setEmotionMonitoringEnabled] = useState(false);
  const [emotionStatus, setEmotionStatus] = useState("OFF");

  return (
    <SessionContext.Provider
      value={{
        currentTopic,
        setCurrentTopic,
        remainingSeconds,
        setRemainingSeconds,
        sessionState,
        setSessionState,
        breakModalOpen,
        setBreakModalOpen,

        emotionMonitoringEnabled,
        setEmotionMonitoringEnabled,
        emotionStatus,
        setEmotionStatus
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
