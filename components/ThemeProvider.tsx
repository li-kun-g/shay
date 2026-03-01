"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (t: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "kimepish-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // load saved theme
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
      if (saved === "light" || saved === "dark" || saved === "system") setThemeState(saved);
    } catch {}
  }, []);

  // resolve + apply + listen system changes
  useEffect(() => {
    const resolve = () => {
      const r = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(r);
      applyThemeClass(r);
    };

    resolve();

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => resolve();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  };

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider />");
  return ctx;
}