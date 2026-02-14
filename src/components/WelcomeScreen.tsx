import { useCallback, useEffect, useState } from "react";
import { listPorts, scanServos, type ServoInfo } from "@/lib/servo";
import { LoaderCircleIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface WelcomeScreenProps {
  onConnect: (servo: ServoInfo) => void;
}

const BAUDRATE_OPTIONS = [
  { value: "9600", label: "9,600 bps" },
  { value: "57600", label: "57,600 bps" },
  { value: "115200", label: "115,200 bps" },
  { value: "1000000", label: "1,000,000 bps" },
];

const PROTOCOL_OPTIONS = [
  { value: "1.0", label: "1.0" },
  { value: "2.0", label: "2.0" },
];

export function WelcomeScreen({ onConnect }: WelcomeScreenProps) {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [protocol, setProtocol] = useState("2.0");
  const [baudrate, setBaudrate] = useState("57600");
  const [idStart, setIdStart] = useState(0);
  const [idEnd, setIdEnd] = useState(252);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ServoInfo[] | null>(null);

  const refreshPorts = useCallback(async () => {
    try {
      const detected = await listPorts();
      setPorts(detected);
      if (detected.length > 0 && !selectedPort) {
        setSelectedPort(detected[0]);
      }
    } catch (err) {
      toast.error(`Failed to list serial ports: ${err}`);
    }
  }, [selectedPort]);

  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  const handleScan = useCallback(async () => {
    if (!selectedPort) {
      toast.error("Please select a serial port.");
      return;
    }
    setScanning(true);
    setResults(null);
    try {
      const servos = await scanServos(
        selectedPort,
        protocol,
        parseInt(baudrate),
        idStart,
        idEnd,
      );
      setResults(servos);
      if (servos.length === 0) {
        toast("No servos found. Check your connection and settings.");
      }
    } catch (err) {
      toast.error(`Scan failed: ${err}`);
    } finally {
      setScanning(false);
    }
  }, [selectedPort, protocol, baudrate, idStart, idEnd]);

  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <div className="w-full max-w-sm p-8 select-none">
        <h1
          className="animate-fade-in-up text-foreground mb-2 text-center text-3xl font-semibold tracking-tight"
          style={{ animationDelay: "0ms" }}
        >
          Welcome to MTTR
        </h1>
        <p
          className="animate-fade-in-up text-muted-foreground mb-8 text-center"
          style={{ animationDelay: "100ms" }}
        >
          A lightweight GUI control program for Dynamixel servos.
        </p>

        <div
          className="animate-fade-in-up space-y-4"
          style={{ animationDelay: "200ms" }}
        >
          {/* Serial Port */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Serial Port
            </label>
            <div className="flex gap-1.5">
              <Select value={selectedPort} onValueChange={setSelectedPort}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      ports.length === 0 ? "No ports found" : "Select port"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {ports.map((port) => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshPorts}
                title="Refresh ports"
              >
                <RefreshCwIcon />
              </Button>
            </div>
          </div>

          {/* Protocol & Baudrate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Protocol
              </label>
              <Select value={protocol} onValueChange={setProtocol}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                Baudrate
              </label>
              <Select value={baudrate} onValueChange={setBaudrate}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAUDRATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ID Range */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              ID Range
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={252}
                value={idStart}
                onChange={(e) =>
                  setIdStart(
                    Math.max(0, Math.min(252, parseInt(e.target.value) || 0)),
                  )
                }
                className="w-20 text-center"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="number"
                min={0}
                max={252}
                value={idEnd}
                onChange={(e) =>
                  setIdEnd(
                    Math.max(0, Math.min(252, parseInt(e.target.value) || 0)),
                  )
                }
                className="w-20 text-center"
              />
            </div>
          </div>

          {/* Scan Button */}
          <Button
            onClick={handleScan}
            disabled={scanning || !selectedPort}
            className="w-full"
          >
            {scanning ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SearchIcon data-icon="inline-start" />
            )}
            {scanning ? "Scanning..." : "Scan for Servos"}
          </Button>

          {/* Scan Results */}
          {results !== null && results.length > 0 && (
            <div className="border-border space-y-2 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">
                Found {results.length} servo{results.length !== 1 && "s"}
              </p>
              {results.map((servo) => (
                <div
                  key={servo.id}
                  className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">Servo ID {servo.id}</p>
                    <p className="text-muted-foreground text-xs">
                      Model: {servo.model_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onConnect(servo)}
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
