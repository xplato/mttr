import "./App.css";

import { useCallback, useEffect, useState } from "react";
import { BoltIcon, RadarIcon } from "lucide-react";
import { Toaster } from "sonner";

import { ScanDialog } from "./components/ScanDialog";
import { ServoDetail } from "./components/ServoDetail";
import { ServoSidebar } from "./components/ServoSidebar";
import { SettingsPage } from "./components/settings";
import Theme from "./components/settings/Theme";
import { Button } from "./components/ui/button";
import { WelcomeScreen } from "./components/WelcomeScreen";
import type { ConnectionConfig, ServoInfo } from "./lib/servo";

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);

  const [servos, setServos] = useState<ServoInfo[]>([]);
  const [activeServo, setActiveServo] = useState<ServoInfo | null>(null);
  const [connectionConfig, setConnectionConfig] =
    useState<ConnectionConfig | null>(null);

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

  const handleScanComplete = useCallback(
    (
      foundServos: ServoInfo[],
      config: { port: string; protocol: string; baudrate: number },
    ) => {
      setServos(foundServos);
      setConnectionConfig(config);

      // Auto-select the first servo, or clear selection if none found
      if (foundServos.length > 0) {
        setActiveServo(foundServos[0]);
      } else {
        setActiveServo(null);
      }
    },
    [],
  );

  if (showSettings) {
    return <SettingsPage onBack={toggleSettings} />;
  }

  const hasServos = servos.length > 0;

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Title bar */}
      <div data-tauri-drag-region className="h-10 w-full shrink-0">
        <div
          data-tauri-drag-region
          className="border-border grid h-10 grid-cols-3 border-b"
        >
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-start pl-2"
          ></div>
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-center"
          >
            <p className="text-sm">MTTR</p>
          </div>
          <div
            data-tauri-drag-region
            className="flex flex-row items-center justify-end gap-1 pr-2"
          >
            {hasServos && (
              <Button
                onClick={() => setShowScanDialog(true)}
                size="icon-sm"
                variant="ghost"
                className="text-neutral-500"
                title="Scan for servos"
              >
                <RadarIcon />
              </Button>
            )}
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

      {/* Main content */}
      {hasServos && connectionConfig ? (
        <div className="flex flex-1 overflow-hidden">
          <ServoSidebar
            servos={servos}
            activeServoId={activeServo?.id ?? null}
            onSelectServo={setActiveServo}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeServo ? (
              <ServoDetail servo={activeServo} config={connectionConfig} />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Select a servo from the sidebar.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <WelcomeScreen onScan={() => setShowScanDialog(true)} />
      )}

      {/* Scan dialog */}
      <ScanDialog
        open={showScanDialog}
        onOpenChange={setShowScanDialog}
        onScanComplete={handleScanComplete}
      />
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
