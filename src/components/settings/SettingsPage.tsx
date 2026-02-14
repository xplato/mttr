import { useEffect, useState } from "react";
import { ArrowLeft, FolderOpen, Keyboard, Paintbrush } from "lucide-react";

import { isMac, mod } from "../../lib/platform";
import { Button } from "../ui/button";
import { AppearanceSettings } from "./AppearanceSettings";
import { GeneralSettings } from "./GeneralSettings";
import { ShortcutsSettings } from "./ShortcutsSettings";

interface SettingsPageProps {
  onBack: () => void;
}

type SettingsTab = "general" | "appearance" | "shortcuts";

const tabs: {
  id: SettingsTab;
  label: string;
  icon: typeof FolderOpen;
  shortcut: string;
}[] = [
  { id: "general", label: "General", icon: FolderOpen, shortcut: "1" },
  { id: "appearance", label: "Appearance", icon: Paintbrush, shortcut: "2" },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard, shortcut: "3" },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveTab("general");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveTab("appearance");
        } else if (e.key === "3") {
          e.preventDefault();
          setActiveTab("shortcuts");
        }
      } else {
        if (e.key === "Escape") {
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="bg-background flex h-full w-full">
      <div className="bg-background border-border flex h-full w-64 flex-col border-r select-none">
        <div className="h-10 shrink-0" data-tauri-drag-region />

        <div className="border-border flex shrink-0 items-center justify-between border-b px-3 pb-2">
          <div className="flex items-center gap-1">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon-sm"
              title={`Back (${mod}${isMac ? "" : "+"},)`}
            >
              <ArrowLeft className="size-4.5 stroke-[1.5]" />
            </Button>
            <div className="text-base font-medium">Settings</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className="h-10 justify-between gap-2.5 pr-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="text-muted-foreground size-4" />
                  {tab.label}
                </div>
                <div className="text-muted-foreground text-xs">
                  <span className="mr-0.5">{mod}</span>
                  {tab.shortcut}
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="bg-background flex flex-1 flex-col overflow-hidden">
        <div className="h-10 shrink-0" data-tauri-drag-region />

        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-3xl px-6 pb-6">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "shortcuts" && <ShortcutsSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
