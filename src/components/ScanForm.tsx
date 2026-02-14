import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelScan,
  listPorts,
  scanServos,
  type ScanEvent,
  type ServoInfo,
} from "@/lib/servo";
import { RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
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

interface ScanFormProps {
  onScanComplete: (
    servos: ServoInfo[],
    config: { port: string; protocol: string; baudrate: number },
  ) => void;
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

export function ScanForm({ onScanComplete }: ScanFormProps) {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [protocol, setProtocol] = useState("2.0");
  const [baudrate, setBaudrate] = useState("57600");
  const [idStart, setIdStart] = useState(0);
  const [idEnd, setIdEnd] = useState(252);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [results, setResults] = useState<ServoInfo[]>([]);
  const hasScanned = useRef(false);

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
    setProgress(null);
    setResults([]);
    hasScanned.current = true;

    // Accumulate in a local variable so we have the final list for onScanComplete
    let found: ServoInfo[] = [];

    const handleEvent = (event: ScanEvent) => {
      switch (event.event) {
        case "found":
          found = [...found, event.data];
          setResults(found);
          break;
        case "progress":
          setProgress(event.data);
          break;
        case "finished":
          if (event.data.cancelled) {
            toast("Scan cancelled.");
          }
          break;
      }
    };

    try {
      await scanServos(
        selectedPort,
        protocol,
        parseInt(baudrate),
        idStart,
        idEnd,
        handleEvent,
      );
      onScanComplete(found, {
        port: selectedPort,
        protocol,
        baudrate: parseInt(baudrate),
      });
      if (found.length === 0) {
        toast("No servos found. Check your connection and settings.");
      } else {
        toast.success(
          `Found ${found.length} servo${found.length !== 1 ? "s" : ""}.`,
        );
      }
    } catch (err) {
      toast.error(`Scan failed: ${err}`);
    } finally {
      setScanning(false);
      setProgress(null);
    }
  }, [selectedPort, protocol, baudrate, idStart, idEnd, onScanComplete]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelScan();
    } catch (err) {
      toast.error(`Failed to cancel scan: ${err}`);
    }
  }, []);

  const progressPercent =
    progress && progress.total > 0
      ? Math.round(((progress.current - idStart) / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Serial Port */}
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-medium">
          Serial Port
        </label>
        <div className="flex gap-1.5">
          <Select value={selectedPort} onValueChange={setSelectedPort}>
            <SelectTrigger className="w-full" disabled={scanning}>
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
            disabled={scanning}
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
          <Select
            value={protocol}
            onValueChange={setProtocol}
            disabled={scanning}
          >
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
          <Select
            value={baudrate}
            onValueChange={setBaudrate}
            disabled={scanning}
          >
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
            disabled={scanning}
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
            disabled={scanning}
            onChange={(e) =>
              setIdEnd(
                Math.max(0, Math.min(252, parseInt(e.target.value) || 0)),
              )
            }
            className="w-20 text-center"
          />
        </div>
      </div>

      {/* Scan / Cancel Button */}
      {scanning ? (
        <div className="space-y-2">
          <Button onClick={handleCancel} variant="outline" className="w-full">
            <XIcon data-icon="inline-start" />
            Cancel Scan
          </Button>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-muted-foreground text-center text-xs">
              Scanning ID {progress?.current ?? idStart} of {idStart}–{idEnd}
            </p>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleScan}
          disabled={!selectedPort}
          className="w-full"
        >
          <SearchIcon data-icon="inline-start" />
          Scan for Servos
        </Button>
      )}

      {/* Scan Results */}
      {results.length > 0 && (
        <div className="border-border space-y-1.5 rounded-lg border p-3">
          <p className="text-muted-foreground text-xs font-medium">
            Found {results.length} servo{results.length !== 1 && "s"}
          </p>
          {results.map((servo) => (
            <div
              key={servo.id}
              className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">ID {servo.id}</p>
                <p className="text-muted-foreground text-xs">
                  Model: {servo.model_number}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {!scanning && hasScanned.current && results.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">
          No servos found. Check your connection and settings.
        </p>
      )}
    </div>
  );
}
