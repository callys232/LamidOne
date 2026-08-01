"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark toggle. Dark mode is TRUE BLACK per the brief, with the
 * red lifted one step (#E2555C) so it clears contrast on black without
 * glowing — see globals.css. Dark is a selected palette, never an
 * automatic inversion.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("lamid-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("lamid-theme", next ? "dark" : "light");
  };

  if (!mounted) return <span className="block h-4 w-4" aria-hidden="true" />;

  return (
    <button
      type="button"
      onClick={toggle}
      className="muted flex items-center gap-1.5 transition-colors hover:text-brand"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="hidden xl:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
