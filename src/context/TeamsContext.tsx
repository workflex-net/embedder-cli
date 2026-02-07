// Original: src/context/TeamsContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface Team {
  id: string;
  name: string;
}

interface TeamsContextValue {
  teams: Team[];
  selectedTeam: Team | null;
  selectTeam: (teamId: string) => void;
  clearTeamSelection: () => void;
}

const TeamsContext = createContext<TeamsContextValue | null>(null);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const selectTeam = useCallback(
    (teamId: string) => {
      const team = teams.find((t) => t.id === teamId) ?? null;
      setSelectedTeam(team);
    },
    [teams]
  );

  const clearTeamSelection = useCallback(() => {
    setSelectedTeam(null);
  }, []);

  const value = useMemo(
    () => ({ teams, selectedTeam, selectTeam, clearTeamSelection }),
    [teams, selectedTeam, selectTeam, clearTeamSelection]
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}

export function useTeams() {
  const ctx = useContext(TeamsContext);
  if (!ctx) throw new Error("useTeams must be used within TeamsProvider");
  return ctx;
}
