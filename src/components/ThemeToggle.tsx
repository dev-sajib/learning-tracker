"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { pref, resolved, cycle, mounted } = useTheme();

  const label = pref === "system" ? `auto (${resolved})` : pref;
  const Icon = pref === "system" ? Monitor : pref === "light" ? Sun : Moon;

  return (
    <button
      onClick={cycle}
      className="btn"
      title={`theme: ${label} · click to cycle (system → light → dark)`}
      aria-label={`Toggle theme. Current: ${label}`}
      suppressHydrationWarning
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{mounted ? label : "theme"}</span>
    </button>
  );
}
