import { useEffect, useState } from "react";
import store from "@/lib/store";

export default function Theme() {
  const [theme, setTheme] = useState<string>("system");
  const [loading, setLoading] = useState(true);

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Load initial value and subscribe to store changes
  useEffect(() => {
    store.get<string>("theme").then((stored) => {
      if (stored) setTheme(stored);
      setLoading(false);
    });

    const unlisten = store.onChange<string>((key, value) => {
      if (key === "theme" && value) setTheme(value);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  // Apply theme to document
  useEffect(() => {
    if (loading) return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme, loading]);

  return null;
}
