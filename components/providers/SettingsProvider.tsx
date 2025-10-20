"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";
export type Density = "comfortable" | "compact";

export type SettingsState = {
  theme: ThemeMode;
  density: Density;
  animations: boolean;
  showCompleted: boolean;
  setTheme: (t: ThemeMode) => void;
  setDensity: (d: Density) => void;
  setAnimations: (on: boolean) => void;
  setShowCompleted: (on: boolean) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

const LS_KEY = "ivylee:settings";

function readSettings(): {
  theme: ThemeMode;
  density: Density;
  animations: boolean;
  showCompleted?: boolean;
} | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

function writeSettings(value: {
  theme: ThemeMode;
  density: Density;
  animations: boolean;
  showCompleted: boolean;
}) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(value));
  } catch {}
}

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const wantsDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", wantsDark);
}

function applyDensityClass(density: Density) {
  const body = document.body;
  body.dataset["density"] = density;
}

function applyAnimationsClass(on: boolean) {
  const body = document.body;
  body.dataset["anim"] = on ? "on" : "off";
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [density, setDensityState] = useState<Density>("comfortable");
  const [animations, setAnimationsState] = useState<boolean>(true);
  const [showCompleted, setShowCompletedState] = useState<boolean>(true);

  // Initialize from localStorage
  useEffect(() => {
    const saved = readSettings();
    if (saved) {
      setThemeState(saved.theme);
      setDensityState(saved.density);
      setAnimationsState(saved.animations);
      setShowCompletedState(saved.showCompleted ?? true);
      // apply immediately
      applyThemeClass(saved.theme);
      applyDensityClass(saved.density);
      applyAnimationsClass(saved.animations);
    } else {
      // apply defaults
      applyThemeClass("system");
      applyDensityClass("comfortable");
      applyAnimationsClass(true);
      setShowCompletedState(true);
    }
  }, []);

  // Watch system theme when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      setThemeState(t);
      applyThemeClass(t);
      writeSettings({ theme: t, density, animations, showCompleted });
    },
    [density, animations, showCompleted],
  );

  const setDensity = useCallback(
    (d: Density) => {
      setDensityState(d);
      applyDensityClass(d);
      writeSettings({ theme, density: d, animations, showCompleted });
    },
    [theme, animations, showCompleted],
  );

  const setAnimations = useCallback(
    (on: boolean) => {
      setAnimationsState(on);
      applyAnimationsClass(on);
      writeSettings({ theme, density, animations: on, showCompleted });
    },
    [theme, density, showCompleted],
  );

  const setShowCompleted = useCallback(
    (on: boolean) => {
      setShowCompletedState(on);
      writeSettings({ theme, density, animations, showCompleted: on });
    },
    [theme, density, animations],
  );

  const value = useMemo<SettingsState>(
    () => ({ theme, density, animations, showCompleted, setTheme, setDensity, setAnimations, setShowCompleted }),
    [theme, density, animations, showCompleted, setTheme, setDensity, setAnimations, setShowCompleted],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
