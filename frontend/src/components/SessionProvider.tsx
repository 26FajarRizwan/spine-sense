"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ConnectionState } from "@/types/posture";

interface SessionContextValue {
  connection: ConnectionState;
  setConnection: (state: ConnectionState) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<ConnectionState>("standby");
  const value = useMemo(
    () => ({ connection, setConnection }),
    [connection],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionConnection(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSessionConnection must be used within SessionProvider");
  }
  return value;
}
