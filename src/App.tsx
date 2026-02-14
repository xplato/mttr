import "./App.css";

import { useCallback, useEffect, useState } from "react";
import { BoltIcon } from "lucide-react";
import { Toaster } from "sonner";

import { ConnectedView } from "./components/ConnectedView";
import { SettingsPage } from "./components/settings";
import Theme from "./components/settings/Theme";
import { Button } from "./components/ui/button";
import { WelcomeScreen } from "./components/WelcomeScreen";
import type { ServoInfo } from "./lib/servo";

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [connectedServo, setConnectedServo] = useState<ServoInfo | null>(null);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  // Global keyboard shortcut: Cmd+, to toggle settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        toggleSettings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSettings]);

  if (showSettings) {
    return <SettingsPage onBack={toggleSettings} />;
  }

  return (
    <div className="bg-background flex h-full flex-col">
      <div data-tauri-drag-region className="h-10 w-full">
        <div
          data-tauri-drag-region
          className="border-border grid h-10 grid-cols-3 border-b"
        >
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-start"
          ></div>
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-center"
          >
            <p className="text-sm">MTTR</p>
          </div>
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-end pr-2"
          >
            <Button
              onClick={() => setShowSettings(true)}
              size="icon-sm"
              variant="ghost"
              className="text-neutral-500"
            >
              <BoltIcon />
            </Button>
          </div>
        </div>
      </div>

      {connectedServo ? (
        <ConnectedView
          servo={connectedServo}
          onDisconnect={() => setConnectedServo(null)}
        />
      ) : (
        <WelcomeScreen onConnect={setConnectedServo} />
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <Theme />
      <Toaster />
      <main className="h-full">
        <AppContent />
      </main>
    </>
  );
}

export default App;
