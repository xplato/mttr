import useTheme from "@/hooks/useTheme";

import { Button } from "../ui/button";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xl font-medium">Theme</h2>
        <div className="border-border flex gap-2 rounded-[10px] border p-1">
          {(["light", "dark", "system"] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setTheme(mode)}
              variant={theme === mode ? "default" : "ghost"}
              size="lg"
              className="flex-1 capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>
        {theme === "system" && (
          <p className="text-muted-foreground mt-3 text-sm">
            Currently using {theme} mode based on system preference
          </p>
        )}
      </section>

      <div className="border-border border-t border-dashed" />
    </div>
  );
}
