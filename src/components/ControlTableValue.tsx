import type { ModelField } from "@/lib/servo";

interface ControlTableValueProps {
  field: ModelField;
  value: number | null;
  error?: string | null;
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

export function ControlTableValue({ field, value, error }: ControlTableValueProps) {
  if (value === null && !error) {
    return (
      <span className="text-muted-foreground animate-pulse text-xs">---</span>
    );
  }

  if (error) {
    return (
      <span className="text-destructive text-xs" title={error}>
        ERR
      </span>
    );
  }

  return (
    <span className="font-mono text-xs">
      {formatValue(field, value!)}
    </span>
  );
}
