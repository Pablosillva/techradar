"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "techlab-theme";
const EVENT = "techlab-theme-change";

/**
 * The <html> class is the source of truth for the theme, not React state — it is
 * also set by the inline script in <head> before first paint, so React would
 * have no way to know about it during hydration.
 *
 * `useSyncExternalStore` reads that DOM state directly and subscribes to a
 * custom event, which avoids both the hydration mismatch of reading
 * localStorage during render and the cascading render of syncing it in an
 * effect.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

const getSnapshot = () => document.documentElement.classList.contains("light");

/** Server render (and hydration) assumes the default dark theme. */
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isLight;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // Private mode / storage disabled — the theme still applies for this page.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
      title={isLight ? "Tema escuro" : "Tema claro"}
      className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {/* Both icons render; visibility swaps them without a layout shift. */}
      <Sun className={`size-[18px] ${isLight ? "hidden" : "block"}`} aria-hidden="true" />
      <Moon className={`size-[18px] ${isLight ? "block" : "hidden"}`} aria-hidden="true" />
    </button>
  );
}
