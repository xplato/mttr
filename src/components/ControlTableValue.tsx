import { useEffect, useRef, useState } from "react";
import type { ModelField } from "@/lib/servo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ControlTableValueProps {
  field: ModelField;
  value: number | null;
  error?: string | null;
  onWrite?: (value: number) => Promise<void>;
}

function formatValue(field: ModelField, value: number): string {
  if (field.value_map) {
    const mapped = field.value_map[String(value)];
    if (mapped !== undefined) {
      return `${value} (${mapped})`;
    }
  }
  return String(value);
}

/** Returns true if this field should use a select dropdown (small enumerable value_map with string labels). */
function isSelectField(field: ModelField): boolean {
  if (!field.value_map) return false;
  const entries = Object.entries(field.value_map);
  // Only use select for value maps with string labels (not numeric mappings like Baud Rate)
  return (
    entries.length > 0 &&
    entries.length <= 20 &&
    entries.every(([, v]) => typeof v === "string")
  );
}

export function ControlTableValue({
  field,
  value,
  error,
  onWrite,
}: ControlTableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const editable = field.access === "RW" && onWrite && value !== null && !error;
  const selectMode = isSelectField(field);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && !selectMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing, selectMode]);

  const startEditing = () => {
    if (!editable) return;
    setDraft(String(value));
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft("");
  };

  const commit = async (newValue: number) => {
    if (newValue === value) {
      setEditing(false);
      return;
    }
    setWriting(true);
    try {
      await onWrite!(newValue);
      setEditing(false);
    } catch {
      // Keep editing open on failure so the user doesn't lose their input.
      // The toast is handled by the caller.
    } finally {
      setWriting(false);
    }
  };

  const validate = (raw: string): number | null => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || raw.trim() === "") {
      toast.error(`${field.name}: value must be a number`);
      return null;
    }
    if (!Number.isInteger(parsed)) {
      toast.error(`${field.name}: value must be an integer`);
      return null;
    }
    if (field.range && (parsed < field.range[0] || parsed > field.range[1])) {
      toast.error(
        `${field.name}: value must be between ${field.range[0]} and ${field.range[1]}`,
      );
      return null;
    }
    return parsed;
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const validated = validate(draft);
      if (validated !== null) commit(validated);
    }
  };

  const handleInputBlur = () => {
    if (writing) return;
    const validated = validate(draft);
    if (validated !== null) {
      commit(validated);
    } else {
      cancel();
    }
  };

  const handleSelectChange = (val: string) => {
    commit(Number(val));
  };

  // Loading state
  if (value === null && !error) {
    return (
      <span className="text-muted-foreground animate-pulse text-xs">---</span>
    );
  }

  // Error state
  if (error) {
    return (
      <span className="text-destructive text-xs" title={error}>
        ERR
      </span>
    );
  }

  // Select editing mode
  if (editing && selectMode) {
    return (
      <Select
        defaultOpen
        value={String(value)}
        onValueChange={handleSelectChange}
        disabled={writing}
        onOpenChange={(open) => {
          if (!open && !writing) cancel();
        }}
      >
        <SelectTrigger className="field-sizing-content h-7 w-auto! max-w-xs py-0 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(field.value_map!).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {k} ({String(v)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Input editing mode
  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={handleInputBlur}
        disabled={writing}
        min={field.range?.[0]}
        max={field.range?.[1]}
        className="field-sizing-content h-7 w-auto! max-w-xs py-0 text-sm"
      />
    );
  }

  // Display mode
  return (
    <span
      className={cn(
        "font-mono text-xs",
        editable && "hover:bg-muted -mx-1 cursor-pointer rounded px-1",
        !editable && "text-muted-foreground",
      )}
      onClick={startEditing}
    >
      {formatValue(field, value!)}
    </span>
  );
}
