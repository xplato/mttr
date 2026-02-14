import "./App.css";

import { useCallback, useEffect, useState } from "react";
import { BoltIcon, PowerOffIcon, RadarIcon } from "lucide-react";
import { toast, Toaster } from "sonner";

import { ScanDialog } from "./components/ScanDialog";
import { ServoDetail } from "./components/ServoDetail";
import { ServoSidebar } from "./components/ServoSidebar";
import { SettingsPage } from "./components/settings";
import Theme from "./components/settings/Theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import { WelcomeScreen } from "./components/WelcomeScreen";
import useTheme from "./hooks/useTheme";
import { disconnect, type ConnectionConfig, type ServoInfo } from "./lib/servo";

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const [servos, setServos] = useState<ServoInfo[]>([]);
  const [activeServo, setActiveServo] = useState<ServoInfo | null>(null);
  const [connectionConfig, setConnectionConfig] =
    useState<ConnectionConfig | null>(null);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setServos([]);
      setActiveServo(null);
      setConnectionConfig(null);
      setShowDisconnectDialog(false);
    } catch (err) {
      toast.error(`Failed to disconnect: ${err}`);
    }
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
      <div
        data-tauri-drag-region
        className="relative z-5000 h-10 w-full shrink-0"
      >
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
              <>
                <Button
                  onClick={() => setShowScanDialog(true)}
                  size="icon-sm"
                  variant="ghost"
                  className="text-neutral-500"
                  title="Scan for servos"
                >
                  <RadarIcon />
                </Button>
                <Button
                  onClick={() => setShowDisconnectDialog(true)}
                  size="icon-sm"
                  variant="ghost"
                  className="text-neutral-500"
                  title="Disconnect"
                >
                  <PowerOffIcon />
                </Button>
              </>
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

      {/* Disconnect confirmation */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the connection to the serial port and clear all
              servos from the current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function App() {
  const { theme } = useTheme();

  return (
    <TooltipProvider>
      <Theme />
      <Toaster theme={theme as "light" | "dark" | "system"} />
      <main className="h-full">
        <AppContent />
      </main>
    </TooltipProvider>
  );
}

export default App;
