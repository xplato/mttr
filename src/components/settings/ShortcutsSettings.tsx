import { Kbd } from "@/components/ui/kbd";

import { mod } from "../../lib/platform";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: [mod, ","],
    description: "Open settings",
    category: "Navigation",
  },
  {
    keys: [mod, "1"],
    description: "Go to General settings",
    category: "Settings",
  },
  {
    keys: [mod, "2"],
    description: "Go to Appearance settings",
    category: "Settings",
  },
  {
    keys: [mod, "3"],
    description: "Go to Shortcuts settings",
    category: "Settings",
  },
];

const groupedShortcuts = shortcuts.reduce(
  (acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  },
  {} as Record<string, Shortcut[]>,
);

export function ShortcutsSettings() {
  const categoryOrder = ["Navigation", "Settings"];

  return (
    <div className="flex flex-col gap-8">
      {categoryOrder.map((category, idx) => {
        const categoryShortcuts = groupedShortcuts[category];
        if (!categoryShortcuts) return null;

        return (
          <div key={category}>
            {idx > 0 && (
              <div className="border-border border-t border-dashed" />
            )}
            <section>
              <h2 className="mb-4 pt-6 text-xl font-medium">{category}</h2>
              <div className="space-y-3">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                  >
                    <p className="text-muted-foreground text-sm font-medium">
                      {shortcut.description}
                    </p>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <Kbd key={ki}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}
