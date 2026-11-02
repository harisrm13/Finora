"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("finora_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("finora_theme", "light");
    }

    window.dispatchEvent(new CustomEvent("finora:theme-changed", { detail: nextDark }));
  };

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${className || ""}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition active:scale-95 ${className || ""}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
}
