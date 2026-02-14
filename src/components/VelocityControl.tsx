import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Slider } from "./ui/slider";

interface VelocityControlProps {
  value: number;
  min: number;
  max: number;
  /** Raw unit string from the schema, e.g. "0.229 rev/min" */
  rawUnit: string | null;
  onWrite: (value: number) => Promise<void>;
}

/** Parses a unit string like "0.229 rev/min" into a scale factor and display unit. */
function parseUnit(rawUnit: string | null): {
  scale: number;
  display: string;
} {
  if (!rawUnit) return { scale: 1, display: "" };
  const match = rawUnit.match(/^([\d.]+)\s+(.+)$/);
  if (match) return { scale: parseFloat(match[1]), display: match[2] };
  return { scale: 1, display: rawUnit };
}

export function VelocityControl({
  value,
  min,
  max,
  rawUnit,
  onWrite,
}: VelocityControlProps) {
  const { scale, display: unit } = parseUnit(rawUnit);
  const [localValue, setLocalValue] = useState(value);
  const [writing, setWriting] = useState(false);
  const lastWritten = useRef(value);

  // Keep local value in sync with prop when not actively dragging
  if (!writing && value !== lastWritten.current) {
    lastWritten.current = value;
    setLocalValue(value);
  }

  const commitValue = useCallback(
    async (newValue: number) => {
      if (newValue === lastWritten.current) return;
      setWriting(true);
      try {
        await onWrite(newValue);
        lastWritten.current = newValue;
      } catch (err) {
        toast.error(`Failed to set velocity: ${err}`);
        setLocalValue(lastWritten.current);
      } finally {
        setWriting(false);
      }
    },
    [onWrite],
  );

  const rpm = (localValue * scale).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">Goal Velocity</h3>
        <span className="text-muted-foreground font-mono text-xs">
          {localValue} ({rpm} {unit})
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[localValue]}
        onValueChange={([v]) => setLocalValue(v)}
        onValueCommit={([v]) => commitValue(v)}
        disabled={writing}
      />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{min}</span>
        <span
          className="hover:text-foreground cursor-pointer"
          onClick={() => {
            setLocalValue(0);
            commitValue(0);
          }}
        >
          Stop (0)
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
