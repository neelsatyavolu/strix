"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY } from "./theme";
import s from "./Landing.module.css";

// Read the current theme straight from the DOM (the pre-paint script in the
// landing applies the saved value). useSyncExternalStore keeps server and
// client renders consistent without a setState-in-effect hydration dance.
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage may be unavailable */
    }
    listeners.forEach((cb) => cb());
  };

  return (
    <button
      type="button"
      className={s.themeToggle}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
      title="Toggle appearance"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
