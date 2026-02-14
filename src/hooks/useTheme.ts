import { useEffect, useState } from "react";
import store from "@/lib/store";

export default function useTheme() {
  const [theme, setThemeState] = useState<string>("system");

  useEffect(() => {
    store.get<string>("theme").then((stored) => {
      if (stored) setThemeState(stored);
    });

    const unlisten = store.onChange<string>((key, value) => {
      if (key === "theme" && value) setThemeState(value);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    await store.set("theme", newTheme);
    await store.save();
  };

  return { theme, setTheme };
}
