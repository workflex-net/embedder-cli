// Original: src/context/UserContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo } from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User | null>(null);
  const [isLoading] = useState(false);

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
