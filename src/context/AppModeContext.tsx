"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AppMode = "admin" | "customer";

const STORAGE_KEY = "apex_app_mode";
const STORAGE_EXP_KEY = "apex_experience_id";

interface AppModeContextType {
  mode: AppMode;
  homeUrl: string;
  setMode: (mode: AppMode, experienceId: string) => void;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: "customer",
  homeUrl: "/",
  setMode: () => {},
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("customer");
  const [homeUrl, setHomeUrl] = useState("/");

  // Restore from sessionStorage on mount (persists across client-side navigations)
  useEffect(() => {
    const savedMode = sessionStorage.getItem(STORAGE_KEY) as AppMode | null;
    const savedExpId = sessionStorage.getItem(STORAGE_EXP_KEY);

    if (savedMode && savedExpId) {
      setModeState(savedMode);
      setHomeUrl(
        savedMode === "admin"
          ? `/experiences/${savedExpId}/dashboard`
          : `/experiences/${savedExpId}/home`
      );
    }
  }, []);

  function setMode(newMode: AppMode, experienceId: string) {
    sessionStorage.setItem(STORAGE_KEY, newMode);
    sessionStorage.setItem(STORAGE_EXP_KEY, experienceId);
    setModeState(newMode);
    setHomeUrl(
      newMode === "admin"
        ? `/experiences/${experienceId}/dashboard`
        : `/experiences/${experienceId}/home`
    );
  }

  return (
    <AppModeContext.Provider value={{ mode, homeUrl, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
