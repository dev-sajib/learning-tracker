"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const KEY = "devtrack:theme";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function readPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function applyTheme(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const resolved: ResolvedTheme = pref === "system" ? getSystemTheme() : pref;
  document.documentElement.dataset.theme = resolved;
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const p = readPref();
    setPref(p);
    const r: ResolvedTheme = p === "system" ? getSystemTheme() : p;
    setResolved(r);
    applyTheme(p);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const cur = readPref();
      if (cur === "system") {
        const r2: ResolvedTheme = getSystemTheme();
        setResolved(r2);
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemePref) => {
    setPref(next);
    window.localStorage.setItem(KEY, next);
    const r: ResolvedTheme = next === "system" ? getSystemTheme() : next;
    setResolved(r);
    applyTheme(next);
  }, []);

  const cycle = useCallback(() => {
    const order: ThemePref[] = ["system", "light", "dark"];
    const i = order.indexOf(pref);
    setTheme(order[(i + 1) % order.length]);
  }, [pref, setTheme]);

  return { pref, resolved, setTheme, cycle, mounted };
}
