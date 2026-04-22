"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "mathbounty-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) return stored;
  } catch {
    // localStorage may be blocked in some contexts
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(getInitialTheme);

  // Sync DOM attribute whenever theme changes (also runs once after hydration)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setResolvedTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  // Listen for system preference changes when no explicit preference is stored
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return;
      } catch {
        return;
      }
      const next = e.matches ? "light" : "dark";
      setResolvedTheme(next);
      document.documentElement.setAttribute("data-theme", next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme: resolvedTheme, resolvedTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
