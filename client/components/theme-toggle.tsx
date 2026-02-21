"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "interviewcraft_theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setReady(true);
  }, []);

  const onToggle = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  if (!ready) {
    return null;
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="fixed bottom-3 right-3 z-40 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[11px] leading-none text-[var(--text)] shadow-sm opacity-90 hover:opacity-100"
      onClick={onToggle}
      type="button"
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
